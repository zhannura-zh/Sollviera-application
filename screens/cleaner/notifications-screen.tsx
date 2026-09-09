import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Bell, Clock, Wrench, MessageSquare, Package, CheckCircle2 } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { AppNotification } from '@/types';

type Filter = 'ALL' | 'TASK' | 'MAINTENANCE' | 'SHIFT';

export function NotificationsScreen() {
  const { lang, notifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<Filter>('ALL');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((item) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'TASK') return item.category === 'NEW_ROOM' || item.category === 'URGENT';
    if (selectedFilter === 'MAINTENANCE') return item.category === 'SUPERVISOR';
    if (selectedFilter === 'SHIFT') return item.category === 'SYSTEM';
    return true;
  });

  const getNotifIcon = (item: AppNotification) => {
    if (item.category === 'URGENT') return <Clock size={17} color="#B3261E" />;
    if (item.category === 'NEW_ROOM') return <Clock size={17} color="#8A8177" />;
    if (item.messageRu.includes('Техник') || item.messageEn.includes('Technician')) return <Wrench size={17} color="#8A8177" />;
    if (item.messageRu.includes('Сообщение') || item.messageEn.includes('Message')) return <MessageSquare size={17} color="#8A8177" />;
    if (item.messageRu.includes('Пополнение') || item.messageEn.includes('replenishment')) return <Package size={17} color="#8A8177" />;
    if (item.messageRu.includes('проверен') || item.messageEn.includes('inspected')) return <CheckCircle2 size={17} color="#8A8177" />;
    return <Clock size={17} color="#8A8177" />;
  };

  const todayNotifs = filtered.filter((n) => n.timestamp !== 'вчера' && n.timestamp !== '25 авг');
  const earlierNotifs = filtered.filter((n) => n.timestamp === 'вчера' || n.timestamp === '25 авг');

  const renderCard = (item: AppNotification) => {
    const hasLeftRedBorder = item.category === 'URGENT' && !item.isRead;
    return (
      <Pressable
        key={item.id}
        onPress={() => markNotificationAsRead(item.id)}
        className={`bg-white border border-border rounded-[14px] p-4 flex-row gap-3 active:bg-background ${
          hasLeftRedBorder ? 'border-l-2 border-l-error' : ''
        }`}
      >
        {getNotifIcon(item)}
        <View className="flex-1">
          <Text className="text-sm font-jost-semibold text-text-primary">
            {lang === 'RU' ? item.messageRu : item.messageEn}
          </Text>
          <Text className="text-[12px] font-jost text-text-secondary mt-0.5">
            {lang === 'RU' ? item.subtitleRu || item.timestamp : item.subtitleEn || item.timestamp}
          </Text>
        </View>
        {!item.isRead && <View className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-3 gap-1.5">
        <Text className="text-sm font-jost text-text-secondary">
          <Text className="text-text-primary font-jost-semibold">{unreadCount} {lang === 'RU' ? 'новых' : 'new'}</Text>
          {' · '}
          <Text className="text-primary" onPress={markAllNotificationsAsRead}>
            {lang === 'RU' ? 'отметить все прочитанными' : 'mark all as read'}
          </Text>
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 pb-3.5 grow-0" contentContainerStyle={{ gap: 6 }}>
        {(['ALL', 'TASK', 'MAINTENANCE', 'SHIFT'] as const).map((filterType) => {
          const isSelected = selectedFilter === filterType;
          const label =
            filterType === 'ALL' ? (lang === 'RU' ? 'Все' : 'All') :
            filterType === 'TASK' ? (lang === 'RU' ? 'Задачи' : 'Tasks') :
            filterType === 'MAINTENANCE' ? (lang === 'RU' ? 'Техслужба' : 'Maintenance') :
            (lang === 'RU' ? 'Смена' : 'Shift');
          return (
            <Pressable
              key={filterType}
              onPress={() => setSelectedFilter(filterType)}
              className={`px-4 py-1.5 rounded-full border ${isSelected ? 'bg-dark border-dark' : 'bg-white border-border'}`}
            >
              <Text className={`text-sm font-jost ${isSelected ? 'text-white' : 'text-text-secondary'}`}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20, gap: 16 }}>
        {filtered.length === 0 ? (
          <View className="items-center py-12 gap-1 bg-white rounded-[14px] border border-border">
            <Bell size={22} color="#8A8177" />
            <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Уведомлений пока нет' : 'No notifications yet'}</Text>
          </View>
        ) : (
          <>
            {todayNotifs.length > 0 && (
              <View className="gap-2">
                <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
                  {lang === 'RU' ? 'СЕГОДНЯ' : 'TODAY'}
                </Text>
                <View className="gap-2">{todayNotifs.map(renderCard)}</View>
              </View>
            )}
            {earlierNotifs.length > 0 && (
              <View className="gap-2">
                <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
                  {lang === 'RU' ? 'ВЧЕРА' : 'YESTERDAY'}
                </Text>
                <View className="gap-2">{earlierNotifs.map(renderCard)}</View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
