import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { useFonts, Spectral_500Medium } from '@expo-google-fonts/spectral';
import { Jost_400Regular, Jost_500Medium, Jost_600SemiBold } from '@expo-google-fonts/jost';
import {
  LayoutDashboard, ShieldCheck, Wrench, Users, User, BookOpen, UtensilsCrossed, Coffee, Sparkles, MessageSquare, Bell, Settings, X, Send, Check
} from 'lucide-react-native';
import { Language, HotelRoom, CleanerProfile, MaintenanceRequest } from './types';
import { mockRooms, mockCleaners, mockMaintenanceRequests } from './data/mockData';
import { COLORS, FONTS } from './theme/tokens';
import { SollvieraLogo } from './components/native/SollvieraLogo.native';
import { HousekeepingScreensNative } from './components/native/HousekeepingScreens.native';
import { SupervisorScreensNative } from './components/native/SupervisorScreens.native';
import { TechnicianScreensNative } from './components/native/TechnicianScreens.native';
import { WaiterScreensNative } from './components/native/WaiterScreens.native';
import { DirectorScreensNative } from './components/native/DirectorScreens.native';

export default function App() {
  const [fontsLoaded] = useFonts({
    Spectral_500Medium,
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold
  });

  const [currentRole, setCurrentRole] = useState<'CLEANER' | 'SUPERVISOR' | 'TECH' | 'WAITER' | 'DIRECTOR'>('SUPERVISOR');
  const [lang, setLang] = useState<Language>('RU');
  const [activeTab, setActiveTab] = useState<string>('SV_PROFILE');
  const [rooms, setRooms] = useState<HotelRoom[]>(mockRooms);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(mockMaintenanceRequests);

  // Modals state
  const [showChatModal, setShowChatModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'Жанна Абаева (Супервайзер)', text: 'В номере 304 гость просит дополнительный комплект полотенец', time: '10:14', isMe: false },
    { id: '2', sender: 'Я', text: 'Принято, сейчас доставлю', time: '10:16', isMe: true }
  ]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'System', fontSize: 16, color: COLORS.dark }}>Sollviera PMS...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Top Brand & Role Switcher Header */}
      <View style={styles.appHeader}>
        <View style={styles.brandRow}>
          <SollvieraLogo size={24} color={COLORS.dark} />
          <Text style={styles.brandTitle}>SOLLVIERA</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleScrollView}>
          {(['CLEANER', 'SUPERVISOR', 'TECH', 'WAITER', 'DIRECTOR'] as const).map(role => {
            const active = currentRole === role;
            const labels: Record<string, string> = {
              CLEANER: 'Клинер',
              SUPERVISOR: 'Супервайзер',
              TECH: 'Техник',
              WAITER: 'Официант',
              DIRECTOR: 'Директор'
            };
            return (
              <TouchableOpacity
                key={role}
                onPress={() => {
                  setCurrentRole(role);
                  if (role === 'SUPERVISOR') setActiveTab('SV_PROFILE');
                  else if (role === 'WAITER') setActiveTab('WAITER_TODAY');
                  else setActiveTab('MAIN');
                }}
                style={[styles.roleChip, active && styles.roleChipActive]}
              >
                <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>{labels[role]}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Screen Router */}
      <View style={styles.mainContent}>
        {currentRole === 'SUPERVISOR' && (
          <SupervisorScreensNative
            lang={lang}
            rooms={rooms}
            onUpdateRooms={setRooms}
            maintenanceRequests={maintenanceRequests}
            onUpdateMaintenanceRequests={setMaintenanceRequests}
            cleanerProfile={mockCleaners[0]}
            onLogout={() => setCurrentRole('CLEANER')}
            activeTab={activeTab as any}
            onOpenChat={() => setShowChatModal(true)}
            onOpenNotifications={() => setShowNotificationsModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        )}

        {currentRole === 'CLEANER' && (
          <HousekeepingScreensNative
            lang={lang}
            rooms={rooms}
            onUpdateRooms={setRooms}
            maintenanceRequests={maintenanceRequests}
            onUpdateMaintenanceRequests={setMaintenanceRequests}
            cleanerProfile={mockCleaners[0]}
            onLogout={() => setCurrentRole('SUPERVISOR')}
            activeTab={activeTab}
            onOpenChat={() => setShowChatModal(true)}
            onOpenNotifications={() => setShowNotificationsModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        )}

        {currentRole === 'TECH' && (
          <TechnicianScreensNative
            lang={lang}
            rooms={rooms}
            maintenanceRequests={maintenanceRequests}
            onUpdateMaintenanceRequests={setMaintenanceRequests}
            onLogout={() => setCurrentRole('SUPERVISOR')}
            activeTab={activeTab}
            onOpenChat={() => setShowChatModal(true)}
            onOpenNotifications={() => setShowNotificationsModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        )}

        {currentRole === 'WAITER' && (
          <WaiterScreensNative
            lang={lang}
            onLogout={() => setCurrentRole('SUPERVISOR')}
            activeTab={activeTab as any}
            onOpenChat={() => setShowChatModal(true)}
            onOpenNotifications={() => setShowNotificationsModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        )}

        {currentRole === 'DIRECTOR' && (
          <DirectorScreensNative
            lang={lang}
            rooms={rooms}
            onLogout={() => setCurrentRole('SUPERVISOR')}
            activeTab={activeTab}
            onOpenChat={() => setShowChatModal(true)}
            onOpenNotifications={() => setShowNotificationsModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        )}
      </View>

      {/* Supervisor Bottom Tab Bar */}
      {currentRole === 'SUPERVISOR' && (
        <View style={styles.bottomTabBar}>
          {[
            { key: 'SV_DASHBOARD', label: 'Обзор', icon: LayoutDashboard },
            { key: 'SV_INSPECTION', label: 'Инспекция', icon: ShieldCheck },
            { key: 'SV_MAINTENANCE', label: 'Техслужба', icon: Wrench },
            { key: 'SV_TEAM', label: 'Команда', icon: Users },
            { key: 'SV_PROFILE', label: 'Профиль', icon: User }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={styles.tabItem}
              >
                <Icon size={20} color={active ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.tabItemLabel, active && styles.tabItemLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Waiter Bottom Tab Bar (5 Tabs) */}
      {currentRole === 'WAITER' && (
        <View style={styles.bottomTabBar}>
          {[
            { key: 'WAITER_TODAY', label: 'Сегодня', icon: Coffee },
            { key: 'WAITER_HALL', label: 'Зал', icon: UtensilsCrossed },
            { key: 'WAITER_ROOM', label: 'В номер', icon: Sparkles },
            { key: 'WAITER_MENU', label: 'Меню', icon: BookOpen },
            { key: 'WAITER_PROFILE', label: 'Профиль', icon: User }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={styles.tabItem}
              >
                <Icon size={20} color={active ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.tabItemLabel, active && styles.tabItemLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* CHAT MODAL */}
      <Modal visible={showChatModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { height: '80%' }]}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Рабочий чат отеля</Text>
              <TouchableOpacity onPress={() => setShowChatModal(false)} style={styles.closeBtn}>
                <X size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1, marginVertical: 12 }}>
              {chatMessages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.chatBubbleWrap,
                    msg.isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }
                  ]}
                >
                  <Text style={styles.chatSender}>{msg.sender}</Text>
                  <View style={[styles.chatBubble, msg.isMe ? styles.chatBubbleMe : styles.chatBubbleOther]}>
                    <Text style={[styles.chatText, msg.isMe && { color: '#FFFFFF' }]}>{msg.text}</Text>
                  </View>
                  <Text style={styles.chatTime}>{msg.time}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.chatInputRow}>
              <TextInput
                placeholder="Напишите сообщение..."
                placeholderTextColor={COLORS.textSecondary}
                value={chatMessage}
                onChangeText={setChatMessage}
                style={styles.chatInput}
              />
              <TouchableOpacity
                onPress={() => {
                  if (!chatMessage.trim()) return;
                  setChatMessages(p => [
                    ...p,
                    { id: '' + Date.now(), sender: 'Я', text: chatMessage, time: 'сейчас', isMe: true }
                  ]);
                  setChatMessage('');
                }}
                style={styles.chatSendBtn}
              >
                <Send size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NOTIFICATIONS MODAL */}
      <Modal visible={showNotificationsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Уведомления</Text>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)} style={styles.closeBtn}>
                <X size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 14 }}>
              <View style={styles.notifItem}>
                <View style={[styles.notifDot, { backgroundColor: COLORS.warning }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Приёмка: Номер 306 убран</Text>
                  <Text style={styles.notifSub}>Клинер Елена Вэнс закончила уборку · 5 мин назад</Text>
                </View>
              </View>
              <View style={[styles.notifItem, { borderTopWidth: 1, borderTopColor: COLORS.borderLight, marginTop: 10, paddingTop: 10 }]}>
                <View style={[styles.notifDot, { backgroundColor: COLORS.error }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Заявка: Протечка в душе №315</Text>
                  <Text style={styles.notifSub}>Техслужба уведомлена · 12 мин назад</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* SETTINGS MODAL */}
      <Modal visible={showSettingsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Настройки приложения</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)} style={styles.closeBtn}>
                <X size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 14 }}>
              <Text style={styles.inputLabel}>Язык интерфейса</Text>
              <View style={styles.langRow}>
                <TouchableOpacity
                  onPress={() => setLang('RU')}
                  style={[styles.langBtn, lang === 'RU' && styles.langBtnActive]}
                >
                  <Text style={[styles.langBtnText, lang === 'RU' && styles.langBtnTextActive]}>Русский (RU)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLang('EN')}
                  style={[styles.langBtn, lang === 'EN' && styles.langBtnActive]}
                >
                  <Text style={[styles.langBtnText, lang === 'EN' && styles.langBtnTextActive]}>English (EN)</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.card, { marginTop: 14 }]}>
                <Text style={styles.settingNoteTitle}>Автономный режим</Text>
                <Text style={styles.settingNoteSub}>Локальное кэширование и синхронизация при появлении сети активны</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  appHeader: { backgroundColor: '#FAF6F0', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  brandTitle: { fontFamily: FONTS.spectral500, fontSize: 16, letterSpacing: 1.5, color: COLORS.dark },
  roleScrollView: { flexDirection: 'row' },
  roleChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  roleChipActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  roleChipText: { fontFamily: FONTS.jost400, fontSize: 11, color: COLORS.textSecondary },
  roleChipTextActive: { fontFamily: FONTS.jost500, color: '#FFFFFF' },
  mainContent: { flex: 1 },
  bottomTabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: COLORS.border, paddingVertical: 8, paddingBottom: Platform.OS === 'ios' ? 14 : 8 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabItemLabel: { fontFamily: FONTS.jost400, fontSize: 10, color: COLORS.textSecondary, marginTop: 3 },
  tabItemLabelActive: { fontFamily: FONTS.jost500, color: COLORS.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontFamily: FONTS.spectral500, fontSize: 18, color: COLORS.dark },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  chatBubbleWrap: { marginBottom: 10 },
  chatSender: { fontFamily: FONTS.jost400, fontSize: 10, color: COLORS.textSecondary, marginBottom: 2 },
  chatBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, maxWidth: '80%' },
  chatBubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  chatBubbleOther: { backgroundColor: '#EFECE6', borderBottomLeftRadius: 4 },
  chatText: { fontFamily: FONTS.jost400, fontSize: 13, color: COLORS.dark },
  chatTime: { fontFamily: FONTS.jost400, fontSize: 9, color: COLORS.textSecondary, marginTop: 2 },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  chatInput: { flex: 1, backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontFamily: FONTS.jost400, fontSize: 13, color: COLORS.dark },
  chatSendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  notifItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifDot: { width: 8, height: 8, borderRadius: 4 },
  notifTitle: { fontFamily: FONTS.jost500, fontSize: 13, color: COLORS.dark },
  notifSub: { fontFamily: FONTS.jost400, fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  inputLabel: { fontFamily: FONTS.jost500, fontSize: 10, textTransform: 'uppercase', color: COLORS.textSecondary, marginBottom: 6 },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.backgroundCard, alignItems: 'center', justifyContent: 'center' },
  langBtnActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  langBtnText: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary },
  langBtnTextActive: { fontFamily: FONTS.jost500, color: '#FFFFFF' },
  card: { backgroundColor: COLORS.backgroundCard, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14 },
  settingNoteTitle: { fontFamily: FONTS.jost500, fontSize: 13, color: COLORS.dark },
  settingNoteSub: { fontFamily: FONTS.jost400, fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }
});
