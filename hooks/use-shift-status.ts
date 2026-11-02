import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useApp } from '@/context/app-store';

// Shift actions shared by every role's profile (components/shift-controls.tsx).
// Opening/closing is done with the front-desk QR; inside an open shift, break and resume are
// saved to the backend (attendance presence). A break or a closed shift can't overlap work:
// the cleaner's running room is paused, and a technician has to finish the repair first
// (tickets have no paused state).
export function useShiftActions() {
  const { lang, role, rooms, maintenanceRequests, updateRoomStatus, setShiftStatus } = useApp();
  const ru = lang === 'RU';

  // False when the technician still has a repair running (and says so).
  const canStopWorking = useCallback(
    (reason: 'break' | 'close') => {
      if (role !== 'TECHNICIAN') return true;
      const repair = maintenanceRequests.find((r) => r.status === 'IN_PROGRESS');
      if (!repair) return true;
      const room = repair.roomNumber ? (ru ? ` по номеру ${repair.roomNumber}` : ` for room ${repair.roomNumber}`) : '';
      Alert.alert(
        ru ? 'Ремонт в работе' : 'Repair in progress',
        reason === 'break'
          ? ru ? `Завершите заявку${room}, прежде чем уходить на перерыв.` : `Complete the ticket${room} before taking a break.`
          : ru ? `Завершите заявку${room}, прежде чем закрывать смену.` : `Complete the ticket${room} before closing the shift.`
      );
      return false;
    },
    [role, maintenanceRequests, ru]
  );

  // Puts the cleaner's running room on pause (no-op for other roles or when nothing runs).
  const pauseActiveRoom = useCallback(() => {
    const cleaning = rooms.find((r) => r.status === 'IN_PROGRESS');
    if (!cleaning) return;
    updateRoomStatus(cleaning.id, 'PENDING');
    Alert.alert('', ru ? `Уборка номера ${cleaning.roomNumber} поставлена на паузу.` : `Cleaning of room ${cleaning.roomNumber} is paused.`);
  }, [rooms, updateRoomStatus, ru]);

  const setPresence = useCallback(
    (status: 'ON_SHIFT' | 'ON_BREAK') => {
      if (status === 'ON_BREAK' && !canStopWorking('break')) return;
      setShiftStatus(status)
        .then(() => {
          if (status === 'ON_BREAK') pauseActiveRoom();
        })
        .catch((error: unknown) =>
          Alert.alert(
            ru ? 'Не удалось сменить статус' : 'Could not change status',
            error instanceof Error ? error.message : ru ? 'Проверьте интернет и попробуйте ещё раз' : 'Check your connection and try again'
          )
        );
    },
    [canStopWorking, setShiftStatus, pauseActiveRoom, ru]
  );

  return { setPresence, canStopWorking, pauseActiveRoom };
}
