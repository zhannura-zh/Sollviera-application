import React, { useRef, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Check, Upload } from 'lucide-react-native';
import { mergeMrz, missingKzSide, type MrzResult } from '@/lib/mrz';
import type { Lang } from '@/components/reception/booking-utils';
import { DocumentCameraModal } from './document-camera-modal';
import { recognizeImage, recognizePdf } from './document-ocr';

// Design (main 8a94405): «Загрузить документ» at the end of a guest's document block. On the phone
// it takes the ID card / passport page from the app's own camera screen (frame, auto-capture, both
// card sides in one go), the gallery or Files (image or PDF), reads it on the device with ML Kit — nothing is uploaded — and hands the fields to the form.
const LABEL = { ru: 'Загрузить документ', en: 'Upload document' };

type Source = 'camera' | 'gallery' | 'files';

export function DocumentScanButton({ lang, onScanned }: { lang: Lang; onScanned: (r: MrzResult) => void }) {
  const ru = lang === 'RU';
  const [scanned, setScanned] = useState(false);
  const [busy, setBusy] = useState(false);
  // What has been read so far: a Kazakhstan ID card is read from two photos, front and back.
  const sofar = useRef<MrzResult | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const cameraShown = useRef(false);

  const noAccess = (text: string) => Alert.alert(ru ? 'Нет доступа' : 'No access', text);

  // Returns the picked file, or null if the user cancelled or denied access.
  const pick = async (source: Source): Promise<{ uri: string; pdf: boolean } | null> => {
    if (source === 'files') {
      const res = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true, multiple: false });
      const file = res.canceled ? undefined : res.assets[0];
      if (!file) return null;
      const pdf = file.mimeType === 'application/pdf' || /\.pdf$/i.test(file.name);
      return { uri: file.uri, pdf };
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      noAccess(ru ? 'Разрешите доступ к фото в настройках телефона' : 'Allow photo access in the phone settings');
      return null;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    const asset = res.canceled ? undefined : res.assets[0];
    return asset ? { uri: asset.uri, pdf: false } : null;
  };

  // Hands what was read to the form and says what is still missing.
  const apply = (filled: MrzResult, offerOtherSide = true) => {
    sofar.current = filled;
    setScanned(true);
    onScanned(filled);

    const side = missingKzSide(filled);
    if (side && offerOtherSide) {
      const front = side === 'front';
      Alert.alert(
        ru ? (front ? 'Оборот прочитан' : 'Лицевая сторона прочитана') : front ? 'Back side read' : 'Front side read',
        ru
          ? front
            ? 'Загрузите лицевую сторону удостоверения, чтобы заполнить дату рождения и пол.'
            : 'Загрузите оборот удостоверения, чтобы заполнить фамилию, имя и номер документа.'
          : front
            ? 'Upload the front of the ID card to fill in the birth date and sex.'
            : 'Upload the back of the ID card to fill in the name and document number.',
        [
          { text: ru ? 'Позже' : 'Later', style: 'cancel' },
          { text: ru ? (front ? 'Загрузить лицевую' : 'Загрузить оборот') : front ? 'Upload front' : 'Upload back', onPress: () => choose(side) },
        ]
      );
      return;
    }
    const missing = [
      !filled.lastName && (ru ? 'фамилию и имя' : 'the name'),
      !filled.docNumber && (ru ? 'номер документа' : 'the document number'),
      !filled.birthDate && (ru ? 'дату рождения и пол' : 'the birth date and sex'),
    ].filter(Boolean);
    if (missing.length) {
      Alert.alert(
        ru ? 'Заполнено не всё' : 'Not everything was filled',
        ru
          ? `Не удалось прочитать ${missing.join(', ')}. Проверьте и впишите вручную.`
          : `Could not read ${missing.join(', ')}. Check and enter manually.`
      );
    }
  };

  // iOS marks a modal as shown even when the presentation was dropped (another screen was still
  // closing), and then never shows it. If it hasn't appeared, close it and present a fresh one.
  const openCamera = (attempt: number) => {
    cameraShown.current = false;
    setCameraKey((k) => k + 1);
    setCameraOpen(true);
    setTimeout(() => {
      if (cameraShown.current) return;
      setCameraOpen(false);
      if (attempt < 2) setTimeout(() => openCamera(attempt + 1), 300);
    }, 1500);
  };

  const read = async (source: Source) => {
    // iOS silently drops a picker presented while the action sheet is still closing (and
    // expo-document-picker then stays «in progress» until restart), so wait for it to go.
    if (Platform.OS === 'ios') await new Promise((resolve) => setTimeout(resolve, 500));
    if (source === 'camera') {
      openCamera(0);
      return;
    }
    let file: Awaited<ReturnType<typeof pick>>;
    try {
      file = await pick(source);
    } catch (error) {
      Alert.alert(ru ? 'Не удалось открыть файл' : 'Could not open the file', error instanceof Error ? error.message : undefined);
      return;
    }
    if (!file) return;

    setBusy(true);
    try {
      const result = file.pdf ? await recognizePdf(file.uri) : await recognizeImage(file.uri);
      if (!result) {
        Alert.alert(
          ru ? 'Не удалось распознать документ' : 'Could not read the document',
          ru
            ? 'Нужна сторона удостоверения или страница паспорта с фото. Документ должен быть виден целиком, без бликов.'
            : 'Use a side of the ID card or the passport photo page. The document must be fully visible, without glare.'
        );
        return;
      }
      const merged = sofar.current ? mergeMrz(sofar.current, result) : null;
      apply(merged ?? result); // a different document starts over
    } catch (error) {
      Alert.alert(ru ? 'Не удалось распознать документ' : 'Could not read the document', error instanceof Error ? error.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  // Native chooser: iOS action sheet; on Android a system dialog (it fits three buttons, so
  // cancelling is a tap outside it).
  // What to shoot is said here too, before the gallery or Files.
  const choose = (side?: 'front' | 'back') => {
    const title = ru
      ? side === 'front' ? 'Лицевая сторона' : side === 'back' ? 'Оборот удостоверения' : 'Документ гостя'
      : side === 'front' ? 'Front side' : side === 'back' ? 'Back of the ID card' : 'Guest document';
    const message = ru
      ? side === 'front'
        ? 'Сторона с фото гостя и ИИН. Документ целиком, без бликов.'
        : side === 'back'
          ? 'Сторона со строками «<<<» внизу. Документ целиком, без бликов.'
          : 'Удостоверение любой стороной или паспорт страницей с фото. Документ целиком, без бликов.'
      : side === 'front'
        ? 'The side with the photo and IIN. The whole document, without glare.'
        : side === 'back'
          ? 'The side with the «<<<» lines at the bottom. The whole document, without glare.'
          : 'ID card on either side or passport on the photo page. The whole document, without glare.';
    const labels: [Source, string][] = [
      ['camera', ru ? 'Сфотографировать' : 'Take a photo'],
      ['gallery', ru ? 'Выбрать из галереи' : 'Choose from gallery'],
      ['files', ru ? 'Выбрать из файлов' : 'Choose from files'],
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title, message, options: [...labels.map(([, l]) => l), ru ? 'Отмена' : 'Cancel'], cancelButtonIndex: labels.length },
        (index) => {
          if (index < labels.length) read(labels[index][0]);
        }
      );
      return;
    }
    Alert.alert(title, message, labels.map(([key, text]) => ({ text, onPress: () => read(key) })), { cancelable: true });
  };

  return (
    <View className="pt-1">
      <Pressable
        onPress={() => choose()}
        disabled={busy}
        className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-[14px] py-3 px-4 flex-row items-center justify-center gap-2 active:bg-[#F3EFE8]"
      >
        {busy ? <ActivityIndicator size="small" color="#C2410C" /> : scanned ? <Check size={16} color="#C2410C" /> : <Upload size={16} color="#C2410C" />}
        <Text className="text-xs font-jost-medium text-[#C2410C] flex-shrink" numberOfLines={1}>
          {scanned ? (ru ? 'Данные заполнены из документа' : 'Details filled from the document') : ru ? LABEL.ru : LABEL.en}
        </Text>
      </Pressable>
      <DocumentCameraModal
        key={cameraKey}
        visible={cameraOpen}
        onShow={() => {
          cameraShown.current = true;
        }}
        lang={lang}
        initial={sofar.current}
        onClose={() => setCameraOpen(false)}
        onDone={(r) => {
          setCameraOpen(false);
          // let the camera close before any alert (iOS drops one shown during the transition)
          setTimeout(() => apply(r, false), Platform.OS === 'ios' ? 600 : 0);
        }}
      />
    </View>
  );
}
