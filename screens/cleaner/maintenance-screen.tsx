import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Wrench, CheckCircle } from 'lucide-react-native';
import { MaintenanceCategory } from '@/types';
import { getTranslation } from '@/lib/locales';
import { useApp } from '@/context/app-store';
import { MaintenanceRequestForm } from '@/components/maintenance-request-form';

export function MaintenanceScreen() {
  const { lang, maintenanceRequests, addMaintenanceRequest, activeRoom } = useApp();
  const t = getTranslation(lang);
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

      <KeyboardAvoidingView className="flex-1" behavior="padding">
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
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

          <MaintenanceRequestForm
            lang={lang}
            initialRoomNumber={activeRoom?.roomNumber}
            submitLabel={lang === 'RU' ? 'Отправить заявку' : 'Submit Ticket'}
            onSubmit={(values) => {
              addMaintenanceRequest(values);
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 3000);
            }}
          />
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
