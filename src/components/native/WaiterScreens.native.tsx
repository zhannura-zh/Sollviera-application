import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import {
  Coffee, UtensilsCrossed, Clock, Check, ChevronRight, ChevronLeft,
  Search, Plus, Minus, MessageSquare, Bell, Settings, User, LogOut, CheckCircle2
} from 'lucide-react-native';
import { Language } from '../../types';
import { COLORS, FONTS } from '../../theme/tokens';

interface WaiterScreensNativeProps {
  lang: Language;
  onLogout: () => void;
  activeTab: 'WAITER_TODAY' | 'WAITER_HALL' | 'WAITER_PROFILE';
  onOpenChat?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
}

export const WaiterScreensNative: React.FC<WaiterScreensNativeProps> = ({
  lang,
  onLogout,
  activeTab,
  onOpenChat,
  onOpenNotifications,
  onOpenSettings
}) => {
  const [hallTables, setHallTables] = useState([
    { id: 'tbl-1', number: 'Стол 4', guests: 2, status: 'ORDERED', time: '12 мин', total: '18 200 ₸', dishes: ['2x Стейк Рибай', '2x Капучино'] },
    { id: 'tbl-2', number: 'Стол 7', guests: 4, status: 'BILL', time: '45 мин', total: '34 500 ₸', dishes: ['4x Бенедикт', '4x Апельсиновый фреш'] },
    { id: 'tbl-3', number: 'Стол 12', guests: 1, status: 'FREE', time: '-', total: '0 ₸', dishes: [] }
  ]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.screenTitle}>
              {activeTab === 'WAITER_TODAY' ? (lang === 'RU' ? 'Питание гостей' : 'Daily Meal Plan')
                : activeTab === 'WAITER_HALL' ? (lang === 'RU' ? 'Зал ресторана' : 'Dining Hall')
                : (lang === 'RU' ? 'Профиль официанта' : 'Waiter Profile')}
            </Text>
            <Text style={styles.screenSubtitle}>Алихан Рахметов · Смена SH-4092</Text>
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

        {/* 1. TODAY MEAL PLAN */}
        {activeTab === 'WAITER_TODAY' && (
          <View>
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>ПИТАНИЕ НА СЕГОДНЯ</Text>
              <View style={styles.card}>
                <View style={styles.statsRow}>
                  <View style={styles.statCol}>
                    <Text style={styles.statNumber}>42</Text>
                    <Text style={styles.statLabel}>завтраков (BB)</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statNumber}>28</Text>
                    <Text style={styles.statLabel}>обедов (HB)</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statNumber}>35</Text>
                    <Text style={styles.statLabel}>ужинов (FB)</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>РАСПИСАНИЕ РАЦИОНОВ</Text>
              <View style={[styles.card, { padding: 0 }]}>
                {[
                  { time: '07:00 – 10:30', title: 'Завтрак (Шведский стол)', count: '96 из 142 пришли' },
                  { time: '12:30 – 15:00', title: 'Обед (A la carte & сет)', count: '54 ожидается' },
                  { time: '18:30 – 22:00', title: 'Ужин (Основной зал)', count: '88 ожидается' }
                ].map((meal, idx) => (
                  <View key={idx} style={[styles.listItem, idx > 0 && styles.itemBorderTop]}>
                    <View style={styles.roomBubble}>
                      <Clock size={16} color={COLORS.dark} />
                    </View>
                    <View style={styles.flexOne}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.itemTitle}>{meal.title}</Text>
                        <Text style={styles.itemSubText}>{meal.time}</Text>
                      </View>
                      <Text style={styles.itemSubtitle}>{meal.count}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 2. HALL ORDERS */}
        {activeTab === 'WAITER_HALL' && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>АКТИВНЫЕ СТОЛЫ</Text>
            <View style={[styles.card, { padding: 0 }]}>
              {hallTables.map((tbl, idx) => (
                <View key={tbl.id} style={[styles.listItem, idx > 0 && styles.itemBorderTop]}>
                  <View style={[styles.roomBubble, tbl.status === 'FREE' && { backgroundColor: '#F1ECE5' }]}>
                    <Text style={styles.roomBubbleText}>{tbl.number}</Text>
                  </View>
                  <View style={styles.flexOne}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.itemTitle}>{tbl.number} · {tbl.guests} гостей</Text>
                      <View style={[styles.badgePill, tbl.status === 'ORDERED' ? styles.badgeAmber : tbl.status === 'BILL' ? styles.badgeGreen : styles.badgeGray]}>
                        <Text style={[styles.badgePillText, tbl.status === 'ORDERED' ? styles.badgeAmberText : tbl.status === 'BILL' ? styles.badgeGreenText : styles.badgeGrayText]}>
                          {tbl.status === 'ORDERED' ? 'Заказ на кухне' : tbl.status === 'BILL' ? 'Счёт' : 'Свободен'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.itemSubtitle}>{tbl.dishes.length > 0 ? tbl.dishes.join(', ') : 'Готов к посадке'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 3. PROFILE */}
        {activeTab === 'WAITER_PROFILE' && (
          <View style={styles.sectionBlock}>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.itemTitle}>Алихан Рахметов</Text>
                <Text style={styles.itemSubText}>Официант 1 категории</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statNumber}>18</Text>
                  <Text style={styles.statLabel}>заказов за смену</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statNumber}>4.9</Text>
                  <Text style={styles.statLabel}>рейтинг гостей</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={onLogout} style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 }]}>
              <LogOut size={18} color={COLORS.textSecondary} />
              <Text style={{ fontFamily: FONTS.jost500, fontSize: 14, color: COLORS.textPrimary }}>Выйти из смены</Text>
            </TouchableOpacity>
          </View>
        )}
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
  screenTitle: { fontFamily: FONTS.spectral500, fontSize: 22, color: COLORS.dark },
  screenSubtitle: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sectionBlock: { marginTop: 16 },
  sectionHeader: { fontFamily: FONTS.jost500, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: COLORS.textSecondary, marginBottom: 8 },
  card: { backgroundColor: COLORS.backgroundCard, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statCol: { alignItems: 'center', flex: 1 },
  statNumber: { fontFamily: FONTS.jost500, fontSize: 18, color: COLORS.dark },
  statLabel: { fontFamily: FONTS.jost400, fontSize: 11, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: COLORS.borderLight },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  itemBorderTop: { borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  itemTitle: { fontFamily: FONTS.jost500, fontSize: 14, color: COLORS.dark },
  itemSubtitle: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  itemSubText: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary },
  flexOne: { flex: 1 },
  roomBubble: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FAF6F0', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  roomBubbleText: { fontFamily: FONTS.jost600, fontSize: 12, color: COLORS.dark },
  badgePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgePillText: { fontFamily: FONTS.jost500, fontSize: 11 },
  badgeGreen: { backgroundColor: COLORS.successLight },
  badgeGreenText: { color: COLORS.successText },
  badgeAmber: { backgroundColor: COLORS.warningLight },
  badgeAmberText: { color: COLORS.warningText },
  badgeRed: { backgroundColor: COLORS.errorLight },
  badgeRedText: { color: COLORS.errorText },
  badgeGray: { backgroundColor: '#F1ECE5' },
  badgeGrayText: { color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 12 }
});
