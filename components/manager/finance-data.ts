import { num } from '@/components/manager/manager-utils';
import type { Lang } from '@/components/reception/booking-utils';

// Finance data the way the web PMS builds its Finance pages: one ledger merged from
// finance_transaction records, operational expenses, paid service requests, paid payroll and
// warehouse purchases (see the web's Finance → Transactions).

type Json = Record<string, any>;

export const list = (v: unknown): Json[] =>
  Array.isArray(v) ? v : v && typeof v === 'object' && Array.isArray((v as Json).data) ? (v as Json).data : [];

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

export const ACCOUNT_TYPES = ['bank', 'cash', 'card_terminal', 'online', 'collection'] as const;

const ACCOUNT_TYPE_LABEL: Record<string, [string, string]> = {
  cash: ['Наличные', 'Cash'],
  bank: ['Расчётный счёт', 'Bank account'],
  card_terminal: ['Терминал', 'Card terminal'],
  online: ['Онлайн-оплата', 'Online payment'],
  collection: ['Инкассация', 'Collection'],
};
const PAYMENT_METHOD_LABEL: Record<string, [string, string]> = {
  cash: ['Наличные', 'Cash'],
  card: ['Банковская карта', 'Bank card'],
  transfer: ['Безналичный перевод', 'Bank transfer'],
  online: ['Онлайн-оплата', 'Online payment'],
};
const EXPENSE_CATEGORY_LABEL: Record<string, [string, string]> = {
  minibar: ['Минибар', 'Minibar'],
  linens: ['Постельное бельё', 'Linens'],
  cleaning: ['Моющие средства', 'Cleaning supplies'],
  other: ['Прочее', 'Other'],
};
const SOURCE_LABEL: Record<string, [string, string]> = {
  booking: ['Бронирование', 'Booking'],
  cash_desk: ['Касса', 'Cash desk'],
  checkout_penalty: ['Штраф', 'Penalty'],
  service_request: ['Услуги', 'Services'],
  deposit_refund: ['Возврат депозита', 'Deposit refund'],
  booking_refund: ['Возврат средств', 'Refund'],
  refund: ['Возврат', 'Refund'],
  payroll: ['Зарплата', 'Payroll'],
  account_transfer: ['Перевод', 'Transfer'],
  cash_float: ['Внесение / изъятие', 'Cash in / out'],
};
const DESCRIPTION_PATTERNS: [RegExp, [string, string]][] = [
  [/^Booking\s+(.+)$/, ['Бронирование {d}', 'Booking {d}']],
  [/^Checkout payment · (.+)$/, ['Оплата при выезде · {d}', 'Payment at checkout · {d}']],
  [/^Penalty · (.+)$/, ['Штраф · {d}', 'Penalty · {d}']],
  [/^Deposit refund · (.+)$/, ['Возврат депозита · {d}', 'Deposit refund · {d}']],
  [/^Refund · (.+)$/, ['Возврат средств · {d}', 'Refund · {d}']],
  [/^Salary · (.+)$/, ['Выплата зарплаты · {d}', 'Salary payment · {d}']],
];
const PAYMENT_TO_ACCOUNT_TYPE: Record<string, string> = { cash: 'cash', card_terminal: 'card', bank: 'transfer', online: 'online' };

const pick = (pair: [string, string] | undefined, lang: Lang, fallback = '') => (pair ? pair[lang === 'RU' ? 0 : 1] : fallback);

export const accountTypeLabel = (type: string, lang: Lang) => pick(ACCOUNT_TYPE_LABEL[type], lang, type);

export interface FinanceAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  openingBalance: number;
  commission: number | null;
  comment: string;
  archived: boolean;
}

export function mapAccount(a: Json): FinanceAccount {
  return {
    id: str(a.id),
    name: str(a.name),
    type: str(a.type),
    balance: num(a.balance),
    openingBalance: num(a.opening_balance),
    commission: a.commission === null || a.commission === undefined || a.commission === '' ? null : num(a.commission),
    comment: str(a.comment),
    archived: !!a.archived,
  };
}

export type LedgerKind = 'income' | 'expense' | 'transfer';

export interface LedgerEntry {
  id: string;
  kind: LedgerKind;
  accountId: string;
  accountName: string;
  sourceLabel: string;
  description: string;
  counterparty: string;
  paymentLabel: string;
  amount: number;
  occurredAt: string;
  // Deposit refunds and transfers don't change profit: hidden unless "show non-profit" is on.
  excludeFromTotals?: boolean;
  isDepositRefund?: boolean;
  fiscalReceipt?: boolean;
  search: string;
}

export interface LedgerInput {
  accounts: Json[];
  transactions: Json[];
  expenses: Json[];
  requests: Json[];
  payroll: Json[];
  movements: Json[];
  items: Json[];
  services: Json[];
}

export function buildLedger(input: LedgerInput, lang: Lang): LedgerEntry[] {
  const none = '—';
  const accountType = new Map<string, string>(input.accounts.map((a) => [str(a.id), str(a.type)]));
  const accountName = new Map<string, string>(input.accounts.map((a) => [str(a.id), str(a.name)]));
  const serviceNames = new Map<string, string>();
  for (const s of input.services) {
    if (s.id) serviceNames.set(str(s.id), str(s.name));
    if (s.code) serviceNames.set(str(s.code).toLowerCase(), str(s.name));
  }
  const itemsById = new Map<string, Json>(input.items.map((i) => [str(i.id), i]));

  const nameOf = (id: unknown): string => (id ? accountName.get(str(id)) : undefined) || none;
  const serviceName = (type: unknown, catalogId?: unknown) => {
    const byId = catalogId ? serviceNames.get(str(catalogId)) : undefined;
    if (byId) return byId;
    const t = str(type).trim();
    return serviceNames.get(t.toLowerCase()) ?? t;
  };
  const requestTitle = (r: Json) => {
    const n = serviceName(r.type, r.catalog_item_id);
    return n && n !== r.type ? n : str(r.comment).trim() || n || none;
  };
  const describe = (description: unknown, source: unknown) => {
    const text = str(description).trim();
    if (!text) return none;
    if (text === 'Cash desk') return pick(SOURCE_LABEL.cash_desk, lang);
    if (text === 'Service request') return pick(SOURCE_LABEL.service_request, lang);
    for (const [re, pair] of DESCRIPTION_PATTERNS) {
      const m = text.match(re);
      if (m) return pick(pair, lang).replace('{d}', m[1]);
    }
    return source === 'service_request' ? serviceName(text) : text;
  };
  const accountTypeName = (id: unknown) => {
    const type = id ? accountType.get(str(id)) : undefined;
    return type ? accountTypeLabel(type, lang) : none;
  };
  const paymentLabel = (method: unknown, accountId: unknown, source: unknown) => {
    if (source !== 'cash_desk') {
      const byAccount = accountTypeName(accountId);
      if (byAccount !== none) return byAccount;
    }
    const m = str(method).trim();
    if (PAYMENT_METHOD_LABEL[m]) return pick(PAYMENT_METHOD_LABEL[m], lang);
    if (ACCOUNT_TYPE_LABEL[m]) return pick(ACCOUNT_TYPE_LABEL[m], lang);
    const t = accountId ? PAYMENT_TO_ACCOUNT_TYPE[accountType.get(str(accountId)) ?? ''] : undefined;
    return t ? pick(PAYMENT_METHOD_LABEL[t], lang) : none;
  };
  const isTransfer = (source: unknown, type: unknown) => source === 'account_transfer' || source === 'cash_float' || type === 'transfer';
  const sourceLabel = (source: unknown, override?: unknown) => (override ? str(override) : pick(SOURCE_LABEL[str(source)], lang, str(source) || none));
  const debit = lang === 'RU' ? 'Списание' : 'Debit';
  const searchOf = (parts: unknown[]) => parts.filter(Boolean).join(' ').toLowerCase();

  const tx = input.transactions;
  const income: LedgerEntry[] = tx
    .filter((t) => t.type !== 'expense' && !isTransfer(t.source, t.type))
    .map((t) => ({
      id: str(t.id),
      kind: 'income',
      accountId: str(t.account_id),
      accountName: nameOf(t.account_id),
      sourceLabel: sourceLabel(t.source),
      description: describe(t.description, t.source),
      counterparty: str(t.guest_name) || none,
      paymentLabel: paymentLabel(t.payment_method, t.account_id, t.source),
      amount: num(t.amount),
      occurredAt: str(t.created_at),
      fiscalReceipt: !!t.fiscal_receipt_id,
      search: searchOf([nameOf(t.account_id), sourceLabel(t.source), describe(t.description, t.source), t.guest_name, t.amount]),
    }));

  const expenses: LedgerEntry[] = tx
    .filter((t) => t.type === 'expense' && !isTransfer(t.source, t.type))
    .map((t) => {
      const refund = t.source === 'deposit_refund' || t.source === 'booking_refund' || !!t.refund_of;
      return {
        id: str(t.id),
        kind: 'expense',
        accountId: str(t.account_id),
        accountName: nameOf(t.account_id),
        sourceLabel: sourceLabel(t.source, t.expense_category_name),
        description: describe(t.description, t.source),
        counterparty: str(t.guest_name ?? t.employee_name) || none,
        paymentLabel: paymentLabel(t.payment_method, t.account_id, t.source),
        amount: num(t.amount),
        occurredAt: str(t.created_at),
        excludeFromTotals: refund,
        isDepositRefund: refund,
        fiscalReceipt: !!t.fiscal_receipt_id,
        search: searchOf([nameOf(t.account_id), describe(t.description, t.source), t.guest_name, t.employee_name, t.amount]),
      };
    });

  const transfers: LedgerEntry[] = tx
    .filter((t) => isTransfer(t.source, t.type))
    .map((t) => ({
      id: str(t.id),
      kind: 'transfer',
      accountId: str(t.account_id),
      accountName: nameOf(t.account_id),
      sourceLabel: sourceLabel(t.source),
      description: describe(t.description, t.source),
      counterparty: str(t.guest_name) || none,
      paymentLabel: paymentLabel(t.payment_method, t.account_id, t.source),
      amount: num(t.amount),
      occurredAt: str(t.created_at),
      search: searchOf([nameOf(t.account_id), sourceLabel(t.source), describe(t.description, t.source), t.amount]),
    }));

  const commissions: LedgerEntry[] = tx
    .filter(
      (t) =>
        !isTransfer(t.source, t.type) &&
        t.type !== 'expense' &&
        (t.source === 'booking' || t.source === 'service_request' || t.source === 'checkout_penalty' || (t.source === 'cash_desk' && !!(t.booking_id || t.guest_id))) &&
        num(t.commission) > 0
    )
    .map((t) => ({
      id: `commission-${t.id}`,
      kind: 'expense',
      accountId: str(t.account_id),
      accountName: nameOf(t.account_id),
      sourceLabel: lang === 'RU' ? 'Комиссия счёта' : 'Account commission',
      description: describe(t.description, t.source),
      counterparty: str(t.guest_name) || none,
      paymentLabel: debit,
      amount: num(t.commission),
      occurredAt: str(t.created_at),
      search: searchOf([nameOf(t.account_id), describe(t.description, t.source), t.guest_name, t.commission]),
    }));

  const operational: LedgerEntry[] = input.expenses.map((e) => ({
    id: str(e.id),
    kind: 'expense',
    accountId: str(e.account_id),
    accountName: nameOf(e.account_id),
    sourceLabel: pick(EXPENSE_CATEGORY_LABEL[str(e.category)], lang, str(e.category) || none),
    description: str(e.description) || none,
    counterparty: str(e.supplier ?? e.property_name) || none,
    paymentLabel: debit,
    amount: num(e.amount),
    occurredAt: str(e.created_at),
    search: searchOf([nameOf(e.account_id), e.description, e.supplier, e.property_name, e.amount]),
  }));

  // Paid service requests that have no ledger transaction of their own.
  const serviceTx = tx.filter((t) => t.source === 'service_request');
  const linked = new Set(serviceTx.map((t) => str(t.service_request_id)).filter(Boolean));
  const services: LedgerEntry[] = input.requests
    .filter((r) => {
      if (r.payment_status !== 'paid' || r.status === 'cancelled' || !r.payment_account_id || r.paid_at_checkout) return false;
      if (linked.has(str(r.id))) return false;
      const paidAt = Date.parse(str(r.paid_at));
      return !(
        Number.isFinite(paidAt) &&
        serviceTx.some(
          (t) => !t.service_request_id && t.account_id === r.payment_account_id && num(t.amount) === num(r.amount) && Math.abs(Date.parse(str(t.created_at)) - paidAt) < 60_000
        )
      );
    })
    .map((r) => ({
      id: `service-${r.id}`,
      kind: 'income',
      accountId: str(r.payment_account_id),
      accountName: nameOf(r.payment_account_id),
      sourceLabel: pick(SOURCE_LABEL.service_request, lang),
      description: requestTitle(r),
      counterparty: str(r.guest_name) || none,
      paymentLabel: accountTypeName(r.payment_account_id),
      amount: num(r.amount),
      occurredAt: str(r.paid_at ?? r.created_at),
      search: searchOf([r.guest_name, r.room_number, requestTitle(r), r.comment]),
    }));

  const payrollIds = new Set(tx.map((t) => str(t.payroll_id)).filter(Boolean));
  const payroll: LedgerEntry[] = input.payroll
    .filter((p) => p.status === 'paid' && !payrollIds.has(str(p.id)))
    .map((p) => ({
      id: `payroll-${p.id}`,
      kind: 'expense',
      accountId: '',
      accountName: none,
      sourceLabel: lang === 'RU' ? 'Зарплата' : 'Payroll',
      description: lang === 'RU' ? 'К выплате' : 'Net pay',
      counterparty: str(p.employee?.name) || none,
      paymentLabel: debit,
      amount: num(p.net_salary),
      occurredAt: str(p.paid_at ?? p.created_at),
      search: searchOf([p.employee?.name, p.employee?.position, p.period]),
    }));

  const warehouse: LedgerEntry[] = input.movements
    .filter((m) => m.account_id)
    .map((m) => {
      const item = m.item ?? itemsById.get(str(m.item_id));
      return {
        id: `warehouse-${m.id}`,
        kind: 'expense' as const,
        accountId: str(m.account_id),
        accountName: nameOf(m.account_id),
        sourceLabel: lang === 'RU' ? 'Склад' : 'Warehouse',
        description: str(item?.name) || (lang === 'RU' ? 'Закупка на склад' : 'Warehouse purchase'),
        counterparty: str(m.supplier ?? m.performed_by) || none,
        paymentLabel: debit,
        amount: num(m.unit_cost) * num(m.quantity),
        occurredAt: str(m.created_at),
        search: searchOf([item?.name, m.supplier, m.performed_by]),
      };
    })
    .filter((e) => e.amount > 0);

  return [...income, ...expenses, ...commissions, ...operational, ...transfers, ...services, ...payroll, ...warehouse].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt)
  );
}

// ---------- payroll ----------

export interface WorkShift {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  date: string;
  start: string;
  end: string;
  hours: number;
  open: boolean;
  qr: boolean;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  hourlyRate: number;
}

export function mapEmployee(e: Json): Employee {
  return {
    id: str(e.id),
    name: str(e.fullName ?? e.name ?? e.email),
    position: str(e.position ?? e.roleCode ?? e.role),
    department: str(e.department),
    hourlyRate: num(e.hourly_rate ?? e.hourlyRate),
  };
}

export function mapShift(s: Json, employees: Map<string, Employee>): WorkShift {
  const emp = s.employee && typeof s.employee === 'object' ? s.employee : employees.get(str(s.employee_id));
  const open = s.status === 'open' || !s.end_time;
  return {
    id: str(s.id),
    employeeId: str(s.employee_id),
    employeeName: str(emp?.name) || '—',
    position: str(emp?.position),
    department: str(emp?.department),
    date: str(s.date).slice(0, 10),
    start: str(s.start_time).slice(0, 5),
    end: open ? '' : str(s.end_time).slice(0, 5),
    hours: open ? 0 : num(s.hours),
    open,
    qr: s.source === 'qr',
  };
}

export interface PayrollRow {
  id: string;
  period: string;
  status: string;
  net: number;
}

export const mapPayroll = (p: Json): PayrollRow => ({ id: str(p.id), period: str(p.period), status: str(p.status), net: num(p.net_salary) });
