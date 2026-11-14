import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, User, Users, X, Zap, type LucideIcon } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { type WaitlistEntry, useReception } from '@/context/reception-store';
import { type BookingPrefill, bookingRangeText, diffDays, nightsText } from '@/components/reception/booking-utils';
import { QuickBookingWizard } from '@/components/reception/create/quick-wizard';
import { IndividualBookingWizard } from '@/components/reception/create/individual-wizard';
import { GroupBookingWizard } from '@/components/reception/create/group-wizard';

// Reception "Создать бронь" tab (web design: ReceptionScreens.tsx → RECEPTION_CREATE):
// booking type picker, then the matching wizard.

type CreateBookingType = 'NONE' | 'INDIVIDUAL' | 'GROUP' | 'QUICK';

function TypeCard({ icon: Icon, title, subtitle, onPress }: { icon: LucideIcon; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-[18px] border border-border p-[18px] flex-row items-center justify-between active:opacity-80"
    >
      <View className="flex-row items-center gap-3.5 flex-1">
        <View className="h-12 w-12 rounded-[14px] bg-dark items-center justify-center">
          <Icon size={20} color="#FFFFFF" strokeWidth={1.8} />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-jost-medium text-text-primary">{title}</Text>
          <Text className="text-xs font-jost text-text-secondary mt-0.5">{subtitle}</Text>
        </View>
      </View>
      <ChevronRight size={16} color="#8A8177" />
    </Pressable>
  );
}

export function ReceptionCreateBookingScreen() {
  const { lang } = useApp();
  const ru = lang === 'RU';
  const router = useRouter();
  const { rooms, waitlist } = useReception();
  const [type, setType] = useState<CreateBookingType>('NONE');

  // Room + dates picked on the chessboard arrive as route params; `at` makes every pick a
  // new value even when the same cell is picked twice.
  const params = useLocalSearchParams<{ roomId?: string; checkIn?: string; checkOut?: string; waitlistId?: string; at?: string }>();
  const [prefill, setPrefill] = useState<BookingPrefill | null>(null);
  const [fromWaitlist, setFromWaitlist] = useState<WaitlistEntry | null>(null);
  useEffect(() => {
    // As in the design: «Создать бронь» on a waitlist request opens the individual booking
    // filled from the request.
    const entry = params.waitlistId ? waitlist.find((w) => w.id === params.waitlistId) : undefined;
    if (entry) {
      setPrefill(null);
      setFromWaitlist(entry);
      setType('INDIVIDUAL');
      // Drop an earlier chessboard pick so it can't win over this one later.
      if (params.roomId) router.setParams({ roomId: undefined, checkIn: undefined, checkOut: undefined });
      return;
    }
    if (params.roomId && params.checkIn && params.checkOut) {
      setFromWaitlist(null);
      if (params.waitlistId) router.setParams({ waitlistId: undefined });
      setPrefill({ roomId: params.roomId, checkIn: params.checkIn, checkOut: params.checkOut });
      // As in the design: a pick on the chessboard goes straight to the individual booking.
      setType('INDIVIDUAL');
    }
    // Only a new pick (new `at`) re-applies the params; later waitlist reloads don't.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.roomId, params.checkIn, params.checkOut, params.waitlistId, params.at]);
  const prefillRoom = prefill ? rooms.find((r) => r.id === prefill.roomId) : undefined;

  const cancel = () => {
    setType('NONE');
    setFromWaitlist(null);
  };
  const created = () => {
    setType('NONE');
    setPrefill(null);
    setFromWaitlist(null);
    router.setParams({ roomId: undefined, checkIn: undefined, checkOut: undefined, waitlistId: undefined, at: undefined });
    router.navigate('/(app)/(reception)');
  };

  return (
    // The individual and group wizards pad for the status bar themselves (they are also shown
    // full-screen when editing a booking), so the tab must not add its own top inset for them.
    <SafeAreaView edges={type === 'INDIVIDUAL' || type === 'GROUP' ? [] : ['top']} className="flex-1 bg-background">
      {type === 'QUICK' ? (
        <QuickBookingWizard onCancel={cancel} onCreated={created} prefill={prefill} />
      ) : type === 'INDIVIDUAL' ? (
        <IndividualBookingWizard
          key={params.at ?? 'new'}
          onCancel={cancel}
          onCreated={created}
          prefill={prefill}
          fromWaitlist={fromWaitlist}
          insideTabs
        />
      ) : type === 'GROUP' ? (
        <GroupBookingWizard onCancel={cancel} onCreated={created} prefill={prefill} insideTabs />
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
          <View className="mb-5">
            <Text className="text-[28px] font-spectral text-text-primary leading-tight">{ru ? 'Создать бронь' : 'Create Booking'}</Text>
          </View>

          {prefill && (
            <View className="mb-4 bg-[#FAF2E6] border border-[#E6B89C] rounded-[16px] px-4 py-3 flex-row items-center justify-between gap-2">
              <View className="flex-1">
                <Text className="text-xs font-jost-semibold text-primary">
                  {ru ? 'Выбрано в шахматке' : 'Picked on the chessboard'}: №{prefillRoom?.number ?? '—'}
                  {prefillRoom ? ` · ${prefillRoom.category}` : ''}
                </Text>
                <Text className="text-[11px] font-jost text-text-primary mt-0.5">
                  {bookingRangeText(prefill.checkIn, prefill.checkOut, lang)} ({nightsText(diffDays(prefill.checkIn, prefill.checkOut), lang)})
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setPrefill(null);
                  router.setParams({ roomId: undefined, checkIn: undefined, checkOut: undefined, at: undefined });
                }}
                hitSlop={8}
                className="p-1 active:opacity-60"
              >
                <X size={16} color="#8A8177" />
              </Pressable>
            </View>
          )}

          <View className="gap-3">
            <TypeCard
              icon={User}
              title={ru ? 'Индивидуальная бронь' : 'Individual booking'}
              subtitle={ru ? 'Индивидуальный гость' : 'Individual guest'}
              onPress={() => setType('INDIVIDUAL')}
            />
            <TypeCard
              icon={Users}
              title={ru ? 'Групповая бронь' : 'Group booking'}
              subtitle={ru ? 'B2B / Турфирмы' : 'B2B / Travel agencies'}
              onPress={() => setType('GROUP')}
            />
            <TypeCard
              icon={Zap}
              title={ru ? 'Быстрая бронь' : 'Quick booking'}
              subtitle={ru ? 'Заезд с ресепшн' : 'Walk-in from reception'}
              onPress={() => setType('QUICK')}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
