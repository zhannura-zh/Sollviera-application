import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Calendar, Check, ChevronDown, ChevronLeft, Download, FileText } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { getReportsMeta, runReport } from '@/lib/api-client';
import { SelectField } from '@/components/ui/select-field';
import { DatePickerOverlay } from '@/components/ui/date-picker';
import { dotsToIso, isoToDots, type Lang } from '@/components/reception/booking-utils';
import { REPORT_LABELS_EN, REPORT_LABELS_RU } from '@/components/manager/report-labels';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

type Json = Record<string, any>;

interface ReportFilter {
  key: string;
  type: 'checkbox' | 'select' | 'month' | 'year' | 'date' | 'entity' | string;
  choices?: string[];
  source?: string;
}

interface ReportDef {
  code: string;
  group: string;
  range: string;
  filters: ReportFilter[];
  columns: string[];
  defaultSort: string;
}

interface ReportResult {
  code: string;
  from: string;
  to: string;
  columns: string[];
  rows: Json[];
}

const ROOM_CATEGORIES_RU: Record<string, string> = { Studio: 'Студия', Standard: 'Стандарт', Superior: 'Улучшенный', Comfort: 'Комфорт', Suite: 'Люкс' };
const BOOKING_STATUS: Record<string, [string, string]> = {
  pending: ['Новая', 'New'],
  confirmed: ['Подтверждена', 'Confirmed'],
  checked_in: ['Заселен', 'Checked in'],
  checked_out: ['Выехал', 'Checked out'],
  cancelled: ['Отмена', 'Cancelled'],
  no_show: ['Не заехал', 'No-show'],
};
const CLEANLINESS: Record<string, [string, string]> = {
  dirty: ['Грязный после выезда', 'Dirty after checkout'],
  in_progress: ['В уборке', 'Being cleaned'],
  cleaned: ['Убран, ожидает подтверждения', 'Cleaned, awaiting confirmation'],
  verified: ['Чистая — проверено', 'Clean — verified'],
  assigned: ['Назначена горничная', 'Housekeeper assigned'],
};

function currentMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const last = new Date(y, d.getMonth() + 1, 0).getDate();
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${String(last).padStart(2, '0')}`, month: m, year: String(y), date: d.toISOString().slice(0, 10) };
}

function defaultFilters(report: ReportDef) {
  const now = currentMonth();
  const out: Record<string, unknown> = {};
  for (const f of report.filters) {
    if (f.type === 'checkbox') out[f.key] = f.key === 'guestBookings' || f.key === 'groupBookings';
    else if (f.type === 'select') out[f.key] = f.choices?.[0] ?? '';
    else if (f.type === 'month') out[f.key] = now.month;
    else if (f.type === 'year') out[f.key] = now.year;
    else if (f.type === 'date') out[f.key] = now.date;
    else out[f.key] = '';
  }
  return out;
}

function useLabels(lang: Lang) {
  const dict: any = lang === 'RU' ? REPORT_LABELS_RU : REPORT_LABELS_EN;
  const pick = (group: string, key: string, fallback = key) => (dict[group]?.[key] as string | undefined) ?? fallback;
  const ru = lang === 'RU';

  const formatValue = (column: string, value: unknown): string => {
    if (value === '' || value === null || value === undefined) return '—';
    if (typeof value === 'string' && value.includes('@')) {
      return value
        .split(' · ')
        .map((part) => (part.startsWith('@') ? pick('values', part.slice(1), part.slice(1)) : part))
        .join(' · ');
    }
    const lower = String(value).toLowerCase();
    if (column === 'bookingStatus') return BOOKING_STATUS[lower]?.[ru ? 0 : 1] ?? String(value);
    if (column === 'cleanliness') return CLEANLINESS[lower]?.[ru ? 0 : 1] ?? String(value);
    if (column === 'hkStatus') return pick('hkStatuses', lower, String(value));
    if (column === 'hkType') return pick('hkTypes', lower, String(value));
    if (column === 'attention') return pick('values', Number(value) > 0 ? 'yes' : 'no', String(value));
    if (column === 'roomType' || column === 'category' || column === 'roomCategory') return ru ? ROOM_CATEGORIES_RU[String(value)] ?? String(value) : String(value);
    if (column === 'status') return pick('statuses', String(value), String(value));
    if (column === 'method') return pick('methods', String(value), String(value));
    if (typeof value === 'number') return value.toLocaleString(ru ? 'ru-RU' : 'en-US', { maximumFractionDigits: 2 });
    return String(value);
  };

  return {
    reportName: (code: string) => pick('types', code, code),
    columnName: (key: string) => pick('columns', key, key),
    filterName: (key: string) => pick('filters', key, key),
    optionName: (key: string) => pick('options', key, key),
    text: (key: string) => (typeof dict[key] === 'string' ? (dict[key] as string) : ''),
    dict,
    formatValue,
  };
}

function Checkbox({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} className="flex-row items-center gap-3 active:opacity-70">
      <View
        className={`h-5 w-5 rounded-[5px] items-center justify-center ${checked ? 'bg-primary' : 'bg-white'}`}
        style={checked ? undefined : { borderWidth: 1, borderColor: '#D4CECA' }}
      >
        {checked && <Check size={14} color="#fff" strokeWidth={2.5} />}
      </View>
      <Text className="text-xs font-jost text-text-primary flex-shrink">{label}</Text>
    </Pressable>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text className="text-xs font-jost text-text-secondary mb-1.5">{children}</Text>;
}

function DateField({ value, onChange, range }: { value: string; onChange: (iso: string) => void; range?: any }) {
  const text = isoToDots(value);
  return (
    <DatePickerOverlay value={text} onChange={(v) => { const iso = dotsToIso(v); if (iso) onChange(iso); }} range={range}>
      <View className="bg-white border border-border rounded-xl px-3 py-2.5 flex-row items-center justify-between">
        <Text className="text-xs font-jost text-text-primary">{text}</Text>
        <Calendar size={16} color="#241E1A" />
      </View>
    </DatePickerOverlay>
  );
}

export function ManagerReportsView() {
  const { lang } = useApp();
  const ru = lang === 'RU';
  const L = useLabels(lang);

  const [meta, setMeta] = useState<{ reports: ReportDef[]; options: Record<string, { value: string; label: string }[]> } | null>(null);
  const [metaError, setMetaError] = useState('');
  const [code, setCode] = useState('ST003');
  const [from, setFrom] = useState(currentMonth().from);
  const [to, setTo] = useState(currentMonth().to);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [columns, setColumns] = useState<string[]>([]);
  const [sort, setSort] = useState('');
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState('');
  const [result, setResult] = useState<ReportResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const loadMeta = () => {
    setMetaError('');
    getReportsMeta()
      .then((m) => setMeta({ reports: Array.isArray(m?.reports) ? m.reports : [], options: (m?.options ?? {}) as Record<string, { value: string; label: string }[]> }))
      .catch((e) => setMetaError(e instanceof Error ? e.message : String(e)));
  };
  useEffect(loadMeta, []);

  const report = useMemo(() => meta?.reports.find((r) => r.code === code) ?? meta?.reports[0], [meta, code]);

  // A new report type starts from its own defaults, as on the web.
  useEffect(() => {
    if (!report) return;
    setFilters(defaultFilters(report));
    setColumns(report.columns);
    setSort(report.defaultSort);
    setDir('asc');
    setResult(null);
    setRunError('');
  }, [report]);

  useEffect(() => {
    if (!showResult) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowResult(false);
      return true;
    });
    return () => sub.remove();
  }, [showResult]);

  const generate = async () => {
    if (!report) return;
    if (!columns.length) {
      Alert.alert(L.text('pickColumns') || (ru ? 'Выберите хотя бы один столбец' : 'Pick at least one column'));
      return;
    }
    setRunning(true);
    setRunError('');
    try {
      const ordered = report.columns.filter((c) => columns.includes(c));
      const res = await runReport({
        code: report.code,
        from,
        to,
        columns: ordered,
        sort: ordered.includes(sort) ? sort : ordered[0],
        dir,
        filters,
      });
      setResult({
        code: String(res?.code ?? report.code),
        from: String(res?.from ?? from),
        to: String(res?.to ?? to),
        columns: Array.isArray(res?.columns) ? res.columns : ordered,
        rows: Array.isArray(res?.rows) ? res.rows : [],
      });
      setShowResult(true);
    } catch (e) {
      setResult(null);
      setRunError(e instanceof Error ? e.message : L.text('failed'));
    } finally {
      setRunning(false);
    }
  };

  if (metaError) {
    return (
      <View className="flex-1 items-center justify-center px-8 gap-3">
        <Text className="text-sm font-jost text-text-secondary text-center">{ru ? 'Не удалось загрузить отчёты' : 'Failed to load reports'}</Text>
        <Text className="text-xs font-jost text-text-muted text-center">{metaError}</Text>
        <Pressable onPress={loadMeta} className="px-4 py-2 rounded-xl border border-border bg-white active:bg-background">
          <Text className="text-xs font-jost-medium text-text-primary">{ru ? 'Повторить' : 'Retry'}</Text>
        </Pressable>
      </View>
    );
  }
  if (!meta || !report) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#C2410C" />
      </View>
    );
  }

  const templateFilter = report.filters.find((f) => f.key === 'template' && f.type === 'select');

  if (showResult && result) {
    return (
      <ReportResultView
        lang={lang}
        labels={L}
        result={result}
        templateLabel={templateFilter ? L.optionName(String(filters.template ?? '')) : ''}
        onBack={() => setShowResult(false)}
      />
    );
  }

  const rangeLink = {
    start: isoToDots(from),
    end: isoToDots(to),
    inclusive: true,
    labels: { title: L.text('period') || (ru ? 'Период' : 'Period'), start: ru ? 'С' : 'From', end: ru ? 'По' : 'To' },
    onChange: (s: string, e: string) => {
      const si = dotsToIso(s);
      const ei = dotsToIso(e);
      if (si) setFrom(si);
      if (ei) setTo(ei);
    },
  };

  const setFilter = (key: string, value: unknown) => setFilters((prev) => ({ ...prev, [key]: value }));
  const otherFilters = report.filters.filter((f) => f.key !== 'template');
  const checkboxFilters = otherFilters.filter((f) => f.type === 'checkbox');
  const fieldFilters = otherFilters.filter((f) => f.type !== 'checkbox');
  const sortOptions = (columns.length ? report.columns.filter((c) => columns.includes(c)) : report.columns).map((c) => ({ value: c, label: L.columnName(c) }));

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-5 pb-6 gap-3.5" keyboardShouldPersistTaps="handled">
      {/* Card 1: dates, type, template, filters */}
      <View className="bg-white rounded-2xl border border-border p-[18px] gap-4">
        {report.range === 'period' && (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <FieldLabel>{ru ? 'С' : 'From'}</FieldLabel>
              <DateField value={from} onChange={setFrom} range={{ role: 'start', ...rangeLink }} />
            </View>
            <View className="flex-1">
              <FieldLabel>{ru ? 'По' : 'To'}</FieldLabel>
              <DateField value={to} onChange={setTo} range={{ role: 'end', ...rangeLink }} />
            </View>
          </View>
        )}

        <View>
          <FieldLabel>{ru ? 'Тип отчёта' : 'Report type'}</FieldLabel>
          <SelectField
            variant="form"
            value={report.code}
            options={meta.reports.map((r) => ({ value: r.code, label: L.reportName(r.code) }))}
            onChange={setCode}
          />
        </View>

        {templateFilter && (
          <View>
            <FieldLabel>{L.filterName('template')}</FieldLabel>
            <SelectField
              variant="form"
              value={String(filters.template ?? '')}
              options={(templateFilter.choices ?? []).map((c) => ({ value: c, label: L.optionName(c) }))}
              onChange={(v) => setFilter('template', v)}
            />
          </View>
        )}

        {fieldFilters.map((f) => {
          if (f.type === 'month') {
            return (
              <View key={f.key}>
                <FieldLabel>{L.filterName('month')}</FieldLabel>
                <SelectField
                  variant="form"
                  value={String(filters[f.key] ?? '')}
                  options={Array.from({ length: 12 }, (_, i) => {
                    const v = String(i + 1).padStart(2, '0');
                    return { value: v, label: v };
                  })}
                  onChange={(v) => setFilter(f.key, v)}
                />
              </View>
            );
          }
          if (f.type === 'year') {
            return (
              <View key={f.key}>
                <FieldLabel>{L.filterName(f.key)}</FieldLabel>
                <TextInput
                  value={String(filters[f.key] ?? '')}
                  onChangeText={(v) => setFilter(f.key, v.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  className="bg-white border border-border rounded-xl px-3.5 py-3 text-xs font-jost text-text-primary"
                />
              </View>
            );
          }
          if (f.type === 'date') {
            return (
              <View key={f.key}>
                <FieldLabel>{L.filterName(f.key)}</FieldLabel>
                <DateField value={String(filters[f.key] ?? '')} onChange={(v) => setFilter(f.key, v)} />
              </View>
            );
          }
          if (f.type === 'select') {
            return (
              <View key={f.key}>
                <FieldLabel>{L.filterName(f.key)}</FieldLabel>
                <SelectField
                  variant="form"
                  value={String(filters[f.key] ?? '')}
                  options={(f.choices ?? []).map((c) => ({ value: c, label: L.optionName(c) }))}
                  onChange={(v) => setFilter(f.key, v)}
                />
              </View>
            );
          }
          if (f.type === 'entity') {
            const opts = meta.options?.[f.source ?? ''] ?? [];
            return (
              <View key={f.key}>
                <FieldLabel>{L.filterName(f.key)}</FieldLabel>
                <SelectField
                  variant="form"
                  value={String(filters[f.key] ?? '')}
                  options={[{ value: '', label: L.text('all') || (ru ? 'Все' : 'All') }, ...opts.map((o) => ({ value: String(o.value), label: String(o.label) }))]}
                  onChange={(v) => setFilter(f.key, v)}
                />
              </View>
            );
          }
          return null;
        })}

        {checkboxFilters.map((f) => (
          <View key={f.key} className="pt-1">
            <Checkbox checked={!!filters[f.key]} label={L.filterName(f.key)} onToggle={() => setFilter(f.key, !filters[f.key])} />
          </View>
        ))}
      </View>

      {/* Card 2: columns */}
      <View className="bg-white rounded-2xl border border-border overflow-hidden">
        <Pressable onPress={() => setColumnsOpen((v) => !v)} className="p-4 flex-row items-center justify-between active:bg-background">
          <Text className="text-xs font-jost-medium text-text-primary">
            {ru ? 'Столбцы отчёта' : 'Report columns'} · {columns.length}
          </Text>
          <View style={{ transform: [{ rotate: columnsOpen ? '180deg' : '0deg' }] }}>
            <ChevronDown size={16} color="#8A8177" />
          </View>
        </Pressable>
        {columnsOpen && (
          <View className="border-t border-border/50 p-4 gap-4">
            <View className="flex-row items-center justify-between">
              <Pressable hitSlop={6} onPress={() => setColumns(report.columns)}>
                <Text className="text-xs font-jost-medium text-primary">{L.text('selectAll') || (ru ? 'Выбрать все' : 'Select all')}</Text>
              </Pressable>
              <Pressable hitSlop={6} onPress={() => setColumns([])}>
                <Text className="text-xs font-jost-medium text-primary">{L.text('clear') || (ru ? 'Снять' : 'Clear')}</Text>
              </Pressable>
            </View>
            <View className="flex-row flex-wrap" style={{ rowGap: 16 }}>
              {report.columns.map((c) => (
                <View key={c} style={{ width: '50%' }} className="pr-2">
                  <Checkbox
                    checked={columns.includes(c)}
                    label={L.columnName(c)}
                    onToggle={() => setColumns((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Sorting + generate */}
      <View className="gap-3.5">
        <View>
          <FieldLabel>{ru ? 'Поле сортировки' : 'Sort field'}</FieldLabel>
          <SelectField
            variant="form"
            value={sortOptions.some((o) => o.value === sort) ? sort : sortOptions[0]?.value ?? ''}
            options={sortOptions}
            onChange={setSort}
          />
        </View>
        <View>
          <FieldLabel>{ru ? 'Тип сортировки' : 'Sort order'}</FieldLabel>
          <SelectField
            variant="form"
            value={dir}
            options={[
              { value: 'asc', label: ru ? 'По возрастанию' : 'Ascending' },
              { value: 'desc', label: ru ? 'По убыванию' : 'Descending' },
            ]}
            onChange={(v) => setDir(v === 'desc' ? 'desc' : 'asc')}
          />
        </View>

        {!!runError && <Text className="text-xs font-jost text-error">{runError}</Text>}

        <Pressable
          disabled={running}
          onPress={generate}
          className="mt-2 bg-primary rounded-2xl py-3.5 items-center active:bg-primary-hover"
          style={{ opacity: running ? 0.7 : 1 }}
        >
          {running ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-sm font-jost-medium text-white">{ru ? 'Сформировать отчёт' : 'Generate report'}</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ReportResultView({
  lang,
  labels: L,
  result,
  templateLabel,
  onBack,
}: {
  lang: Lang;
  labels: ReturnType<typeof useLabels>;
  result: ReportResult;
  templateLabel: string;
  onBack: () => void;
}) {
  const ru = lang === 'RU';
  const isTotal = (row: Json) => Object.values(row).includes('@total');

  // Column widths from the longest text in each column, so the table scrolls sideways
  // instead of wrapping.
  const widths = useMemo(
    () =>
      result.columns.map((c) => {
        const texts = [L.columnName(c), ...result.rows.map((r) => L.formatValue(c, r[c] ?? ''))];
        const longest = Math.max(...texts.map((s) => s.length));
        return Math.min(Math.max(longest * 7 + 28, 72), 260);
      }),
    [result, L]
  );

  const cellColor = (column: string) => (column === 'occupancy' ? 'text-success' : column === 'revenue' ? 'text-primary' : 'text-text-primary');
  const [exporting, setExporting] = useState<'' | 'csv' | 'pdf'>('');

  // As on the web: the table as shown (column titles, formatted values, the total row).
  const table = () => ({
    head: result.columns.map((c) => L.columnName(c)),
    body: result.rows.map((row) => result.columns.map((c) => String(L.formatValue(c, row[c] ?? '')))),
  });
  const fileBase = `${result.code}-${result.from}-${result.to}`;

  const share = async (uri: string, mimeType: string, UTI: string) => {
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType, UTI, dialogTitle: L.reportName(result.code) });
    else Alert.alert(ru ? 'Файл сохранён' : 'File saved', uri);
  };

  const exportFile = async (kind: 'csv' | 'pdf') => {
    if (exporting) return;
    if (!result.rows.length) return Alert.alert(ru ? 'В отчёте нет строк' : 'The report has no rows');
    setExporting(kind);
    try {
      const { head, body } = table();
      if (kind === 'csv') {
        // Same file as the web's «Скачать»: UTF-8 with BOM so Excel reads Cyrillic.
        const csv = '\uFEFF' + [head, ...body].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
        const file = new File(Paths.cache, `${fileBase}.csv`);
        if (file.exists) file.delete();
        file.create();
        file.write(csv);
        await share(file.uri, 'text/csv', 'public.comma-separated-values-text');
      } else {
        const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const html = `<html><head><meta charset="utf-8"/><style>
          body{font-family:-apple-system,Roboto,Arial,sans-serif;color:#241E1A;padding:24px}
          h1{font-size:18px;margin:0 0 4px} p{font-size:11px;color:#8A8177;margin:0 0 14px}
          table{border-collapse:collapse;width:100%;font-size:10px} th,td{border:1px solid #E5E2DD;padding:5px 7px;text-align:left}
          th{background:#FAF7F3;color:#8A8177;font-weight:600} tr.total td{font-weight:700;background:#FAF7F3}
        </style></head><body>
          <h1>${esc(L.reportName(result.code))}</h1>
          <p>${ru ? 'Период' : 'Period'}: ${isoToDots(result.from)} – ${isoToDots(result.to)}${templateLabel ? ` · ${esc(templateLabel)}` : ''}</p>
          <table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
          ${body.map((r, i) => `<tr${isTotal(result.rows[i]) ? ' class="total"' : ''}>${r.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}
          </tbody></table></body></html>`;
        const { uri } = await Print.printToFileAsync({ html });
        // expo-print names the file with a random UUID: give it the same name as the CSV.
        const pdf = new File(Paths.cache, `${fileBase}.pdf`);
        if (pdf.exists) pdf.delete();
        new File(uri).move(pdf);
        await share(pdf.uri, 'application/pdf', 'com.adobe.pdf');
      }
    } catch (error) {
      Alert.alert(ru ? 'Не удалось выгрузить отчёт' : 'Could not export the report', error instanceof Error ? error.message : undefined);
    } finally {
      setExporting('');
    }
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-5 pb-6 gap-4">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={onBack} className="flex-row items-center gap-1.5 active:opacity-60">
          <ChevronLeft size={16} color="#8A8177" />
          <Text className="text-xs font-jost text-text-secondary">{ru ? 'Параметры отчёта' : 'Report parameters'}</Text>
        </Pressable>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => exportFile('csv')} disabled={!!exporting} className="px-2.5 py-1 rounded-lg bg-white border border-border flex-row items-center gap-1 active:bg-background">
            {exporting === 'csv' ? <ActivityIndicator size="small" color="#C2410C" /> : <Download size={14} color="#C2410C" />}
            <Text className="text-[11px] font-jost text-text-primary">Excel</Text>
          </Pressable>
          <Pressable onPress={() => exportFile('pdf')} disabled={!!exporting} className="px-2.5 py-1 rounded-lg bg-white border border-border flex-row items-center gap-1 active:bg-background">
            {exporting === 'pdf' ? <ActivityIndicator size="small" color="#C2410C" /> : <FileText size={14} color="#C2410C" />}
            <Text className="text-[11px] font-jost text-text-primary">PDF</Text>
          </Pressable>
        </View>
      </View>

      <View className="gap-1">
        <Text className="text-lg font-spectral text-text-primary">{L.reportName(result.code)}</Text>
        <Text className="text-xs font-jost text-text-secondary">
          {ru ? 'Период' : 'Period'}: {isoToDots(result.from)} – {isoToDots(result.to)}
          {templateLabel ? ` · ${ru ? 'Шаблон' : 'Template'}: ${templateLabel}` : ''}
        </Text>
      </View>

      {result.rows.length === 0 ? (
        <View className="p-8 bg-white rounded-2xl border border-border">
          <Text className="text-xs font-jost text-text-secondary text-center">{L.text('empty') || (ru ? 'За эти условия строк нет' : 'No rows')}</Text>
        </View>
      ) : (
        <View className="bg-white rounded-2xl border border-border overflow-hidden">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View className="flex-row bg-background border-b border-border">
                {result.columns.map((c, i) => (
                  <Text key={c} style={{ width: widths[i] }} className="px-3.5 py-3 text-[11px] font-jost-medium text-text-secondary">
                    {L.columnName(c)}
                  </Text>
                ))}
              </View>
              {result.rows.map((row, ri) => {
                const total = isTotal(row);
                return (
                  <View
                    key={ri}
                    className={`flex-row ${total ? 'bg-background border-t-2 border-border' : ri > 0 ? 'border-t border-border/60' : ''}`}
                  >
                    {result.columns.map((c, i) => (
                      <Text
                        key={c}
                        style={{ width: widths[i] }}
                        className={`px-3.5 py-3 text-xs ${total || c === 'roomType' || c === 'occupancy' || c === 'revenue' ? 'font-jost-medium' : 'font-jost'} ${cellColor(c)}`}
                      >
                        {L.formatValue(c, row[c] ?? '')}
                      </Text>
                    ))}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      <Pressable onPress={onBack} className="py-3.5 rounded-2xl bg-white border border-border items-center active:bg-background">
        <Text className="text-xs font-jost text-text-primary">{ru ? 'Изменить параметры отчёта' : 'Change report parameters'}</Text>
      </Pressable>
    </ScrollView>
  );
}
