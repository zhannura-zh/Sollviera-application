import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageSquare, Bell, Settings, BarChart3, Users, Layers, ChevronRight } from 'lucide-react-native';
import { ShiftControls } from '@/components/shift-controls';
import { useApp } from '@/context/app-store';
import { useChat } from '@/context/chat-store';
import { ReassignTasksModal } from '@/components/reassign-tasks-modal';

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';
}

interface ProfileScreenProps {
  onOpenChats: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenReports: () => void;
  onOpenStaff: () => void;
  onLoggedOut: () => void;
}

export function ProfileScreen({ onOpenChats, onOpenNotifications, onOpenSettings, onOpenReports, onOpenStaff, onLoggedOut }: ProfileScreenProps) {
  const router = useRouter();
  const { lang, cleanerProfile, notifications, rooms, staffList } = useApp();
  const [showReassign, setShowReassign] = useState(false);

  const verifiedCount = rooms.filter((r) => r.status === 'VERIFIED').length;
  const pendingReviewCount = rooms.filter((r) => r.status === 'READY').length;
  const onShiftCount = staffList.filter((s) => s.shiftStatus === 'ON_SHIFT').length;


  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const { totalUnread: totalUnreadChats } = useChat();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-1.5 flex-row items-center justify-between">
        <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Профиль' : 'Profile'}</Text>
        <View className="flex-row items-center gap-1.5">
          <Pressable onPress={onOpenChats} className="h-10 w-10 bg-white border border-border rounded-xl items-center justify-center relative active:bg-background">
            <MessageSquare size={16} color="#241E1A" />
            {totalUnreadChats > 0 && (
              <View className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full items-center justify-center">
                <Text className="text-white text-[11px] font-jost-semibold">{totalUnreadChats}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={onOpenNotifications} className="h-10 w-10 bg-white border border-border rounded-xl items-center justify-center relative active:bg-background">
            <Bell size={16} color="#241E1A" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full items-center justify-center">
                <Text className="text-white text-[11px] font-jost-semibold">{unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={onOpenSettings} className="h-10 w-10 bg-white border border-border rounded-xl items-center justify-center active:bg-background">
            <Settings size={16} color="#241E1A" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32, gap: 16 }}>
        <View className="flex-row items-center gap-3.5 pt-2">
          <View className="h-14 w-14 rounded-full bg-primary-light items-center justify-center border border-border">
            <Text className="text-text-primary font-jost text-base">
              {getInitials(lang === 'RU' ? cleanerProfile.fullNameRu : cleanerProfile.fullName)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xl font-jost text-text-primary leading-tight" numberOfLines={1}>
              {lang === 'RU' ? cleanerProfile.fullNameRu : cleanerProfile.fullName}
            </Text>
            <Text className="text-sm font-jost text-text-secondary mt-0.5" numberOfLines={1}>
              {lang === 'RU' ? 'Супервайзер' : 'Supervisor'}
            </Text>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'ТЕКУЩАЯ СМЕНА' : 'CURRENT SHIFT'}
          </Text>
          <View className="bg-white rounded-[14px] border border-border p-4 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-jost-semibold text-text-primary">{cleanerProfile.currentShift.date}</Text>
              <Text className="text-sm font-jost text-text-secondary">
                {lang === 'RU' ? 'с' : 'from'} {cleanerProfile.currentShift.startTime}
              </Text>
            </View>

            <ShiftControls />

            <View className="border-t border-border-light" />

            <View className="flex-row">
              <View className="flex-1 items-center">
                <Text className="text-lg font-jost-semibold text-text-primary">{verifiedCount}</Text>
                <Text className="text-[12px] text-text-secondary font-jost uppercase tracking-wider mt-0.5">
                  {lang === 'RU' ? 'проверено' : 'verified'}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-lg font-jost-semibold text-text-primary">{pendingReviewCount}</Text>
                <Text className="text-[12px] text-text-secondary font-jost uppercase tracking-wider mt-0.5">
                  {lang === 'RU' ? 'ждут проверки' : 'pending'}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-lg font-jost-semibold text-text-primary">{onShiftCount}</Text>
                <Text className="text-[12px] text-text-secondary font-jost uppercase tracking-wider mt-0.5">
                  {lang === 'RU' ? 'на смене' : 'staff on shift'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'РАБОТА' : 'WORK'}
          </Text>
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            <Pressable onPress={onOpenReports} className="flex-row items-center justify-between p-3.5 active:bg-background border-b border-border-light">
              <View className="flex-row items-center gap-2.5">
                <BarChart3 size={16} color="#8A8177" />
                <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Отчёты по смене' : 'Shift reports'}</Text>
              </View>
              <ChevronRight size={16} color="#8A8177" />
            </Pressable>
            <Pressable onPress={() => setShowReassign(true)} className="flex-row items-center justify-between p-3.5 active:bg-background border-b border-border-light">
              <View className="flex-row items-center gap-2.5">
                <Layers size={16} color="#8A8177" />
                <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Перераспределение задач' : 'Task reallocation'}</Text>
              </View>
              <ChevronRight size={16} color="#8A8177" />
            </Pressable>
            <Pressable onPress={onOpenStaff} className="flex-row items-center justify-between p-3.5 active:bg-background">
              <View className="flex-row items-center gap-2.5">
                <Users size={16} color="#8A8177" />
                <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Управление персоналом' : 'Staff management'}</Text>
              </View>
              <ChevronRight size={16} color="#8A8177" />
            </Pressable>
          </View>
        </View>

        <ReassignTasksModal visible={showReassign} onClose={() => setShowReassign(false)} />
      </ScrollView>
    </SafeAreaView>
  );
}
