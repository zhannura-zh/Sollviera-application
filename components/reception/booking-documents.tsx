import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, View } from 'react-native';
import { type EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Download, Edit3, Eye, FileText, Printer, RefreshCw, X } from 'lucide-react-native';
import {
  type DocumentIssue,
  issueDocuments,
  listDocumentIssues,
  renderDocument,
  updateDocumentIssue,
} from '@/lib/api-client';
import type { ReceptionBookingStatus } from '@/context/reception-store';

// Booking documents, same logic as the web PMS (bookings → «Документы»):
// - the registration card is issued automatically for new/confirmed bookings, the booking
//   confirmation for confirmed/in-house/departed ones;
// - the registration card can be edited (fields marked .reg-field and checkboxes);
// - the confirmation is always re-rendered from the current booking.

const REG_CARD = 'guest_registration_card';
const CONFIRMATION = 'booking_confirmation';
const REG_STATUSES: ReceptionBookingStatus[] = ['NEW', 'CONFIRMED'];
const CONFIRMATION_STATUSES: ReceptionBookingStatus[] = ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'];

const MONTHS_SHORT = ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];

interface DocRow extends DocumentIssue {
  live: boolean; // not issued yet: rendered from the booking on demand
}

const bodyOf = (html: string) => /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html;

// A4 page as in the web viewer; the viewport width makes the page fit the phone screen.
const pageHtml = (title: string, html: string) =>
  `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8" /><meta name="viewport" content="width=820" />` +
  `<title>${title}</title><style>@page{size:A4;margin:0}html,body{margin:0;background:#d4d4d4}` +
  `@media print{html,body{background:#fff}}</style></head><body>${bodyOf(html)}</body></html>`;

const ENABLE_EDITING = `
  document.querySelectorAll('.reg-field').forEach(function (el) { el.setAttribute('contenteditable', 'true'); });
  document.querySelectorAll('input[type="checkbox"]').forEach(function (el) { el.removeAttribute('disabled'); });
  true;
`;

// Same serialization as the web editor: fields locked again, checkbox state kept as attributes.
const COLLECT_HTML = `
  (function () {
    var live = Array.prototype.slice.call(document.querySelectorAll('input[type="checkbox"]'));
    var copy = document.body.cloneNode(true);
    copy.querySelectorAll('.reg-field').forEach(function (el) { el.removeAttribute('contenteditable'); });
    copy.querySelectorAll('input[type="checkbox"]').forEach(function (el, i) {
      if (live[i] && live[i].checked) el.setAttribute('checked', 'checked'); else el.removeAttribute('checked');
      el.setAttribute('disabled', 'disabled');
    });
    window.ReactNativeWebView.postMessage(copy.innerHTML);
  })();
  true;
`;

function formatIssued(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${hh}:${mm}`;
}

// System print / share sheets: closing them without printing or sharing rejects the promise,
// and the closing tap can fall through to the screen underneath. Cancelling is not an error,
// and taps right after a sheet closes are ignored (see recentlyClosedSheet).
let sheetClosedAt = 0;
export const recentlyClosedSheet = () => Date.now() - sheetClosedAt < 800;
async function systemSheet(run: () => Promise<unknown>) {
  try {
    await run();
  } catch {
    // dismissed without printing / sharing
  } finally {
    sheetClosedAt = Date.now();
  }
}

const byNewest = (a: DocumentIssue, b: DocumentIssue) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '');

export function BookingDocuments({ bookingId, status }: { bookingId: string; status: ReceptionBookingStatus }) {
  const insets = useSafeAreaInsets();
  const [issues, setIssues] = useState<DocumentIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [viewer, setViewer] = useState<{ row: DocRow; html: string; editing: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    (async () => {
      const found = new Map<string, DocumentIssue>();
      for (const doc of (await listDocumentIssues(bookingId)) ?? []) found.set(doc.id, doc);
      const has = (code: string) => [...found.values()].some((d) => d.code === code);
      const missing = [
        ...(REG_STATUSES.includes(status) && !has(REG_CARD) ? [REG_CARD] : []),
        ...(CONFIRMATION_STATUSES.includes(status) && !has(CONFIRMATION) ? [CONFIRMATION] : []),
      ];
      const issued = await Promise.all(missing.map((code) => issueDocuments({ code, bookingId }).catch(() => [] as DocumentIssue[])));
      for (const list of issued) for (const doc of list ?? []) found.set(doc.id, doc);
      if (!cancelled) setIssues([...found.values()].sort(byNewest));
    })()
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bookingId, status]);

  const regIssue = issues.find((d) => d.code === REG_CARD);
  const rows: DocRow[] = [
    regIssue
      ? { ...regIssue, title: 'Регистрационная карта гостя', live: false }
      : { id: `live:${bookingId}`, code: REG_CARD, title: 'Регистрационная карта гостя', html: '', bookingId, live: true },
    ...issues.filter((d) => d.code !== REG_CARD).map((d) => ({ ...d, live: false })),
  ];

  const titleOf = (row: DocRow) => row.title || (row.code === CONFIRMATION ? 'Подтверждение бронирования' : 'Документ');

  const htmlOf = useCallback(
    async (row: DocRow) =>
      row.live || !row.html || row.code === CONFIRMATION
        ? (await renderDocument({ code: row.code === CONFIRMATION ? CONFIRMATION : REG_CARD, bookingId })).html
        : row.html,
    [bookingId]
  );

  const withHtml = async (row: DocRow, run: (html: string) => Promise<void> | void) => {
    if (recentlyClosedSheet()) return;
    setBusyId(row.id);
    try {
      await run(await htmlOf(row));
    } catch (error) {
      Alert.alert('Не удалось открыть документ', error instanceof Error ? error.message : undefined);
    } finally {
      setBusyId('');
    }
  };

  const open = (row: DocRow, editing: boolean) => withHtml(row, (html) => setViewer({ row, html, editing }));

  const print = (row: DocRow) => withHtml(row, (html) => systemSheet(() => Print.printAsync({ html: pageHtml(titleOf(row), html) })));

  const download = (row: DocRow) =>
    withHtml(row, async (html) => {
      const { uri } = await Print.printToFileAsync({ html: pageHtml(titleOf(row), html) });
      if (await Sharing.isAvailableAsync()) {
        await systemSheet(() => Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: titleOf(row) }));
      } else {
        Alert.alert('PDF сохранён', uri);
      }
    });

  const save = async (html: string) => {
    if (!viewer) return;
    const { row } = viewer;
    const saved = row.live
      ? (await issueDocuments({ code: REG_CARD, bookingId, html }))[0]
      : await updateDocumentIssue(row.id, html);
    if (!saved) return;
    setIssues((prev) => [saved, ...prev.filter((d) => d.id !== saved.id && d.id !== row.id)]);
    setViewer({ row: { ...saved, title: titleOf(row), live: false }, html: saved.html, editing: false });
  };

  if (loading) {
    return (
      <View className="bg-white rounded-[18px] border border-border p-6 items-center">
        <ActivityIndicator color="#C2410C" />
      </View>
    );
  }

  return (
    <>
      {failed && <Text className="text-xs font-jost text-error-text">Не удалось загрузить документы</Text>}
      {rows.map((row) => {
        const isReg = row.code === REG_CARD;
        const issuedAt = formatIssued(row.createdAt);
        const subtitle = [issuedAt ?? 'Из брони', row.issuedByName].filter(Boolean).join(' · ');
        const actions = [
          { icon: Eye, label: 'Просмотр', onPress: () => open(row, false) },
          ...(isReg ? [{ icon: Edit3, label: 'Изменить', onPress: () => open(row, true) }] : []),
          { icon: Printer, label: 'Печать', onPress: () => print(row) },
          { icon: Download, label: 'Скачать', onPress: () => download(row) },
        ];
        return (
          <View key={row.id} className="bg-white rounded-[18px] border border-border p-4 gap-3">
            <Pressable onPress={() => open(row, false)} className="flex-row items-start gap-3 active:opacity-70">
              <View className="mt-0.5">
                <FileText size={20} color="#8A8177" strokeWidth={1.6} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-jost-medium text-text-primary">{titleOf(row)}</Text>
                <Text className="text-[11px] font-jost text-text-secondary mt-0.5">{subtitle}</Text>
              </View>
              {busyId === row.id && <ActivityIndicator size="small" color="#C2410C" />}
            </Pressable>
            <View className="pt-2 border-t border-[#F0ECE6] flex-row gap-1">
              {actions.map(({ icon: Icon, label, onPress }) => (
                <Pressable
                  key={label}
                  disabled={!!busyId}
                  onPress={onPress}
                  className="flex-1 items-center gap-1 py-1 active:opacity-60"
                >
                  <Icon size={16} color="#6E665E" strokeWidth={1.7} />
                  <Text className="text-[10px] font-jost text-[#6E665E]">{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}

      {viewer && (
        <DocumentViewer
          insets={insets}
          title={titleOf(viewer.row)}
          html={viewer.html}
          editing={viewer.editing}
          canEdit={viewer.row.code === REG_CARD}
          onClose={() => {
            sheetClosedAt = Date.now();
            setViewer(null);
          }}
          onEdit={() => setViewer({ ...viewer, editing: true })}
          onPrint={() => systemSheet(() => Print.printAsync({ html: pageHtml(titleOf(viewer.row), viewer.html) }))}
          onRefresh={async () => {
            const html = (await renderDocument({ code: REG_CARD, bookingId })).html;
            setViewer({ ...viewer, html, editing: true });
          }}
          onSave={save}
        />
      )}
    </>
  );
}

interface ViewerProps {
  insets: EdgeInsets;
  title: string;
  html: string;
  editing: boolean;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onRefresh: () => Promise<void>;
  onSave: (html: string) => Promise<void>;
}

function DocumentViewer({ insets, title, html, editing, canEdit, onClose, onEdit, onPrint, onRefresh, onSave }: ViewerProps) {
  const webRef = useRef<WebView>(null);
  const [saving, setSaving] = useState(false);

  const onMessage = async (event: WebViewMessageEvent) => {
    try {
      await onSave(event.nativeEvent.data);
    } catch (error) {
      Alert.alert('Не удалось сохранить', error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const refresh = async () => {
    setSaving(true);
    try {
      await onRefresh();
    } catch (error) {
      Alert.alert('Не удалось обновить', error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View className="px-4 py-3 flex-row items-center justify-between gap-3 border-b border-border">
          <Text className="flex-1 text-base font-spectral text-text-primary" numberOfLines={1}>
            {title}
          </Text>
          <Pressable onPress={onClose} hitSlop={10} className="active:opacity-60">
            <X size={20} color="#241E1A" />
          </Pressable>
        </View>

        <WebView
          ref={webRef}
          // Re-mount when switching modes so the editing script runs on a fresh page.
          key={`${editing ? 'edit' : 'view'}-${html.length}`}
          originWhitelist={['*']}
          source={{ html: pageHtml(title, html) }}
          injectedJavaScript={editing ? ENABLE_EDITING : undefined}
          onMessage={onMessage}
          scalesPageToFit
          setBuiltInZoomControls
          setDisplayZoomControls={false}
          style={{ flex: 1, backgroundColor: '#d4d4d4' }}
        />

        <View className="px-4 py-3 flex-row gap-2 border-t border-border bg-white">
          {editing ? (
            <>
              <Pressable
                onPress={refresh}
                disabled={saving}
                className="flex-1 h-11 rounded-[12px] border border-border flex-row items-center justify-center gap-2 active:opacity-70"
              >
                <RefreshCw size={15} color="#241E1A" />
                <Text className="text-sm font-jost-medium text-text-primary">Из брони</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSaving(true);
                  webRef.current?.injectJavaScript(COLLECT_HTML);
                }}
                disabled={saving}
                className="flex-1 h-11 rounded-[12px] bg-primary flex-row items-center justify-center active:bg-primary-hover"
              >
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-sm font-jost-semibold text-white">Сохранить</Text>}
              </Pressable>
            </>
          ) : (
            <>
              {canEdit && (
                <Pressable
                  onPress={onEdit}
                  className="flex-1 h-11 rounded-[12px] border border-border flex-row items-center justify-center gap-2 active:opacity-70"
                >
                  <Edit3 size={15} color="#241E1A" />
                  <Text className="text-sm font-jost-medium text-text-primary">Изменить</Text>
                </Pressable>
              )}
              <Pressable
                onPress={onPrint}
                className="flex-1 h-11 rounded-[12px] bg-primary flex-row items-center justify-center gap-2 active:bg-primary-hover"
              >
                <Printer size={15} color="#FFFFFF" />
                <Text className="text-sm font-jost-semibold text-white">Печать</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
