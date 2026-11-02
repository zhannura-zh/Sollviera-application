import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useApp } from '@/context/app-store';
import type { ShiftStatusValue } from '@/lib/api-client';

// Shared "На смене / Перерыв / Завершить" handler for the profile screens.
// Break and resume are saved to the backend (attendance presence, or the staff
// shiftStatus flag when no desk shift is open). Finishing marks the shift ended and signs
// out; a shift opened at the front desk still has to be closed with the desk QR.
// A break can't overlap work: the cleaner's running room is paused, and a technician has
// to finish the repair first (tickets have no paused state).
export function useShiftStatusHandler(onLoggedOut: () => void) {
  const { lang, role, rooms, maintenanceRequests, updateRoomStatus, setShiftStatus, hasOpenDeskShift, logout } = useApp();
  const ru = lang === 'RU';

  return useCallback(
    (status: ShiftStatusValue) => {
      const fail = (error: unknown) =>
        Alert.alert(
          ru ? 'Не удалось сменить статус' : 'Could not change status',
          error instanceof Error ? error.message : ru ? 'Проверьте интернет и попробуйте ещё раз' : 'Check your connection and try again'
        );

      if (status === 'ON_BREAK' && role === 'TECHNICIAN') {
        const repair = maintenanceRequests.find((r) => r.status === 'IN_PROGRESS');
        if (repair) {
          Alert.alert(
            ru ? 'Ремонт в работе' : 'Repair in progress',
            ru
              ? `Завершите заявку${repair.roomNumber ? ` по номеру ${repair.roomNumber}` : ''}, прежде чем уходить на перерыв.`
              : `Complete the ticket${repair.roomNumber ? ` for room ${repair.roomNumber}` : ''} before taking a break.`
          );
          return;
        }
      }

      if (status !== 'SHIFT_ENDED') {
        setShiftStatus(status)
          .then(() => {
            if (status !== 'ON_BREAK') return;
            const cleaning = rooms.find((r) => r.status === 'IN_PROGRESS');
            if (!cleaning) return;
            updateRoomStatus(cleaning.id, 'PENDING');
            Alert.alert('', ru ? `Уборка номера ${cleaning.roomNumber} поставлена на паузу.` : `Cleaning of room ${cleaning.roomNumber} is paused.`);
          })
          .catch(fail);
        return;
      }

      Alert.alert(
        ru ? 'Завершить смену?' : 'Finish shift?',
        hasOpenDeskShift
          ? ru
            ? 'Вы будете выведены из аккаунта. Смена на стойке остаётся открытой — закройте её QR-кодом на ресепшене.'
            : 'You will be signed out. Your front-desk shift stays open — close it with the QR code at reception.'
          : ru
            ? 'Вы будете выведены из аккаунта.'
            : 'You will be signed out.',
        [
          { text: ru ? 'Отмена' : 'Cancel', style: 'cancel' },
          {
            text: ru ? 'Завершить' : 'Finish',
            style: 'destructive',
            onPress: () => {
              // Best effort: the session ends either way.
              setShiftStatus('SHIFT_ENDED')
                .catch(() => undefined)
                .finally(() => {
                  logout();
                  onLoggedOut();
                });
            },
          },
        ]
      );
    },
    [ru, role, rooms, maintenanceRequests, updateRoomStatus, setShiftStatus, hasOpenDeskShift, logout, onLoggedOut]
  );
}
