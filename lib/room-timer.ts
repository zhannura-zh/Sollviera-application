import type { HotelRoom } from '@/types';

// Cleaning time actually spent on a room, excluding pauses.
// startedAtMs / pausedMs / pausedAtMs are exact timestamps kept by updateRoomStatus in
// app-store.tsx. Rooms loaded before those existed only have startTime ("HH:MM", no
// date) — then fall back to wall-clock time since that minute, assuming today.
export function roomElapsedSeconds(
  room: Pick<HotelRoom, 'startTime' | 'startedAtMs' | 'pausedMs' | 'pausedAtMs'>,
  now: number = Date.now()
): number {
  let start = room.startedAtMs;
  if (!start) {
    const match = room.startTime ? /^(\d{1,2}):(\d{2})/.exec(room.startTime) : null;
    if (!match) return 0;
    const d = new Date(now);
    d.setHours(Number(match[1]), Number(match[2]), 0, 0);
    start = d.getTime();
    if (start > now) start -= 24 * 60 * 60 * 1000; // crossed midnight
  }
  const paused = (room.pausedMs ?? 0) + (room.pausedAtMs ? Math.max(0, now - room.pausedAtMs) : 0);
  return Math.max(0, Math.floor((now - start - paused) / 1000));
}
