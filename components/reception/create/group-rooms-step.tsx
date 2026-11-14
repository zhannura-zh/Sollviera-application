import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { ChevronDown, ChevronRight, LayoutGrid, List, Plus, X } from 'lucide-react-native';
import type { ReceptionRoom } from '@/context/reception-store';
import { type Lang, guestsText, pluralRu } from '@/components/reception/booking-utils';
import { FieldLabel, IconInput, PickerField, SectionTitle, TextField, digitsOnly, money, type PickerOption } from './group-ui';

// Step 2 «Номера» and the rooming list of the group booking wizard (web design:
// ReceptionScreens.tsx → grpStep === 2 / showGrpRoomingModal).

export interface GrpRoom {
  key: string; // stable per card, so rooming-list data survives removing other cards
  roomId: string;
  adults: string;
  children: string;
}

export interface RoomingGuest {
  lastName: string;
  firstName: string;
  middleName: string;
  phone: string;
  docType: string;
  docNumber: string;
  birthDate: string; // ДД.ММ.ГГГГ
  gender: string; // '' | 'male' | 'female'
  nationality: string;
}

export const EMPTY_GUEST: RoomingGuest = {
  lastName: '',
  firstName: '',
  middleName: '',
  phone: '',
  docType: '',
  docNumber: '',
  birthDate: '',
  gender: '',
  nationality: '',
};

export const roomGuests = (r: GrpRoom) => (parseInt(r.adults, 10) || 0) + (parseInt(r.children, 10) || 0);
// The rooming list always offers at least one guest line per room.
export const roomingGuestCount = (r: GrpRoom) => Math.max(1, roomGuests(r));
export const guestKey = (roomKey: string, guestIdx: number) => `${roomKey}-${guestIdx}`;

export const roomsWord = (n: number, lang: Lang) =>
  lang === 'RU' ? pluralRu(n, 'номер', 'номера', 'номеров') : n === 1 ? 'room' : 'rooms';

const capacityText = (n: number, lang: Lang) =>
  lang === 'RU' ? `${n} ${pluralRu(n, 'гость', 'гостя', 'гостей')}` : `${n} ${n === 1 ? 'guest' : 'guests'}`;

export function isRoomListFilled(room: GrpRoom, guests: Record<string, RoomingGuest>) {
  for (let g = 0; g < roomingGuestCount(room); g++) {
    const gd = guests[guestKey(room.key, g)];
    if (gd && (gd.lastName.trim() || gd.firstName.trim())) return true;
  }
  return false;
}

export interface RoomStats {
  target: number;
  distributed: number;
  totalCapacity: number;
  guestsUnplaced: number; // > 0: guests without a room; < 0: more placed than in the group
  overflowRoom: { number: string; guests: number; capacity: number } | null;
  hasCapacityMismatch: boolean;
}

// ---------- Step 2 ----------

interface RoomsStepProps {
  lang: Lang;
  rooms: GrpRoom[];
  roomById: Map<string, ReceptionRoom>;
  roomOptions: (current: GrpRoom) => PickerOption[];
  stats: RoomStats;
  canAddRoom: boolean;
  picking: boolean;
  filledCount: number;
  onAutoPick: () => void;
  onAddRoom: () => void;
  onRemoveRoom: (key: string) => void;
  onChangeRoom: (key: string, patch: Partial<GrpRoom>) => void;
  onOpenRooming: () => void;
}

export function GroupRoomsStep({
  lang,
  rooms,
  roomById,
  roomOptions,
  stats,
  canAddRoom,
  picking,
  filledCount,
  onAutoPick,
  onAddRoom,
  onRemoveRoom,
  onChangeRoom,
  onOpenRooming,
}: RoomsStepProps) {
  const ru = lang === 'RU';
  const floors = Array.from(
    new Set(rooms.map((r) => roomById.get(r.roomId)?.floor).filter((f): f is number => typeof f === 'number')),
  ).sort((a, b) => a - b);

  let warning = '';
  if (stats.hasCapacityMismatch) {
    if (stats.totalCapacity < stats.target) {
      warning = ru
        ? `В выбранных номерах ${stats.totalCapacity} ${pluralRu(stats.totalCapacity, 'место', 'места', 'мест')} для ${guestsText(stats.target, lang)}. ${
            canAddRoom ? 'Измените размещение или добавьте номер.' : 'Свободных номеров на эти даты больше нет — уменьшите группу или измените даты.'
          }`
        : `The selected rooms have ${stats.totalCapacity} ${stats.totalCapacity === 1 ? 'bed' : 'beds'} for ${guestsText(stats.target, lang)}. ${
            canAddRoom ? 'Change the allocation or add a room.' : 'No more rooms are free for these dates — reduce the group or change the dates.'
          }`;
    } else if (stats.overflowRoom) {
      warning = ru
        ? `В номере №${stats.overflowRoom.number} указано больше гостей, чем мест. Измените размещение.`
        : `Room ${stats.overflowRoom.number} has more guests than beds. Change the allocation.`;
    } else if (stats.guestsUnplaced > 0) {
      warning = ru
        ? `Не распределено: ${guestsText(stats.guestsUnplaced, lang)}. Укажите их в номерах.`
        : `${guestsText(stats.guestsUnplaced, lang)} not allocated yet. Add them to the rooms.`;
    } else {
      warning = ru
        ? `Распределено ${guestsText(stats.distributed, lang)}, а в группе ${stats.target}. Измените размещение или число гостей.`
        : `${guestsText(stats.distributed, lang)} allocated, but the group has ${stats.target}. Change the allocation or the group size.`;
    }
  }

  return (
    <>
      <View className="gap-3">
        <SectionTitle>{ru ? 'Распределение номеров' : 'Room allocation'}</SectionTitle>

        <Pressable
          onPress={onAutoPick}
          disabled={picking}
          className="w-full bg-white border border-[#E5E2DD] rounded-[14px] py-3.5 px-4 flex-row items-center justify-center gap-2 active:bg-[#F5F2EC]"
        >
          {picking ? <ActivityIndicator size="small" color="#241E1A" /> : <LayoutGrid size={16} color="#241E1A" />}
          <Text className="text-xs font-jost-medium text-[#241E1A]">{ru ? 'Подобрать номера' : 'Pick rooms'}</Text>
        </Pressable>

        <Text className="text-[11px] font-jost text-[#8A8177]">
          {ru ? 'Предложено' : 'Suggested'} {rooms.length} {roomsWord(rooms.length, lang)}
          {floors.length > 0 ? ` · ${ru ? (floors.length > 1 ? 'этажи' : 'этаж') : floors.length > 1 ? 'floors' : 'floor'} ${floors.join(', ')}` : ''}
        </Text>

        <View className="bg-[#EFECE6] rounded-[12px] px-3.5 py-2.5 flex-row items-center justify-between">
          <Text className="text-xs font-jost text-[#6E675F]">
            <Text className="font-jost-semibold text-[#241E1A]">
              {stats.distributed} / {stats.target}
            </Text>{' '}
            {ru ? 'гостей распределено' : 'guests allocated'}
          </Text>
          <Text className="text-xs font-jost text-[#6E675F]">
            {rooms.length} {roomsWord(rooms.length, lang)}
          </Text>
        </View>
      </View>

      <View className="gap-3.5">
        {rooms.map((item) => {
          const room = roomById.get(item.roomId);
          const capacity = room?.capacity ?? 1;
          const total = roomGuests(item);
          const isOverCap = total > capacity;
          return (
            <View key={item.key} className="bg-white rounded-[18px] border border-[#E5E2DD] p-4 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-jost-semibold text-[#241E1A]">
                  {ru ? 'Номер' : 'Room'} №{room?.number ?? '—'}
                </Text>
                {rooms.length > 1 && (
                  <Pressable onPress={() => onRemoveRoom(item.key)} hitSlop={8} className="flex-row items-center gap-1 active:opacity-60">
                    <X size={14} color="#8A8177" />
                    <Text className="text-xs font-jost text-[#8A8177]">{ru ? 'Убрать' : 'Remove'}</Text>
                  </Pressable>
                )}
              </View>

              <View>
                <PickerField
                  label={ru ? '№ комнаты' : 'Room no.'}
                  title={ru ? 'Номер' : 'Room'}
                  value={item.roomId}
                  options={roomOptions(item)}
                  onChange={(roomId) => onChangeRoom(item.key, { roomId })}
                  emptyText={ru ? 'Нет свободных номеров' : 'No free rooms'}
                />
                <Text className="text-[11px] font-jost text-[#8A8177] mt-1.5">
                  {room?.floor != null ? `${room.floor} ${ru ? 'этаж' : 'floor'} · ` : ''}
                  {ru ? 'Вместимость' : 'Capacity'} — {capacityText(capacity, lang)}
                </Text>
              </View>

              <View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <FieldLabel>{ru ? 'Взрослые' : 'Adults'}</FieldLabel>
                    <TextField
                      value={item.adults}
                      onChangeText={(v) => onChangeRoom(item.key, { adults: digitsOnly(v, 2) })}
                      keyboardType="number-pad"
                      invalid={isOverCap}
                    />
                  </View>
                  <View className="flex-1">
                    <FieldLabel>{ru ? 'Дети' : 'Children'}</FieldLabel>
                    <TextField
                      value={item.children}
                      onChangeText={(v) => onChangeRoom(item.key, { children: digitsOnly(v, 2) })}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                {isOverCap && (
                  <Text className="text-[11px] font-jost text-[#C2410C] mt-1.5">
                    {ru
                      ? `Указано ${guestsText(total, lang)} при вместимости ${capacity}`
                      : `${guestsText(total, lang)} for a capacity of ${capacity}`}
                  </Text>
                )}
              </View>

              <View className="h-px bg-[#E5E2DD]/70" />

              <View className="flex-row items-center justify-between pt-0.5">
                <Text className="text-xs font-jost text-[#8A8177]">{ru ? 'Цена/ночь' : 'Price/night'}</Text>
                <Text>
                  <Text className="text-base font-jost-semibold text-[#241E1A]">{money(room?.pricePerNight ?? 0)}</Text>
                  <Text className="text-[11px] font-jost text-[#8A8177]"> {ru ? '/ночь' : '/night'}</Text>
                </Text>
              </View>
            </View>
          );
        })}

        {rooms.length === 0 && !picking && (
          <View className="border border-dashed border-[#D6CFC5] rounded-[14px] py-4 px-4 items-center bg-white/40">
            <Text className="text-xs font-jost text-[#8A8177] text-center">
              {ru ? 'Номера не выбраны. Нажмите «Подобрать номера» или добавьте номер.' : 'No rooms yet. Tap “Pick rooms” or add a room.'}
            </Text>
          </View>
        )}
      </View>

      {warning ? (
        <View className="bg-[#FBECE6] border border-[#E8C5B8] rounded-[14px] p-3.5">
          <Text className="text-xs font-jost text-[#9A3412] leading-5">{warning}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onAddRoom}
        className="w-full bg-white border border-[#E5E2DD] rounded-[14px] py-3.5 px-4 flex-row items-center justify-center gap-2 active:bg-[#F5F2EC]"
        style={{ opacity: canAddRoom ? 1 : 0.5 }}
      >
        <Plus size={16} color="#241E1A" />
        <Text className="text-xs font-jost-medium text-[#241E1A]">{ru ? 'Добавить номер' : 'Add room'}</Text>
      </Pressable>

      <Pressable
        onPress={onOpenRooming}
        disabled={rooms.length === 0}
        className="bg-white border border-[#E5E2DD] rounded-[16px] p-3.5 flex-row items-center justify-between active:bg-[#F5F2EC]"
        style={{ opacity: rooms.length === 0 ? 0.5 : 1 }}
      >
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 rounded-[12px] bg-[#EFECE6] items-center justify-center">
            <List size={16} color="#5C544C" />
          </View>
          <View>
            <Text className="text-xs font-jost-semibold text-[#241E1A]">Rooming list</Text>
            <Text className="text-[11px] font-jost text-[#8A8177] mt-0.5">
              {ru ? 'Заполнено' : 'Filled'} {filledCount} {ru ? 'из' : 'of'} {rooms.length} {roomsWord(rooms.length, lang)}
            </Text>
          </View>
        </View>
        <ChevronRight size={16} color="#8A8177" />
      </Pressable>
    </>
  );
}

// ---------- Rooming list ----------

const DOC_TYPES = [
  { value: 'Удостоверение личности', ru: 'Уд. личности', en: 'ID card' },
  { value: 'Паспорт', ru: 'Паспорт', en: 'Passport' },
  { value: 'Свидетельство о рождении', ru: 'Св-во о рожд.', en: 'Birth cert.' },
];
const GENDERS = [
  { value: 'male', ru: 'Мужской', en: 'Male' },
  { value: 'female', ru: 'Женский', en: 'Female' },
];
const NATIONALITIES = [
  { value: 'Казахстан', ru: 'Казахстан', en: 'Kazakhstan' },
  { value: 'Россия', ru: 'Россия', en: 'Russia' },
  { value: 'Узбекистан', ru: 'Узбекистан', en: 'Uzbekistan' },
  { value: 'Кыргызстан', ru: 'Кыргызстан', en: 'Kyrgyzstan' },
  { value: 'Другая', ru: 'Другая', en: 'Other' },
];

interface RoomingListProps {
  lang: Lang;
  rooms: GrpRoom[];
  roomById: Map<string, ReceptionRoom>;
  guests: Record<string, RoomingGuest>;
  filledCount: number;
  onChangeGuest: (key: string, field: keyof RoomingGuest, value: string) => void;
}

export function GroupRoomingList({ lang, rooms, roomById, guests, filledCount, onChangeGuest }: RoomingListProps) {
  const ru = lang === 'RU';
  const [expandedRoom, setExpandedRoom] = useState<string | null>(rooms[0]?.key ?? null);
  const [expandedGuest, setExpandedGuest] = useState<string | null>(rooms[0] ? guestKey(rooms[0].key, 0) : null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const opts = (list: { value: string; ru: string; en: string }[]): PickerOption[] => [
    { value: '', label: ru ? 'Выбрать...' : 'Select...' },
    ...list.map((o) => ({ value: o.value, label: ru ? o.ru : o.en })),
  ];

  return (
    <View className="gap-3.5 pb-2">
      <View className="bg-[#EFECE6] rounded-[16px] p-4 flex-row items-center justify-between">
        <View>
          <Text className="text-[15px] font-jost-semibold text-[#241E1A]">Rooming list</Text>
          <Text className="text-[11px] font-jost text-[#8A8177] mt-1">
            {ru ? 'Заполнено' : 'Filled'} {filledCount} {ru ? 'из' : 'of'} {rooms.length} {roomsWord(rooms.length, lang)}
          </Text>
        </View>
        <Text className="text-[22px] font-jost-medium text-[#8A8177]">
          {filledCount} / {rooms.length}
        </Text>
      </View>

      {rooms.map((item) => {
        const room = roomById.get(item.roomId);
        const count = roomingGuestCount(item);
        const isExpanded = expandedRoom === item.key;
        const filled = isRoomListFilled(item, guests);
        return (
          <View key={item.key} className="bg-white rounded-[18px] border border-[#E5E2DD] overflow-hidden">
            <Pressable
              onPress={() => setExpandedRoom(isExpanded ? null : item.key)}
              className="p-4 flex-row items-center justify-between active:bg-[#FAF7F3]"
            >
              <View className="flex-1 pr-2">
                <Text className="text-[15px] font-jost-semibold text-[#241E1A]">
                  №{room?.number ?? '—'}
                  {room?.category ? ` · ${room.category}` : ''}
                </Text>
                <Text className="text-xs font-jost text-[#8A8177] mt-0.5">
                  {guestsText(count, lang)} ·{' '}
                  {filled ? (ru ? 'список заполнен' : 'list filled') : ru ? 'список не заполнен' : 'list not filled'}
                </Text>
              </View>
              <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
                <ChevronDown size={16} color="#6E675F" />
              </View>
            </Pressable>

            {isExpanded && (
              <View className="border-t border-[#E5E2DD]/80">
                {Array.from({ length: count }, (_, gIdx) => {
                  const gKey = guestKey(item.key, gIdx);
                  const gd = guests[gKey] ?? EMPTY_GUEST;
                  const guestOpen = expandedGuest === gKey;
                  const docOpen = expandedDoc === gKey;
                  const fullName = `${gd.lastName.trim()} ${gd.firstName.trim()}`.trim();
                  const set = (field: keyof RoomingGuest) => (v: string) => onChangeGuest(gKey, field, v);
                  return (
                    <View key={gKey} className={`px-4 py-3.5 ${gIdx > 0 ? 'border-t border-[#E5E2DD]/80' : ''}`}>
                      <Pressable onPress={() => setExpandedGuest(guestOpen ? null : gKey)} className="flex-row items-center justify-between">
                        <View className="flex-1 pr-2">
                          <Text className="text-sm font-jost-semibold text-[#241E1A]">
                            {ru ? 'Гость' : 'Guest'} {gIdx + 1}
                          </Text>
                          <Text className="text-[11px] font-jost text-[#8A8177] mt-0.5">
                            {fullName || (ru ? 'Данные не заполнены' : 'No details yet')}
                          </Text>
                        </View>
                        <View style={{ transform: [{ rotate: guestOpen ? '180deg' : '0deg' }] }}>
                          <ChevronDown size={16} color="#6E675F" />
                        </View>
                      </Pressable>

                      {guestOpen && (
                        <View className="mt-3.5 gap-3">
                          <TextField
                            label={ru ? 'Фамилия' : 'Last name'}
                            value={gd.lastName}
                            onChangeText={set('lastName')}
                            placeholder={ru ? 'Фамилия гостя' : 'Guest last name'}
                            autoCapitalize="words"
                            invalid={!!gd.firstName.trim() && !gd.lastName.trim()}
                          />
                          <View className="flex-row gap-3">
                            <TextField
                              className="flex-1"
                              label={ru ? 'Имя' : 'First name'}
                              value={gd.firstName}
                              onChangeText={set('firstName')}
                              placeholder={ru ? 'Имя' : 'First name'}
                              autoCapitalize="words"
                              invalid={!!gd.lastName.trim() && !gd.firstName.trim()}
                            />
                            <TextField
                              className="flex-1"
                              label={ru ? 'Отчество' : 'Middle name'}
                              value={gd.middleName}
                              onChangeText={set('middleName')}
                              placeholder={ru ? 'Отчество' : 'Middle name'}
                              autoCapitalize="words"
                            />
                          </View>
                          <TextField
                            label={ru ? 'Телефон' : 'Phone'}
                            value={gd.phone}
                            onChangeText={set('phone')}
                            placeholder="+7 (XXX) XXX XX XX"
                            keyboardType="phone-pad"
                          />

                          <View className="pt-1">
                            <Pressable onPress={() => setExpandedDoc(docOpen ? null : gKey)} className="flex-row items-center justify-between py-2 active:opacity-60">
                              <Text className="text-xs font-jost text-[#6E675F]">{ru ? 'Документ и личные данные' : 'Document and personal details'}</Text>
                              <View style={{ transform: [{ rotate: docOpen ? '180deg' : '0deg' }] }}>
                                <ChevronDown size={14} color="#6E675F" />
                              </View>
                            </Pressable>

                            {docOpen && (
                              <View className="gap-3 pt-2 pb-1">
                                <View className="flex-row gap-2.5">
                                  <PickerField
                                    className="flex-1"
                                    small
                                    label={ru ? 'Тип документа' : 'Document type'}
                                    title={ru ? 'Тип документа' : 'Document type'}
                                    value={gd.docType}
                                    options={opts(DOC_TYPES)}
                                    onChange={set('docType')}
                                  />
                                  <TextField
                                    className="flex-1"
                                    small
                                    label={ru ? 'Номер документа' : 'Document no.'}
                                    value={gd.docNumber}
                                    onChangeText={set('docNumber')}
                                    placeholder={ru ? 'Номер документа' : 'Document no.'}
                                    autoCapitalize="characters"
                                  />
                                </View>
                                <View>
                                  <FieldLabel small>{ru ? 'Дата рождения' : 'Date of birth'}</FieldLabel>
                                  <IconInput
                                    small
                                    icon="calendar"
                                    birth
                                    title={ru ? 'Дата рождения' : 'Date of birth'}
                                    value={gd.birthDate}
                                    onChangeText={set('birthDate')}
                                    placeholder={ru ? 'дд.мм.гггг' : 'dd.mm.yyyy'}
                                    invalid={gd.birthDate.length >= 10 && !/^\d{2}\.\d{2}\.\d{4}$/.test(gd.birthDate)}
                                  />
                                </View>
                                <View className="flex-row gap-2.5">
                                  <PickerField
                                    className="flex-1"
                                    small
                                    label={ru ? 'Пол' : 'Gender'}
                                    title={ru ? 'Пол' : 'Gender'}
                                    value={gd.gender}
                                    options={opts(GENDERS)}
                                    onChange={set('gender')}
                                  />
                                  <PickerField
                                    className="flex-1"
                                    small
                                    label={ru ? 'Национальность' : 'Nationality'}
                                    title={ru ? 'Национальность' : 'Nationality'}
                                    value={gd.nationality}
                                    options={opts(NATIONALITIES)}
                                    onChange={set('nationality')}
                                  />
                                </View>
                              </View>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
