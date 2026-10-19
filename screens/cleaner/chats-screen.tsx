import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, RefreshControl, ActivityIndicator, Modal, Alert } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Search, Users, Check } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { chatRoleLabel, formatChatTime, useChat } from '@/context/chat-store';

interface ChatsScreenProps {
  onOpenContact: (contactId: string) => void;
}

export function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?';
}

export function ChatsScreen({ onOpenContact }: ChatsScreenProps) {
  const { lang, role } = useApp();
  const { contacts, loading, error, refreshInbox, markRead, createGroup } = useChat();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // Group chats (POST /chat/groups) — created by supervisors, e.g. one per floor or shift.
  const canCreateGroup = role === 'SUPERVISOR';
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const people = contacts.filter((c) => c.kind === 'DIRECT');

  const openGroupModal = () => {
    setGroupTitle('');
    setGroupMembers([]);
    setGroupOpen(true);
  };

  const submitGroup = async () => {
    setCreatingGroup(true);
    try {
      const id = await createGroup(groupTitle, groupMembers);
      setGroupOpen(false);
      onOpenContact(id);
    } catch (e) {
      Alert.alert(
        lang === 'RU' ? 'Не удалось создать группу' : 'Could not create group',
        e instanceof Error ? e.message : lang === 'RU' ? 'Попробуйте ещё раз' : 'Please try again'
      );
    } finally {
      setCreatingGroup(false);
    }
  };

  const filtered = contacts.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || chatRoleLabel(c, lang).includes(q);
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshInbox();
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pb-4 pt-2 flex-row gap-2">
        <View className="relative flex-1">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={lang === 'RU' ? 'Поиск по имени' : 'Search by name'}
            placeholderTextColor="#8A8177"
            className="w-full bg-white border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-text-primary"
          />
          <View className="absolute left-3 top-0 bottom-0 justify-center">
            <Search size={16} color="#8A8177" />
          </View>
        </View>
        {canCreateGroup && (
          <Pressable
            onPress={openGroupModal}
            className="h-[42px] px-3 bg-white border border-border rounded-xl flex-row items-center gap-1.5 active:bg-background"
          >
            <Users size={16} color="#241E1A" />
            <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Группа' : 'Group'}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && contacts.length === 0 ? (
          <ActivityIndicator className="mt-8" color="#8A8177" />
        ) : error && contacts.length === 0 ? (
          <Text className="text-sm text-text-secondary font-jost text-center mt-8">
            {lang === 'RU' ? 'Не удалось загрузить чаты. Потяните вниз, чтобы повторить.' : 'Could not load chats. Pull down to retry.'}
          </Text>
        ) : filtered.length === 0 ? (
          <Text className="text-sm text-text-secondary font-jost text-center mt-8">
            {lang === 'RU' ? 'Никого не найдено' : 'Nobody found'}
          </Text>
        ) : (
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            {filtered.map((contact, i) => {
              const last = contact.lastMessage;
              const preview = last ? `${last.mine ? (lang === 'RU' ? 'Вы: ' : 'You: ') : ''}${last.text}` : lang === 'RU' ? 'Нет сообщений' : 'No messages yet';
              return (
                <Pressable
                  key={`${contact.kind}-${contact.id}`}
                  onPress={() => {
                    markRead(contact.id);
                    onOpenContact(contact.id);
                  }}
                  className={`p-4 flex-row items-center gap-3.5 active:bg-background ${i < filtered.length - 1 ? 'border-b border-border-light' : ''}`}
                >
                  <View className="h-10 w-10 rounded-full bg-primary-light items-center justify-center border border-border">
                    <Text className="text-text-primary font-jost text-sm">{getInitials(contact.name)}</Text>
                  </View>
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-sm font-jost-semibold text-text-primary shrink" numberOfLines={1}>
                        {contact.name}
                      </Text>
                      <Text className="text-[12px] font-jost text-text-secondary shrink" numberOfLines={1}>
                        {chatRoleLabel(contact, lang)}
                      </Text>
                      <Text className="text-[12px] font-jost text-text-secondary ml-auto shrink-0" numberOfLines={1}>
                        {last ? formatChatTime(last.createdAt, lang) : ''}
                      </Text>
                      {contact.unreadCount > 0 && (
                        <View className="h-[18px] min-w-[18px] px-1 rounded-full bg-primary items-center justify-center ml-1 shrink-0">
                          <Text className="text-white text-[11px] font-jost-semibold">{contact.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-[12px] text-text-secondary font-jost" numberOfLines={1}>
                      {preview}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={groupOpen} transparent animationType="fade" onRequestClose={() => setGroupOpen(false)}>
        <KeyboardAvoidingView className="flex-1 items-center justify-center bg-dark/60 p-4" behavior="padding">
          <View className="bg-white rounded-[24px] w-full max-w-sm p-5 gap-4 border border-border max-h-[80%]">
            <Text className="text-base font-jost text-text-primary">{lang === 'RU' ? 'Новый групповой чат' : 'New group chat'}</Text>
            <TextInput
              value={groupTitle}
              onChangeText={setGroupTitle}
              placeholder={lang === 'RU' ? 'Название, например «3 этаж»' : 'Title, e.g. "Floor 3"'}
              placeholderTextColor="#8A8177"
              className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary"
            />
            <Text className="text-[12px] text-text-secondary font-jost uppercase tracking-wider">
              {lang === 'RU' ? `Участники · ${groupMembers.length}` : `Members · ${groupMembers.length}`}
            </Text>
            <ScrollView className="border border-border rounded-xl" style={{ maxHeight: 320 }}>
              {people.map((p, i) => {
                const selected = groupMembers.includes(p.id);
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setGroupMembers((prev) => (selected ? prev.filter((id) => id !== p.id) : [...prev, p.id]))}
                    className={`px-3 py-2.5 flex-row items-center gap-3 active:bg-background ${i < people.length - 1 ? 'border-b border-border-light' : ''}`}
                  >
                    <View className={`h-5 w-5 rounded-md border items-center justify-center ${selected ? 'bg-primary border-primary' : 'border-border'}`}>
                      {selected && <Check size={12} color="#fff" />}
                    </View>
                    <Text className="flex-1 text-sm font-jost text-text-primary" numberOfLines={1}>{p.name}</Text>
                    <Text className="text-[12px] font-jost text-text-secondary">{chatRoleLabel(p, lang)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View className="flex-row gap-2">
              <Pressable onPress={() => setGroupOpen(false)} className="flex-1 py-2.5 border border-border rounded-xl items-center">
                <Text className="text-text-secondary font-jost text-sm">{lang === 'RU' ? 'Отмена' : 'Cancel'}</Text>
              </Pressable>
              <Pressable
                onPress={submitGroup}
                disabled={!groupTitle.trim() || groupMembers.length === 0 || creatingGroup}
                className={`flex-1 py-2.5 rounded-xl items-center ${!groupTitle.trim() || groupMembers.length === 0 || creatingGroup ? 'bg-border' : 'bg-primary active:bg-primary-hover'}`}
              >
                <Text className="text-white font-jost text-sm">{creatingGroup ? '…' : lang === 'RU' ? 'Создать' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
