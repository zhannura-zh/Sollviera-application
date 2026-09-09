import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { ChevronRight, RefreshCw, User, Lock, HelpCircle, LogOut } from 'lucide-react-native';
import { useApp } from '@/context/app-store';

function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} className={`w-9 h-5 rounded-full justify-center ${value ? 'bg-success' : 'bg-border'}`}>
      <View className={`h-4 w-4 rounded-full bg-white ${value ? 'ml-4' : 'ml-0.5'}`} />
    </Pressable>
  );
}

interface SettingsScreenProps {
  onLoggedOut: () => void;
}

export function SettingsScreen({ onLoggedOut }: SettingsScreenProps) {
  const { lang, setLang, offlineMode, toggleOffline, cleanerProfile, updateCleanerProfile, logout } = useApp();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [taskSound, setTaskSound] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [editFullName, setEditFullName] = useState(cleanerProfile.fullName);
  const [editFullNameRu, setEditFullNameRu] = useState(cleanerProfile.fullNameRu);
  const [editBadgeId, setEditBadgeId] = useState(cleanerProfile.badgeId);
  const [editFloorAssigned, setEditFloorAssigned] = useState(cleanerProfile.floorAssigned);

  const openEditProfile = () => {
    setEditFullName(cleanerProfile.fullName);
    setEditFullNameRu(cleanerProfile.fullNameRu);
    setEditBadgeId(cleanerProfile.badgeId);
    setEditFloorAssigned(cleanerProfile.floorAssigned);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    updateCleanerProfile({
      ...cleanerProfile,
      fullName: editFullName,
      fullNameRu: editFullNameRu,
      badgeId: editBadgeId,
      floorAssigned: editFloorAssigned,
    });
    setIsEditingProfile(false);
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
            <Toggle value={taskSound} onToggle={() => setTaskSound((v) => !v)} />
          </View>
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
          {lang === 'RU' ? 'СИНХРОНИЗАЦИЯ' : 'SYNCHRONIZATION'}
        </Text>
        <Pressable
          onPress={() => Alert.alert('', lang === 'RU' ? 'Данные синхронизированы успешно!' : 'Data synced successfully!')}
          className="bg-white rounded-[14px] border border-border p-4 flex-row items-center justify-between active:bg-background"
        >
          <View className="flex-row items-center gap-3">
            <RefreshCw size={16} color="#8A8177" />
            <View>
              <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Обновить данные' : 'Refresh Data'}</Text>
              <Text className="text-[12px] font-jost text-text-secondary mt-0.5">
                {lang === 'RU' ? 'последняя синхронизация 09:41' : 'last synced at 09:41'}
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
            onPress={() => Alert.alert('', lang === 'RU' ? 'Смена пароля недоступна в демо-режиме' : 'Change password is not available in demo mode')}
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
        <View className="flex-1 items-center justify-center bg-dark/60 p-4">
          <View className="bg-white rounded-[24px] w-full max-w-xs p-5 gap-4 border border-border">
            <View className="flex-row items-center justify-between border-b border-border-light pb-2">
              <Text className="text-base font-jost text-text-primary">{lang === 'RU' ? 'Редактировать' : 'Edit Details'}</Text>
              <Pressable onPress={() => setIsEditingProfile(false)} className="h-6 w-6 rounded-full bg-slate-50 items-center justify-center">
                <Text className="text-text-secondary font-jost-semibold">×</Text>
              </Pressable>
            </View>

            <View className="gap-2.5">
              <View>
                <Text className="text-[11px] text-text-secondary uppercase tracking-wider mb-0.5">
                  {lang === 'RU' ? 'ФИО' : 'Full name'}
                </Text>
                <TextInput
                  value={lang === 'RU' ? editFullNameRu : editFullName}
                  onChangeText={(v) => {
                    if (lang === 'RU') { setEditFullNameRu(v); setEditFullName(v); }
                    else { setEditFullName(v); setEditFullNameRu(v); }
                  }}
                  className="w-full bg-background border border-border rounded-xl px-2.5 py-2 text-sm text-text-primary"
                />
              </View>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="text-[11px] text-text-secondary uppercase tracking-wider mb-0.5">
                    {lang === 'RU' ? 'Табель' : 'Staff ID'}
                  </Text>
                  <TextInput
                    value={editBadgeId}
                    onChangeText={setEditBadgeId}
                    className="w-full bg-background border border-border rounded-xl px-2.5 py-2 text-sm text-text-primary"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[11px] text-text-secondary uppercase tracking-wider mb-0.5">
                    {lang === 'RU' ? 'Этаж' : 'Floor'}
                  </Text>
                  <TextInput
                    value={editFloorAssigned}
                    onChangeText={setEditFloorAssigned}
                    className="w-full bg-background border border-border rounded-xl px-2.5 py-2 text-sm text-text-primary"
                  />
                </View>
              </View>
            </View>

            <View className="flex-row gap-2 pt-2 border-t border-border-light">
              <Pressable onPress={() => setIsEditingProfile(false)} className="flex-1 py-2 border border-border rounded-xl items-center">
                <Text className="text-text-secondary font-jost text-sm">{lang === 'RU' ? 'Отмена' : 'Cancel'}</Text>
              </Pressable>
              <Pressable onPress={handleSaveProfile} className="flex-1 py-2 bg-primary rounded-xl items-center active:bg-primary-hover">
                <Text className="text-white font-jost text-sm">{lang === 'RU' ? 'Сохранить' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
