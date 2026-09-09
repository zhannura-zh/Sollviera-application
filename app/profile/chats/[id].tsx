import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useApp } from '@/context/app-store';
import { ChatConversationScreen } from '@/screens/cleaner/chat-conversation-screen';

export default function ChatConversationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, chatContacts } = useApp();
  const contact = chatContacts.find((c) => c.id === id);
  const title = contact ? (lang === 'RU' ? contact.nameRu : contact.name) : '';

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title }} />
      <ChatConversationScreen contactId={id} />
    </>
  );
}
