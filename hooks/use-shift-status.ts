import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useApp } from '@/context/app-store';
import type { ShiftStatusValue } from '@/lib/api-client';

// Shared "На смене / Перерыв / Завершить" handler for the profile screens.
// Break and resume are saved to the backend (attendance presence, or the staff
// shiftStatus flag when no desk shift is open). Finishing marks the shift ended and signs
// out; a shift opened at the front desk still has to be closed with the desk QR.
export function useShiftStatusHandler(onLoggedOut: () => void) {
  const { lang, setShiftStatus, hasOpenDeskShift, logout } = useApp();
  const ru = lang === 'RU';

  return useCallback(
    (status: ShiftStatusValue) => {
      const fail = (error: unknown) =>
        Alert.alert(
          ru ? 'Не удалось сменить статус' : 'Could not change status',
          error instanceof Error ? error.message : ru ? 'Проверьте интернет и попробуйте ещё раз' : 'Check your connection and try again'
        );

      if (status !== 'SHIFT_ENDED') {
        setShiftStatus(status).catch(fail);
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
    [ru, setShiftStatus, hasOpenDeskShift, logout, onLoggedOut]
  );
}
