import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/context/app-store';
import { useChat } from '@/context/chat-store';
import { ChatConversationScreen } from '@/screens/cleaner/chat-conversation-screen';

export default function ChatConversationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { staffList } = useApp();
  const { contacts } = useChat();
  const title = contacts.find((c) => c.id === id)?.name || staffList.find((s) => s.id === id)?.fullName || '';

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title }} />
      <ChatConversationScreen contactId={id} />
    </>
  );
}
