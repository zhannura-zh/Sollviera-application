import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { mockCleaners } from '@/data/mockData';
import { SollvieraLogo } from '@/components/sollviera-logo';

interface LoginScreenProps {
  onLoggedIn: () => void;
}

const DEMO_PROFILES = [
  { id: 'elena', matches: ['elena', '8042'], profileIndex: 0, nameRu: 'Елена Вэнс', nameEn: 'Elena Vance', roleRu: 'Клинер · 3 этаж', roleEn: 'Cleaner · Floor 3', email: 'elena.vance@sollviera-pms.com' },
  { id: 'svetlana', matches: ['svetlana', '7701'], profileIndex: 2, nameRu: 'Светлана Ким', nameEn: 'Svetlana Kim', roleRu: 'Супервизор', roleEn: 'Supervisor', email: 'svetlana.kim@sollviera-pms.com' },
  { id: 'oleg', matches: ['oleg', '5501'], profileIndex: 3, nameRu: 'Олег Петров', nameEn: 'Oleg Petrov', roleRu: 'Техник', roleEn: 'Technician', email: 'oleg.petrov@sollviera-pms.com' },
  { id: 'aigerim', matches: ['aigerim', 'dossova', '4092'], profileIndex: 4, nameRu: 'Айгерим Досова', nameEn: 'Aigerim Dossova', roleRu: 'Официант', roleEn: 'Waiter', email: 'aigerim.dossova@sollviera-pms.com' },
];

export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const { lang, login } = useApp();
  const [emailInput, setEmailInput] = useState('elena.vance@sollviera.com');
  const [passwordInput, setPasswordInput] = useState('••••••••');
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const matched = mockCleaners.find(
      (c) =>
        c.email.toLowerCase() === cleanEmail ||
        cleanEmail.includes(c.badgeId.toLowerCase()) ||
        cleanEmail.includes(c.fullName.toLowerCase().split(' ')[0])
    );

    if (matched) {
      login(matched);
      setLoginError(false);
      onLoggedIn();
      return;
    }

    const demo = DEMO_PROFILES.find((d) => d.matches.some((m) => cleanEmail.includes(m)));
    if (demo) {
      login(mockCleaners[demo.profileIndex]);
      setLoginError(false);
      onLoggedIn();
      return;
    }

    setLoginError(true);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
    <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', padding: 20, gap: 24 }}>
      <View className="gap-5">
        <View className="items-center pt-8 pb-3">
          <SollvieraLogo size={96} />
          <Text className="text-[30px] font-spectral tracking-[3px] text-text-primary uppercase pt-4">SOLLVIERA</Text>
        </View>

        <View className="bg-white rounded-[14px] border border-border p-5 gap-4">
          {loginError && (
            <View className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <Text className="text-sm text-error font-jost">
                {lang === 'RU' ? 'Неверные данные. Воспользуйтесь демо-аккаунтами ниже.' : 'Invalid credentials. Please use quick demo accounts below.'}
              </Text>
            </View>
          )}

          <View className="gap-1">
            <Text className="text-[12px] font-jost text-text-secondary">
              {lang === 'RU' ? 'Email или табельный номер' : 'Email or Staff ID'}
            </Text>
            <TextInput
              value={emailInput}
              onChangeText={setEmailInput}
              autoCapitalize="none"
              placeholder="elena.vance@sollviera.com"
              placeholderTextColor="#8A8177"
              className="w-full bg-background/30 border border-border rounded-xl px-3.5 py-3 text-sm text-text-primary"
            />
          </View>

          <View className="gap-1">
            <Text className="text-[12px] font-jost text-text-secondary">{lang === 'RU' ? 'Пароль' : 'Password'}</Text>
            <View className="relative">
              <TextInput
                value={passwordInput}
                onChangeText={setPasswordInput}
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor="#8A8177"
                className="w-full bg-background/30 border border-border rounded-xl px-3.5 py-3 pr-16 text-sm text-text-primary"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-0 bottom-0 justify-center">
                <Text className="text-sm font-jost text-primary">
                  {showPassword ? (lang === 'RU' ? 'Скрыть' : 'Hide') : (lang === 'RU' ? 'Показать' : 'Show')}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable onPress={handleLogin} className="w-full bg-primary py-3 rounded-xl items-center active:bg-primary-hover">
            <Text className="text-white font-jost-semibold text-sm">{lang === 'RU' ? 'Войти на смену' : 'Login to shift'}</Text>
          </Pressable>

          <Pressable
            onPress={() => Alert.alert('', lang === 'RU' ? 'Связаться с ИТ-поддержкой: +7 (800) 100-20-30' : 'Contact IT Helpdesk: +7 (800) 100-20-30')}
          >
            <Text className="text-center text-sm font-jost text-primary pt-1">
              {lang === 'RU' ? 'Забыли пароль?' : 'Forgot password?'}
            </Text>
          </Pressable>
        </View>

        <View className="gap-2">
          <Text className="text-[12px] text-text-secondary font-jost tracking-widest uppercase px-1">
            {lang === 'RU' ? 'ДЕМО-ПРОФИЛИ' : 'DEMO PROFILES'}
          </Text>
          <View className="bg-white rounded-[14px] border border-border overflow-hidden">
            {DEMO_PROFILES.map((profile, i) => (
              <Pressable
                key={profile.id}
                onPress={() => {
                  setEmailInput(profile.email);
                  setPasswordInput(`${profile.id}${profile.matches[profile.matches.length - 1]}`);
                }}
                className={`p-4 flex-row items-center justify-between active:bg-background ${
                  i < DEMO_PROFILES.length - 1 ? 'border-b border-border-light' : ''
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 rounded-full bg-primary-light items-center justify-center border border-border">
                    <Text className="text-text-primary font-jost text-sm">
                      {(lang === 'RU' ? profile.nameRu : profile.nameEn).split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-sm font-jost-semibold text-text-primary">{lang === 'RU' ? profile.nameRu : profile.nameEn}</Text>
                    <Text className="text-[12px] text-text-secondary font-jost mt-0.5">{lang === 'RU' ? profile.roleRu : profile.roleEn}</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#8A8177" />
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Text className="text-[12px] text-text-secondary font-jost tracking-wide text-center">
        {lang === 'RU' ? 'Sollviera PMS v2.4 • Мобильный клининг' : 'Sollviera PMS v2.4 • Housekeeping Mobile'}
      </Text>
    </ScrollView>
    </SafeAreaView>
  );
}
