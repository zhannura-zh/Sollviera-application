import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, ActivityIndicator } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { requestPasswordReset, resetPassword } from '@/lib/api-client';

type Lang = 'RU' | 'EN';

const MIN_PASSWORD_LENGTH = 6;

function Field({
  label,
  value,
  onChangeText,
  secure,
  keyboardType,
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
  keyboardType?: 'email-address' | 'number-pad';
  autoFocus?: boolean;
}) {
  return (
    <View>
      <Text className="text-[11px] text-text-secondary uppercase tracking-wider mb-0.5">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
        className="w-full bg-background border border-border rounded-xl px-2.5 py-2 text-sm text-text-primary"
      />
    </View>
  );
}

function Shell({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1 items-center justify-center bg-dark/60 p-4" behavior="padding">
        <View className="bg-white rounded-[24px] w-full max-w-xs p-5 gap-4 border border-border">
          <View className="flex-row items-center justify-between border-b border-border-light pb-2">
            <Text className="text-base font-jost text-text-primary">{title}</Text>
            <Pressable onPress={onClose} className="h-6 w-6 rounded-full bg-slate-50 items-center justify-center">
              <Text className="text-text-secondary font-jost-semibold">×</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Buttons({
  lang,
  onCancel,
  onSubmit,
  submitLabel,
  disabled,
  busy,
}: {
  lang: Lang;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  disabled: boolean;
  busy: boolean;
}) {
  return (
    <View className="flex-row gap-2 pt-2 border-t border-border-light">
      <Pressable onPress={onCancel} className="flex-1 py-2 border border-border rounded-xl items-center">
        <Text className="text-text-secondary font-jost text-sm">{lang === 'RU' ? 'Отмена' : 'Cancel'}</Text>
      </Pressable>
      <Pressable
        onPress={onSubmit}
        disabled={disabled || busy}
        className={`flex-1 py-2 rounded-xl items-center ${disabled || busy ? 'bg-border' : 'bg-primary active:bg-primary-hover'}`}
      >
        {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-jost text-sm">{submitLabel}</Text>}
      </Pressable>
    </View>
  );
}

function newPasswordProblem(lang: Lang, next: string, repeat: string): string | null {
  if (next.length > 0 && next.length < MIN_PASSWORD_LENGTH) {
    return lang === 'RU' ? `Минимум ${MIN_PASSWORD_LENGTH} символов` : `At least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (repeat.length > 0 && next !== repeat) return lang === 'RU' ? 'Пароли не совпадают' : 'Passwords do not match';
  return null;
}

const errorText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

// Settings → "Сменить пароль" (POST /staff/me/password).
export function ChangePasswordModal({
  visible,
  lang,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  lang: Lang;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCurrent('');
    setNext('');
    setRepeat('');
    setError(null);
    setDone(false);
  }, [visible]);

  const problem = newPasswordProblem(lang, next, repeat);
  const canSubmit = !!current && next.length >= MIN_PASSWORD_LENGTH && next === repeat;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSubmit(current, next);
      setDone(true);
    } catch (e) {
      setError(errorText(e, lang === 'RU' ? 'Не удалось сменить пароль' : 'Could not change password'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell visible={visible} title={lang === 'RU' ? 'Смена пароля' : 'Change password'} onClose={onClose}>
      {done ? (
        <>
          <Text className="text-sm font-jost text-text-primary">{lang === 'RU' ? 'Пароль изменён.' : 'Password changed.'}</Text>
          <Pressable onPress={onClose} className="py-2 bg-primary rounded-xl items-center active:bg-primary-hover">
            <Text className="text-white font-jost text-sm">OK</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View className="gap-2.5">
            <Field label={lang === 'RU' ? 'Текущий пароль' : 'Current password'} value={current} onChangeText={setCurrent} secure autoFocus />
            <Field label={lang === 'RU' ? 'Новый пароль' : 'New password'} value={next} onChangeText={setNext} secure />
            <Field label={lang === 'RU' ? 'Повторите новый' : 'Repeat new password'} value={repeat} onChangeText={setRepeat} secure />
            {!!(problem || error) && <Text className="text-[12px] font-jost text-error">{problem || error}</Text>}
          </View>
          <Buttons lang={lang} onCancel={onClose} onSubmit={submit} submitLabel={lang === 'RU' ? 'Сменить' : 'Change'} disabled={!canSubmit} busy={busy} />
        </>
      )}
    </Shell>
  );
}

// Login → "Забыли пароль?": email → 6-digit code from the email + new password.
export function ForgotPasswordModal({
  visible,
  lang,
  initialEmail,
  tenantSlug,
  onClose,
  onReset,
}: {
  visible: boolean;
  lang: Lang;
  initialEmail: string;
  tenantSlug: string;
  onClose: () => void;
  onReset: (email: string) => void;
}) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setStep('email');
    setEmail(initialEmail);
    setCode('');
    setNext('');
    setRepeat('');
    setError(null);
  }, [visible, initialEmail]);

  const sendCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await requestPasswordReset(email.trim(), tenantSlug);
      setStep('code');
    } catch (e) {
      setError(errorText(e, lang === 'RU' ? 'Не удалось отправить код' : 'Could not send the code'));
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async () => {
    setBusy(true);
    setError(null);
    try {
      await resetPassword(email.trim(), code.trim(), next, tenantSlug);
      onReset(email.trim());
    } catch (e) {
      setError(errorText(e, lang === 'RU' ? 'Неверный код или он истёк' : 'Invalid or expired code'));
    } finally {
      setBusy(false);
    }
  };

  const problem = step === 'code' ? newPasswordProblem(lang, next, repeat) : null;

  return (
    <Shell visible={visible} title={lang === 'RU' ? 'Восстановление пароля' : 'Reset password'} onClose={onClose}>
      {step === 'email' ? (
        <>
          <View className="gap-2.5">
            <Text className="text-[13px] font-jost text-text-secondary">
              {lang === 'RU' ? 'Пришлём 6-значный код на рабочую почту.' : "We'll email you a 6-digit code."}
            </Text>
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoFocus />
            {!!error && <Text className="text-[12px] font-jost text-error">{error}</Text>}
          </View>
          <Buttons
            lang={lang}
            onCancel={onClose}
            onSubmit={sendCode}
            submitLabel={lang === 'RU' ? 'Получить код' : 'Send code'}
            disabled={!/^\S+@\S+\.\S+$/.test(email.trim())}
            busy={busy}
          />
        </>
      ) : (
        <>
          <View className="gap-2.5">
            <Text className="text-[13px] font-jost text-text-secondary">
              {lang === 'RU' ? `Код отправлен на ${email.trim()}` : `Code sent to ${email.trim()}`}
            </Text>
            <Field
              label={lang === 'RU' ? 'Код из письма' : 'Code from email'}
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              autoFocus
            />
            <Field label={lang === 'RU' ? 'Новый пароль' : 'New password'} value={next} onChangeText={setNext} secure />
            <Field label={lang === 'RU' ? 'Повторите пароль' : 'Repeat password'} value={repeat} onChangeText={setRepeat} secure />
            {!!(problem || error) && <Text className="text-[12px] font-jost text-error">{problem || error}</Text>}
            <Pressable onPress={sendCode} disabled={busy}>
              <Text className="text-[12px] font-jost text-primary">{lang === 'RU' ? 'Отправить код ещё раз' : 'Resend code'}</Text>
            </Pressable>
          </View>
          <Buttons
            lang={lang}
            onCancel={onClose}
            onSubmit={submitReset}
            submitLabel={lang === 'RU' ? 'Сохранить' : 'Save'}
            disabled={code.length !== 6 || next.length < MIN_PASSWORD_LENGTH || next !== repeat}
            busy={busy}
          />
        </>
      )}
    </Shell>
  );
}
