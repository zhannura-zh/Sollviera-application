import React from 'react';
import { useApp } from '@/context/app-store';
import { LOGIN_QR_PREFIX, SHIFT_QR_PREFIX, qrPayloadFrom } from '@/lib/api-client';
import { QrScannerModal } from '@/components/qr-scanner-modal';

// Error codes POST /staff/attendance/scan answers with (checked on stage).
const SCAN_ERRORS: Record<string, { ru: string; en: string }> = {
  ATTENDANCE_QR_EXPIRED: {
    ru: 'QR-код устарел — он обновляется каждые 90 секунд. Отсканируйте текущий код на экране ресепшн.',
    en: 'The QR code has expired — it refreshes every 90 seconds. Scan the current code on the front desk screen.',
  },
  ATTENDANCE_QR_WRONG_HOTEL: {
    ru: 'Этот QR-код от другого отеля.',
    en: 'This QR code belongs to another hotel.',
  },
  INVALID_ATTENDANCE_QR: {
    ru: 'QR-код не распознан. Отсканируйте код смены на экране ресепшн.',
    en: 'The QR code is not valid. Scan the shift code on the front desk screen.',
  },
};

interface ShiftQrScannerProps {
  visible: boolean;
  // What the button promised; the server still decides (it toggles an open shift).
  action: 'open' | 'close';
  onClose: () => void;
  onDone: (result: 'opened' | 'closed') => void;
}

// Reads the rotating shift QR on the front-desk screen and opens or closes the employee's
// attendance shift (POST /staff/attendance/scan).
export function ShiftQrScanner({ visible, action, onClose, onDone }: ShiftQrScannerProps) {
  const { lang, scanShiftQr } = useApp();
  const ru = lang === 'RU';

  const handleScan = async (data: string) => {
    const token = qrPayloadFrom(data, SHIFT_QR_PREFIX);
    if (!token) {
      // A personal login QR is a common mix-up worth naming.
      throw new Error(
        qrPayloadFrom(data, LOGIN_QR_PREFIX)
          ? ru ? 'Это QR для входа. Для смены отсканируйте QR на экране ресепшн.' : 'This is a login QR. Scan the shift QR on the front desk screen.'
          : ru ? 'Это не QR смены. Отсканируйте QR на экране ресепшн.' : 'This is not a shift QR. Scan the QR on the front desk screen.'
      );
    }
    try {
      onDone(await scanShiftQr(token, action));
    } catch (e) {
      const known = e instanceof Error ? SCAN_ERRORS[e.message] : undefined;
      throw known ? new Error(ru ? known.ru : known.en) : e;
    }
  };

  return (
    <QrScannerModal
      visible={visible}
      lang={lang}
      title={action === 'open' ? (ru ? 'Открыть смену' : 'Open shift') : ru ? 'Закрыть смену' : 'Close shift'}
      hint={ru ? 'Наведите камеру на QR-код смены на экране ресепшн.' : 'Point the camera at the shift QR on the front desk screen.'}
      onClose={onClose}
      onScan={handleScan}
    />
  );
}
