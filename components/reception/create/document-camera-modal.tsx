import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, Text, View, useWindowDimensions, type LayoutRectangle } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, IdCard, X } from 'lucide-react-native';
import { missingKzSide, type MrzResult } from '@/lib/mrz';
import type { Lang } from '@/components/reception/booking-utils';
import { combine, confirmedByTwoFrames, isComplete, recognizeImage, type Region } from './document-ocr';

interface DocumentCameraModalProps {
  visible: boolean;
  lang: Lang;
  /** Read earlier (e.g. one side from the gallery): the camera only adds what is missing. */
  initial: MrzResult | null;
  onClose: () => void;
  /** Everything read; may be partial when the porter fills in without the second side. */
  onDone: (result: MrzResult) => void;
  /** iOS really showed the screen (a presentation can be dropped silently, see the button). */
  onShow?: () => void;
}

const FRAME_INTERVAL_MS = 600;
const SLOW_HINT_AFTER_MS = 12000;
// Room around the frame that still counts, so a card held slightly off the frame is not cut.
const FRAME_MARGIN = 0.08;
// Photos about this big on the long side are plenty for the document text and read several
// times faster than the full 12 MP, so frames are checked more often.
const TARGET_LONG_SIDE = 1920;

// Picks from the camera's sizes («1920x1080», …; iOS adds presets like «Photo») the one whose
// long side is closest to the target without going much below it.
function pickPictureSize(sizes: string[]) {
  const parsed = sizes
    .map((size) => {
      const m = size.match(/^(\d+)x(\d+)$/);
      return m ? { size, long: Math.max(Number(m[1]), Number(m[2])) } : null;
    })
    .filter((x): x is { size: string; long: number } => !!x && x.long >= TARGET_LONG_SIDE * 0.8);
  parsed.sort((a, b) => Math.abs(a.long - TARGET_LONG_SIDE) - Math.abs(b.long - TARGET_LONG_SIDE));
  return parsed[0]?.size;
}

// The camera preview fills the screen like «cover»: the photo is scaled to cover the view and
// centred, the overflow cropped. Maps the on-screen frame back to the photo's pixels.
function frameInPhoto(view: { width: number; height: number }, frame: LayoutRectangle, photoWidth: number, photoHeight: number): Region {
  const scale = Math.max(view.width / photoWidth, view.height / photoHeight);
  const offsetX = (view.width - photoWidth * scale) / 2;
  const offsetY = (view.height - photoHeight * scale) / 2;
  const mx = frame.width * FRAME_MARGIN;
  const my = frame.height * FRAME_MARGIN;
  return {
    left: (frame.x - mx - offsetX) / scale,
    top: (frame.y - my - offsetY) / scale,
    right: (frame.x + frame.width + mx - offsetX) / scale,
    bottom: (frame.y + frame.height + my - offsetY) / scale,
    photoWidth,
    photoHeight,
  };
}

// Full-screen camera for the guest's document, built like the app's QR scanner. It takes a frame
// about once a second and reads it on the device; when a Kazakhstan ID card needs its other side
// it says so and keeps going, so both sides are read in one go. A shutter button forces a frame.
// A field reaches the form only after two frames read it the same way (see confirmedByTwoFrames),
// and only text inside the on-screen frame is read.
export function DocumentCameraModal({ visible, lang, initial, onClose, onDone, onShow }: DocumentCameraModalProps) {
  const ru = lang === 'RU';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [pictureSize, setPictureSize] = useState<string | undefined>(undefined);
  const sizeChosen = useRef(false);
  const [result, setResult] = useState<MrzResult | null>(initial);
  const [slow, setSlow] = useState(false);
  const [manualFailed, setManualFailed] = useState(false);
  const [shooting, setShooting] = useState(false);
  const resultRef = useRef<MrzResult | null>(initial);
  const capturing = useRef(false);
  const history = useRef<MrzResult[]>([]);
  // Sizes on screen of the camera view and of the frame, to read only what is inside the frame.
  const viewSize = useRef<{ width: number; height: number } | null>(null);
  const frameRect = useRef<LayoutRectangle | null>(null);
  const active = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!visible) return;
    resultRef.current = initial;
    setResult(initial);
    setSlow(false);
    setManualFailed(false);
    setReady(false);
    history.current = [];
    if (permission && !permission.granted && permission.canAskAgain) void requestPermission();
    // `initial` is read when the camera opens, not followed afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, permission, requestPermission]);

  const capture = async (manual: boolean) => {
    if (capturing.current || !camera.current) return;
    capturing.current = true;
    if (manual) setShooting(true);
    try {
      const picture = await camera.current.takePictureAsync({ quality: 0.8, shutterSound: false });
      if (!picture || !active.current) return;
      const region =
        viewSize.current && frameRect.current
          ? frameInPhoto(viewSize.current, frameRect.current, picture.width, picture.height)
          : undefined;
      const found = await recognizeImage(picture.uri, region).catch(() => null);
      try {
        new File(picture.uri).delete();
      } catch {
        // a leftover frame in the cache is harmless
      }
      if (!active.current) return;
      if (!found) {
        if (manual) setManualFailed(true);
        return;
      }
      const confirmed = confirmedByTwoFrames(found, history.current);
      history.current = [found, ...history.current].slice(0, 3);
      setManualFailed(false);
      if (!confirmed) return; // wait for the next frame to agree
      const next = combine(resultRef.current, confirmed);
      const progressed = JSON.stringify(next) !== JSON.stringify(resultRef.current);
      resultRef.current = next;
      setResult(next);
      setManualFailed(false);
      if (progressed) setSlow(false);
      if (isComplete(next)) {
        active.current = false;
        doneRef.current(next);
      }
    } catch {
      // the camera may refuse a frame while it is starting or closing — the next one will do
    } finally {
      capturing.current = false;
      if (manual) setShooting(false);
    }
  };

  // Automatic frames while the camera is open.
  useEffect(() => {
    if (!visible || !ready || !permission?.granted) return;
    active.current = true;
    const slowTimer = setTimeout(() => setSlow(true), SLOW_HINT_AFTER_MS);
    void (async () => {
      while (active.current) {
        await capture(false);
        await new Promise((resolve) => setTimeout(resolve, FRAME_INTERVAL_MS));
      }
    })();
    return () => {
      active.current = false;
      clearTimeout(slowTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, ready, permission?.granted]);

  const side = result ? missingKzSide(result) : null;
  const title = side === 'front' ? (ru ? 'Лицевая сторона' : 'Front side') : side === 'back' ? (ru ? 'Оборот удостоверения' : 'Back of the ID card') : ru ? 'Документ гостя' : 'Guest document';
  const hint = side === 'front'
    ? ru ? 'Переверните удостоверение стороной с фото и ИИН' : 'Turn the ID card to the side with the photo and IIN'
    : side === 'back'
      ? ru ? 'Переверните удостоверение стороной со строками «<<<» внизу' : 'Turn the ID card to the side with the «<<<» lines'
      : ru ? 'Удостоверение любой стороной или паспорт страницей с фото' : 'ID card on either side or passport on the photo page';
  const readSide = side === 'front' ? (ru ? 'Оборот прочитан' : 'Back side read') : side === 'back' ? (ru ? 'Лицевая сторона прочитана' : 'Front side read') : '';
  const problem = manualFailed
    ? ru ? 'Не удалось прочитать. Документ целиком в рамке, без бликов' : 'Could not read it. Keep the whole document in the frame, without glare'
    : slow
      ? ru ? 'Не получается прочитать: уберите блики, поднесите документ ближе' : 'Cannot read it yet: avoid glare, bring the document closer'
      : '';

  // ID card proportions (85.6 × 54 mm); a passport page fits it as well.
  const frameWidth = Math.min(width - 40, 520);
  const frameHeight = frameWidth / 1.55;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose} onShow={onShow}>
      <View className="flex-1 bg-dark">
        {permission?.granted ? (
          <CameraView
            ref={camera}
            style={{ flex: 1 }}
            onLayout={(e) => (viewSize.current = e.nativeEvent.layout)}
            facing="back"
            animateShutter={false}
            pictureSize={pictureSize}
            onCameraReady={() => {
              setReady(true);
              if (sizeChosen.current) return;
              sizeChosen.current = true;
              camera.current
                ?.getAvailablePictureSizesAsync()
                .then((sizes) => setPictureSize(pickPictureSize(sizes)))
                .catch(() => undefined); // keep the camera's default size
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-8 gap-4">
            <IdCard size={40} color="#8A8177" />
            <Text className="text-white text-center font-jost text-sm leading-relaxed">
              {ru ? 'Нужен доступ к камере, чтобы сфотографировать документ гостя.' : 'Camera access is needed to photograph the guest document.'}
            </Text>
            {permission && (
              <Pressable
                onPress={() => (permission.canAskAgain ? void requestPermission() : void Linking.openSettings())}
                className="bg-primary px-5 py-3 rounded-xl active:bg-primary-hover"
              >
                <Text className="text-white font-jost-semibold text-sm">
                  {permission.canAskAgain ? (ru ? 'Разрешить камеру' : 'Allow camera') : ru ? 'Открыть настройки' : 'Open settings'}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Header over the camera */}
        <View className="absolute left-0 right-0 px-5 flex-row items-center justify-between" style={{ top: insets.top + 12 }}>
          <Text className="text-white font-jost-semibold text-base">{title}</Text>
          <Pressable onPress={onClose} hitSlop={12} className="h-10 w-10 rounded-full bg-black/50 items-center justify-center">
            <X size={20} color="#fff" />
          </Pressable>
        </View>

        {permission?.granted && (
          <View className="absolute inset-0 items-center justify-center gap-4" pointerEvents="none">
            {!!readSide && (
              <View className="flex-row items-center gap-2 bg-black/60 rounded-full px-4 py-2">
                <Check size={16} color="#4ADE80" />
                <Text className="text-white font-jost-medium text-sm">{readSide}</Text>
              </View>
            )}
            <View
              style={{ width: frameWidth, height: frameHeight }}
              className="rounded-2xl border-2 border-white/80"
              onLayout={(e) => (frameRect.current = e.nativeEvent.layout)}
            />
            <Text className="text-white/90 font-jost text-sm text-center bg-black/50 rounded-xl py-3 px-4 mx-5">{hint}</Text>
          </View>
        )}

        {permission?.granted && (
          <View className="absolute left-0 right-0 px-5 gap-4 items-center" style={{ bottom: insets.bottom + 24 }}>
            {!!problem && (
              <Text className="text-white font-jost text-sm text-center bg-black/70 rounded-xl py-3 px-4 self-stretch">{problem}</Text>
            )}
            <Pressable
              onPress={() => void capture(true)}
              disabled={!ready}
              className="h-[72px] w-[72px] rounded-full border-4 border-white/90 items-center justify-center active:opacity-70"
            >
              {shooting ? <ActivityIndicator color="#fff" /> : <View className="h-14 w-14 rounded-full bg-white" />}
            </Pressable>
            {result && !isComplete(result) && (
              <Pressable onPress={() => onDone(result)} hitSlop={8} className="py-1 active:opacity-60">
                <Text className="text-white font-jost-medium text-sm underline">
                  {side ? (ru ? 'Заполнить без второй стороны' : 'Fill in without the other side') : ru ? 'Заполнить то, что прочитано' : 'Fill in what was read'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}
