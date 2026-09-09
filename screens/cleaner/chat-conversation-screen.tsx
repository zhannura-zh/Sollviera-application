import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhoneCall, Send } from 'lucide-react-native';
import { useApp } from '@/context/app-store';

interface ChatConversationScreenProps {
  contactId: string;
}

export function ChatConversationScreen({ contactId }: ChatConversationScreenProps) {
  const { lang, chatContacts, sendContactMessage } = useApp();
  const [inputText, setInputText] = useState('');
  const contact = chatContacts.find((c) => c.id === contactId);

  if (!contact) return null;

  const initials = (lang === 'RU' ? contact.nameRu : contact.name).split(' ').map((n) => n[0]).join('').toUpperCase();

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendContactMessage(contact.id, inputText);
    setInputText('');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 44 : 0}
    >
      <View className="bg-white border-y border-border/80 px-5 py-3.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 rounded-full bg-primary-light items-center justify-center border border-border">
            <Text className="text-text-primary font-jost text-sm">{initials}</Text>
          </View>
          <View>
            <Text className="text-sm font-jost-semibold text-text-primary">{lang === 'RU' ? contact.nameRu : contact.name}</Text>
            <Text className="text-[12px] text-text-secondary font-jost mt-0.5">
              {lang === 'RU' ? contact.roleRu : contact.role} · {contact.phone}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => Linking.openURL(`tel:${contact.phone}`)}
          className="h-9 w-9 bg-white border border-border rounded-xl items-center justify-center active:bg-background"
        >
          <PhoneCall size={16} color="#8A8177" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-5" contentContainerStyle={{ gap: 12 }}>
        {contact.messages.map((msg, index) => {
          const isCleaner = msg.sender === 'CLEANER';
          return (
            <View key={index} className={`flex-row ${isCleaner ? 'justify-end' : 'justify-start'}`}>
              <View className={`max-w-[85%] rounded-[14px] p-3 ${isCleaner ? 'bg-dark rounded-br-none' : 'bg-white border border-border rounded-bl-none'}`}>
                <Text className={`text-sm leading-relaxed font-jost ${isCleaner ? 'text-white' : 'text-text-primary'}`}>{msg.text}</Text>
                <Text className={`text-[11px] text-right mt-1 font-jost ${isCleaner ? 'text-white/60' : 'text-text-secondary'}`}>{msg.time}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="p-5 bg-white border-t border-border/60 flex-row gap-2">
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder={lang === 'RU' ? 'Напишите сообщение...' : 'Type a message...'}
          placeholderTextColor="#8A8177"
          className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary"
        />
        <Pressable
          onPress={handleSend}
          disabled={!inputText.trim()}
          className="h-10 w-10 bg-primary rounded-xl items-center justify-center disabled:opacity-50 active:bg-primary-hover"
        >
          <Send size={16} color="#fff" />
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
