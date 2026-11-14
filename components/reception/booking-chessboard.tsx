import React, { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, ScrollView as GHScrollView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { ArrowRight, BedDouble, Plus } from 'lucide-react-native';
import type { ReceptionBooking, ReceptionRoom } from '@/context/reception-store';
import {
  type Lang,
  type VisibleStatus,
  STATUS_STYLE,
  addDaysIso,
  bookingRangeText,
  diffDays,
  dowLabel,
  formatDayLabel,
  formatShortDate,
  guestsText,
  isVisibleStatus,
  isWeekend,
  nightsText,
  parseIso,
  pluralRu,
} from '@/components/reception/booking-utils';

const LINE = '#E5E2DD';
const LINE_SOFT = 'rgba(229,226,221,0.6)';
const HEADER_H = 48;
const BANNER_H = 30;

interface RoomGroup {
  category: string;
  rooms: ReceptionRoom[];
}

function groupRooms(rooms: ReceptionRoom[]): RoomGroup[] {
  const groups: RoomGroup[] = [];
  const byCategory = new Map<string, RoomGroup>();
  for (const room of rooms) {
    let group = byCategory.get(room.category);
    if (!group) {
      group = { category: room.category, rooms: [] };
      byCategory.set(room.category, group);
      groups.push(group);
    }
    group.rooms.push(room);
  }
  return groups;
}

const bookingInRoom = (booking: ReceptionBooking, room: ReceptionRoom) =>
  booking.roomId ? booking.roomId === room.id : booking.roomNumber === room.number;

interface BoardProps {
  lang: Lang;
  rooms: ReceptionRoom[];
  bookings: ReceptionBooking[];
  fromIso: string;
  dayCount: number;
  todayIso: string;
  onPressBooking: (booking: ReceptionBooking) => void;
  // A free cell was tapped (one night) or long-pressed and dragged (several nights); checkOut is exclusive.
  onSelectRange: (room: ReceptionRoom, checkIn: string, checkOut: string) => void;
}

function RoomInfoCell({ room, lang, compact }: { room: ReceptionRoom; lang: Lang; compact: boolean }) {
  const clean = room.cleanStatus === 'CLEAN';
  const floorText = room.floor !== null ? (lang === 'RU' ? `${room.floor} этаж` : `Floor ${room.floor}`) : null;
  return (
    <>
      <Text className="text-[15px] font-jost-semibold text-text-primary" numberOfLines={1}>
        №{room.number}
      </Text>
      <Text className="text-[10px] font-jost text-text-secondary mt-0.5" numberOfLines={1}>
        {[floorText, guestsText(room.capacity, lang)].filter(Boolean).join(' · ')}
      </Text>
      {!compact && (
        <View className="flex-row items-center gap-1 mt-1">
          <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: clean ? '#4B7F52' : '#D9822B' }} />
          <Text className="text-[10px] font-jost" style={{ color: clean ? '#4B7F52' : '#B4651F' }}>
            {clean ? (lang === 'RU' ? 'Чистый' : 'Clean') : lang === 'RU' ? 'Грязный' : 'Dirty'}
          </Text>
        </View>
      )}
    </>
  );
}

// Week / 14-day grid: the room column stays pinned on the left, days scroll horizontally.
export function BookingChessboard({ lang, rooms, bookings, fromIso, dayCount, todayIso, onPressBooking, onSelectRange }: BoardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const compact = dayCount > 7;
  const leftWidth = compact ? 82 : 96;
  const dayWidth = Math.max(compact ? 22 : 72, Math.floor((screenWidth - leftWidth) / dayCount));
  const rowHeight = compact ? 60 : 76;

  const days = useMemo(() => Array.from({ length: dayCount }, (_, i) => addDaysIso(fromIso, i)), [fromIso, dayCount]);
  const groups = useMemo(() => groupRooms(rooms), [rooms]);

  const dayBg = (iso: string, header: boolean) => {
    if (iso === todayIso) return header ? '#EFE5DC' : 'rgba(250,243,236,0.5)';
    if (isWeekend(iso)) return header ? 'rgba(250,243,238,0.6)' : 'rgba(250,247,243,0.4)';
    return header ? '#FAF7F3' : '#FFFFFF';
  };

  return (
    <View className="flex-row bg-white" style={{ borderTopWidth: 1, borderTopColor: LINE }}>
      {/* Pinned room column */}
      <View
        style={{
          width: leftWidth,
          borderRightWidth: 1,
          borderRightColor: LINE,
        }}
      >
        <View
          className="px-3 justify-center bg-background"
          style={{
            height: HEADER_H,
            borderBottomWidth: 1,
            borderBottomColor: LINE,
          }}
        >
          <Text className="text-xs font-jost text-text-secondary">{lang === 'RU' ? 'Номер' : 'Room'}</Text>
        </View>
        {groups.map((group) => (
          <View key={group.category}>
            <View
              className="px-3 flex-row items-center gap-1.5 bg-[#F3EFEA]"
              style={{
                height: BANNER_H,
                borderBottomWidth: 1,
                borderBottomColor: LINE,
              }}
            >
              <Text className="text-xs font-jost-medium text-text-primary shrink" numberOfLines={1}>
                {group.category}
              </Text>
              <Text className="text-xs font-jost text-text-secondary">{group.rooms.length}</Text>
            </View>
            {group.rooms.map((room) => (
              <View
                key={room.id}
                className="px-3 justify-center bg-white"
                style={{
                  height: rowHeight,
                  borderBottomWidth: 1,
                  borderBottomColor: LINE,
                }}
              >
                <RoomInfoCell room={room} lang={lang} compact={compact} />
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Scrollable days */}
      <GHScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} className="flex-1">
        <View style={{ width: dayWidth * dayCount }}>
          <View
            className="flex-row"
            style={{
              height: HEADER_H,
              borderBottomWidth: 1,
              borderBottomColor: LINE,
            }}
          >
            {days.map((iso) => {
              const today = iso === todayIso;
              return (
                <View
                  key={iso}
                  className="items-center justify-center"
                  style={{
                    width: dayWidth,
                    backgroundColor: dayBg(iso, true),
                    borderRightWidth: 1,
                    borderRightColor: LINE_SOFT,
                  }}
                >
                  <Text className="text-[10px] font-jost text-text-secondary">{dowLabel(iso, lang)}</Text>
                  <Text className={`text-xs mt-0.5 ${today ? 'text-primary font-jost-semibold' : 'text-text-primary font-jost-medium'}`}>
                    {parseIso(iso).getDate()}
                  </Text>
                </View>
              );
            })}
          </View>

          {groups.map((group) => (
            <View key={group.category}>
              <View
                className="bg-[#F3EFEA]"
                style={{
                  height: BANNER_H,
                  borderBottomWidth: 1,
                  borderBottomColor: LINE,
                }}
              />
              {group.rooms.map((room) => (
                <ChessRow
                  key={room.id}
                  room={room}
                  lang={lang}
                  compact={compact}
                  days={days}
                  dayWidth={dayWidth}
                  rowHeight={rowHeight}
                  fromIso={fromIso}
                  dayBg={dayBg}
                  bookings={bookings.filter(
                    (b) => bookingInRoom(b, room) && diffDays(fromIso, b.checkOut) > 0 && diffDays(fromIso, b.checkIn) < dayCount,
                  )}
                  onPressBooking={onPressBooking}
                  onSelectRange={onSelectRange}
                />
              ))}
            </View>
          ))}
        </View>
      </GHScrollView>
    </View>
  );
}

interface ChessRowProps {
  room: ReceptionRoom;
  lang: Lang;
  compact: boolean;
  days: string[];
  dayWidth: number;
  rowHeight: number;
  fromIso: string;
  dayBg: (iso: string, header: boolean) => string;
  bookings: ReceptionBooking[];
  onPressBooking: (booking: ReceptionBooking) => void;
  onSelectRange: (room: ReceptionRoom, checkIn: string, checkOut: string) => void;
}

// One room row. As in the design: a tap on a free cell opens a booking for that night;
// a long press and drag along the row picks several nights (stops at the next booking).
function ChessRow({ room, lang, compact, days, dayWidth, rowHeight, fromIso, dayBg, bookings, onPressBooking, onSelectRange }: ChessRowProps) {
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ start: number; end: number } | null>(null);
  const dragRef = useRef<{ start: number; end: number } | null>(null);

  const visible = bookings.filter((b): b is ReceptionBooking & { status: VisibleStatus } => isVisibleStatus(b.status));
  const occupied = (i: number) => visible.some((b) => b.checkIn <= days[i] && days[i] < b.checkOut);
  const indexAt = (x: number) => Math.min(days.length - 1, Math.max(0, Math.floor(x / dayWidth)));

  const setDragRange = (next: { start: number; end: number } | null) => {
    dragRef.current = next;
    setDrag(next);
  };

  const tap = Gesture.Tap()
    .runOnJS(true)
    .maxDuration(400)
    .onBegin((e) => {
      const i = indexAt(e.x);
      if (!occupied(i)) setPressedIdx(i);
    })
    .onEnd((e, success) => {
      if (!success) return;
      const i = indexAt(e.x);
      if (occupied(i)) return;
      onSelectRange(room, days[i], addDaysIso(days[i], 1));
    })
    .onFinalize(() => setPressedIdx(null));

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activateAfterLongPress(300)
    .onStart((e) => {
      const i = indexAt(e.x);
      if (occupied(i)) return;
      setDragRange({ start: i, end: i });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    })
    .onUpdate((e) => {
      const current = dragRef.current;
      if (!current) return;
      const target = indexAt(e.x);
      const step = target >= current.start ? 1 : -1;
      let end = current.start;
      while (end !== target && !occupied(end + step)) end += step;
      if (end !== current.end) setDragRange({ start: current.start, end });
    })
    .onEnd(() => {
      const current = dragRef.current;
      if (!current) return;
      const first = Math.min(current.start, current.end);
      const last = Math.max(current.start, current.end);
      onSelectRange(room, days[first], addDaysIso(days[last], 1));
    })
    .onFinalize(() => setDragRange(null));

  const gesture = Gesture.Exclusive(pan, tap);
  const dragMin = drag ? Math.min(drag.start, drag.end) : -1;
  const dragMax = drag ? Math.max(drag.start, drag.end) : -2;
  const dayCount = days.length;

  return (
    <GestureDetector gesture={gesture}>
      <View
        className="flex-row"
        style={{
          height: rowHeight,
          borderBottomWidth: 1,
          borderBottomColor: LINE,
        }}
      >
        {days.map((iso, i) => (
          <View
            key={iso}
            style={{
              width: dayWidth,
              backgroundColor: pressedIdx === i || (i >= dragMin && i <= dragMax) ? '#FAF2E6' : dayBg(iso, false),
              borderRightWidth: 1,
              borderRightColor: 'rgba(229,226,221,0.5)',
            }}
          />
        ))}

        {drag && (
          <View
            pointerEvents="none"
            className="absolute px-2 justify-center overflow-hidden"
            style={{
              top: 8,
              bottom: 8,
              left: dragMin * dayWidth + 2,
              width: (dragMax - dragMin + 1) * dayWidth - 4,
              borderRadius: 8,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: '#C2410C',
              backgroundColor: 'rgba(250,242,230,0.95)',
            }}
          >
            <Text className="text-[11px] font-jost-semibold text-primary" numberOfLines={1}>
              {compact ? `№${room.number}` : lang === 'RU' ? 'Новая бронь' : 'New booking'}
            </Text>
            {!compact && (
              <Text className="text-[10px] font-jost text-primary mt-0.5" numberOfLines={1}>
                {nightsText(dragMax - dragMin + 1, lang)}
              </Text>
            )}
          </View>
        )}

        {visible.map((b) => {
          const start = Math.max(0, diffDays(fromIso, b.checkIn));
          const end = Math.min(dayCount, diffDays(fromIso, b.checkOut));
          const span = Math.max(1, end - start);
          const st = STATUS_STYLE[b.status];
          return (
            <Pressable
              key={b.id}
              onPress={() => onPressBooking(b)}
              className="absolute px-2 justify-center overflow-hidden active:opacity-80"
              style={{
                top: 8,
                bottom: 8,
                left: start * dayWidth + 2,
                width: span * dayWidth - 4,
                borderRadius: 8,
                borderLeftWidth: 3,
                borderLeftColor: st.chessBorder,
                backgroundColor: st.chessBg,
              }}
            >
              <Text className="text-[11px] font-jost-medium" style={{ color: st.chessText }} numberOfLines={1}>
                {compact ? b.shortName : b.guestName}
              </Text>
              {!compact && (
                <Text className="text-[10px] font-jost mt-0.5" style={{ color: st.chessText, opacity: 0.8 }} numberOfLines={1}>
                  {bookingRangeText(b.checkIn, b.checkOut, lang)}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </GestureDetector>
  );
}

// "День" scale: one card per room for the selected day.
export function BookingDayBoard({ lang, rooms, bookings, fromIso, onPressBooking, onSelectRange }: Omit<BoardProps, 'dayCount' | 'todayIso'>) {
  const groups = useMemo(() => groupRooms(rooms), [rooms]);
  const day = fromIso;
  const checkins = bookings.filter((b) => b.checkIn === day).length;
  const checkouts = bookings.filter((b) => b.checkOut === day).length;
  const summary =
    lang === 'RU'
      ? `${checkins} ${pluralRu(checkins, 'заезд', 'заезда', 'заездов')} · ${checkouts} ${pluralRu(checkouts, 'выезд', 'выезда', 'выездов')}`
      : `${checkins} ${checkins === 1 ? 'arrival' : 'arrivals'} · ${checkouts} ${checkouts === 1 ? 'departure' : 'departures'}`;

  return (
    <View className="px-4 gap-4">
      <View className="bg-[#EFECE6] rounded-[14px] px-4 py-3 flex-row items-center justify-between">
        <Text className="text-xs font-jost text-text-primary">{formatDayLabel(day, lang)}</Text>
        <Text className="text-xs font-jost-medium text-text-primary">{summary}</Text>
      </View>

      {groups.map((group) => (
        <View key={group.category} className="gap-2.5">
          <Text className="text-[11px] font-jost text-text-secondary uppercase tracking-wider">{group.category}</Text>
          {group.rooms.map((room) => {
            const inRoom = bookings.filter((b) => bookingInRoom(b, room));
            const staying = inRoom.find((b) => b.checkIn <= day && day < b.checkOut);
            const leaving = inRoom.find((b) => b.checkOut === day);
            const booking = staying ?? leaving;

            const roomLabel = (
              <View className="w-12 shrink-0">
                <Text className="text-base font-jost-medium text-text-primary" numberOfLines={1}>
                  {room.number}
                </Text>
                <Text className="text-[10px] font-jost text-text-secondary">{guestsText(room.capacity, lang)}</Text>
              </View>
            );

            if (!booking || !isVisibleStatus(booking.status)) {
              const clean = room.cleanStatus === 'CLEAN';
              return (
                <View key={room.id} className="flex-row items-center gap-3">
                  {roomLabel}
                  <Pressable
                    onPress={() => onSelectRange(room, day, addDaysIso(day, 1))}
                    className="flex-1 bg-[#EDF4EE] rounded-[16px] p-3.5 flex-row items-center justify-between active:bg-[#E4EFE7]"
                    style={{
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: '#9BBFA4',
                    }}
                  >
                    <View className="flex-1">
                      <Text className="text-sm font-jost-medium text-[#2E623C]">{lang === 'RU' ? 'Свободен' : 'Available'}</Text>
                      <Text className="text-[11px] font-jost text-text-secondary mt-0.5">
                        {clean
                          ? lang === 'RU'
                            ? 'Чистый · можно заселять'
                            : 'Clean · ready for check-in'
                          : lang === 'RU'
                            ? 'Грязный · нужна уборка'
                            : 'Dirty · needs cleaning'}
                      </Text>
                    </View>
                    <Plus size={18} color="#4B7F52" />
                  </Pressable>
                </View>
              );
            }

            const isCheckout = !staying;
            const isCheckin = !isCheckout && booking.checkIn === day;
            const accent = isCheckout ? '#8A8177' : STATUS_STYLE[booking.status].chessBorder;
            const subText = isCheckout
              ? lang === 'RU'
                ? `Выезд · до ${booking.checkOutTime}`
                : `Check-out · by ${booking.checkOutTime}`
              : isCheckin
                ? lang === 'RU'
                  ? `Заезд · с ${booking.checkInTime}`
                  : `Check-in · from ${booking.checkInTime}`
                : lang === 'RU'
                  ? `Проживает · до ${formatShortDate(booking.checkOut, lang)}`
                  : `In house · until ${formatShortDate(booking.checkOut, lang)}`;

            return (
              <View key={room.id} className="flex-row items-center gap-3">
                {roomLabel}
                <Pressable
                  onPress={() => onPressBooking(booking)}
                  className="flex-1 bg-white rounded-[16px] p-3.5 flex-row items-center justify-between active:opacity-80"
                  style={{
                    borderWidth: 1,
                    borderColor: LINE,
                    borderLeftWidth: 3.5,
                    borderLeftColor: accent,
                  }}
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-sm font-jost-medium text-text-primary" numberOfLines={1}>
                      {booking.guestName}
                    </Text>
                    <Text className="text-[11px] font-jost text-text-secondary mt-0.5">{subText}</Text>
                  </View>
                  {isCheckout ? (
                    <ArrowRight size={16} color="#8A8177" />
                  ) : isCheckin ? (
                    <Plus size={18} color={booking.status === 'CONFIRMED' ? '#4B7F52' : '#D9822B'} />
                  ) : (
                    <BedDouble size={18} color="#B94A2C" />
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
