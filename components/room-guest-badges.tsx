import React from 'react';
import { View, Text } from 'react-native';
import { LogIn, LogOut } from 'lucide-react-native';
import type { HotelRoom } from '@/types';

// Today's departure / arrival for a room, from GET /bookings (see applyBookingsToRooms).
// A room with both is a "turnaround": it must be ready before the new guest checks in.
export function RoomGuestBadges({
  room,
  lang,
  showRequests = false,
  dark = false,
}: {
  room: Pick<HotelRoom, 'departureGuest' | 'arrivalGuest' | 'arrivalRequests' | 'adults' | 'children'>;
  lang: 'RU' | 'EN';
  showRequests?: boolean;
  dark?: boolean;
}) {
  if (!room.departureGuest && !room.arrivalGuest) return null;
  const ru = lang === 'RU';
  const guests = [
    room.adults ? `${room.adults} ${ru ? 'взр.' : 'ad.'}` : '',
    room.children ? `${room.children} ${ru ? 'реб.' : 'ch.'}` : '',
  ].filter(Boolean).join(', ');
  const textColor = dark ? 'text-white/80' : 'text-text-secondary';

  return (
    <View className="gap-1">
      <View className="flex-row flex-wrap gap-1.5">
        {!!room.departureGuest && (
          <View className="flex-row items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
            <LogOut size={11} color="#B45309" />
            <Text className="text-amber-800 font-jost-semibold text-[11px]">{ru ? 'Выезд сегодня' : 'Departs today'}</Text>
          </View>
        )}
        {!!room.arrivalGuest && (
          <View className="flex-row items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
            <LogIn size={11} color="#047857" />
            <Text className="text-emerald-800 font-jost-semibold text-[11px]">
              {ru ? 'Заезд сегодня' : 'Arrives today'}
              {guests ? ` · ${guests}` : ''}
            </Text>
          </View>
        )}
      </View>
      {showRequests && !!room.arrivalRequests && (
        <Text className={`text-[12px] font-jost ${textColor}`} numberOfLines={3}>
          {ru ? 'Пожелания гостя: ' : 'Guest requests: '}
          {room.arrivalRequests}
        </Text>
      )}
    </View>
  );
}
