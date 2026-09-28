import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { CheckCircle } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { MaintenanceRequestForm } from '@/components/maintenance-request-form';

export function CreateTicketScreen() {
  const { lang, addMaintenanceRequest } = useApp();
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-5 pt-7 pb-4 gap-1.5">
        <Text className="text-2xl font-spectral text-text-primary">{lang === 'RU' ? 'Новая заявка' : 'New ticket'}</Text>
        <Text className="text-sm font-jost text-text-secondary">
          {lang === 'RU' ? 'Зарегистрируйте неисправность вручную' : 'Log a defect you found yourself'}
        </Text>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior="padding">
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        {showSuccess && (
          <View className="bg-[#FFFDF5] rounded-xl border border-warning/40 p-3.5 flex-row items-center gap-2.5">
            <CheckCircle size={18} color="#5B8C6E" />
            <Text className="text-sm font-jost text-text-primary flex-1">
              {lang === 'RU' ? 'Заявка успешно создана!' : 'Ticket created successfully!'}
            </Text>
          </View>
        )}

        <MaintenanceRequestForm
          lang={lang}
          submitLabel={lang === 'RU' ? 'Создать заявку' : 'Create ticket'}
          onSubmit={(values) => {
            addMaintenanceRequest(values);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          }}
        />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
