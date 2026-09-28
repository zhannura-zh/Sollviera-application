import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { MaintenanceCategory, MaintenanceRequest } from '@/types';
import { getTranslation } from '@/lib/locales';
import { useApp } from '@/context/app-store';

interface MaintenanceDetailScreenProps {
  ticket: MaintenanceRequest | null;
  onBack: () => void;
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="p-3.5 flex-row items-center justify-between border-t border-border-light first:border-t-0">
      <Text className="text-sm font-jost text-text-secondary">{label}</Text>
      {children}
    </View>
  );
}

export function MaintenanceDetailScreen({ ticket, onBack }: MaintenanceDetailScreenProps) {
  const { lang } = useApp();
  const t = getTranslation(lang);

  if (!ticket) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background items-center justify-center">
        <Text className="text-sm font-jost text-text-secondary">{lang === 'RU' ? 'Заявка не найдена' : 'Ticket not found'}</Text>
      </SafeAreaView>
    );
  }

  const getCategoryLabel = (cat: MaintenanceCategory) => {
    switch (cat) {
      case 'PLUMBING': return t.categoryPlumbing;
      case 'ELECTRICAL': return t.categoryElectrical;
      case 'FURNITURE': return t.categoryFurniture;
      case 'APPLIANCES': return t.categoryAppliances;
      case 'CLEANLINESS': return t.categoryCleanliness;
      default: return t.categoryOther;
    }
  };

  const statusLabel = ticket.status === 'RESOLVED'
    ? (lang === 'RU' ? 'устранена' : 'resolved')
    : ticket.status === 'IN_PROGRESS'
      ? (lang === 'RU' ? 'в работе' : 'in progress')
      : (lang === 'RU' ? 'новая' : 'new');

  const priorityLabel = ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH'
    ? (lang === 'RU' ? 'высокий' : 'high')
    : ticket.priority === 'LOW'
      ? (lang === 'RU' ? 'низкий' : 'low')
      : (lang === 'RU' ? 'средний' : 'medium');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-dark">
      <View className="bg-dark px-5 pt-2 pb-5 gap-3">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={onBack} className="flex-row items-center gap-1.5">
            <ChevronLeft size={16} color="#8A8177" />
            <Text className="text-xs font-jost text-text-secondary">{lang === 'RU' ? 'Техслужба' : 'Maintenance'}</Text>
          </Pressable>
          <View className="flex-row items-center gap-1.5">
            {ticket.blocksCleaning && ticket.status !== 'RESOLVED' && (
              <View className="bg-[#FAF0EF]/20 border border-rose-200/30 rounded-md px-2.5 py-0.5">
                <Text className="text-[10px] font-jost-semibold text-rose-200 uppercase tracking-wider">
                  {lang === 'RU' ? 'Блокирует' : 'Blocks'}
                </Text>
              </View>
            )}
            {ticket.isGuestDamage && (
              <View className="bg-amber-950/40 border border-amber-200/30 rounded-md px-2.5 py-0.5">
                <Text className="text-[10px] font-jost-semibold text-amber-200 uppercase tracking-wider">
                  {lang === 'RU' ? 'Поломка гостем' : 'Guest damage'}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-2xl font-spectral text-white">{lang === 'RU' ? `Заявка № ${ticket.roomNumber}` : `Ticket No. ${ticket.roomNumber}`}</Text>
            <Text className="text-xs font-jost text-text-secondary mt-1.5">{ticket.timestamp}</Text>
          </View>
          <Text className="text-xs font-jost text-text-secondary">{statusLabel}</Text>
        </View>
      </View>

      <ScrollView className="flex-1 bg-background px-5" contentContainerStyle={{ paddingTop: 16, paddingBottom: 20, gap: 16 }}>
        <View className="bg-white rounded-[14px] border border-border overflow-hidden">
          <InfoRow label={lang === 'RU' ? 'Номер' : 'Room'}>
            <Text className="text-sm font-jost-semibold text-text-primary">№ {ticket.roomNumber}{ticket.roomCategory ? ` · ${ticket.roomCategory}` : ''}</Text>
          </InfoRow>
          <InfoRow label={lang === 'RU' ? 'Категория' : 'Category'}>
            <Text className="text-sm font-jost-semibold text-text-primary">{getCategoryLabel(ticket.category)}</Text>
          </InfoRow>
          <InfoRow label={lang === 'RU' ? 'Приоритет' : 'Priority'}>
            <View className="px-2 py-0.5 rounded bg-error/10 border border-error/20">
              <Text className="text-[11px] font-jost-semibold uppercase text-error">{priorityLabel}</Text>
            </View>
          </InfoRow>
          {!!ticket.reportedBy && (
            <InfoRow label={lang === 'RU' ? 'Автор' : 'Reported by'}>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-jost-semibold text-text-primary">{ticket.reportedBy}</Text>
                <View className="h-6 w-6 rounded-full bg-primary-light items-center justify-center border border-border">
                  <Text className="text-[10px] font-jost-semibold text-text-primary">{initials(ticket.reportedBy)}</Text>
                </View>
              </View>
            </InfoRow>
          )}
          {!!ticket.assignedToName && (
            <InfoRow label={lang === 'RU' ? 'Исполнитель' : 'Assigned to'}>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-jost-semibold text-text-primary">{ticket.assignedToName}</Text>
                <View className="h-6 w-6 rounded-full bg-primary-light items-center justify-center border border-border">
                  <Text className="text-[10px] font-jost-semibold text-text-primary">{initials(ticket.assignedToName)}</Text>
                </View>
              </View>
            </InfoRow>
          )}
        </View>

        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'ОПИСАНИЕ' : 'DESCRIPTION'}
          </Text>
          <View className="bg-white rounded-[14px] border border-border p-3.5">
            <Text className="text-sm font-jost text-text-primary leading-normal">
              {lang === 'RU' ? ticket.descriptionRu || ticket.description : ticket.descriptionEn || ticket.description}
            </Text>
          </View>
        </View>

        {ticket.isGuestDamage && (
          <View className="bg-[#FFF8F5] border border-[#FED7AA] rounded-[14px] p-3.5 gap-2">
            <Text className="text-[11px] font-jost-semibold uppercase tracking-wider text-text-primary">
              {lang === 'RU' ? 'Ущерб' : 'Damage'}
            </Text>
            <Text className="text-[13px] font-jost text-[#C2410C]">
              {ticket.guestDamageType || (lang === 'RU' ? 'Поломка по вине гостя' : 'Guest damage')}
            </Text>
            {ticket.costCalculated && ticket.repairCost !== undefined && (
              <Text className="text-xs font-jost-semibold text-[#C2410C]">{ticket.repairCost.toLocaleString('ru-RU')} ₸</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
