import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { ChevronLeft, ChevronRight, QrCode, ShieldCheck } from 'lucide-react-native';
import { useApp, UNSUPPORTED_ROLE, type StaffRole } from '@/context/app-store';
import { LOGIN_QR_PREFIX, SHIFT_QR_PREFIX, qrPayloadFrom, type ApiSession } from '@/lib/api-client';
import { QrScannerModal } from '@/components/qr-scanner-modal';
import type { Language } from '@/types';
import { ForgotPasswordModal } from '@/components/password-modals';
import { SollvieraLogo } from '@/components/sollviera-logo';

interface LoginScreenProps {
  onLoggedIn: () => void;
}

const DEMO_PASSWORD = 'demo1234';

const DEMO_PROFILES = [
  { id: 'elena', nameRu: 'Елена Вэнс', nameEn: 'Elena Vance', roleRu: 'Клинер', roleEn: 'Cleaner', email: 'housekeeper@demo.kz' },
  { id: 'oleg', nameRu: 'Олег Петров', nameEn: 'Oleg Petrov', roleRu: 'Техник', roleEn: 'Technician', email: 'technician@demo.kz' },
  { id: 'anna', nameRu: 'Анна Петерсон', nameEn: 'Anna Peterson', roleRu: 'Супервизор', roleEn: 'Supervisor', email: 'supervisor@demo.kz' },
  { id: 'aigerim', nameRu: 'Айгерим Досова', nameEn: 'Aigerim Dossova', roleRu: 'Метрдотель', roleEn: 'Метрдотель', email: 'maitre@demo.kz' },
  { id: 'parking', nameRu: 'Парковка Демо', nameEn: 'Parking Demo', roleRu: 'Сотрудник парковки', roleEn: 'Parking attendant', email: 'parking@demo.kz' },
];

const ROLE_LABELS: Record<StaffRole, { ru: string; en: string }> = {
  CLEANER: { ru: 'Клинер', en: 'Cleaner' },
  TECHNICIAN: { ru: 'Техник', en: 'Technician' },
  SUPERVISOR: { ru: 'Супервизор', en: 'Supervisor' },
  WAITER: { ru: 'Официант', en: 'Waiter' },
  PARKING: { ru: 'Сотрудник парковки', en: 'Parking attendant' },
  RECEPTION: { ru: 'Администратор ресепшена', en: 'Front desk administrator' },
};

// Login errors worth translating (the rest come from the server as readable text).
function loginErrorText(error: unknown, lang: Language) {
  const message = error instanceof Error ? error.message : '';
  if (message === UNSUPPORTED_ROLE) {
    return lang === 'RU' ? 'Мобильное приложение пока не поддерживает эту должность.' : 'The mobile app does not support this role yet.';
  }
  // LOGIN_QR_INVALID and the like.
  if (message.startsWith('LOGIN_QR')) {
    return lang === 'RU'
      ? 'QR-код недействителен: срок действия истёк или код не предназначен для входа сотрудника.'
      : 'Invalid QR code: it has expired or is not meant for employee sign-in.';
  }
  return message || (lang === 'RU' ? 'Не удалось войти' : 'Unable to sign in');
}

export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const { lang, authenticate, previewQrLogin, completeQrLogin } = useApp();
  const ru = lang === 'RU';
  const insets = useSafeAreaInsets();
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrAccount, setQrAccount] = useState<{ session: ApiSession; role: StaffRole } | null>(null);
  const [qrSigningIn, setQrSigningIn] = useState(false);
  const [hotelCodeInput, setHotelCodeInput] = useState('demo');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async () => {
    setIsSubmitting(true);
    setLoginError('');
    try {
      await authenticate(emailInput.trim(), passwordInput, hotelCodeInput.trim() || 'demo');
      onLoggedIn();
    } catch (error) {
      setLoginError(loginErrorText(error, lang));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQrScan = async (data: string) => {
    const token = qrPayloadFrom(data, LOGIN_QR_PREFIX);
    if (!token) {
      throw new Error(
        qrPayloadFrom(data, SHIFT_QR_PREFIX)
          ? ru ? 'Это QR смены. Для входа нужен личный QR-код — его выдают на ресепшн.' : 'This is a shift QR. Sign-in needs your personal QR code from the front desk.'
          : ru ? 'Это не QR-код для входа сотрудника.' : 'This is not an employee sign-in QR code.'
      );
    }
    try {
      setQrAccount(await previewQrLogin(token));
      setShowQrScanner(false);
    } catch (error) {
      throw new Error(loginErrorText(error, lang));
    }
  };

  const confirmQrLogin = async () => {
    if (!qrAccount) return;
    setQrSigningIn(true);
    try {
      await completeQrLogin(qrAccount.session);
      setQrAccount(null);
      onLoggedIn();
    } catch (error) {
      setQrAccount(null);
      setLoginError(loginErrorText(error, lang));
    } finally {
      setQrSigningIn(false);
    }
  };

  const qrUser = qrAccount?.session.user;
  const qrName = qrUser?.fullName || qrUser?.email || '';

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
    <KeyboardAvoidingView className="flex-1" behavior="padding">
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', padding: 20, gap: 24 }}
      keyboardShouldPersistTaps="handled"
    >
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
            onPress={() => setShowQrScanner(true)}
            className="w-full py-3 rounded-xl border border-border flex-row items-center justify-center gap-2 active:bg-background"
          >
            <QrCode size={16} color="#241E1A" />
            <Text className="text-text-primary font-jost-semibold text-sm">{ru ? 'Войти по QR-коду' : 'Sign in with QR code'}</Text>
          </Pressable>

          <Pressable onPress={() => setShowForgot(true)}>
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
                  setPasswordInput(DEMO_PASSWORD);
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
                    <Text className="text-[12px] text-text-secondary font-jost mt-0.5">
                      {lang === 'RU' ? profile.roleRu : profile.roleEn} · {profile.email}
                    </Text>
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
      <QrScannerModal
        visible={showQrScanner}
        lang={lang}
        title={ru ? 'Вход по QR-коду' : 'Sign in with QR'}
        hint={ru ? 'Наведите камеру на личный QR-код сотрудника.' : 'Point the camera at your personal employee QR code.'}
        onClose={() => setShowQrScanner(false)}
        onScan={handleQrScan}
      />

      {/* Whose account the QR opens — confirmed before signing in */}
      <Modal visible={!!qrAccount} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setQrAccount(null)}>
        {/* SafeAreaView gets no insets inside a Modal, so pad by the screen's own insets. */}
        <View className="flex-1 bg-background px-5 gap-4" style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom }}>
          <View className="gap-1.5">
            <View className="flex-row items-center gap-2 -ml-1">
              <Pressable onPress={() => setQrAccount(null)} hitSlop={12}>
                <ChevronLeft size={24} color="#241E1A" />
              </Pressable>
              <Text className="text-2xl font-spectral text-text-primary">{ru ? 'Аккаунт найден' : 'Account found'}</Text>
            </View>
            <Text className="text-xs font-jost text-text-secondary">{ru ? 'Проверьте профиль перед входом' : 'Verify the profile before signing in'}</Text>
          </View>

          {qrAccount && qrUser && (
            <View className="bg-white rounded-[16px] border border-border overflow-hidden">
              <View className="p-5 flex-row items-center gap-3.5">
                <View className="h-14 w-14 rounded-full bg-primary-light items-center justify-center">
                  <Text className="text-text-primary font-jost text-sm">
                    {qrName.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-spectral text-text-primary" numberOfLines={2}>{qrName}</Text>
                  <Text className="text-xs font-jost text-text-secondary mt-1">
                    {ru ? ROLE_LABELS[qrAccount.role].ru : ROLE_LABELS[qrAccount.role].en}
                    {qrUser.department ? ` · ${qrUser.department}` : ''}
                  </Text>
                </View>
              </View>
              {!!qrUser.tenantSlug && (
                <View className="px-5 py-3.5 border-t border-border-light flex-row justify-between">
                  <Text className="text-xs font-jost text-text-secondary">{ru ? 'Код отеля' : 'Hotel code'}</Text>
                  <Text className="text-xs font-jost text-text-primary">{qrUser.tenantSlug}</Text>
                </View>
              )}
              {!!qrUser.badgeNumber && (
                <View className="px-5 py-3.5 border-t border-border-light flex-row justify-between">
                  <Text className="text-xs font-jost text-text-secondary">{ru ? 'Табельный номер' : 'Staff ID'}</Text>
                  <Text className="text-xs font-jost text-text-primary">{qrUser.badgeNumber}</Text>
                </View>
              )}
            </View>
          )}

          <View className="bg-primary-light/40 border border-border rounded-[14px] p-4 flex-row items-start gap-2.5">
            <ShieldCheck size={16} color="#8A8177" />
            <Text className="flex-1 text-xs font-jost text-text-secondary leading-relaxed">
              {ru ? 'Вход по личному QR-коду. Смену нужно начать отдельно в профиле.' : 'Signing in with a personal QR code. Start your shift separately in the profile.'}
            </Text>
          </View>

          <View className="gap-2.5">
            <Pressable onPress={confirmQrLogin} disabled={qrSigningIn} className="w-full bg-primary py-3.5 rounded-xl items-center active:bg-primary-hover">
              <Text className="text-white font-jost-semibold text-sm">
                {qrSigningIn ? (ru ? 'Авторизация...' : 'Signing in...') : ru ? 'Войти в аккаунт' : 'Sign in to account'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setQrAccount(null);
                setShowQrScanner(true);
              }}
              disabled={qrSigningIn}
              className="w-full bg-white border border-border py-3.5 rounded-xl items-center active:bg-background"
            >
              <Text className="text-text-primary font-jost text-sm">{ru ? 'Сканировать другой код' : 'Scan another code'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ForgotPasswordModal
        visible={showForgot}
        lang={lang}
        initialEmail={emailInput.trim()}
        tenantSlug={hotelCodeInput.trim() || 'demo'}
        onClose={() => setShowForgot(false)}
        onReset={(email) => {
          setShowForgot(false);
          setEmailInput(email);
          setPasswordInput('');
          Alert.alert('', lang === 'RU' ? 'Пароль изменён. Войдите с новым паролем.' : 'Password changed. Sign in with the new password.');
        }}
      />
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
