import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useApp } from '@/context/app-store';
import { SollvieraLogo } from '@/components/sollviera-logo';

interface LoginScreenProps {
  onLoggedIn: () => void;
}

const DEMO_PROFILES = [
  { id: 'elena', nameRu: 'Елена Вэнс', nameEn: 'Elena Vance', roleRu: 'Клинер · 3 этаж', roleEn: 'Cleaner · Floor 3', email: 'housekeeper@demo.kz' },
  { id: 'marcus', nameRu: 'Маркус Броди', nameEn: 'Marcus Brody', roleRu: 'Клинер · 2 этаж', roleEn: 'Cleaner · Floor 2', email: 'marcus.brody@sollviera-pms.com' },
];

export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const { lang, authenticate } = useApp();
  const [hotelCodeInput, setHotelCodeInput] = useState('demo');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setIsSubmitting(true);
    setLoginError('');
    try {
      await authenticate(emailInput.trim(), passwordInput, hotelCodeInput.trim() || 'demo');
      onLoggedIn();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : lang === 'RU' ? 'Не удалось войти' : 'Unable to sign in');
    } finally {
      setIsSubmitting(false);
    }
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
                {loginError}
              </Text>
            </View>
          )}

          <View className="gap-1">
            <Text className="text-[12px] font-jost text-text-secondary">
              {lang === 'RU' ? 'Код отеля' : 'Hotel code'}
            </Text>
            <TextInput
              value={hotelCodeInput}
              onChangeText={setHotelCodeInput}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="demo"
              placeholderTextColor="#8A8177"
              className="w-full bg-background/30 border border-border rounded-xl px-3.5 py-3 text-sm text-text-primary"
            />
          </View>

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
            <Text className="text-white font-jost-semibold text-sm">{isSubmitting ? (lang === 'RU' ? 'Авторизация...' : 'Authenticating...') : (lang === 'RU' ? 'Войти на смену' : 'Login to shift')}</Text>
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
                  setPasswordInput('');
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
