import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { List, Plus, X } from 'lucide-react-native';
import type { CatalogItem } from '@/context/reception-store';
import type { Lang } from '@/components/reception/booking-utils';
import { C, FieldLabel, Select, SoonBadge, money } from './individual-ui';

// Step 3 "Услуги": chosen catalog services plus the inline "Заказать услугу" form.
// Booking creation only takes service codes (extraServices), so the order form's slot,
// duration and cash-desk parts are shown as in the design but are not editable yet.

function StubField({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-jost text-text-secondary">{label}</Text>
      <View className="bg-[#F5F2EC] rounded-[12px] px-3 py-2.5" style={{ borderWidth: 1, borderColor: C.border }}>
        <Text className="text-xs font-jost text-text-secondary">{value}</Text>
      </View>
    </View>
  );
}

export function ServicesSection({
  lang,
  catalog,
  selected,
  onAdd,
  onRemove,
}: {
  lang: Lang;
  catalog: CatalogItem[];
  selected: CatalogItem[];
  onAdd: (item: CatalogItem) => void;
  onRemove: (code: string) => void;
}) {
  const ru = lang === 'RU';
  const [pickerOpen, setPickerOpen] = useState(false);
  const [serviceCode, setServiceCode] = useState('');
  const chosen = catalog.find((s) => s.code === serviceCode);

  const options = catalog.map((s) => ({
    value: s.code,
    label: `${s.name} (${money(s.price)})`,
    disabled: selected.some((x) => x.code === s.code),
    hint: selected.some((x) => x.code === s.code) ? (ru ? 'Уже добавлена' : 'Already added') : undefined,
  }));

  return (
    <View className="gap-3 pb-2">
      <Text className="text-xs font-jost-medium text-text-primary">{ru ? 'Услуги' : 'Services'}</Text>

      {selected.length === 0 ? (
        <View
          className="rounded-[14px] py-4 px-4 flex-row items-center justify-center gap-2 bg-white/40"
          style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: '#D6CFC5' }}
        >
          <List size={16} color={C.muted} />
          <Text className="text-xs font-jost text-text-secondary">{ru ? 'Услуг пока нет' : 'No services yet'}</Text>
        </View>
      ) : (
        <View className="gap-2">
          {selected.map((srv) => (
            <View
              key={srv.code}
              className="bg-white rounded-[14px] px-3.5 py-2.5 flex-row items-center justify-between gap-2"
              style={{ borderWidth: 1, borderColor: C.border }}
            >
              <Text className="flex-1 text-xs font-jost-medium text-text-primary" numberOfLines={2}>{srv.name}</Text>
              <View className="flex-row items-center gap-2.5">
                <Text className="text-xs font-jost-semibold text-primary">+{money(srv.price)}</Text>
                <Pressable onPress={() => onRemove(srv.code)} hitSlop={6} className="h-6 w-6 rounded-md items-center justify-center active:bg-black/5">
                  <X size={14} color={C.muted} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {pickerOpen ? (
        <View className="bg-[#FAF7F3] rounded-[18px] p-[18px] gap-4" style={{ borderWidth: 1, borderColor: C.border }}>
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-xs font-jost text-text-secondary">
              {ru ? 'Услуга будет записана в бронь и добавлена в folio гостя.' : "The service is saved to the booking and added to the guest's folio."}
            </Text>
            <Pressable onPress={() => setPickerOpen(false)} hitSlop={8} className="p-1 active:opacity-60">
              <X size={16} color={C.muted} />
            </Pressable>
          </View>

          <View>
            <FieldLabel className="text-text-primary">{ru ? 'Услуга' : 'Service'}</FieldLabel>
            <Select
              title={ru ? 'Услуга' : 'Service'}
              value={serviceCode}
              placeholder={ru ? 'Выберите услугу' : 'Select a service'}
              options={options}
              onChange={setServiceCode}
              emptyText={ru ? 'Каталог услуг пуст' : 'The service catalog is empty'}
            />
          </View>

          {/* Not supported by booking creation yet: shown as in the design, read-only. */}
          <View className="gap-3.5" style={{ opacity: 0.6 }} pointerEvents="none">
            <View className="flex-row items-center gap-2">
              <Text className="flex-1 text-[11px] font-jost text-text-secondary">
                {ru ? 'Время, длительность и оплата услуги — скоро будет доступно' : 'Time, duration and payment — coming soon'}
              </Text>
              <SoonBadge lang={lang} />
            </View>
            <StubField label={ru ? 'Время / слот' : 'Time / slot'} value="—" />
            <StubField label={ru ? 'Длительность' : 'Duration'} value="—" />
            <View className="bg-white rounded-[16px] p-4 gap-3.5" style={{ borderWidth: 1, borderColor: C.border }}>
              <Text className="text-xs font-jost-semibold text-text-primary">{ru ? 'Касса' : 'Cash desk'}</Text>
              <StubField label={ru ? 'Оплата' : 'Payment'} value={ru ? 'При выселении' : 'At check-out'} />
              <StubField label={ru ? 'Оплата / Folio' : 'Payment / Folio'} value={ru ? 'Не оплачено' : 'Unpaid'} />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <StubField label={ru ? 'Сумма' : 'Amount'} value={chosen ? money(chosen.price) : '—'} />
                </View>
                <View className="flex-1">
                  <StubField label={ru ? 'К оплате' : 'To pay'} value={chosen ? money(chosen.price) : '—'} />
                </View>
              </View>
              <View className="w-full py-2.5 rounded-[12px] bg-[#D6A283] items-center">
                <Text className="text-xs font-jost-medium text-white">{ru ? 'Принять' : 'Accept'}</Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => {
              if (!chosen) return;
              onAdd(chosen);
              setServiceCode('');
              setPickerOpen(false);
            }}
            disabled={!chosen}
            className="w-full py-3.5 rounded-[14px] bg-[#B93800] items-center active:bg-[#9E3000]"
            style={{ opacity: chosen ? 1 : 0.5 }}
          >
            <Text className="text-xs font-jost-semibold text-white">{ru ? 'Добавить услугу' : 'Add service'}</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setPickerOpen(true)}
          className="w-full rounded-[14px] bg-[#FAF7F3] py-3.5 px-4 flex-row items-center justify-center gap-2 active:bg-[#F5EFE6]"
          style={{ borderWidth: 1, borderColor: '#DFC3B4' }}
        >
          <Plus size={16} color={C.accent} />
          <Text className="text-xs font-jost-medium text-primary">{ru ? 'Заказать услугу' : 'Order a service'}</Text>
        </Pressable>
      )}
    </View>
  );
}
