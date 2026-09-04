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
  Search, Check, X, Camera, MessageSquare, Bell, Settings, Layers, User, LogOut,
  Receipt
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

  // Guest damage cost calculation modal states
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [damageTargetTicket, setDamageTargetTicket] = useState<MaintenanceRequest | null>(null);
  const [damageComment, setDamageComment] = useState('');
  const [damageCost, setDamageCost] = useState('');

  const handleOpenDamageModal = (t: MaintenanceRequest) => {
    setDamageTargetTicket(t);
    setDamageComment(t.repairComment || '');
    setDamageCost(t.repairCost ? String(t.repairCost) : '');
    setShowDamageModal(true);
  };

  const handleSaveDamageCost = () => {
    if (!damageTargetTicket) return;
    const costNum = parseInt(damageCost, 10) || 0;
    const comment = damageComment.trim();

    const updated = maintenanceRequests.map(r => {
      if (r.id === damageTargetTicket.id) {
        return {
          ...r,
          repairCost: costNum,
          repairComment: comment,
          costCalculated: true
        };
      }
      return r;
    });

    onUpdateMaintenanceRequests(updated);

    if (selectedTicket && selectedTicket.id === damageTargetTicket.id) {
      setSelectedTicket({
        ...selectedTicket,
        repairCost: costNum,
        repairComment: comment,
        costCalculated: true
      });
    }

    setShowDamageModal(false);
    setDamageTargetTicket(null);
    Alert.alert('Успешно', 'Расчёт суммы ремонта сохранён');
  };

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
                <View
                  key={t.id}
                  style={[styles.listItemWrapper, idx > 0 && styles.itemBorderTop]}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedTicket(t)}
                    style={styles.listItem}
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
                      
                      {t.isGuestDamage && (
                        <View style={styles.damageBadgeRow}>
                          <View style={styles.guestDamageBadge}>
                            <AlertTriangle size={11} color="#C2410C" />
                            <Text style={styles.guestDamageBadgeText}>
                              {lang === 'RU' ? `Поломка гостем${t.guestDamageType ? ` · ${t.guestDamageType}` : ''}` : `Guest damage${t.guestDamageType ? ` · ${t.guestDamageType}` : ''}`}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                    <ChevronRight size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>

                  {/* Guest Damage Action Button */}
                  {t.isGuestDamage && (
                    <View style={styles.damageActionContainer}>
                      <TouchableOpacity
                        onPress={() => handleOpenDamageModal(t)}
                        style={styles.calcCostButton}
                      >
                        <Receipt size={14} color="#C2410C" />
                        <Text style={styles.calcCostButtonText}>
                          {t.costCalculated && t.repairCost !== undefined
                            ? (lang === 'RU' ? `Сумма ремонта: ${t.repairCost.toLocaleString('ru-RU')} ₸ (изменить)` : `Cost: ${t.repairCost.toLocaleString('en-US')} ₸ (edit)`)
                            : (lang === 'RU' ? 'Рассчитать сумму ремонта' : 'Calculate repair cost')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
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

      {/* TICKET DETAILS MODAL */}
      <Modal visible={!!selectedTicket} transparent animationType="slide">
        {selectedTicket && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.modalTitle}>№ {selectedTicket.roomNumber} · {selectedTicket.title}</Text>
                  <Text style={styles.screenSubtitle}>{selectedTicket.category} · {selectedTicket.priority === 'URGENT' ? 'Срочный приоритет' : 'Обычный'}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTicket(null)} style={styles.closeBtn}>
                  <X size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>Описание проблемы</Text>
                <View style={styles.readOnlyBox}>
                  <Text style={styles.readOnlyText}>{selectedTicket.description || 'Без подробного описания'}</Text>
                </View>
              </View>

              {/* Guest Damage details in modal */}
              {selectedTicket.isGuestDamage && (
                <View style={styles.damageSectionBox}>
                  <View style={styles.rowBetween}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={14} color="#C2410C" />
                      <Text style={styles.damageSectionTitle}>
                        {lang === 'RU' ? 'Ущерб по вине гостя' : 'Guest Damage'}
                      </Text>
                    </View>
                    {selectedTicket.costCalculated && selectedTicket.repairCost !== undefined && (
                      <Text style={styles.damageCostPill}>
                        {selectedTicket.repairCost.toLocaleString('ru-RU')} ₸
                      </Text>
                    )}
                  </View>

                  {selectedTicket.repairComment ? (
                    <Text style={styles.damageCommentText}>
                      {selectedTicket.repairComment}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    onPress={() => {
                      const t = selectedTicket;
                      setSelectedTicket(null);
                      handleOpenDamageModal(t);
                    }}
                    style={styles.calcCostButtonWide}
                  >
                    <Receipt size={14} color="#C2410C" />
                    <Text style={styles.calcCostButtonText}>
                      {selectedTicket.costCalculated
                        ? (lang === 'RU' ? 'Изменить расчёт суммы ремонта' : 'Edit repair cost')
                        : (lang === 'RU' ? 'Рассчитать сумму ремонта' : 'Calculate repair cost')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.bottomBarDouble}>
                <TouchableOpacity
                  onPress={() => {
                    const updated = maintenanceRequests.map(r => r.id === selectedTicket.id ? { ...r, status: 'COMPLETED' as const } : r);
                    onUpdateMaintenanceRequests(updated);
                    setSelectedTicket(null);
                    Alert.alert('Успешно', 'Заявка переведена в статус «Готово»');
                  }}
                  style={[styles.primaryButton, { flex: 1, backgroundColor: COLORS.success }]}
                >
                  <Text style={styles.primaryButtonText}>Завершить работу</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* GUEST DAMAGE REPAIR COST CALCULATION MODAL */}
      <Modal visible={showDamageModal} transparent animationType="slide">
        {damageTargetTicket && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.modalTitle}>
                    {lang === 'RU' ? 'Расчёт суммы ремонта' : 'Repair Cost'}
                  </Text>
                  <Text style={styles.screenSubtitle}>
                    № {damageTargetTicket.roomNumber} · {damageTargetTicket.guestDamageType || 'Поломка гостем'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowDamageModal(false)} style={styles.closeBtn}>
                  <X size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 14 }}>
                <Text style={styles.inputLabel}>
                  {lang === 'RU' ? 'Что и как отремонтировано' : 'What was repaired & how'}
                </Text>
                <TextInput
                  placeholder={lang === 'RU' ? 'Например: заменён нагревательный элемент, протестирован...' : 'e.g. replaced heating element...'}
                  value={damageComment}
                  onChangeText={setDamageComment}
                  style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                  multiline
                />
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.inputLabel}>
                  {lang === 'RU' ? 'Сумма ремонта (₸)' : 'Repair cost (₸)'}
                </Text>
                <TextInput
                  placeholder="0 ₸"
                  keyboardType="numeric"
                  value={damageCost}
                  onChangeText={setDamageCost}
                  style={styles.modalInput}
                />
              </View>

              <View style={styles.bottomBarDouble}>
                <TouchableOpacity onPress={() => setShowDamageModal(false)} style={[styles.secondaryButton, { flex: 1 }]}>
                  <Text style={styles.secondaryButtonText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveDamageCost}
                  style={[styles.primaryButton, { flex: 1, backgroundColor: '#C2410C' }]}
                >
                  <Text style={styles.primaryButtonText}>Сохранить расчёт</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>

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
  listItemWrapper: { paddingVertical: 4 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  itemBorderTop: { borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  itemTitle: { fontFamily: FONTS.jost500, fontSize: 14, color: COLORS.dark },
  itemSubtitle: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  damageBadgeRow: { marginTop: 4, flexDirection: 'row' },
  guestDamageBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF4ED', borderColor: '#FED7AA', borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  guestDamageBadgeText: { fontFamily: FONTS.jost500, fontSize: 10, color: '#C2410C', textTransform: 'uppercase' },
  damageActionContainer: { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 2 },
  calcCostButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FAF0EB', borderColor: '#F3CDB8', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  calcCostButtonWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FAF0EB', borderColor: '#F3CDB8', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  calcCostButtonText: { fontFamily: FONTS.jost500, fontSize: 11, color: '#C2410C' },
  damageSectionBox: { marginTop: 12, backgroundColor: '#FFF8F5', borderColor: '#FED7AA', borderWidth: 1, borderRadius: 14, padding: 12 },
  damageSectionTitle: { fontFamily: FONTS.jost500, fontSize: 12, color: '#C2410C' },
  damageCostPill: { fontFamily: FONTS.jost600, fontSize: 12, color: '#C2410C', backgroundColor: '#FAF0EB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#F3CDB8' },
  damageCommentText: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.dark, marginTop: 6, lineHeight: 16 },
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
  bottomBarDouble: { flexDirection: 'row', gap: 10, marginTop: 16 },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontFamily: FONTS.jost500, fontSize: 13, color: '#FFFFFF' },
  secondaryButton: { backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontFamily: FONTS.jost500, fontSize: 13, color: COLORS.dark },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontFamily: FONTS.spectral500, fontSize: 18, color: COLORS.dark },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontFamily: FONTS.jost500, fontSize: 10, textTransform: 'uppercase', color: COLORS.textSecondary, marginBottom: 6 },
  modalInput: { backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: FONTS.jost400, fontSize: 13, color: COLORS.dark },
  readOnlyBox: { backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12 },
  readOnlyText: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.dark, lineHeight: 16 }
});
