import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Search, UserCheck, X } from 'lucide-react-native';
import type { FoundGuest, GuestInput } from '@/context/reception-store';
import { dotsToIso, isoToDots, type Lang } from '@/components/reception/booking-utils';
import { C, DateInput, Divider, FieldLabel, Input, Select, type PickOption } from './individual-ui';

// One guest block of step 2 ("Основной гость" / "Гость N").

export interface GuestDraft {
  lastName: string;
  firstName: string;
  middleName: string;
  phone: string;
  email: string;
  docType: string;
  docNumber: string;
  birthDate: string; // ДД.ММ.ГГГГ as typed
  gender: '' | 'male' | 'female';
  nationality: string;
}

export const emptyGuest = (): GuestDraft => ({
  lastName: '',
  firstName: '',
  middleName: '',
  phone: '',
  email: '',
  docType: '',
  docNumber: '',
  birthDate: '',
  gender: '',
  nationality: '',
});

export const isGuestBlank = (g: GuestDraft) =>
  !g.lastName.trim() && !g.firstName.trim() && !g.middleName.trim() && !g.phone.trim() && !g.docNumber.trim() && !g.birthDate.trim();

export const birthDateInvalid = (g: GuestDraft) => !!g.birthDate.trim() && !dotsToIso(g.birthDate);

export function draftToGuestInput(g: GuestDraft): GuestInput {
  return {
    lastName: g.lastName.trim(),
    firstName: g.firstName.trim(),
    middleName: g.middleName.trim() || undefined,
    phone: g.phone.trim() || undefined,
    email: g.email.trim() || undefined,
    birthDate: dotsToIso(g.birthDate) || undefined,
    gender: g.gender || undefined,
    documentType: g.docType || undefined,
    documentId: g.docNumber.trim() || undefined,
    nationality: g.nationality || undefined,
  };
}

export function foundToDraft(f: FoundGuest): GuestDraft {
  return {
    lastName: f.lastName,
    firstName: f.firstName,
    middleName: f.middleName ?? '',
    phone: f.phone ?? '',
    email: f.email ?? '',
    docType: f.documentType ?? '',
    docNumber: f.documentId ?? '',
    birthDate: f.birthDate ? isoToDots(f.birthDate) : '',
    gender: f.gender === 'male' || f.gender === 'female' ? f.gender : '',
    nationality: f.nationality ?? '',
  };
}

// Document types and countries are stored as the label (the API takes free strings and the
// booking card shows them as is).
const DOC_TYPES_MAIN = [
  ['Удостоверение личности', 'ID card'],
  ['Паспорт', 'Passport'],
  ['Заграничный паспорт', 'International passport'],
  ['Вид на жительство', 'Residence permit'],
];
const DOC_TYPES_COMPANION = [
  ['Удостоверение личности', 'ID card'],
  ['Паспорт', 'Passport'],
  ['Заграничный паспорт', 'International passport'],
  ['Свидетельство о рождении', 'Birth certificate'],
];
const COUNTRIES = [
  ['Казахстан', 'Kazakhstan'],
  ['Россия', 'Russia'],
  ['Узбекистан', 'Uzbekistan'],
  ['Кыргызстан', 'Kyrgyzstan'],
  ['Турция', 'Turkey'],
  ['Германия', 'Germany'],
  ['США', 'USA'],
  ['Другая', 'Other'],
];

function optionsFrom(pairs: string[][], lang: Lang, current: string): PickOption[] {
  const ru = lang === 'RU';
  const list: PickOption[] = [{ value: '', label: ru ? 'Выбрать...' : 'Select...' }];
  pairs.forEach(([r, e]) => list.push({ value: ru ? r : e, label: ru ? r : e }));
  // A value from the guest base that is not in the list stays selectable.
  if (current && !list.some((o) => o.value === current)) list.push({ value: current, label: current });
  return list;
}

function GuestSearch({ lang, searchGuests, onPick }: { lang: Lang; searchGuests: (q: string) => Promise<FoundGuest[]>; onPick: (g: FoundGuest) => void }) {
  const ru = lang === 'RU';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoundGuest[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    const id = ++seq.current;
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setFailed(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      searchGuests(q)
        .then((list) => {
          if (id !== seq.current) return;
          setResults(list.slice(0, 5));
          setFailed(false);
        })
        .catch(() => {
          if (id !== seq.current) return;
          setResults([]);
          setFailed(true);
        })
        .finally(() => {
          if (id === seq.current) setLoading(false);
        });
    }, 350);
    return () => clearTimeout(timer);
  }, [query, searchGuests]);

  const q = query.trim();
  return (
    <View>
      <FieldLabel>{ru ? 'Поиск в базе' : 'Search database'}</FieldLabel>
      <View className="bg-[#FAF7F3] rounded-[14px] px-3.5 flex-row items-center gap-2.5" style={{ borderWidth: 1, borderColor: C.border }}>
        <Search size={16} color={C.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={ru ? 'Имя или телефон...' : 'Name or phone...'}
          placeholderTextColor={C.muted}
          autoCorrect={false}
          className="flex-1 py-3 text-xs font-jost text-text-primary"
        />
        {loading ? <ActivityIndicator size="small" color={C.muted} /> : null}
      </View>
      <Text className="text-[11px] font-jost text-text-secondary mt-1.5">
        {ru ? 'Найдите гостя в базе или заполните данные ниже.' : 'Find a guest in the database or fill in the details below.'}
      </Text>

      {q.length >= 2 && !loading ? (
        <View className="mt-2 bg-[#FAF7F3] rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: C.border }}>
          {failed ? (
            <Text className="px-3.5 py-2.5 text-xs font-jost text-error">{ru ? 'Не удалось выполнить поиск' : 'Search failed'}</Text>
          ) : results.length === 0 ? (
            <Text className="px-3.5 py-2.5 text-xs font-jost text-text-secondary">{ru ? 'Ничего не найдено' : 'Nothing found'}</Text>
          ) : (
            results.map((g, i) => {
              const name = [g.lastName, g.firstName, g.middleName].filter(Boolean).join(' ') || '—';
              return (
                <Pressable
                  key={g.id || String(i)}
                  onPress={() => {
                    onPick(g);
                    setQuery('');
                  }}
                  className="px-3.5 py-2.5 flex-row items-center justify-between gap-2 active:bg-white"
                  style={i > 0 ? { borderTopWidth: 1, borderTopColor: 'rgba(229,226,221,0.6)' } : undefined}
                >
                  <Text className="flex-1 text-xs font-jost-medium text-text-primary" numberOfLines={1}>{name}</Text>
                  <Text className="text-xs font-jost text-text-secondary">{g.phone || g.email || ''}</Text>
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}

interface GuestCardProps {
  lang: Lang;
  title: string;
  kindLabel: string;
  guest: GuestDraft;
  onChange: (patch: Partial<GuestDraft>) => void;
  showErrors: boolean;
  // Main guest only
  primary?: boolean;
  searchGuests?: (q: string) => Promise<FoundGuest[]>;
  onPickFound?: (g: FoundGuest) => void;
  linkedToBase?: boolean;
  onUnlink?: () => void;
  // Companion: names are required only once anything is filled in
  requireNames: boolean;
  // "Источник" block rendered inside the main guest card, as in the design.
  sourceSlot?: React.ReactNode;
}

export function GuestCard({
  lang,
  title,
  kindLabel,
  guest,
  onChange,
  showErrors,
  primary,
  searchGuests,
  onPickFound,
  linkedToBase,
  onUnlink,
  requireNames,
  sourceSlot,
}: GuestCardProps) {
  const ru = lang === 'RU';
  const missLast = showErrors && requireNames && !guest.lastName.trim();
  const missFirst = showErrors && requireNames && !guest.firstName.trim();
  const genderOptions: PickOption[] = [
    { value: '', label: ru ? 'Выбрать...' : 'Select...' },
    { value: 'male', label: ru ? 'Мужской' : 'Male' },
    { value: 'female', label: ru ? 'Женский' : 'Female' },
  ];

  return (
    <View className="bg-white rounded-[18px] p-4 gap-4" style={{ borderWidth: 1, borderColor: C.border }}>
      <View className="flex-row items-center justify-between pb-2.5" style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(229,226,221,0.7)' }}>
        <Text className="text-sm font-jost-semibold text-text-primary">{title}</Text>
        <Text className="text-[11px] font-jost text-text-secondary">{kindLabel}</Text>
      </View>

      {/* Контакты */}
      <View className="gap-3.5">
        <Text className="text-xs font-jost-medium text-text-primary">{ru ? 'Контакты' : 'Contacts'}</Text>

        {primary && searchGuests && onPickFound ? <GuestSearch lang={lang} searchGuests={searchGuests} onPick={onPickFound} /> : null}

        {linkedToBase ? (
          <View className="flex-row items-center gap-2 bg-success-light rounded-xl px-3 py-2">
            <UserCheck size={14} color="#3D6A50" />
            <Text className="flex-1 text-[11px] font-jost text-success-text">
              {ru ? 'Гость из базы — бронь будет привязана к его карточке' : 'Guest from the database — the booking is linked to their profile'}
            </Text>
            <Pressable onPress={onUnlink} hitSlop={8} className="active:opacity-60">
              <X size={14} color="#3D6A50" />
            </Pressable>
          </View>
        ) : null}

        <View>
          <FieldLabel>{ru ? 'Фамилия' : 'Last name'}</FieldLabel>
          <Input
            tone="subtle"
            value={guest.lastName}
            onChangeText={(v) => onChange({ lastName: v })}
            placeholder={ru ? 'Фамилия гостя' : 'Guest last name'}
            autoCapitalize="words"
            invalid={missLast}
          />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FieldLabel>{ru ? 'Имя' : 'First name'}</FieldLabel>
            <Input
              tone="subtle"
              value={guest.firstName}
              onChangeText={(v) => onChange({ firstName: v })}
              placeholder={ru ? 'Имя' : 'First name'}
              autoCapitalize="words"
              invalid={missFirst}
            />
          </View>
          <View className="flex-1">
            <FieldLabel>{ru ? 'Отчество' : 'Middle name'}</FieldLabel>
            <Input
              tone="subtle"
              value={guest.middleName}
              onChangeText={(v) => onChange({ middleName: v })}
              placeholder={ru ? 'Отчество' : 'Middle name'}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View>
          <FieldLabel>{ru ? 'Телефон' : 'Phone'}</FieldLabel>
          <Input
            tone="subtle"
            value={guest.phone}
            onChangeText={(v) => onChange({ phone: v })}
            placeholder="+7 (XXX) XXX XX XX"
            keyboardType="phone-pad"
          />
        </View>

        {primary ? (
          <View>
            <FieldLabel>E-mail</FieldLabel>
            <Input
              tone="subtle"
              value={guest.email}
              onChangeText={(v) => onChange({ email: v })}
              placeholder="guest@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ) : null}
      </View>

      {sourceSlot ? <Divider soft /> : null}
      {sourceSlot}

      <Divider soft />

      {/* Документы и личные данные */}
      <View className="gap-3.5">
        <Text className="text-xs font-jost-medium text-text-primary">{ru ? 'Документы и личные данные' : 'Documents and personal data'}</Text>

        <View>
          <FieldLabel>{ru ? 'Тип документа' : 'Document type'}</FieldLabel>
          <Select
            title={ru ? 'Тип документа' : 'Document type'}
            tone="subtle"
            value={guest.docType}
            options={optionsFrom(primary ? DOC_TYPES_MAIN : DOC_TYPES_COMPANION, lang, guest.docType)}
            onChange={(v) => onChange({ docType: v })}
          />
        </View>

        <View>
          <FieldLabel>{ru ? 'Номер документа' : 'Document number'}</FieldLabel>
          <Input
            tone="subtle"
            value={guest.docNumber}
            onChangeText={(v) => onChange({ docNumber: v })}
            placeholder={ru ? 'Номер документа' : 'Document number'}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>

        <View>
          <FieldLabel>{ru ? 'Дата рождения' : 'Date of birth'}</FieldLabel>
          <DateInput
            tone="subtle"
            birth
            title={ru ? 'Дата рождения' : 'Date of birth'}
            value={guest.birthDate}
            onChange={(v) => onChange({ birthDate: v })}
            placeholder={ru ? 'дд.мм.гггг' : 'dd.mm.yyyy'}
            invalid={(showErrors || guest.birthDate.length >= 10) && birthDateInvalid(guest)}
          />
        </View>

        <View>
          <FieldLabel>{ru ? 'Пол' : 'Gender'}</FieldLabel>
          <Select
            title={ru ? 'Пол' : 'Gender'}
            tone="subtle"
            value={guest.gender}
            options={genderOptions}
            onChange={(v) => onChange({ gender: v as GuestDraft['gender'] })}
          />
        </View>

        <View>
          <FieldLabel>{ru ? 'Национальность' : 'Nationality'}</FieldLabel>
          <Select
            title={ru ? 'Национальность' : 'Nationality'}
            tone="subtle"
            value={guest.nationality}
            options={optionsFrom(COUNTRIES, lang, guest.nationality)}
            onChange={(v) => onChange({ nationality: v })}
          />
        </View>
      </View>
    </View>
  );
}
