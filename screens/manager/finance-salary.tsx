import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { createRecord, listRecord, updateRecord } from '@/lib/api-client';
import { SelectField } from '@/components/ui/select-field';
import { DatePickerOverlay } from '@/components/ui/date-picker';
import { dec, money, num, todayIso } from '@/components/manager/manager-utils';
import { dotsToIso, isoToDots, pluralRu, type Lang } from '@/components/reception/booking-utils';
import { list, mapEmployee, mapPayroll, mapShift, type Employee, type WorkShift } from '@/components/manager/finance-data';
import { useManagerToast } from '@/components/manager/toast';
import { AddCard, Checkbox, Chevron, comingSoon, EmptyCard, FieldLabel, FormButtons, FormInput, InfoRow, SearchInput, showError } from '@/components/manager/finance-ui';

type Json = Record<string, any>;

const MONTHS_NOM_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => String(n).padStart(2, '0');
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function shiftDateText(iso: string, lang: Lang) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === 'RU' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function FinanceSalaryView() {
  const { lang } = useApp();
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const toast = useManagerToast();

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [payroll, setPayroll] = useState<Json[]>([]);
  const [shiftsRaw, setShiftsRaw] = useState<Json[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [p, s, e] = await Promise.all([
        listRecord('payroll').then(list),
        listRecord('work_shift').then(list),
        listRecord('employee').then(list).catch(() => [] as Json[]),
      ]);
      setPayroll(p);
      setShiftsRaw(s);
      setEmployees(e.map(mapEmployee));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const periodKey = `${month.y}-${pad(month.m + 1)}`;
  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const shifts = useMemo(
    () =>
      shiftsRaw
        .map((s) => mapShift(s, employeeMap))
        .filter((s) => s.date.startsWith(periodKey))
        .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start)),
    [shiftsRaw, employeeMap, periodKey]
  );
  const rows = useMemo(() => payroll.map(mapPayroll).filter((p) => p.period === periodKey), [payroll, periodKey]);

  const fund = rows.reduce((s, p) => s + p.net, 0);
  const paid = rows.filter((p) => p.status === 'paid').reduce((s, p) => s + p.net, 0);
  const pending = fund - paid;
  const unpaidCount = rows.filter((p) => p.status !== 'paid').length;
  const closed = shifts.filter((s) => !s.open);
  const hours = closed.reduce((s, x) => s + x.hours, 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return shifts;
    return shifts.filter((s) => s.employeeName.toLowerCase().includes(q) || s.department.toLowerCase().includes(q) || s.position.toLowerCase().includes(q));
  }, [shifts, search]);

  const monthLabel = ru ? `${MONTHS_NOM_RU[month.m]} ${month.y}` : `${MONTHS_EN[month.m]} ${month.y}`;

  const closeShift = (s: WorkShift) =>
    Alert.alert(t('Закрыть смену', 'Close shift'), ru ? `Закрыть смену «${s.employeeName}» в ${nowTime()}?` : `Close ${s.employeeName}'s shift at ${nowTime()}?`, [
      { text: t('Отмена', 'Cancel'), style: 'cancel' },
      {
        text: t('Закрыть', 'Close'),
        onPress: async () => {
          try {
            await updateRecord('work_shift', s.id, { employee_id: s.employeeId, date: s.date, start_time: s.start, end_time: nowTime() });
            toast(ru ? `Смена для «${s.employeeName}» закрыта` : `Shift for “${s.employeeName}” closed`);
            await load();
          } catch (e) {
            showError(lang, e);
          }
        },
      },
    ]);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-5 pb-6 gap-4"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View>
        <Text className="text-xs font-jost text-text-secondary mb-1.5">{t('Период', 'Period')}</Text>
        <Pressable onPress={() => setPickerOpen((v) => !v)} className="bg-white border border-border rounded-xl px-4 py-3 flex-row items-center justify-between active:opacity-70">
          <Text className="text-xs font-jost-medium text-text-primary">{monthLabel}</Text>
          <View className="flex-row items-center gap-2">
            <Chevron open={pickerOpen} />
            <Calendar size={16} color="#241E1A" />
          </View>
        </Pressable>
        {pickerOpen && (
          <View className="mt-2 p-3.5 bg-white border border-border rounded-2xl gap-3">
            <View className="flex-row items-center justify-between border-b border-border/60 pb-2">
              <Pressable onPress={() => setMonth((v) => ({ ...v, y: v.y - 1 }))} className="p-1.5 rounded-lg active:bg-background">
                <ChevronLeft size={16} color="#241E1A" />
              </Pressable>
              <Text className="text-xs font-spectral text-text-primary">
                {month.y} {ru ? 'год' : ''}
              </Text>
              <Pressable onPress={() => setMonth((v) => ({ ...v, y: v.y + 1 }))} className="p-1.5 rounded-lg active:bg-background">
                <ChevronRight size={16} color="#241E1A" />
              </Pressable>
            </View>
            <View className="flex-row flex-wrap" style={{ marginHorizontal: -3 }}>
              {MONTHS_NOM_RU.map((name, idx) => {
                const current = idx === month.m;
                return (
                  <View key={name} style={{ width: '33.333%', padding: 3 }}>
                    <Pressable
                      onPress={() => {
                        setMonth((v) => ({ ...v, m: idx }));
                        setPickerOpen(false);
                      }}
                      className={`py-2 rounded-xl items-center ${current ? 'bg-dark' : 'bg-background active:bg-[#EAE6DE]'}`}
                    >
                      <Text className={`text-xs ${current ? 'text-white font-jost-medium' : 'text-text-primary font-jost'}`}>{ru ? name : MONTHS_SHORT_EN[idx]}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {loading && !payroll.length && !shiftsRaw.length ? (
        <View className="py-16 items-center">
          <ActivityIndicator color="#C2410C" />
        </View>
      ) : error && !payroll.length && !shiftsRaw.length ? (
        <View className="py-12 items-center gap-3">
          <Text className="text-sm font-jost text-text-secondary text-center">{t('Не удалось загрузить зарплату', 'Failed to load payroll')}</Text>
          <Text className="text-xs font-jost text-text-muted text-center">{error}</Text>
          <Pressable onPress={load} className="px-4 py-2 rounded-xl border border-border bg-white active:bg-background">
            <Text className="text-xs font-jost-medium text-text-primary">{t('Повторить', 'Retry')}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View className="flex-row gap-2.5">
            <View className="flex-1 bg-white rounded-2xl border border-border p-4">
              <Text className="text-[11px] font-jost text-text-secondary">{t('Фонд оплаты', 'Total payroll')}</Text>
              <Text className="text-2xl font-spectral text-text-primary mt-1" numberOfLines={1} adjustsFontSizeToFit>
                {money(fund)}
              </Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl border border-border p-4">
              <Text className="text-[11px] font-jost text-text-secondary">{t('Отработано', 'Hours worked')}</Text>
              <Text className="text-2xl font-spectral text-text-primary mt-1" numberOfLines={1}>
                {dec(hours)} {t('ч', 'h')}
              </Text>
              <Text className="text-[11px] font-jost text-text-secondary mt-0.5">
                {ru ? `${closed.length} ${pluralRu(closed.length, 'смена', 'смены', 'смен')}` : `${closed.length} shifts`}
              </Text>
            </View>
          </View>

          <View className="bg-dark rounded-2xl p-[18px]">
            <Text className="text-xs font-jost text-white/80">{t('К выплате', 'To pay')}</Text>
            <Text className="text-2xl font-spectral text-white mt-0.5" numberOfLines={1} adjustsFontSizeToFit>
              {money(pending)}
            </Text>
            <Text className="text-[11px] font-jost text-white/70 mt-1">
              {ru ? `${unpaidCount} ${pluralRu(unpaidCount, 'сотрудник', 'сотрудника', 'сотрудников')}` : `${unpaidCount} employees`}
            </Text>
          </View>

          <AddShiftCard lang={lang} employees={employees} periodKey={periodKey} onSaved={load} />

          <View className="gap-3 pt-1">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-jost-medium text-text-primary">{t('Табель смен', 'Shift log')}</Text>
              <Pressable onPress={() => comingSoon(lang)} hitSlop={6} className="p-1 active:opacity-60">
                <Download size={18} color="#241E1A" />
              </Pressable>
            </View>
            <SearchInput value={search} onChangeText={setSearch} placeholder={t('Сотрудник или отдел', 'Employee or department')} />

            {filtered.length === 0 ? (
              <EmptyCard text={search.trim() ? t('Смен по данному запросу не найдено', 'No shifts match the search') : t('Смен за этот месяц нет', 'No shifts this month')} />
            ) : (
              filtered.map((s) => {
                const open = expanded === s.id;
                const rate = employeeMap.get(s.employeeId)?.hourlyRate ?? 0;
                return (
                  <View key={s.id} className="bg-white rounded-2xl border border-border p-4 gap-2">
                    <View className="flex-row items-start justify-between gap-2">
                      <Text className="flex-1 text-sm font-jost-medium text-text-primary">{s.employeeName}</Text>
                      {s.open ? (
                        <View className="bg-[#FDF3E3] px-2.5 py-0.5 rounded-md">
                          <Text className="text-[11px] font-jost-medium text-[#B87A28]">{t('Открыта', 'Open')}</Text>
                        </View>
                      ) : (
                        <Text className="text-sm font-jost-medium text-text-primary">
                          {dec(s.hours)} {t('ч', 'h')}
                        </Text>
                      )}
                    </View>
                    <Text className="text-xs font-jost text-text-secondary">
                      {shiftDateText(s.date, lang)}
                      {s.qr ? ' · QR' : ''}
                    </Text>
                    <View className="flex-row items-center justify-between pt-1 gap-2">
                      <Text className="text-xs font-jost text-text-primary">
                        {s.start} → {s.open ? t('Открыта', 'Open') : s.end}
                      </Text>
                      <Pressable onPress={() => setExpanded(open ? null : s.id)} hitSlop={6} className="flex-row items-center gap-1 active:opacity-60 flex-shrink">
                        <Text className="text-xs font-jost text-text-secondary" numberOfLines={1}>
                          {s.department || s.position || '—'}
                        </Text>
                        <Chevron open={open} size={14} />
                      </Pressable>
                    </View>
                    {open && (
                      <View className="mt-3 bg-background rounded-xl p-3 gap-2">
                        <InfoRow label={t('Почасовая ставка:', 'Hourly rate:')} value={rate > 0 ? `${money(rate)} / ${t('ч', 'h')}` : '—'} />
                        <InfoRow
                          label={t('Начислено за смену:', 'Accrued for shift:')}
                          value={s.open ? t('Рассчитывается при закрытии', 'Calculated on close') : rate > 0 ? money(rate * s.hours) : '—'}
                          valueClass={!s.open && rate > 0 ? 'text-[#3D7C52] font-spectral' : 'text-text-primary font-jost'}
                        />
                        <InfoRow
                          label={t('Фиксация времени:', 'Time tracking:')}
                          value={s.qr ? t('Вход по личному QR-коду', 'Personal QR code') : t('Через рабочее приложение', 'Via the work app')}
                          valueClass="text-text-primary font-jost"
                        />
                        {s.open && (
                          <View className="pt-2 border-t border-border/50">
                            <Pressable onPress={() => closeShift(s)} className="bg-primary py-2 rounded-lg items-center active:bg-primary-hover">
                              <Text className="text-xs font-jost-medium text-white">{t('Закрыть смену', 'Close shift')}</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function AddShiftCard({ lang, employees, periodKey, onSaved }: { lang: Lang; employees: Employee[]; periodKey: string; onSaved: () => Promise<void> }) {
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const toast = useManagerToast();
  const defaultDate = () => (todayIso().startsWith(periodKey) ? todayIso() : `${periodKey}-01`);
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(() => isoToDots(defaultDate()));
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('18:00');
  const [isOpen, setIsOpen] = useState(false);
  const [qr, setQr] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDate(isoToDots(defaultDate()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodKey]);

  const employee = employees.find((e) => e.id === employeeId);

  const save = async () => {
    const dateIso = dotsToIso(date);
    if (!employeeId) return toast(t('Выберите сотрудника', 'Choose an employee'));
    if (!dateIso) return toast(t('Укажите дату', 'Enter the date'));
    if (!TIME_RE.test(start) || (!isOpen && !TIME_RE.test(end))) return toast(t('Время в формате ЧЧ:ММ', 'Time as HH:MM'));
    setBusy(true);
    try {
      const payload: Json = { employee_id: employeeId, date: dateIso, start_time: start };
      if (isOpen) payload.status = 'open';
      else payload.end_time = end;
      if (qr) payload.source = 'qr';
      await createRecord('work_shift', payload);
      toast(ru ? `Смена для ${employee?.name ?? ''} сохранена` : `Shift for ${employee?.name ?? ''} saved`);
      setEmployeeId('');
      setIsOpen(false);
      setQr(false);
      setOpen(false);
      await onSaved();
    } catch (e) {
      showError(lang, e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AddCard title={t('Добавить смену', 'Add shift')} open={open} onToggle={() => setOpen((v) => !v)}>
      <View>
        <FieldLabel>{t('ФИО сотрудника', 'Employee')}</FieldLabel>
        <SelectField
          variant="form"
          value={employeeId}
          onChange={setEmployeeId}
          options={[
            { value: '', label: t('Выберите сотрудника', 'Choose an employee') },
            ...employees.map((e) => ({ value: e.id, label: e.position ? `${e.name} · ${e.position}` : e.name })),
          ]}
        />
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <FieldLabel>{t('Отдел', 'Department')}</FieldLabel>
          <FormInput editable={false} value={employee?.department || '—'} />
        </View>
        <View className="flex-1">
          <FieldLabel>{t('Дата', 'Date')}</FieldLabel>
          <DatePickerOverlay value={date} onChange={setDate} title={t('Дата', 'Date')}>
            <View className="bg-white border border-border rounded-xl px-3.5 py-2.5 flex-row items-center justify-between">
              <Text className="text-xs font-jost text-text-primary">{date}</Text>
              <Calendar size={14} color="#8A8177" />
            </View>
          </DatePickerOverlay>
        </View>
      </View>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <FieldLabel>{t('Начало', 'Start')}</FieldLabel>
          <FormInput value={start} onChangeText={setStart} placeholder="09:00" keyboardType="numbers-and-punctuation" maxLength={5} />
        </View>
        <View className="flex-1">
          <FieldLabel>{t('Окончание', 'End')}</FieldLabel>
          <FormInput
            editable={!isOpen}
            value={isOpen ? t('Открыта', 'Open') : end}
            onChangeText={setEnd}
            placeholder="18:00"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </View>
      </View>
      <View className="flex-row items-center justify-between pt-1">
        <Checkbox checked={isOpen} onToggle={() => setIsOpen((v) => !v)} label={t('Смена открыта', 'Shift is open')} />
        <Checkbox checked={qr} onToggle={() => setQr((v) => !v)} label={t('Отметка QR', 'QR check-in')} muted />
      </View>
      <FormButtons lang={lang} busy={busy} submitLabel={t('Сохранить смену', 'Save shift')} onSubmit={save} onCancel={() => setOpen(false)} />
    </AddCard>
  );
}
