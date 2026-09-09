import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Search } from 'lucide-react-native';
import { useApp } from '@/context/app-store';

interface ChatsScreenProps {
  onOpenContact: (contactId: string) => void;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase();
}

export function ChatsScreen({ onOpenContact }: ChatsScreenProps) {
  const { lang, chatContacts, markContactRead } = useApp();
  const [query, setQuery] = useState('');

  const filtered = chatContacts.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.nameRu.toLowerCase().includes(q) || c.role.toLowerCase().includes(q) || c.roleRu.toLowerCase().includes(q);
  });

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pb-4 pt-2">
        <View className="relative">
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
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="bg-white rounded-[14px] border border-border overflow-hidden">
          {filtered.map((contact, i) => {
            const initials = getInitials(lang === 'RU' ? contact.nameRu : contact.name);
            const lastMsg = contact.messages[contact.messages.length - 1];
            return (
              <Pressable
                key={contact.id}
                onPress={() => {
                  markContactRead(contact.id);
                  onOpenContact(contact.id);
                }}
                className={`p-4 flex-row items-center gap-3.5 active:bg-background ${i < filtered.length - 1 ? 'border-b border-border-light' : ''}`}
              >
                <View className="h-10 w-10 rounded-full bg-primary-light items-center justify-center border border-border">
                  <Text className="text-text-primary font-jost text-sm">{initials}</Text>
                </View>
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-sm font-jost-semibold text-text-primary shrink" numberOfLines={1}>
                      {lang === 'RU' ? contact.nameRu : contact.name}
                    </Text>
                    <Text className="text-[12px] font-jost text-text-secondary shrink" numberOfLines={1}>
                      {(lang === 'RU' ? contact.roleRu : contact.role).toLowerCase()}
                    </Text>
                    <Text className="text-[12px] font-jost text-text-secondary ml-auto shrink-0" numberOfLines={1}>{lastMsg?.time}</Text>
                    {contact.unreadCount > 0 && (
                      <View className="h-[18px] w-[18px] rounded-full bg-primary items-center justify-center ml-1 shrink-0">
                        <Text className="text-white text-[11px] font-jost-semibold">{contact.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-[12px] text-text-secondary font-jost" numberOfLines={1}>
                    {lastMsg?.text}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
