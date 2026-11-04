import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, QrCode } from 'lucide-react-native';
import type { Language } from '@/types';

interface QrScannerModalProps {
  visible: boolean;
  lang: Language;
  title: string;
  hint: string;
  onClose: () => void;
  // Handles one scanned code. Throwing shows the error's message with "Scan again".
  onScan: (data: string) => Promise<void>;
}

// Full-screen camera for the app's QR codes (front-desk shift QR, personal login QR).
export function QrScannerModal({ visible, lang, title, hint, onClose, onScan }: QrScannerModalProps) {
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
    setBusy(true);
    try {
      await onScan(data);
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
              {ru ? 'Нужен доступ к камере, чтобы отсканировать QR-код.' : 'Camera access is needed to scan the QR code.'}
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
              <Text className="text-white/90 font-jost text-sm text-center bg-black/50 rounded-xl py-3 px-4">{hint}</Text>
            )
          )}
        </View>
      </View>
    </Modal>
  );
}
