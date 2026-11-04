import type { Language, StaffMember } from '@/types';

// Human label for an employee's role. The backend spreads it over three fields: roleCode
// (app role, e.g. "supervisor"), position (set from the app) and role (the account's
// system role — the only one a hotel admin has: HOTEL_ADMIN). Checked in that order.
export function staffRoleLabel(staff: Pick<StaffMember, 'roleCode' | 'position' | 'role'> | undefined, lang: Language): string {
  const ru = lang === 'RU';
  for (const raw of [staff?.roleCode, staff?.position, staff?.role]) {
    const code = (raw || '').toLowerCase();
    if (!code) continue;
    if (code.includes('admin') || code.includes('owner')) return ru ? 'Администратор' : 'Administrator';
    if (code.includes('supervisor')) return ru ? 'Супервайзер' : 'Supervisor';
    if (code.includes('senior')) return ru ? 'Ст. клинер' : 'Senior cleaner';
    if (code.includes('technician')) return ru ? 'Техник' : 'Technician';
    if (code.includes('maitre')) return ru ? 'Метрдотель' : 'Maître d’';
    if (code.includes('waiter') || code.includes('host')) return ru ? 'Официант' : 'Waiter';
    if (code.includes('porter')) return ru ? 'Портье' : 'Porter';
    if (code.includes('parking') || code.includes('valet')) return ru ? 'Парковка' : 'Parking';
    if (code.includes('reception')) return ru ? 'Ресепшн' : 'Reception';
    if (code.includes('cleaner') || code.includes('housekeep')) return ru ? 'Клинер' : 'Cleaner';
    return raw as string;
  }
  return '—';
}

// Hotel admins/owners are managed only in the PMS — the app shows them read-only and never
// offers them as assignees.
export function isHotelAdmin(staff: Pick<StaffMember, 'roleCode' | 'position' | 'role'> | undefined): boolean {
  return /admin|owner/.test(`${staff?.roleCode || ''} ${staff?.position || ''} ${staff?.role || ''}`.toLowerCase());
}
