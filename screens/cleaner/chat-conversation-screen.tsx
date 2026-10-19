import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Linking, ActivityIndicator, Image, Alert, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { KeyboardAvoidingView, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useHeaderHeight } from '@react-navigation/elements';
import { PhoneCall, Send, ImagePlus, X } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { chatRoleLabel, messageClock, useChatConversation, ChatMessage } from '@/context/chat-store';
import { fileSource } from '@/lib/api-client';
import { getInitials } from '@/screens/cleaner/chats-screen';

interface ChatConversationScreenProps {
  contactId: string;
}

export function ChatConversationScreen({ contactId }: ChatConversationScreenProps) {
  const { lang, staffList } = useApp();
  const { contact, messages, loading, error, send, retry } = useChatConversation(contactId);
  const [inputText, setInputText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [viewer, setViewer] = useState<{ uri: string; remote: boolean } | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  // The route shows a native stack header above this screen; without this offset the
  // keyboard lifts the input by too little and covers it.
  const headerHeight = useHeaderHeight();
  // Closed: 12px + the home-indicator inset. Open: the inset is under the keyboard, so only
  // 12px (same as the top padding). Interpolated on the keyboard's own animation progress so
  // the bar moves in one smooth motion instead of jumping by the inset at start/end.
  const insets = useSafeAreaInsets();
  const { progress } = useReanimatedKeyboardAnimation();
  const inputBarStyle = useAnimatedStyle(() => ({
    paddingBottom: interpolate(progress.value, [0, 1], [insets.bottom + 12, 12]),
  }));

  // Someone opened from a staff card who isn't in the inbox yet — fall back to the staff
  // directory for the header; the conversation is created on the first message.
  const staff = staffList.find((s) => s.id === contactId);
  const name = contact?.name || staff?.fullName || '';
  const role = contact ? chatRoleLabel(contact, lang) : staff ? chatRoleLabel({ kind: 'DIRECT', role: staff.roleCode || '', department: staff.department || '' }, lang) : '';
  const phone = staff?.phone;
  const isGroup = contact?.kind === 'GROUP';

  const canSend = !!inputText.trim() || photos.length > 0;

  const handleSend = () => {
    if (!canSend) return;
    send(inputText, photos);
    setInputText('');
    setPhotos([]);
  };

  const pickPhoto = (source: 'camera' | 'library') => async () => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        lang === 'RU' ? 'Нет доступа' : 'Permission required',
        lang === 'RU' ? 'Разрешите доступ к камере или фото в настройках устройства.' : 'Allow access to the camera or photo library in device settings.'
      );
      return;
    }
    const options = { mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 };
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const uri = result.canceled ? undefined : result.assets[0]?.uri;
    if (uri) setPhotos((prev) => [...prev, uri].slice(0, 5));
  };

  const askPhotoSource = () =>
    Alert.alert(lang === 'RU' ? 'Фото' : 'Photo', undefined, [
      { text: lang === 'RU' ? 'Камера' : 'Camera', onPress: pickPhoto('camera') },
      { text: lang === 'RU' ? 'Галерея' : 'Library', onPress: pickPhoto('library') },
      { text: lang === 'RU' ? 'Отмена' : 'Cancel', style: 'cancel' },
    ]);

  const renderPhotos = (msg: ChatMessage) => {
    const items = [
      ...(msg.localPhotos || []).map((uri) => ({ key: uri, uri, remote: false })),
      ...msg.attachments.filter((a) => a.isImage && a.url).map((a) => ({ key: a.id, uri: a.url, remote: true })),
    ];
    const files = msg.attachments.filter((a) => !a.isImage);
    if (items.length === 0 && files.length === 0) return null;
    return (
      <View className="gap-1.5 mb-1">
        {items.map((it) => (
          <Pressable key={it.key} onPress={() => setViewer({ uri: it.uri, remote: it.remote })}>
            <Image source={it.remote ? fileSource(it.uri) : { uri: it.uri }} className="w-52 h-52 rounded-[10px] bg-border" resizeMode="cover" />
          </Pressable>
        ))}
        {files.map((f) => (
          <Text key={f.id} className={`text-[13px] font-jost underline ${msg.mine ? 'text-white' : 'text-text-primary'}`}>📎 {f.fileName}</Text>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior="padding" keyboardVerticalOffset={headerHeight}>
      <View className="bg-white border-y border-border/80 px-5 py-3.5 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          <View className="h-10 w-10 rounded-full bg-primary-light items-center justify-center border border-border">
            <Text className="text-text-primary font-jost text-sm">{getInitials(name)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-jost-semibold text-text-primary" numberOfLines={1}>{name}</Text>
            {!!(role || phone) && (
              <Text className="text-[12px] text-text-secondary font-jost mt-0.5" numberOfLines={1}>
                {[role, phone].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
        </View>
        {!!phone && (
          <Pressable
            onPress={() => Linking.openURL(`tel:${phone}`)}
            className="h-9 w-9 bg-white border border-border rounded-xl items-center justify-center active:bg-background"
          >
            <PhoneCall size={16} color="#8A8177" />
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 p-5"
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled"
      >
        {loading && messages.length === 0 ? (
          <ActivityIndicator className="mt-8" color="#8A8177" />
        ) : messages.length === 0 ? (
          <Text className="text-sm text-text-secondary font-jost text-center mt-8">
            {error
              ? lang === 'RU' ? 'Не удалось загрузить сообщения' : 'Could not load messages'
              : lang === 'RU' ? 'Сообщений пока нет. Напишите первым.' : 'No messages yet. Say hello.'}
          </Text>
        ) : (
          messages.map((msg) => {
            const mine = msg.mine;
            const failed = msg.status === 'failed';
            return (
              <Pressable
                key={msg.id}
                disabled={!failed}
                onPress={() => retry(msg)}
                className={`flex-row ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <View className={`max-w-[85%] rounded-[14px] p-3 ${mine ? 'bg-dark rounded-br-none' : 'bg-white border border-border rounded-bl-none'} ${msg.status === 'sending' ? 'opacity-60' : ''}`}>
                  {isGroup && !mine && !!msg.senderName && (
                    <Text className="text-[11px] font-jost-semibold text-text-secondary mb-1">{msg.senderName}</Text>
                  )}
                  {renderPhotos(msg)}
                  {!!msg.text && (
                    <Text className={`text-sm leading-relaxed font-jost ${mine ? 'text-white' : 'text-text-primary'}`}>{msg.text}</Text>
                  )}
                  <Text className={`text-[11px] text-right mt-1 font-jost ${failed ? 'text-red-300' : mine ? 'text-white/60' : 'text-text-secondary'}`}>
                    {failed
                      ? lang === 'RU' ? 'Не отправлено · нажмите, чтобы повторить' : 'Not sent · tap to retry'
                      : msg.status === 'sending'
                        ? lang === 'RU' ? 'Отправка…' : 'Sending…'
                        : messageClock(msg.createdAt)}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Animated.View style={[{ backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: 'rgba(229, 226, 221, 0.6)' }, inputBarStyle]}>
        <View className="px-5 pt-3 gap-2">
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {photos.map((uri) => (
                <View key={uri}>
                  <Image source={{ uri }} className="w-16 h-16 rounded-lg bg-border" />
                  <Pressable
                    onPress={() => setPhotos((prev) => prev.filter((p) => p !== uri))}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-dark items-center justify-center"
                  >
                    <X size={12} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
          <View className="flex-row gap-2">
            <Pressable
              onPress={askPhotoSource}
              className="h-10 w-10 bg-white border border-border rounded-xl items-center justify-center active:bg-background self-end"
            >
              <ImagePlus size={16} color="#8A8177" />
            </Pressable>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={lang === 'RU' ? 'Напишите сообщение...' : 'Type a message...'}
              placeholderTextColor="#8A8177"
              multiline
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary max-h-28"
            />
            <Pressable
              onPress={handleSend}
              disabled={!canSend}
              className="h-10 w-10 bg-primary rounded-xl items-center justify-center disabled:opacity-50 active:bg-primary-hover self-end"
            >
              <Send size={16} color="#fff" />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <Pressable onPress={() => setViewer(null)} className="flex-1 bg-black/90 items-center justify-center">
          {!!viewer && (
            <Image source={viewer.remote ? fileSource(viewer.uri) : { uri: viewer.uri }} className="w-full h-full" resizeMode="contain" />
          )}
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
