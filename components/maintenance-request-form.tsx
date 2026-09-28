import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { Language, MaintenanceCategory, MaintenancePriority } from '@/types';
import { getTranslation } from '@/lib/locales';
import { SelectField } from '@/components/ui/select-field';

const CATEGORIES: MaintenanceCategory[] = ['PLUMBING', 'ELECTRICAL', 'FURNITURE', 'APPLIANCES', 'CLEANLINESS', 'OTHER'];
const PRIORITIES: MaintenancePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export interface MaintenanceRequestFormValues {
  roomNumber: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  description: string;
  blocksCleaning: boolean;
  photoUrl?: string;
}

interface MaintenanceRequestFormProps {
  lang: Language;
  initialRoomNumber?: string;
  submitLabel: string;
  onSubmit: (values: MaintenanceRequestFormValues) => void;
}

// Shared "new maintenance ticket" form used by both the cleaner's maintenance-screen (report
// a defect) and the technician's create-ticket-screen (log a ticket directly) — same fields,
// same category/priority catalog, so kept as one component instead of two near-copies.
export function MaintenanceRequestForm({ lang, initialRoomNumber, submitLabel, onSubmit }: MaintenanceRequestFormProps) {
  const t = getTranslation(lang);

  const [roomNumber, setRoomNumber] = useState(initialRoomNumber || '');
  const [category, setCategory] = useState<MaintenanceCategory>('PLUMBING');
  const [priority, setPriority] = useState<MaintenancePriority>('MEDIUM');
  const [description, setDescription] = useState('');
  const [blocksCleaning, setBlocksCleaning] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');

  const getCategoryLabel = (cat: MaintenanceCategory) => {
    switch (cat) {
      case 'PLUMBING': return t.categoryPlumbing;
      case 'ELECTRICAL': return t.categoryElectrical;
      case 'FURNITURE': return t.categoryFurniture;
      case 'APPLIANCES': return t.categoryAppliances;
      case 'CLEANLINESS': return t.categoryCleanliness;
      default: return t.categoryOther;
    }
  };

  const getPriorityLabel = (prio: MaintenancePriority) => {
    switch (prio) {
      case 'LOW': return t.priorityLow;
      case 'MEDIUM': return t.priorityMedium;
      case 'HIGH': return t.priorityHigh;
      case 'CRITICAL': return t.priorityCritical;
    }
  };

  const handlePickPhoto = async (source: 'camera' | 'library') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        lang === 'RU' ? 'Нет доступа' : 'Permission required',
        lang === 'RU' ? 'Разрешите доступ к камере или фото в настройках устройства.' : 'Allow access to the camera or photo library in device settings.'
      );
      return;
    }
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets[0]?.uri) return;
    setPhotoUrl(result.assets[0].uri);
  };

  const choosePhotoSource = () => {
    Alert.alert(
      lang === 'RU' ? 'Добавить фото' : 'Add photo',
      lang === 'RU' ? 'Выберите источник' : 'Choose a source',
      [
        { text: lang === 'RU' ? 'Снять фото' : 'Take photo', onPress: () => void handlePickPhoto('camera') },
        { text: lang === 'RU' ? 'Выбрать из галереи' : 'Choose from gallery', onPress: () => void handlePickPhoto('library') },
        { text: lang === 'RU' ? 'Отмена' : 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmit = () => {
    if (!description.trim()) return;
    onSubmit({ roomNumber, category, priority, description, blocksCleaning, photoUrl: photoUrl || undefined });
    setDescription('');
    setPhotoUrl('');
    setBlocksCleaning(false);
  };

  return (
    <View className="bg-white rounded-[14px] border border-border p-4 gap-4">
      <View className="flex-row gap-3.5">
        <View className="flex-1 gap-1">
          <Text className="text-[12px] text-text-secondary font-jost uppercase">{t.roomNumberLabel}</Text>
          <TextInput
            value={roomNumber}
            onChangeText={setRoomNumber}
            placeholder="e.g. 304"
            placeholderTextColor="#8A8177"
            className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary font-jost"
          />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-[12px] text-text-secondary font-jost uppercase">
            {lang === 'RU' ? 'Категория' : 'Category'}
          </Text>
          <SelectField
            value={category}
            onChange={setCategory}
            options={CATEGORIES.map((cat) => ({ value: cat, label: getCategoryLabel(cat) }))}
          />
        </View>
      </View>

      <View className="gap-1">
        <Text className="text-[12px] text-text-secondary font-jost uppercase">
          {lang === 'RU' ? 'Приоритет' : 'Priority'}
        </Text>
        <View className="flex-row gap-1.5">
          {PRIORITIES.map((prio) => (
            <Pressable
              key={prio}
              onPress={() => setPriority(prio)}
              className={`flex-1 py-2 rounded-xl border items-center ${
                priority === prio ? 'bg-dark border-dark' : 'bg-white border-border'
              }`}
            >
              <Text className={`text-[13px] font-jost ${priority === prio ? 'text-white' : 'text-text-secondary'}`}>
                {getPriorityLabel(prio)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="border-t border-border-light pt-3.5 flex-row items-center justify-between">
        <Text className="text-sm text-text-primary font-jost flex-1 pr-2">{t.blocksCleaningLabel}</Text>
        <Pressable
          onPress={() => setBlocksCleaning(!blocksCleaning)}
          className={`w-11 h-6 rounded-full justify-center ${blocksCleaning ? 'bg-primary' : 'bg-border'}`}
        >
          <View className={`h-[18px] w-[18px] rounded-full bg-white ${blocksCleaning ? 'ml-5' : 'ml-0.5'}`} />
        </Pressable>
      </View>

      <TextInput
        multiline
        value={description}
        onChangeText={setDescription}
        placeholder={lang === 'RU' ? 'Опишите проблему' : 'Describe defect'}
        placeholderTextColor="#8A8177"
        className="w-full bg-background border border-border rounded-xl p-3 text-sm text-text-primary font-jost min-h-[80px]"
      />

      {photoUrl ? (
        <Pressable onPress={() => setPhotoUrl('')}>
          <Image source={{ uri: photoUrl }} className="w-full h-24 rounded-xl border border-border" />
        </Pressable>
      ) : (
        <Pressable
          onPress={choosePhotoSource}
          className="w-full py-2.5 px-3 border border-border rounded-xl flex-row items-center justify-center gap-2 bg-background"
        >
          <Camera size={16} color="#8A8177" />
          <Text className="text-[12px] font-jost uppercase tracking-wider text-text-secondary">
            {lang === 'RU' ? 'Добавить фото' : 'Add photo'}
          </Text>
        </Pressable>
      )}

      <Pressable
        onPress={handleSubmit}
        className="w-full bg-primary py-3.5 px-4 rounded-xl items-center active:bg-primary-hover"
      >
        <Text className="text-white text-sm font-jost-semibold">{submitLabel}</Text>
      </Pressable>
    </View>
  );
}
