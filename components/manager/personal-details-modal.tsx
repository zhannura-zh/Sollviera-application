import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { User, X } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { ManagerAvatar } from '@/components/manager/manager-avatar';
import { useManagerToast } from '@/components/manager/toast';

// Design ManagerScreens «Личные данные» (Settings → MODAL 1). Saved via PATCH /staff/me.
export function ManagerPersonalDetailsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { lang, cleanerProfile, saveMyProfile } = useApp();
  const toast = useManagerToast();
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFullName((ru ? cleanerProfile.fullNameRu : cleanerProfile.fullName) || cleanerProfile.fullName);
    setPhone(cleanerProfile.phone || '');
    setEmail(cleanerProfile.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const save = async () => {
    if (!fullName.trim()) return;
    setBusy(true);
    try {
      await saveMyProfile({ fullName, email, phone });
      onClose();
      toast(t('Данные профиля обновлены', 'Profile details updated'));
    } catch (error) {
      Alert.alert(t('Не удалось сохранить', 'Could not save'), error instanceof Error ? error.message : t('Попробуйте ещё раз', 'Please try again'));
    } finally {
      setBusy(false);
    }
  };

  const fields = [
    { label: t('ФИО руководителя', 'Full Name'), value: fullName, set: setFullName, keyboard: 'default' as const },
    { label: t('Контактный телефон', 'Contact Phone'), value: phone, set: setPhone, keyboard: 'phone-pad' as const },
    { label: t('Электронная почта', 'Email Address'), value: email, set: setEmail, keyboard: 'email-address' as const },
  ];
  const displayName = fullName || cleanerProfile.fullNameRu || cleanerProfile.fullName;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1 items-center justify-center bg-black/40 p-4" behavior="padding">
        <View className="bg-white w-full max-w-sm rounded-2xl border border-border p-5 gap-4">
          <View className="flex-row items-center justify-between border-b border-border/60 pb-2">
            <View className="flex-row items-center gap-2">
              <User size={16} color="#C2410C" />
              <Text className="text-sm font-spectral text-text-primary">{t('Личные данные', 'Personal Details')}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} className="p-1 active:opacity-60">
              <X size={16} color="#8A8177" />
            </Pressable>
          </View>

          <View className="flex-row items-center gap-3 bg-background p-3 rounded-xl border border-border">
            <ManagerAvatar name={displayName} size={44} />
            <View className="flex-1">
              <Text className="text-xs font-jost-medium text-text-primary" numberOfLines={1}>
                {displayName}
              </Text>
              <Text className="text-[11px] font-jost text-text-secondary">
                {t('Руководитель отеля', 'Hotel Manager')}
                {cleanerProfile.badgeId ? ` · ${cleanerProfile.badgeId}` : ''}
              </Text>
            </View>
          </View>

          <View className="gap-3">
            {fields.map((f) => (
              <View key={f.label}>
                <Text className="text-[11px] font-jost text-text-secondary mb-1">{f.label}</Text>
                <TextInput
                  value={f.value}
                  onChangeText={f.set}
                  keyboardType={f.keyboard}
                  autoCapitalize={f.keyboard === 'default' ? 'words' : 'none'}
                  className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs font-jost text-text-primary"
                />
              </View>
            ))}
          </View>

          <View className="flex-row items-center gap-2 pt-2">
            <Pressable
              onPress={save}
              disabled={busy || !fullName.trim()}
              className={`flex-1 py-2.5 rounded-xl items-center ${busy || !fullName.trim() ? 'bg-border' : 'bg-primary active:opacity-80'}`}
            >
              <Text className="text-xs font-jost-medium text-white">{busy ? '…' : t('Сохранить', 'Save Changes')}</Text>
            </Pressable>
            <Pressable onPress={onClose} className="px-4 py-2.5 bg-white border border-border rounded-xl active:bg-background">
              <Text className="text-xs font-jost text-text-secondary">{t('Отмена', 'Cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
