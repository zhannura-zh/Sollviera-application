import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, QrCode } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { LOGIN_QR_PREFIX, SHIFT_QR_PREFIX } from '@/lib/api-client';

// The desk QR is either the bare payload (RHPMS-ATT|…) or a link carrying it in a query
// parameter. Returns null for anything else; 'login' for a personal login QR, which is a
// common mix-up worth naming.
function shiftTokenFrom(raw: string): string | 'login' | null {
  const value = raw.trim();
  if (value.startsWith(SHIFT_QR_PREFIX)) return value;
  if (value.startsWith(LOGIN_QR_PREFIX)) return 'login';
  try {
    const params = Array.from(new URL(value).searchParams.values()).map((v) => v.trim());
    const shift = params.find((v) => v.startsWith(SHIFT_QR_PREFIX));
    if (shift) return shift;
    if (params.some((v) => v.startsWith(LOGIN_QR_PREFIX))) return 'login';
  } catch {
    // Not a URL.
  }
  return null;
}

interface ShiftQrScannerProps {
  visible: boolean;
  // What the button promised; the server still decides (it toggles an open shift).
  action: 'open' | 'close';
  onClose: () => void;
  onDone: (result: 'opened' | 'closed') => void;
}

// Full-screen camera that reads the rotating shift QR on the front-desk screen and opens or
// closes the employee's attendance shift (POST /staff/attendance/scan).
export function ShiftQrScanner({ visible, action, onClose, onDone }: ShiftQrScannerProps) {
  const { lang, scanShiftQr } = useApp();
  const ru = lang === 'RU';
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // The camera fires many events per second for the same code; handle one at a time and
  // ignore the rest until the user asks to scan again.
  const handling = useRef(false);

  useEffect(() => {
    if (!visible) return;
    handling.current = false;
    setBusy(false);
    setError('');
    if (permission && !permission.granted && permission.canAskAgain) void requestPermission();
  }, [visible, permission, requestPermission]);

  const handleScanned = async (data: string) => {
    if (handling.current) return;
    handling.current = true;
    const token = shiftTokenFrom(data);
    if (token === 'login' || token === null) {
      setError(
        token === 'login'
          ? ru ? 'Это QR для входа. Для смены отсканируйте QR на экране ресепшн.' : 'This is a login QR. Scan the shift QR on the front desk screen.'
          : ru ? 'Это не QR смены. Отсканируйте QR на экране ресепшн.' : 'This is not a shift QR. Scan the QR on the front desk screen.'
      );
      return;
    }
    setBusy(true);
    try {
      const result = await scanShiftQr(token, action);
      onDone(result);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : ru ? 'Не удалось распознать код' : 'Could not process the code');
    } finally {
      setBusy(false);
    }
  };

  const retry = () => {
    setError('');
    handling.current = false;
  };

  const title = action === 'open'
    ? ru ? 'Открыть смену' : 'Open shift'
    : ru ? 'Закрыть смену' : 'Close shift';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View className="flex-1 bg-dark">
        {permission?.granted ? (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={busy || error ? undefined : ({ data }) => void handleScanned(data)}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-8 gap-4">
            <QrCode size={40} color="#8A8177" />
            <Text className="text-white text-center font-jost text-sm leading-relaxed">
              {ru ? 'Нужен доступ к камере, чтобы отсканировать QR смены.' : 'Camera access is needed to scan the shift QR.'}
            </Text>
            {permission && (
              <Pressable
                onPress={() => (permission.canAskAgain ? void requestPermission() : void Linking.openSettings())}
                className="bg-primary px-5 py-3 rounded-xl active:bg-primary-hover"
              >
                <Text className="text-white font-jost-semibold text-sm">
                  {permission.canAskAgain ? (ru ? 'Разрешить камеру' : 'Allow camera') : (ru ? 'Открыть настройки' : 'Open settings')}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Header and hint over the camera */}
        <View className="absolute left-0 right-0 px-5 flex-row items-center justify-between" style={{ top: insets.top + 12 }}>
          <Text className="text-white font-jost-semibold text-base">{title}</Text>
          <Pressable onPress={onClose} hitSlop={12} className="h-10 w-10 rounded-full bg-black/50 items-center justify-center">
            <X size={20} color="#fff" />
          </Pressable>
        </View>

        {permission?.granted && (
          <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
            <View className="w-64 h-64 rounded-3xl border-2 border-white/80" />
          </View>
        )}

        <View className="absolute left-0 right-0 px-5 gap-3" style={{ bottom: insets.bottom + 24 }}>
          {busy ? (
            <View className="flex-row items-center justify-center gap-2 bg-black/60 rounded-xl py-3">
              <ActivityIndicator color="#fff" />
              <Text className="text-white font-jost text-sm">{ru ? 'Проверяем код…' : 'Checking the code…'}</Text>
            </View>
          ) : error ? (
            <View className="bg-black/70 rounded-xl p-4 gap-3">
              <Text className="text-white font-jost text-sm text-center leading-relaxed">{error}</Text>
              <Pressable onPress={retry} className="bg-primary py-3 rounded-xl items-center active:bg-primary-hover">
                <Text className="text-white font-jost-semibold text-sm">{ru ? 'Сканировать снова' : 'Scan again'}</Text>
              </Pressable>
            </View>
          ) : (
            permission?.granted && (
              <Text className="text-white/90 font-jost text-sm text-center bg-black/50 rounded-xl py-3 px-4">
                {ru ? 'Наведите камеру на QR-код смены на экране ресепшн.' : 'Point the camera at the shift QR on the front desk screen.'}
              </Text>
            )
          )}
        </View>
      </View>
    </Modal>
  );
}
