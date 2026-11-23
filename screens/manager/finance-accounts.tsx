import React, { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { archiveFinanceAccount, createRecord, updateRecord } from '@/lib/api-client';
import { SelectField } from '@/components/ui/select-field';
import { money, num } from '@/components/manager/manager-utils';
import { pluralRu, type Lang } from '@/components/reception/booking-utils';
import { accountTypeLabel, type FinanceAccount } from '@/components/manager/finance-data';
import { AddCard, Chevron, comingSoon, FieldLabel, FormButtons, FormInput, InfoRow, showError } from '@/components/manager/finance-ui';
import { useManagerToast } from '@/components/manager/toast';

// The design's account types, in its order.
const NEW_ACCOUNT_TYPES = ['bank', 'cash', 'card_terminal', 'online'] as const;

export function FinanceAccountsView({
  lang,
  accounts,
  refreshing,
  onRefresh,
  reload,
}: {
  lang: Lang;
  accounts: FinanceAccount[];
  refreshing: boolean;
  onRefresh: () => void;
  reload: () => Promise<void>;
}) {
  const ru = lang === 'RU';
  const t = (r: string, e: string) => (ru ? r : e);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('bank');
  const [balance, setBalance] = useState('');
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const toast = useManagerToast();

  const active = accounts.filter((a) => !a.archived);
  const archived = accounts.filter((a) => a.archived);
  const total = active.reduce((s, a) => s + a.balance, 0);

  const create = async () => {
    if (!name.trim()) {
      toast(t('Введите название счёта', 'Enter the account name'));
      return;
    }
    setBusy(true);
    try {
      const created = name.trim();
      await createRecord('finance_account', { name: created, type, opening_balance: num(balance), comment: '' });
      toast(ru ? `Счёт «${created}» успешно добавлен` : `Account “${created}” added`);
      setName('');
      setBalance('');
      setAddOpen(false);
      await reload();
    } catch (e) {
      showError(lang, e);
    } finally {
      setBusy(false);
    }
  };

  const archive = (a: FinanceAccount) =>
    Alert.alert(t('В архив', 'Archive'), ru ? `Перенести счёт «${a.name}» в архив?` : `Move “${a.name}” to the archive?`, [
      { text: t('Отмена', 'Cancel'), style: 'cancel' },
      {
        text: t('В архив', 'Archive'),
        style: 'destructive',
        onPress: async () => {
          try {
            await archiveFinanceAccount(a.id);
            toast(ru ? `Счёт «${a.name}» перенесён в архив` : `Account “${a.name}” moved to the archive`);
            setExpanded(null);
            await reload();
          } catch (e) {
            showError(lang, e);
          }
        },
      },
    ]);

  const restore = async (a: FinanceAccount) => {
    try {
      await updateRecord('finance_account', a.id, { archived: false });
      toast(ru ? `Счёт «${a.name}» восстановлен из архива` : `Account “${a.name}” restored from the archive`);
      await reload();
    } catch (e) {
      showError(lang, e);
    }
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-5 pb-6 gap-4"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="bg-[#F1E9DE] border border-[#E3DACD] rounded-2xl p-5">
        <Text className="text-xs font-jost text-text-secondary">{t('На всех активных счетах', 'Across all active accounts')}</Text>
        <Text className="text-3xl font-spectral text-text-primary mt-2" numberOfLines={1} adjustsFontSizeToFit>
          {money(total)}
        </Text>
      </View>

      <AddCard title={t('Добавить счёт', 'Add account')} open={addOpen} onToggle={() => setAddOpen((v) => !v)}>
        <View>
          <FieldLabel>{t('Название счёта', 'Account name')}</FieldLabel>
          <FormInput value={name} onChangeText={setName} placeholder={t('Например: Kaspi Pay QR или Форте Банк', 'E.g. Kaspi Pay QR')} />
        </View>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <FieldLabel>{t('Тип счёта', 'Account type')}</FieldLabel>
            <SelectField
              variant="form"
              value={type}
              onChange={setType}
              options={NEW_ACCOUNT_TYPES.map((v) => ({ value: v, label: accountTypeLabel(v, lang) }))}
            />
          </View>
          <View className="flex-1">
            <FieldLabel>{t('Баланс (₸)', 'Balance (₸)')}</FieldLabel>
            <FormInput value={balance} onChangeText={setBalance} placeholder="0" keyboardType="numeric" />
          </View>
        </View>
        <FormButtons lang={lang} busy={busy} submitLabel={t('Создать счёт', 'Create account')} onSubmit={create} onCancel={() => setAddOpen(false)} />
      </AddCard>

      <View className="gap-3 pt-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-jost-medium text-text-primary">{t('Активные счета', 'Active accounts')}</Text>
          <Text className="text-[11px] font-jost text-text-secondary">
            {ru ? `${active.length} ${pluralRu(active.length, 'счёт', 'счёта', 'счетов')}` : `${active.length} accounts`}
          </Text>
        </View>

        {active.map((a) => {
          const open = expanded === a.id;
          return (
            <View key={a.id} className="bg-white rounded-2xl border border-border p-[18px] gap-2.5">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-sm font-jost-medium text-text-primary">{a.name}</Text>
                <View className="bg-[#EBF4EE] px-2 py-0.5 rounded-md">
                  <Text className="text-[10px] font-jost-medium text-[#3D7C52]">{t('Активен', 'Active')}</Text>
                </View>
              </View>
              <Text className="text-xs font-jost text-text-secondary">{accountTypeLabel(a.type, lang)}</Text>
              <Text className="text-3xl font-spectral text-text-primary my-2" numberOfLines={1} adjustsFontSizeToFit>
                {money(a.balance)}
              </Text>

              <View className="rounded-xl border border-border overflow-hidden">
                <Pressable onPress={() => setExpanded(open ? null : a.id)} className="p-3 flex-row items-center justify-between bg-white active:bg-background">
                  <Text className="text-xs font-jost text-text-primary">{t('Реквизиты и управление', 'Details & management')}</Text>
                  <Chevron open={open} />
                </Pressable>
                {open && (
                  <View className="p-3.5 bg-background/70 border-t border-border/60 gap-2.5">
                    {!!a.comment && <InfoRow label={t('Примечание:', 'Note:')} value={a.comment} valueClass="text-text-primary font-jost" />}
                    {a.commission !== null && a.commission > 0 && (
                      <InfoRow label={t('Комиссия:', 'Commission:')} value={`${a.commission}%`} valueClass="text-text-primary font-jost" />
                    )}
                    <View className={`flex-row gap-2 ${a.comment || (a.commission ?? 0) > 0 ? 'pt-2 border-t border-border/50' : ''}`}>
                      <Pressable onPress={() => comingSoon(lang)} className="flex-1 bg-white border border-border py-2 rounded-lg items-center active:bg-background">
                        <Text className="text-xs font-jost-medium text-text-primary">{t('+ Пополнить', '+ Top up')}</Text>
                      </Pressable>
                      <Pressable onPress={() => archive(a)} className="flex-1 bg-white border border-border py-2 rounded-lg items-center active:bg-[#FBECEA]">
                        <Text className="text-xs font-jost text-[#B3261E]">{t('В архив', 'Archive')}</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View className="bg-white rounded-2xl border border-border overflow-hidden">
        <Pressable onPress={() => setArchiveOpen((v) => !v)} className="p-4 flex-row items-center justify-between active:bg-background">
          <Text className="text-xs font-jost-medium text-text-primary">{t('Архив счетов', 'Archived accounts')}</Text>
          <Chevron open={archiveOpen} />
        </Pressable>
        {archiveOpen && (
          <View className="p-4 pt-3 border-t border-border/60 gap-2">
            {archived.length === 0 ? (
              <Text className="text-xs font-jost text-text-secondary">{t('Архивных счетов пока нет.', 'No archived accounts yet.')}</Text>
            ) : (
              archived.map((a) => (
                <View key={a.id} className="flex-row items-center justify-between p-2.5 bg-background rounded-xl border border-border gap-2">
                  <View className="flex-1">
                    <Text className="text-xs font-jost-medium text-text-primary">{a.name}</Text>
                    <Text className="text-[10px] font-jost text-text-secondary">
                      {accountTypeLabel(a.type, lang)} · {money(a.balance)}
                    </Text>
                  </View>
                  <Pressable onPress={() => restore(a)} hitSlop={6}>
                    <Text className="text-xs font-jost text-primary">{t('Восстановить', 'Restore')}</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
