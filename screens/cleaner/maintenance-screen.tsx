import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wrench, Camera, CheckCircle, ChevronDown } from 'lucide-react-native';
import { MaintenanceCategory, MaintenancePriority } from '@/types';
import { getTranslation } from '@/lib/locales';
import { useApp } from '@/context/app-store';
import { SelectField } from '@/components/ui/select-field';

const MOCK_DEFECT_PHOTO = 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=300&auto=format&fit=crop&q=80';
const CATEGORIES: MaintenanceCategory[] = ['PLUMBING', 'ELECTRICAL', 'FURNITURE', 'APPLIANCES', 'CLEANLINESS', 'OTHER'];
const PRIORITIES: MaintenancePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function MaintenanceScreen() {
  const { lang, maintenanceRequests, addMaintenanceRequest, activeRoom } = useApp();
  const t = getTranslation(lang);

  const [roomNumber, setRoomNumber] = useState(activeRoom?.roomNumber || '');
  const [category, setCategory] = useState<MaintenanceCategory>('PLUMBING');
  const [priority, setPriority] = useState<MaintenancePriority>('MEDIUM');
  const [description, setDescription] = useState('');
  const [blocksCleaning, setBlocksCleaning] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

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

  const handleSubmit = () => {
    if (!description.trim()) return;
    addMaintenanceRequest({ roomNumber, category, priority, description, blocksCleaning, photoUrl: photoUrl || undefined });
    setDescription('');
    setPhotoUrl('');
    setBlocksCleaning(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const activeCount = maintenanceRequests.filter((r) => r.status !== 'RESOLVED').length;
  const blockingCount = maintenanceRequests.filter((r) => r.status !== 'RESOLVED' && r.blocksCleaning).length;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-7 pb-4 gap-1.5">
        <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Техслужба' : 'Maintenance'}</Text>
        <Text className="text-sm font-jost text-text-secondary">
          <Text className="text-text-primary font-jost-semibold">{activeCount} </Text>
          {lang === 'RU' ? 'заявки в работе' : 'active tickets'}
          {blockingCount > 0 && (
            <Text className="text-error font-jost-semibold"> · {blockingCount} {lang === 'RU' ? 'блокирует уборку' : 'blocking cleaning'}</Text>
          )}
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20, gap: 16 }}>
        {showSuccess && (
          <View className="bg-[#FFFDF5] rounded-xl border border-warning/40 p-3.5 flex-row items-center gap-2.5">
            <CheckCircle size={18} color="#5B8C6E" />
            <Text className="text-sm font-jost text-text-primary flex-1">
              {lang === 'RU' ? 'Заявка успешно отправлена!' : 'Repair ticket submitted successfully!'}
            </Text>
          </View>
        )}

        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'НОВАЯ ЗАЯВКА' : 'NEW REQUEST'}
          </Text>

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
                onPress={() => setPhotoUrl(MOCK_DEFECT_PHOTO)}
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
              <Text className="text-white text-sm font-jost-semibold">
                {lang === 'RU' ? 'Отправить заявку' : 'Submit Ticket'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'ИСТОРИЯ ЗАЯВОК' : 'TICKET HISTORY'}
          </Text>

          {maintenanceRequests.length === 0 ? (
            <View className="bg-white rounded-[14px] border border-border p-8 items-center gap-2">
              <Wrench size={28} color="#8A8177" />
              <Text className="text-sm font-jost text-text-secondary">
                {lang === 'RU' ? 'Нет активных заявок' : 'No active reported tickets'}
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {maintenanceRequests.map((req) => {
                const isBlocked = req.blocksCleaning && req.status !== 'RESOLVED';
                return (
                  <View key={req.id} className="bg-white rounded-[14px] border border-border p-3.5 relative overflow-hidden gap-1.5">
                    {isBlocked && <View className="absolute left-0 top-0 bottom-0 w-[3px] bg-error" />}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-base font-jost-semibold text-text-primary">№ {req.roomNumber}</Text>
                        {isBlocked && (
                          <View className="bg-error/10 px-1.5 py-0.5 rounded">
                            <Text className="text-error text-[11px] font-jost-semibold uppercase tracking-wide">
                              {lang === 'RU' ? 'БЛОКИРУЕТ' : 'BLOCKS'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm font-jost text-text-secondary">
                        {req.status === 'CREATED' ? (lang === 'RU' ? 'создана' : 'created') :
                          req.status === 'IN_PROGRESS' ? (lang === 'RU' ? 'в работе' : 'in progress') :
                          (lang === 'RU' ? 'решено' : 'resolved')}
                      </Text>
                    </View>
                    <Text className="text-[13px] font-jost text-text-secondary leading-normal">
                      {getCategoryLabel(req.category)} · <Text className="text-text-primary">{req.description}</Text> · {req.timestamp}
                    </Text>
                    {!!req.photoUrl && <Image source={{ uri: req.photoUrl }} className="h-10 w-16 rounded border border-border mt-1" />}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
