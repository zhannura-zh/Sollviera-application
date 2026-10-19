import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import { useApp } from '@/context/app-store';
import {
  createChatGroup,
  getChatInbox,
  listChatMessages,
  markChatRead,
  openDirectChat,
  sendChatMessage,
} from '@/lib/api-client';

type Lang = 'RU' | 'EN';

export interface ChatLastMessage {
  text: string;
  createdAt: string;
  mine: boolean;
}

// One row of the chat list. For a DIRECT chat `id` is the other person's user id (a
// conversation only exists on the backend once someone has written), for a GROUP it is
// the conversation id — the same ids the web PMS uses, so /profile/chats/<id> can be
// opened straight from a staff card.
export interface ChatContact {
  id: string;
  kind: 'DIRECT' | 'GROUP';
  conversationId: string | null;
  name: string;
  role: string;
  department: string;
  unreadCount: number;
  lastMessage: ChatLastMessage | null;
}

export interface ChatAttachment {
  id: string;
  url: string;
  fileName: string;
  isImage: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  mine: boolean;
  status: 'sent' | 'sending' | 'failed';
  attachments: ChatAttachment[];
  // Local file uris of photos still being sent (shown until the server copy arrives).
  localPhotos?: string[];
}

interface ChatState {
  contacts: ChatContact[];
  currentUserId: string;
  loading: boolean;
  error: string | null;
  totalUnread: number;
  refreshInbox: () => Promise<void>;
  ensureConversation: (contactId: string) => Promise<string>;
  markRead: (contactId: string) => void;
  // POST /chat/groups → the new group's id (also a contact id in `contacts`).
  createGroup: (title: string, memberIds: string[]) => Promise<string>;
}

const INBOX_POLL_MS = 20_000;
const MESSAGES_POLL_MS = 4_000;

const ChatContext = createContext<ChatState | null>(null);

function mapUser(u: any) {
  return {
    id: String(u?.id ?? ''),
    name: String(u?.fullName ?? u?.name ?? u?.email ?? ''),
    role: String(u?.role ?? ''),
    department: String(u?.department ?? ''),
  };
}

function mapLast(m: any, currentUserId: string): ChatLastMessage | null {
  if (!m || typeof m !== 'object') return null;
  const hasAttachments = Boolean(m.hasAttachments ?? m.has_attachments);
  const body = String(m.body ?? '');
  return {
    text: body || (hasAttachments ? '📷' : ''),
    createdAt: String(m.createdAt ?? m.created_at ?? ''),
    mine: String(m.senderId ?? m.sender_id ?? '') === currentUserId,
  };
}

function mapMessage(m: any, currentUserId: string): ChatMessage {
  const senderId = String(m?.senderId ?? m?.sender_id ?? '');
  const attachments: ChatAttachment[] = (Array.isArray(m?.attachments) ? m.attachments : []).map((a: any) => {
    const fileName = String(a?.fileName ?? a?.file_name ?? 'file');
    const mime = String(a?.mimeType ?? a?.mime_type ?? '');
    return {
      id: String(a?.id ?? fileName),
      url: String(a?.url ?? ''),
      fileName,
      isImage: mime.startsWith('image/') || /\.(jpe?g|png|heic|webp|gif)$/i.test(fileName),
    };
  });
  return {
    id: String(m?.id ?? ''),
    senderId,
    senderName: String(m?.senderName ?? m?.sender_name ?? ''),
    text: String(m?.body ?? ''),
    createdAt: String(m?.createdAt ?? m?.created_at ?? ''),
    mine: senderId === currentUserId,
    status: 'sent',
    attachments,
  };
}

function byTime(a: ChatMessage, b: ChatMessage) {
  return a.createdAt.localeCompare(b.createdAt);
}

export function chatRoleLabel(contact: Pick<ChatContact, 'kind' | 'role' | 'department'>, lang: Lang) {
  if (contact.kind === 'GROUP') return lang === 'RU' ? 'группа' : 'group';
  const r = `${contact.role} ${contact.department}`.toLowerCase();
  const ru = lang === 'RU';
  if (r.includes('supervisor')) return ru ? 'супервайзер' : 'supervisor';
  if (r.includes('technician') || r.includes('maintenance')) return ru ? 'техник' : 'technician';
  if (r.includes('housekeep') || r.includes('cleaner')) return ru ? 'клинер' : 'cleaner';
  if (r.includes('waiter') || r.includes('maitre') || r.includes('restaurant')) return ru ? 'ресторан' : 'restaurant';
  if (r.includes('parking') || r.includes('valet')) return ru ? 'парковка' : 'parking';
  if (r.includes('reception') || r.includes('front')) return ru ? 'ресепшн' : 'reception';
  if (r.includes('admin') || r.includes('owner') || r.includes('manager')) return ru ? 'администрация' : 'management';
  return (contact.department || contact.role).toLowerCase();
}

// "14:05" today, "Вчера"/"Yesterday", otherwise "18.10".
export function formatChatTime(iso: string, lang: Lang) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const pad = (n: number) => String(n).padStart(2, '0');
  if (d.getTime() >= startOfToday) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (d.getTime() >= startOfToday - 86_400_000) return lang === 'RU' ? 'Вчера' : 'Yesterday';
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}

export function messageClock(iso: string) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useApp();
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contactsRef = useRef(contacts);
  contactsRef.current = contacts;

  const refreshInbox = useCallback(async () => {
    try {
      const inbox: any = await getChatInbox();
      const me = String(inbox?.currentUserId ?? inbox?.current_user_id ?? '');
      const staff = Array.isArray(inbox?.staff) ? inbox.staff : [];
      const groups = Array.isArray(inbox?.groups) ? inbox.groups : [];
      const next: ChatContact[] = [
        ...staff
          .map((s: any) => {
            const u = mapUser(s?.user);
            return {
              id: u.id,
              kind: 'DIRECT' as const,
              conversationId: s?.conversationId ? String(s.conversationId) : null,
              name: u.name,
              role: u.role,
              department: u.department,
              unreadCount: Number(s?.unreadCount ?? 0),
              lastMessage: mapLast(s?.lastMessage, me),
            };
          })
          .filter((c: ChatContact) => c.id && c.id !== me),
        ...groups.map((g: any) => ({
          id: String(g?.id ?? ''),
          kind: 'GROUP' as const,
          conversationId: String(g?.id ?? ''),
          name: String(g?.title ?? ''),
          role: '',
          department: '',
          unreadCount: Number(g?.unreadCount ?? 0),
          lastMessage: mapLast(g?.lastMessage, me),
        })),
      ];
      // Conversations with activity first (newest on top), then everyone else by name.
      next.sort((a, b) => {
        const at = a.lastMessage?.createdAt || '';
        const bt = b.lastMessage?.createdAt || '';
        if (at !== bt) return bt.localeCompare(at);
        return a.name.localeCompare(b.name);
      });
      setCurrentUserId(me);
      setContacts(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setContacts([]);
      setCurrentUserId('');
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void refreshInbox().finally(() => {
      if (!cancelled) setLoading(false);
    });
    const timer = setInterval(() => {
      if (RNAppState.currentState === 'active') void refreshInbox();
    }, INBOX_POLL_MS);
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s === 'active') void refreshInbox();
    });
    return () => {
      cancelled = true;
      clearInterval(timer);
      sub.remove();
    };
  }, [isLoggedIn, refreshInbox]);

  const ensureConversation = useCallback(async (contactId: string) => {
    const existing = contactsRef.current.find((c) => c.id === contactId);
    if (existing?.conversationId) return existing.conversationId;
    // Not in the inbox as a group → it's a user id; open (or fetch) the direct chat.
    const conversation: any = await openDirectChat(contactId);
    const conversationId = String(conversation?.id ?? '');
    if (!conversationId) throw new Error('No conversation id');
    setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, conversationId } : c)));
    return conversationId;
  }, []);

  const markRead = useCallback((contactId: string) => {
    const contact = contactsRef.current.find((c) => c.id === contactId);
    if (!contact) return;
    if (contact.unreadCount > 0) {
      setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, unreadCount: 0 } : c)));
    }
    if (contact.conversationId) void markChatRead(contact.conversationId).catch(() => undefined);
  }, []);

  const createGroup = useCallback(
    async (title: string, memberIds: string[]) => {
      const group: any = await createChatGroup(title.trim(), memberIds);
      const id = String(group?.id ?? '');
      if (!id) throw new Error('No group id');
      setContacts((prev) => [
        { id, kind: 'GROUP', conversationId: id, name: title.trim(), role: '', department: '', unreadCount: 0, lastMessage: null },
        ...prev.filter((c) => c.id !== id),
      ]);
      void refreshInbox();
      return id;
    },
    [refreshInbox]
  );

  const totalUnread = useMemo(() => contacts.reduce((acc, c) => acc + c.unreadCount, 0), [contacts]);

  const value = useMemo<ChatState>(
    () => ({ contacts, currentUserId, loading, error, totalUnread, refreshInbox, ensureConversation, markRead, createGroup }),
    [contacts, currentUserId, loading, error, totalUnread, refreshInbox, ensureConversation, markRead, createGroup]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}

// Messages of one chat, polled while the screen is mounted and the app is in the
// foreground. Sending is optimistic: the bubble shows immediately as "sending" and is
// replaced by the server's copy (or marked failed, tap to retry).
export function useChatConversation(contactId: string) {
  const { contacts, currentUserId, ensureConversation, markRead, refreshInbox } = useChat();
  const contact = contacts.find((c) => c.id === contactId);
  const conversationId = contact?.conversationId ?? null;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(conversationId));
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<ChatMessage[]>([]);
  const lastSeenId = useRef<string>('');

  const load = useCallback(async () => {
    if (!conversationId || !currentUserId) return;
    try {
      const raw = await listChatMessages(conversationId);
      const server = (Array.isArray(raw) ? raw : []).map((m) => mapMessage(m, currentUserId)).sort(byTime);
      setMessages([...server, ...pending.current]);
      setError(null);
      const newest = server[server.length - 1]?.id || '';
      if (newest && newest !== lastSeenId.current) {
        lastSeenId.current = newest;
        markRead(contactId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [conversationId, currentUserId, contactId, markRead]);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void load();
    const timer = setInterval(() => {
      if (RNAppState.currentState === 'active') void load();
    }, MESSAGES_POLL_MS);
    return () => clearInterval(timer);
  }, [conversationId, load]);

  const deliver = useCallback(
    async (local: ChatMessage) => {
      const setPending = (list: ChatMessage[]) => {
        pending.current = list;
        setMessages((prev) => [...prev.filter((m) => m.status === 'sent'), ...list]);
      };
      setPending([...pending.current.filter((m) => m.id !== local.id), { ...local, status: 'sending' }]);
      try {
        const id = await ensureConversation(contactId);
        const saved = mapMessage(await sendChatMessage(id, local.text, local.localPhotos), currentUserId);
        pending.current = pending.current.filter((m) => m.id !== local.id);
        lastSeenId.current = saved.id;
        setMessages((prev) => [...prev.filter((m) => m.id !== local.id && m.id !== saved.id), { ...saved, mine: true }].sort(byTime));
        void refreshInbox();
      } catch {
        setPending(pending.current.map((m) => (m.id === local.id ? { ...m, status: 'failed' } : m)));
      }
    },
    [contactId, currentUserId, ensureConversation, refreshInbox]
  );

  const send = useCallback(
    (text: string, photoUris: string[] = []) => {
      const body = text.trim();
      if (!body && photoUris.length === 0) return;
      void deliver({
        id: `local-${Date.now()}`,
        senderId: currentUserId,
        senderName: '',
        text: body,
        createdAt: new Date().toISOString(),
        mine: true,
        status: 'sending',
        attachments: [],
        localPhotos: photoUris.length ? photoUris : undefined,
      });
    },
    [currentUserId, deliver]
  );

  const retry = useCallback((message: ChatMessage) => void deliver(message), [deliver]);

  return { contact, messages, loading, error, send, retry, reload: load };
}
