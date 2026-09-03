import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert
} from 'react-native';
import {
  Sparkles, CheckCircle2, AlertTriangle, Clock, Camera, Plus, Minus,
  ChevronRight, ChevronLeft, Check, X, Wrench, Wine, Package,
  Layers, User, Calendar, LogOut, MessageSquare, Bell, Settings
} from 'lucide-react-native';
import { Language, HotelRoom, RoomStatus, CleanerProfile, MaintenanceRequest } from '../../types';
import { COLORS, FONTS } from '../../theme/tokens';

interface HousekeepingScreensNativeProps {
  lang: Language;
  rooms: HotelRoom[];
  onUpdateRooms: (rooms: HotelRoom[]) => void;
  maintenanceRequests: MaintenanceRequest[];
  onUpdateMaintenanceRequests: (reqs: MaintenanceRequest[]) => void;
  cleanerProfile: CleanerProfile;
  onLogout: () => void;
  activeTab: string;
  onOpenChat?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
}

export const HousekeepingScreensNative: React.FC<HousekeepingScreensNativeProps> = ({
  lang,
  rooms,
  onUpdateRooms,
  maintenanceRequests,
  onUpdateMaintenanceRequests,
  cleanerProfile,
  onLogout,
  activeTab,
  onOpenChat,
  onOpenNotifications,
  onOpenSettings
}) => {
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [roomTab, setRoomTab] = useState<'CHECKLIST' | 'MINIBAR' | 'DEFECT'>('CHECKLIST');
  const [checklistTasks, setChecklistTasks] = useState([
    { id: '1', zone: 'Спальня', title: 'Смена постельного белья и наволочек', done: true },
    { id: '2', zone: 'Спальня', title: 'Пылесос ковролина и влажная уборка пола', done: true },
    { id: '3', zone: 'Спальня', title: 'Протирка пыли со столов и тумбочек', done: false },
    { id: '4', zone: 'Санузел', title: 'Дезинфекция ванны, раковины и унитаза', done: false },
    { id: '5', zone: 'Санузел', title: 'Замена комплекта полотенец и косметики', done: false }
  ]);

  const [minibarItems, setMinibarItems] = useState([
    { id: 'mb-1', name: 'Вода 0.5л', standard: 4, current: 2 },
    { id: 'mb-2', name: 'Сок яблочный', standard: 2, current: 1 },
    { id: 'mb-3', name: 'Шоколад', standard: 2, current: 2 }
  ]);

  const [defectDesc, setDefectDesc] = useState('');
  const [defectCategory, setDefectCategory] = useState('Сантехника');

  const myRooms = rooms.filter(r => r.assignedCleanerId === cleanerProfile.id || !r.assignedCleanerId);
  const doneCount = myRooms.filter(r => r.status === 'READY').length;

  if (selectedRoom) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => setSelectedRoom(null)} style={styles.backButton}>
              <ChevronLeft size={24} color={COLORS.dark} />
            </TouchableOpacity>
            <View>
              <Text style={styles.screenTitle}>{lang === 'RU' ? 'Номер' : 'Room'} {selectedRoom.number}</Text>
              <Text style={styles.screenSubtitle}>{selectedRoom.type} · {selectedRoom.floor} {lang === 'RU' ? 'этаж' : 'floor'}</Text>
            </View>
          </View>

          <View style={styles.segmentRow}>
            <TouchableOpacity onPress={() => setRoomTab('CHECKLIST')} style={[styles.segmentBtn, roomTab === 'CHECKLIST' && styles.segmentBtnActive]}>
              <Text style={[styles.segmentBtnText, roomTab === 'CHECKLIST' && styles.segmentBtnTextActive]}>Чек-лист</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRoomTab('MINIBAR')} style={[styles.segmentBtn, roomTab === 'MINIBAR' && styles.segmentBtnActive]}>
              <Text style={[styles.segmentBtnText, roomTab === 'MINIBAR' && styles.segmentBtnTextActive]}>Мини-бар</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRoomTab('DEFECT')} style={[styles.segmentBtn, roomTab === 'DEFECT' && styles.segmentBtnActive]}>
              <Text style={[styles.segmentBtnText, roomTab === 'DEFECT' && styles.segmentBtnTextActive]}>Поломка</Text>
            </TouchableOpacity>
          </View>

          {roomTab === 'CHECKLIST' && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>ЗАДАЧИ УБОРКИ</Text>
              <View style={[styles.card, { padding: 0 }]}>
                {checklistTasks.map((task, idx) => (
                  <TouchableOpacity
                    key={task.id}
                    onPress={() => setChecklistTasks(p => p.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}
                    style={[styles.listItem, idx > 0 && styles.itemBorderTop]}
                  >
                    <View style={[styles.checkbox, task.done && styles.checkboxDone]}>
                      {task.done && <Check size={14} color="#FFFFFF" />}
                    </View>
                    <View style={styles.flexOne}>
                      <Text style={[styles.itemTitle, task.done && styles.itemTitleDone]}>{task.title}</Text>
                      <Text style={styles.itemSubtitle}>{task.zone}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity onPress={() => Alert.alert('Фото', 'Камера запущена')} style={[styles.card, styles.photoCard, { marginTop: 12 }]}>
                <Camera size={20} color={COLORS.primary} />
                <Text style={{ fontFamily: FONTS.jost500, fontSize: 13, color: COLORS.primary }}>
                  {lang === 'RU' ? 'Сделать фотоотчёт уборки' : 'Add room photo'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {roomTab === 'MINIBAR' && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>ПРОВЕРКА И ПОПОЛНЕНИЕ</Text>
              <View style={[styles.card, { padding: 0 }]}>
                {minibarItems.map((item, idx) => (
                  <View key={item.id} style={[styles.listItem, idx > 0 && styles.itemBorderTop]}>
                    <View style={styles.flexOne}>
                      <Text style={styles.itemTitle}>{item.name}</Text>
                      <Text style={styles.itemSubtitle}>Норма: {item.standard} шт</Text>
                    </View>
                    <View style={styles.stepperWrap}>
                      <TouchableOpacity
                        onPress={() => setMinibarItems(p => p.map(x => x.id === item.id ? { ...x, current: Math.max(0, x.current - 1) } : x))}
                        style={styles.stepperBtn}
                      >
                        <Text style={styles.stepperBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperVal}>{item.current}</Text>
                      <TouchableOpacity
                        onPress={() => setMinibarItems(p => p.map(x => x.id === item.id ? { ...x, current: x.current + 1 } : x))}
                        style={styles.stepperBtn}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {roomTab === 'DEFECT' && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>ЗАЯВКА В ТЕХСЛУЖБУ</Text>
              <View style={styles.card}>
                <Text style={styles.inputLabel}>Категория</Text>
                <View style={styles.segmentRow}>
                  {['Сантехника', 'Электрика', 'Мебель', 'Климат'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setDefectCategory(cat)}
                      style={[styles.segmentBtn, defectCategory === cat && styles.segmentBtnActive]}
                    >
                      <Text style={[styles.segmentBtnText, defectCategory === cat && styles.segmentBtnTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Описание проблемы</Text>
                <TextInput
                  placeholder="Опишите что сломано..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={defectDesc}
                  onChangeText={setDefectDesc}
                  style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                  multiline
                />
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Заявка', 'Заявка отправлена технику');
                    setDefectDesc('');
                  }}
                  style={[styles.primaryButton, { marginTop: 14 }]}
                >
                  <Text style={styles.primaryButtonText}>Отправить технику</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomBarSingle}>
          <TouchableOpacity
            onPress={() => {
              onUpdateRooms(rooms.map(r => r.id === selectedRoom.id ? { ...r, status: 'READY' } : r));
              Alert.alert('Сдано', 'Номер успешно сдан супервайзеру на приёмку');
              setSelectedRoom(null);
            }}
            style={[styles.primaryButton, { backgroundColor: COLORS.success }]}
          >
            <Text style={styles.primaryButtonText}>{lang === 'RU' ? 'Завершить уборку номера' : 'Complete Room'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.screenTitle}>{cleanerProfile.fullNameRu}</Text>
            <Text style={styles.screenSubtitle}>{lang === 'RU' ? 'Горничная · Смена SH-4092' : 'Housekeeper · Shift SH-4092'}</Text>
          </View>
          <View style={styles.topIconsRow}>
            <TouchableOpacity onPress={() => onOpenChat?.()} style={styles.topIconBtn}>
              <MessageSquare size={18} color={COLORS.dark} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onOpenNotifications?.()} style={styles.topIconBtn}>
              <Bell size={18} color={COLORS.dark} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onOpenSettings?.()} style={styles.topIconBtn}>
              <Settings size={18} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.itemTitle}>{lang === 'RU' ? 'Прогресс за смену' : 'Shift Progress'}</Text>
            <Text style={{ fontFamily: FONTS.jost500, fontSize: 13, color: COLORS.primary }}>
              {doneCount} из {myRooms.length}
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: ((doneCount / (myRooms.length || 1)) * 100) + '%', backgroundColor: COLORS.success }]} />
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>{lang === 'RU' ? 'МОИ НОМЕРА НА СЕГОДНЯ' : 'MY ROOMS TODAY'}</Text>
          <View style={[styles.card, { padding: 0 }]}>
            {myRooms.map((room, idx) => {
              const isReady = room.status === 'READY';
              const isProg = room.status === 'CLEANING';
              return (
                <TouchableOpacity
                  key={room.id}
                  onPress={() => setSelectedRoom(room)}
                  style={[styles.listItem, idx > 0 && styles.itemBorderTop]}
                >
                  <View style={[styles.roomNumberBubble, isReady && styles.roomReadyBubble]}>
                    <Text style={[styles.roomNumberText, isReady && styles.roomReadyText]}>{room.number}</Text>
                  </View>
                  <View style={styles.flexOne}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.itemTitle}>{room.type}</Text>
                      <View style={[styles.badgePill, isReady ? styles.badgeGreen : isProg ? styles.badgeAmber : styles.badgeGray]}>
                        <Text style={[styles.badgePillText, isReady ? styles.badgeGreenText : isProg ? styles.badgeAmberText : styles.badgeGrayText]}>
                          {isReady ? 'Убрано' : isProg ? 'В уборке' : 'Грязный'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemSubtitle}>{room.floor} этаж · {room.priority === 'VIP' ? 'VIP гость' : 'Выездная уборка'}</Text>
                  </View>
                  <ChevronRight size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flex: 1, padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  topIconsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topIconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.03)' },
  screenTitle: { fontFamily: FONTS.spectral500, fontSize: 22, color: COLORS.dark },
  screenSubtitle: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sectionBlock: { marginTop: 16 },
  sectionHeader: { fontFamily: FONTS.jost500, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: COLORS.textSecondary, marginBottom: 8 },
  card: { backgroundColor: COLORS.backgroundCard, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segmentRow: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  segmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.backgroundCard, alignItems: 'center', justifyContent: 'center' },
  segmentBtnActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  segmentBtnText: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary },
  segmentBtnTextActive: { color: '#FFFFFF', fontFamily: FONTS.jost500 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  itemBorderTop: { borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  itemTitle: { fontFamily: FONTS.jost500, fontSize: 14, color: COLORS.dark },
  itemTitleDone: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  itemSubtitle: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  flexOne: { flex: 1 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  photoCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderStyle: 'dashed' },
  stepperWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperBtn: { width: 26, height: 26, borderRadius: 6, backgroundColor: '#F1ECE5', alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontFamily: FONTS.jost600, fontSize: 14, color: COLORS.dark },
  stepperVal: { fontFamily: FONTS.jost500, fontSize: 13, color: COLORS.dark, minWidth: 30, textAlign: 'center' },
  inputLabel: { fontFamily: FONTS.jost500, fontSize: 10, textTransform: 'uppercase', color: COLORS.textSecondary, marginBottom: 6 },
  modalInput: { backgroundColor: '#F9F8F6', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: FONTS.jost400, fontSize: 13, color: COLORS.dark },
  roomNumberBubble: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FAF6F0', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  roomNumberText: { fontFamily: FONTS.jost600, fontSize: 14, color: COLORS.dark },
  roomReadyBubble: { backgroundColor: COLORS.successLight, borderColor: COLORS.success },
  roomReadyText: { color: COLORS.successText },
  barTrack: { height: 6, backgroundColor: '#EFECE6', borderRadius: 3, overflow: 'hidden', marginTop: 10 },
  barFill: { height: 6, borderRadius: 3 },
  badgePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgePillText: { fontFamily: FONTS.jost500, fontSize: 10 },
  badgeGreen: { backgroundColor: COLORS.successLight },
  badgeGreenText: { color: COLORS.successText },
  badgeAmber: { backgroundColor: COLORS.warningLight },
  badgeAmberText: { color: COLORS.warningText },
  badgeGray: { backgroundColor: '#F1ECE5' },
  badgeGrayText: { color: COLORS.textSecondary },
  bottomBarSingle: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.background },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontFamily: FONTS.jost500, fontSize: 13, color: '#FFFFFF' }
});
