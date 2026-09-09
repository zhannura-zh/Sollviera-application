import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  Language,
  HotelRoom,
  RoomStatus,
  RoomCheckitem,
  SupplyItem,
  AppNotification,
  MaintenanceRequest,
  CleanerProfile,
} from '@/types';
import {
  mockRooms,
  mockCleaners,
  mockSupplyItems,
  mockNotifications,
  mockMaintenanceRequests,
} from '@/data/mockData';

export interface ChatMessage {
  sender: 'CLEANER' | 'OTHER';
  text: string;
  time: string;
}

export interface ChatContact {
  id: string;
  name: string;
  nameRu: string;
  role: string;
  roleRu: string;
  avatarUrl: string;
  phone: string;
  unreadCount: number;
  messages: ChatMessage[];
  quickRepliesRu: string[];
  quickRepliesEn: string[];
}

const INITIAL_CHAT_CONTACTS: ChatContact[] = [
  {
    id: 'super-anna',
    name: 'Anna Peterson',
    nameRu: 'Анна Петерсон',
    role: 'Supervisor',
    roleRu: 'Супервайзер',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    phone: '+7 (999) 450-12-88',
    unreadCount: 0,
    messages: [
      { sender: 'OTHER', text: 'Доброе утро! Ваша смена активирована. Пожалуйста, проверьте этаж 3.', time: '08:00' },
    ],
    quickRepliesRu: ['Сообщение принято. Отправляю дежурного. Спасибо!', 'Поняла вас, проверю в течение 10 минут.', 'Спасибо за отчет!'],
    quickRepliesEn: ['Message received. Directing shift crew. Thank you!', 'Got it, will inspect in 10 minutes.', 'Thanks for the report!'],
  },
  {
    id: 'cleaner-marcus',
    name: 'Marcus Brody',
    nameRu: 'Маркус Броди',
    role: 'Housekeeper',
    roleRu: 'Горничная',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+7 (999) 555-01-99',
    unreadCount: 1,
    messages: [
      { sender: 'OTHER', text: 'Привет, у тебя есть лишние большие простыни на 3 этаже? Нам не хватило для 208 номера.', time: '13:02' },
    ],
    quickRepliesRu: ['Привет! Да, есть 2 штуки на тележке, забирай у лифта.', 'К сожалению, закончились, жду поставку.', 'Спроси у Светланы, у нее был запас.'],
    quickRepliesEn: ['Hey! Yes, I have 2 sheets on my trolley near the elevator.', 'Sorry, ran out, waiting for refill.', 'Ask Svetlana, she had a reserve.'],
  },
  {
    id: 'senior-svetlana',
    name: 'Svetlana Kim',
    nameRu: 'Светлана Ким',
    role: 'Senior Housekeeper',
    roleRu: 'Старшая горничная',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    phone: '+7 (800) 100-20-30',
    unreadCount: 0,
    messages: [
      { sender: 'OTHER', text: 'Пожалуйста, сверьте стандарты по 304 номеру до 13:45. Заезд VIP гостя планируется раньше.', time: '12:45' },
    ],
    quickRepliesRu: ['Принято в работу, уже заканчиваю спальню.', 'Всё готово, стандарты подтверждены.', 'Хорошо, сейчас перепроверю мини-бар.'],
    quickRepliesEn: ['Accepted, already finishing the bedroom details.', 'All set, standards verified.', 'Okay, will double check the minibar now.'],
  },
  {
    id: 'head-oleg',
    name: 'Oleg Voronov',
    nameRu: 'Олег Воронов',
    role: 'Head of Housekeeping',
    roleRu: 'Руководитель службы',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    phone: '+7 (800) 100-20-30',
    unreadCount: 0,
    messages: [
      { sender: 'OTHER', text: 'Отличная работа по аудитам 3 этажа на этой неделе. Качество 99%. Так держать!', time: 'Вчера' },
    ],
    quickRepliesRu: ['Спасибо большое, Олег! Стараемся всей командой.', 'Спасибо! Будем поддерживать этот уровень.'],
    quickRepliesEn: ['Thank you very much, Oleg! Great team effort.', 'Thank you! We will keep up this standard.'],
  },
];

function timeNow() {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

interface AppState {
  lang: Language;
  setLang: (lang: Language) => void;

  isLoggedIn: boolean;
  login: (profile: CleanerProfile) => void;
  logout: () => void;

  cleanerProfile: CleanerProfile;
  updateCleanerProfile: (profile: CleanerProfile) => void;

  rooms: HotelRoom[];
  updateRoomStatus: (roomId: string, status: RoomStatus) => boolean;
  updateRoomChecklist: (roomId: string, checklist: RoomCheckitem[]) => void;
  activeRoom: HotelRoom | null;

  supplies: SupplyItem[];
  updateSupplyQty: (supplyId: string, diff: number) => void;
  requestSupplyRefill: (supplyId: string, qty: number) => void;
  deductSupplies: (deductions: Record<string, number>) => void;

  notifications: AppNotification[];
  addSystemNotification: (msgEn: string, msgRu: string, cat: AppNotification['category']) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  maintenanceRequests: MaintenanceRequest[];
  addMaintenanceRequest: (req: Omit<MaintenanceRequest, 'id' | 'timestamp' | 'status'>) => void;

  offlineMode: boolean;
  toggleOffline: () => void;

  chatContacts: ChatContact[];
  sendContactMessage: (contactId: string, text: string) => void;
  markContactRead: (contactId: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('RU');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [cleanerProfile, setCleanerProfile] = useState<CleanerProfile>(mockCleaners[0]);
  const [rooms, setRooms] = useState<HotelRoom[]>(mockRooms);
  const [supplies, setSupplies] = useState<SupplyItem[]>(mockSupplyItems);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(mockMaintenanceRequests);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [chatContacts, setChatContacts] = useState<ChatContact[]>(INITIAL_CHAT_CONTACTS);

  const login = useCallback((profile: CleanerProfile) => {
    setCleanerProfile(profile);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setCleanerProfile(mockCleaners[0]);
  }, []);

  const addSystemNotification = useCallback((msgEn: string, msgRu: string, cat: AppNotification['category']) => {
    const notif: AppNotification = {
      id: `n-${Date.now()}`,
      timestamp: timeNow(),
      messageEn: msgEn,
      messageRu: msgRu,
      category: cat,
      isRead: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  }, []);

  // Returns false if the update was rejected (e.g. another room already active)
  const updateRoomStatus = useCallback(
    (roomId: string, status: RoomStatus) => {
      if (status === 'IN_PROGRESS') {
        const currentlyActive = rooms.find((r) => r.status === 'IN_PROGRESS');
        if (currentlyActive && currentlyActive.id !== roomId) {
          return false;
        }
      }
      const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id !== roomId) return r;
          const updated = { ...r, status };
          if (status === 'IN_PROGRESS' && !r.startTime) updated.startTime = timeStr;
          if ((status === 'READY' || status === 'VERIFIED') && !r.endTime) updated.endTime = timeStr;
          return updated;
        })
      );
      return true;
    },
    [rooms]
  );

  const updateRoomChecklist = useCallback((roomId: string, checklist: RoomCheckitem[]) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, checklist } : r)));
  }, []);

  const updateSupplyQty = useCallback((supplyId: string, diff: number) => {
    setSupplies((prev) =>
      prev.map((s) => (s.id === supplyId ? { ...s, trolleyQty: Math.max(0, s.trolleyQty + diff) } : s))
    );
  }, []);

  const requestSupplyRefill = useCallback(
    (supplyId: string, qty: number) => {
      setSupplies((prev) =>
        prev.map((s) => (s.id === supplyId ? { ...s, requestedQty: s.requestedQty + qty } : s))
      );
      const item = supplies.find((s) => s.id === supplyId);
      if (item) {
        addSystemNotification(
          `Supply refill requested: ${qty} x ${item.nameEn}`,
          `Запрошено пополнение: ${qty} шт. x ${item.nameRu}`,
          'SYSTEM'
        );
      }
    },
    [supplies, addSystemNotification]
  );

  const deductSupplies = useCallback((deductions: Record<string, number>) => {
    setSupplies((prev) =>
      prev.map((s) => {
        const ded = deductions[s.id] || 0;
        return ded > 0 ? { ...s, trolleyQty: Math.max(0, s.trolleyQty - ded) } : s;
      })
    );
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const addMaintenanceRequest = useCallback(
    (req: Omit<MaintenanceRequest, 'id' | 'timestamp' | 'status'>) => {
      const timestamp = new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const newReq: MaintenanceRequest = {
        ...req,
        id: `m-${Date.now()}`,
        status: 'CREATED',
        timestamp,
        descriptionEn: req.descriptionEn || req.description,
        descriptionRu: req.descriptionRu || req.description,
      };
      setMaintenanceRequests((prev) => [newReq, ...prev]);

      if (req.blocksCleaning) {
        const room = rooms.find((r) => r.roomNumber === req.roomNumber);
        if (room) updateRoomStatus(room.id, 'PROBLEM');
      }

      addSystemNotification(
        `Issue reported in Room ${req.roomNumber}: ${req.description}`,
        `Неполадка в номере ${req.roomNumber}: ${req.description}`,
        'URGENT'
      );
    },
    [rooms, updateRoomStatus, addSystemNotification]
  );

  const toggleOffline = useCallback(() => setOfflineMode((prev) => !prev), []);

  const sendContactMessage = useCallback(
    (contactId: string, text: string) => {
      if (!text.trim()) return;
      const time = timeNow();
      setChatContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, messages: [...c.messages, { sender: 'CLEANER', text: text.trim(), time }] } : c))
      );

      setTimeout(() => {
        const repTime = timeNow();
        setChatContacts((prev) =>
          prev.map((c) => {
            if (c.id !== contactId) return c;
            const replies = lang === 'RU' ? c.quickRepliesRu : c.quickRepliesEn;
            const reply = replies[Math.floor(Math.random() * replies.length)] || 'Ok';
            return { ...c, messages: [...c.messages, { sender: 'OTHER', text: reply, time: repTime }] };
          })
        );
      }, 1500);
    },
    [lang]
  );

  const markContactRead = useCallback((contactId: string) => {
    setChatContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, unreadCount: 0 } : c)));
  }, []);

  const activeRoom = useMemo(() => rooms.find((r) => r.status === 'IN_PROGRESS') || null, [rooms]);

  const value: AppState = {
    lang,
    setLang,
    isLoggedIn,
    login,
    logout,
    cleanerProfile,
    updateCleanerProfile: setCleanerProfile,
    rooms,
    updateRoomStatus,
    updateRoomChecklist,
    activeRoom,
    supplies,
    updateSupplyQty,
    requestSupplyRefill,
    deductSupplies,
    notifications,
    addSystemNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    maintenanceRequests,
    addMaintenanceRequest,
    offlineMode,
    toggleOffline,
    chatContacts,
    sendContactMessage,
    markContactRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
