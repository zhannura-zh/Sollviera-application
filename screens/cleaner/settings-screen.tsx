import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, TextInput, Alert, Switch } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { ChevronRight, RefreshCw, User, Lock, HelpCircle, LogOut } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { ChangePasswordModal } from '@/components/password-modals';

function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#E5DFD3', true: '#5B8C6E' }}
      thumbColor="#fff"
    />
  );
}

interface SettingsScreenProps {
  onLoggedOut: () => void;
}

export function SettingsScreen({ onLoggedOut }: SettingsScreenProps) {
  const {
    lang, setLang, offlineMode, toggleOffline, cleanerProfile, saveMyProfile, changePassword, logout,
    refreshData, lastSyncedAt, taskSoundEnabled, toggleTaskSound,
  } = useApp();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRefreshData = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await refreshData();
      Alert.alert('', lang === 'RU' ? 'Данные синхронизированы успешно!' : 'Data synced successfully!');
    } catch (error) {
      Alert.alert(
        lang === 'RU' ? 'Ошибка синхронизации' : 'Sync error',
        error instanceof Error ? error.message : lang === 'RU' ? 'Не удалось синхронизировать данные' : 'Failed to sync data'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Personal details are saved to the backend (PATCH /staff/me): name, email, phone.
  const [editFullName, setEditFullName] = useState(cleanerProfile.fullName);
  const [editEmail, setEditEmail] = useState(cleanerProfile.email);
  const [editPhone, setEditPhone] = useState(cleanerProfile.phone || '');

  const openEditProfile = () => {
    setEditFullName(lang === 'RU' ? cleanerProfile.fullNameRu : cleanerProfile.fullName);
    setEditEmail(cleanerProfile.email);
    setEditPhone(cleanerProfile.phone || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) return;
    setIsSavingProfile(true);
    try {
      await saveMyProfile({ fullName: editFullName, email: editEmail, phone: editPhone });
      setIsEditingProfile(false);
    } catch (error) {
      Alert.alert(
        lang === 'RU' ? 'Не удалось сохранить' : 'Could not save',
        error instanceof Error ? error.message : lang === 'RU' ? 'Попробуйте ещё раз' : 'Please try again'
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 20 }}>
      <View className="gap-2">
        <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
          {lang === 'RU' ? 'ПРИЛОЖЕНИЕ' : 'APPLICATION'}
        </Text>
        <View className="bg-white rounded-[14px] border border-border overflow-hidden">
          <View className="p-4 flex-row items-center justify-between border-b border-border-light">
            <View>
              <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Язык интерфейса' : 'Interface Language'}</Text>
              <Text className="text-[12px] font-jost text-text-secondary mt-0.5">{lang === 'RU' ? 'Русский' : 'English'}</Text>
            </View>
            <View className="flex-row bg-border/40 p-0.5 rounded-full">
              <Pressable onPress={() => setLang('RU')} className={`px-3 py-1 rounded-full ${lang === 'RU' ? 'bg-dark' : ''}`}>
                <Text className={`text-[12px] font-jost-semibold ${lang === 'RU' ? 'text-white' : 'text-text-secondary'}`}>RU</Text>
              </Pressable>
              <Pressable onPress={() => setLang('EN')} className={`px-3 py-1 rounded-full ${lang === 'EN' ? 'bg-dark' : ''}`}>
                <Text className={`text-[12px] font-jost-semibold ${lang === 'EN' ? 'text-white' : 'text-text-secondary'}`}>EN</Text>
              </Pressable>
            </View>
          </View>

          <View className="p-4 flex-row items-center justify-between border-b border-border-light">
            <View>
              <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Офлайн-режим' : 'Offline Mode'}</Text>
              <Text className="text-[12px] font-jost text-text-secondary mt-0.5">
                {lang === 'RU' ? 'данные синхронизируются при сети' : 'data syncs when connected'}
              </Text>
            </View>
            <Toggle value={offlineMode} onToggle={toggleOffline} />
          </View>

          <View className="p-4 flex-row items-center justify-between border-b border-border-light">
            <View>
              <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Push-уведомления' : 'Push Notifications'}</Text>
              <Text className="text-[12px] font-jost text-text-secondary mt-0.5">
                {lang === 'RU' ? 'новые задачи и сообщения' : 'new tasks and messages'}
              </Text>
            </View>
            <Toggle value={pushNotifications} onToggle={() => setPushNotifications((v) => !v)} />
          </View>

          <View className="p-4 flex-row items-center justify-between">
            <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Звук при новой задаче' : 'Sound on New Task'}</Text>
            <Toggle value={taskSoundEnabled} onToggle={toggleTaskSound} />
          </View>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
          {lang === 'RU' ? 'СИНХРОНИЗАЦИЯ' : 'SYNCHRONIZATION'}
        </Text>
        <Pressable
          onPress={handleRefreshData}
          disabled={isSyncing}
          className={`bg-white rounded-[14px] border border-border p-4 flex-row items-center justify-between active:bg-background ${isSyncing ? 'opacity-60' : ''}`}
        >
          <View className="flex-row items-center gap-3">
            <RefreshCw size={16} color="#8A8177" />
            <View>
              <Text className="text-sm font-jost text-text-primary">
                {isSyncing ? (lang === 'RU' ? 'Синхронизация…' : 'Syncing…') : (lang === 'RU' ? 'Обновить данные' : 'Refresh Data')}
              </Text>
              <Text className="text-[12px] font-jost text-text-secondary mt-0.5">
                {lastSyncedAt
                  ? (lang === 'RU' ? `последняя синхронизация ${lastSyncedAt}` : `last synced at ${lastSyncedAt}`)
                  : (lang === 'RU' ? 'ещё не синхронизировано' : 'not synced yet')}
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color="#8A8177" />
        </Pressable>
      </View>

      <View className="gap-2">
        <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
          {lang === 'RU' ? 'УЧЁТНАЯ ЗАПИСЬ' : 'ACCOUNT'}
        </Text>
        <View className="bg-white rounded-[14px] border border-border overflow-hidden">
          <Pressable onPress={openEditProfile} className="p-4 flex-row items-center justify-between border-b border-border-light active:bg-background">
            <View className="flex-row items-center gap-3">
              <User size={16} color="#8A8177" />
              <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Личные данные' : 'Personal Details'}</Text>
            </View>
            <ChevronRight size={16} color="#8A8177" />
          </Pressable>
          <Pressable
            onPress={() => setIsChangingPassword(true)}
            className="p-4 flex-row items-center justify-between border-b border-border-light active:bg-background"
          >
            <View className="flex-row items-center gap-3">
              <Lock size={16} color="#8A8177" />
              <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Сменить пароль' : 'Change Password'}</Text>
            </View>
            <ChevronRight size={16} color="#8A8177" />
          </Pressable>
          <Pressable
            onPress={() => Alert.alert('', lang === 'RU' ? 'Служба поддержки: +7 (800) 100-20-30' : 'Support Desk: +7 (800) 100-20-30')}
            className="p-4 flex-row items-center justify-between active:bg-background"
          >
            <View className="flex-row items-center gap-3">
              <HelpCircle size={16} color="#8A8177" />
              <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Служба поддержки' : 'Support Desk'}</Text>
            </View>
            <ChevronRight size={16} color="#8A8177" />
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={() => {
          logout();
          onLoggedOut();
        }}
        className="bg-white rounded-[14px] border border-border p-4 flex-row items-center gap-3 active:bg-background"
      >
        <LogOut size={16} color="#8A8177" />
        <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Выйти из аккаунта' : 'Log Out'}</Text>
      </Pressable>

      <Modal visible={isEditingProfile} transparent animationType="fade" onRequestClose={() => setIsEditingProfile(false)}>
        <KeyboardAvoidingView
          className="flex-1 items-center justify-center bg-dark/60 p-4"
          behavior="padding"
        >
          <View className="bg-white rounded-[24px] w-full max-w-xs p-5 gap-4 border border-border">
            <View className="flex-row items-center justify-between border-b border-border-light pb-2">
              <Text className="text-base font-jost text-text-primary">{lang === 'RU' ? 'Редактировать' : 'Edit Details'}</Text>
              <Pressable onPress={() => setIsEditingProfile(false)} className="h-6 w-6 rounded-full bg-slate-50 items-center justify-center">
                <Text className="text-text-secondary font-jost-semibold">×</Text>
              </Pressable>
            </View>

            <View className="gap-2.5">
              {([
                [lang === 'RU' ? 'ФИО' : 'Full name', editFullName, setEditFullName, 'default'],
                ['Email', editEmail, setEditEmail, 'email-address'],
                [lang === 'RU' ? 'Телефон' : 'Phone', editPhone, setEditPhone, 'phone-pad'],
              ] as const).map(([label, value, setValue, keyboardType]) => (
                <View key={label}>
                  <Text className="text-[11px] text-text-secondary uppercase tracking-wider mb-0.5">{label}</Text>
                  <TextInput
                    value={value}
                    onChangeText={setValue}
                    keyboardType={keyboardType}
                    autoCapitalize={keyboardType === 'default' ? 'words' : 'none'}
                    className="w-full bg-background border border-border rounded-xl px-2.5 py-2 text-sm text-text-primary"
                  />
                </View>
              ))}
            </View>

            <View className="flex-row gap-2 pt-2 border-t border-border-light">
              <Pressable onPress={() => setIsEditingProfile(false)} className="flex-1 py-2 border border-border rounded-xl items-center">
                <Text className="text-text-secondary font-jost text-sm">{lang === 'RU' ? 'Отмена' : 'Cancel'}</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveProfile}
                disabled={isSavingProfile || !editFullName.trim()}
                className={`flex-1 py-2 rounded-xl items-center ${isSavingProfile || !editFullName.trim() ? 'bg-border' : 'bg-primary active:bg-primary-hover'}`}
              >
                <Text className="text-white font-jost text-sm">{isSavingProfile ? '…' : lang === 'RU' ? 'Сохранить' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ChangePasswordModal
        visible={isChangingPassword}
        lang={lang}
        onClose={() => setIsChangingPassword(false)}
        onSubmit={changePassword}
      />
    </ScrollView>
  );
}
