import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert
} from 'react-native';
import {
  Wrench, CheckCircle2, Clock, AlertTriangle, Plus, ChevronRight, ChevronLeft,
  Search, Check, X, Camera, MessageSquare, Bell, Settings, Layers, User, LogOut
} from 'lucide-react-native';
import { Language, HotelRoom, MaintenanceRequest } from '../../types';
import { COLORS, FONTS } from '../../theme/tokens';

interface TechnicianScreensNativeProps {
  lang: Language;
  rooms: HotelRoom[];
  maintenanceRequests: MaintenanceRequest[];
  onUpdateMaintenanceRequests: (reqs: MaintenanceRequest[]) => void;
  onLogout: () => void;
  activeTab: string;
  onOpenChat?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
}

export const TechnicianScreensNative: React.FC<TechnicianScreensNativeProps> = ({
  lang,
  rooms,
  maintenanceRequests,
  onUpdateMaintenanceRequests,
  onLogout,
  activeTab,
  onOpenChat,
  onOpenNotifications,
  onOpenSettings
}) => {
  const [ticketFilter, setTicketFilter] = useState<'ALL' | 'ACTIVE' | 'DONE'>('ACTIVE');
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceRequest | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newRoomNum, setNewRoomNum] = useState('');
  const [newCategory, setNewCategory] = useState('Сантехника');
  const [newDesc, setNewDesc] = useState('');

  const filtered = maintenanceRequests.filter(t => {
    if (ticketFilter === 'ACTIVE') return t.status === 'PENDING' || t.status === 'IN_PROGRESS';
    if (ticketFilter === 'DONE') return t.status === 'COMPLETED';
    return true;
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.screenTitle}>{lang === 'RU' ? 'Техслужба' : 'Maintenance'}</Text>
            <Text style={styles.screenSubtitle}>Олег Петров · Смена SH-4092</Text>
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

        {/* Filters */}
        <View style={styles.segmentRow}>
          <TouchableOpacity onPress={() => setTicketFilter('ACTIVE')} style={[styles.segmentBtn, ticketFilter === 'ACTIVE' && styles.segmentBtnActive]}>
            <Text style={[styles.segmentBtnText, ticketFilter === 'ACTIVE' && styles.segmentBtnTextActive]}>В работе ({maintenanceRequests.filter(x => x.status !== 'COMPLETED').length})</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTicketFilter('ALL')} style={[styles.segmentBtn, ticketFilter === 'ALL' && styles.segmentBtnActive]}>
            <Text style={[styles.segmentBtnText, ticketFilter === 'ALL' && styles.segmentBtnTextActive]}>Все</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTicketFilter('DONE')} style={[styles.segmentBtn, ticketFilter === 'DONE' && styles.segmentBtnActive]}>
            <Text style={[styles.segmentBtnText, ticketFilter === 'DONE' && styles.segmentBtnTextActive]}>Готово</Text>
          </TouchableOpacity>
        </View>

        {/* Tickets List */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>ЗАЯВКИ НА УСТРАНЕНИЕ</Text>
          <View style={[styles.card, { padding: 0 }]}>
            {filtered.map((t, idx) => {
              const isDone = t.status === 'COMPLETED';
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setSelectedTicket(t)}
                  style={[styles.listItem, idx > 0 && styles.itemBorderTop]}
                >
                  <View style={[styles.roomBubble, isDone && { backgroundColor: COLORS.successLight }]}>
                    <Text style={[styles.roomBubbleText, isDone && { color: COLORS.successText }]}>№ {t.roomNumber}</Text>
                  </View>
                  <View style={styles.flexOne}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.itemTitle}>{t.title}</Text>
                      <View style={[styles.badgePill, t.priority === 'URGENT' ? styles.badgeRed : styles.badgeAmber]}>
                        <Text style={[styles.badgePillText, t.priority === 'URGENT' ? styles.badgeRedText : styles.badgeAmberText]}>
                          {t.priority === 'URGENT' ? 'Срочно' : 'Обычный'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemSubtitle}>{t.category} · {t.reportedTime || '08:50'}</Text>
                  </View>
                  <ChevronRight size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.bottomBarSingle}>
        <TouchableOpacity onPress={() => setShowNewTicketModal(true)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>+ Создать заявку</Text>
        </TouchableOpacity>
      </View>

      {/* NEW TICKET MODAL */}
      <Modal visible={showNewTicketModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Новая заявка</Text>
              <TouchableOpacity onPress={() => setShowNewTicketModal(false)} style={styles.closeBtn}>
                <X size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.inputLabel}>Номер комнаты</Text>
              <TextInput
                placeholder="Например 304"
                value={newRoomNum}
                onChangeText={setNewRoomNum}
                style={styles.modalInput}
              />
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>Категория</Text>
              <View style={styles.segmentRow}>
                {['Сантехника', 'Электрика', 'Мебель'].map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setNewCategory(c)}
                    style={[styles.segmentBtn, newCategory === c && styles.segmentBtnActive]}
                  >
                    <Text style={[styles.segmentBtnText, newCategory === c && styles.segmentBtnTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.inputLabel}>Описание</Text>
              <TextInput
                placeholder="Подробности неисправности..."
                value={newDesc}
                onChangeText={setNewDesc}
                style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
                multiline
              />
            </View>

            <View style={styles.bottomBarDouble}>
              <TouchableOpacity onPress={() => setShowNewTicketModal(false)} style={[styles.secondaryButton, { flex: 1 }]}>
                <Text style={styles.secondaryButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (!newRoomNum || !newDesc) {
                    Alert.alert('Ошибка', 'Укажите номер и описание');
                    return;
                  }
                  onUpdateMaintenanceRequests([
                    ...maintenanceRequests,
                    {
                      id: 'req-' + Date.now(),
                      roomId: 'room-' + newRoomNum,
                      roomNumber: newRoomNum,
                      category: newCategory as any,
                      title: newDesc.slice(0, 30),
                      description: newDesc,
                      priority: 'NORMAL',
                      status: 'PENDING',
                      reportedBy: 'Олег Петров',
                      reportedTime: 'сейчас'
                    }
                  ]);
                  Alert.alert('Успешно', 'Заявка зарегистрирована');
                  setShowNewTicketModal(false);
                  setNewRoomNum('');
                  setNewDesc('');
                }}
                style={[styles.primaryButton, { flex: 1 }]}
              >
                <Text style={styles.primaryButtonText}>Создать</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flex: 1, padding: 16 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  topIconsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topIconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontFamily: FONTS.spectral500, fontSize: 22, color: COLORS.dark },
  screenSubtitle: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  segmentRow: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  segmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.backgroundCard, alignItems: 'center', justifyContent: 'center' },
  segmentBtnActive: { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  segmentBtnText: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary },
  segmentBtnTextActive: { color: '#FFFFFF', fontFamily: FONTS.jost500 },
  sectionBlock: { marginTop: 16 },
  sectionHeader: { fontFamily: FONTS.jost500, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: COLORS.textSecondary, marginBottom: 8 },
  card: { backgroundColor: COLORS.backgroundCard, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  itemBorderTop: { borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  itemTitle: { fontFamily: FONTS.jost500, fontSize: 14, color: COLORS.dark },
  itemSubtitle: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  flexOne: { flex: 1 },
  roomBubble: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FAF6F0', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  roomBubbleText: { fontFamily: FONTS.jost600, fontSize: 12, color: COLORS.dark },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgePillText: { fontFamily: FONTS.jost500, fontSize: 10 },
  badgeRed: { backgroundColor: COLORS.errorLight },
  badgeRedText: { color: COLORS.errorText },
  badgeAmber: { backgroundColor: COLORS.warningLight },
  badgeAmberText: { color: COLORS.warningText },
  bottomBarSingle: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.background },
  bottomBarDouble: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.background },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontFamily: FONTS.jost500, fontSize: 13, color: '#FFFFFF' },
  secondaryButton: { backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontFamily: FONTS.jost500, fontSize: 13, color: COLORS.dark },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontFamily: FONTS.spectral500, fontSize: 18, color: COLORS.dark },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontFamily: FONTS.jost500, fontSize: 10, textTransform: 'uppercase', color: COLORS.textSecondary, marginBottom: 6 },
  modalInput: { backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: FONTS.jost400, fontSize: 13, color: COLORS.dark }
});
