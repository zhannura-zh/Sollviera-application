import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { QrCode } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { useShiftActions } from '@/hooks/use-shift-status';
import { ShiftQrScanner } from '@/components/shift-qr-scanner';

// "Открыть / Закрыть смену (QR)" + "На смене / Перерыв" — the same block in every role's
// profile, matching mobile.sollviera.com. Break is only available inside an open shift.
export function ShiftControls() {
  const { lang, cleanerProfile, hasOpenDeskShift } = useApp();
  const { setPresence, canStopWorking, pauseActiveRoom } = useShiftActions();
  const [scan, setScan] = useState<'open' | 'close' | null>(null);
  const ru = lang === 'RU';
  const isOpen = hasOpenDeskShift;
  const status = isOpen ? cleanerProfile.currentShift.status : 'SHIFT_ENDED';

  const startScan = () => {
    if (!isOpen) {
      setScan('open');
      return;
    }
    if (!canStopWorking('close')) return;
    setScan('close');
  };

  const handleDone = (result: 'opened' | 'closed') => {
    setScan(null);
    if (result === 'closed') pauseActiveRoom();
    Alert.alert(
      '',
      result === 'opened'
        ? ru ? 'Смена открыта. Хорошей работы!' : 'Shift opened. Have a good one!'
        : ru ? 'Смена закрыта.' : 'Shift closed.'
    );
  };

  return (
    <View className="gap-2">
      <Pressable
        onPress={startScan}
        className="py-2.5 rounded-xl bg-dark flex-row items-center justify-center gap-2 active:opacity-80"
      >
        <QrCode size={16} color="#fff" />
        <Text className="text-[13px] font-jost-semibold text-white">
          {isOpen ? (ru ? 'Закрыть смену (QR)' : 'Close shift (QR)') : ru ? 'Открыть смену (QR)' : 'Open shift (QR)'}
        </Text>
      </Pressable>

      <View className="flex-row gap-2">
        {(['ON_SHIFT', 'ON_BREAK'] as const).map((value) => {
          const selected = status === value;
          return (
            <Pressable
              key={value}
              disabled={!isOpen || selected}
              onPress={() => setPresence(value)}
              className={`flex-1 py-2 rounded-xl border items-center ${selected ? 'bg-primary-light border-dark' : 'bg-white border-border'} ${!isOpen ? 'opacity-50' : ''}`}
            >
              <Text className={`text-[13px] font-jost ${selected ? 'text-text-primary font-jost-semibold' : 'text-text-secondary'}`}>
                {value === 'ON_SHIFT' ? (ru ? 'На смене' : 'On shift') : ru ? 'Перерыв' : 'Break'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!isOpen && (
        <Text className="text-[12px] font-jost text-text-secondary text-center">
          {ru ? 'Смена не начата — отсканируйте QR на экране ресепшн.' : 'Shift not started — scan the QR on the front desk screen.'}
        </Text>
      )}

      <ShiftQrScanner visible={scan !== null} action={scan ?? 'open'} onClose={() => setScan(null)} onDone={handleDone} />
    </View>
  );
}
