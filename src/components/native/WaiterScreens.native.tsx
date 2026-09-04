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
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [mealAttendanceList, setMealAttendanceList] = useState([
    {
      id: 'att-1',
      roomNumber: '№ 304',
      guestName: 'Ким А. · Deluxe Suite',
      packageType: 'HB',
      guestsInfo: '2 взр · 1 реб',
      checkedIn: false,
      checkInTime: ''
    },
    {
      id: 'att-2',
      roomNumber: '№ 208',
      guestName: 'Серикбаева Б. · Standard Twin',
      packageType: 'BB',
      guestsInfo: 'отмечены 08:12',
      checkedIn: true,
      checkInTime: '08:12'
    },
    {
      id: 'att-3',
      roomNumber: '№ 412',
      guestName: 'Абдиров К. · Presidential Suite',
      packageType: 'AI',
      guestsInfo: '2 взр',
      checkedIn: false,
      checkInTime: ''
    },
    {
      id: 'att-4',
      roomNumber: '№ 105',
      guestName: 'Дмитриев С. · Standard King',
      packageType: 'FB',
      guestsInfo: '3 взр',
      checkedIn: false,
      checkInTime: ''
    }
  ]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.screenTitle}>
              {activeTab === 'WAITER_TODAY' ? (lang === 'RU' ? 'Сегодня' : 'Today')
                : activeTab === 'WAITER_HALL' ? (lang === 'RU' ? 'Зал' : 'Dining Hall')
                : (lang === 'RU' ? 'Профиль' : 'Profile')}
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

        {/* 2. HALL ATTENDANCE CHECK-IN WITH SEARCH */}
        {activeTab === 'WAITER_HALL' && (
          <View style={styles.sectionBlock}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionHeader}>ОТМЕТКА ПРИХОДА</Text>
              <Text style={[styles.itemSubText, { color: COLORS.textSecondary }]}>завтрак</Text>
            </View>

            <View style={styles.searchBox}>
              <Search size={16} color={COLORS.textSecondary} />
              <TextInput
                placeholder="Номер комнаты или фамилия"
                placeholderTextColor={COLORS.textSecondary}
                value={guestSearchQuery}
                onChangeText={setGuestSearchQuery}
                style={styles.searchInput}
              />
            </View>

            <View style={[styles.card, { padding: 0, marginTop: 10 }]}>
              {mealAttendanceList
                .filter(g => {
                  const q = guestSearchQuery.toLowerCase();
                  return g.roomNumber.toLowerCase().includes(q) || g.guestName.toLowerCase().includes(q);
                })
                .map((guest, idx) => (
                  <TouchableOpacity
                    key={guest.id}
                    onPress={() => {
                      setMealAttendanceList(prev => prev.map(item => {
                        if (item.id === guest.id) {
                          const newChecked = !item.checkedIn;
                          return {
                            ...item,
                            checkedIn: newChecked,
                            checkInTime: newChecked ? '08:12' : ''
                          };
                        }
                        return item;
                      }));
                    }}
                    style={[styles.listItem, idx > 0 && styles.itemBorderTop]}
                  >
                    <View style={[styles.dotIndicator, guest.checkedIn ? { backgroundColor: COLORS.success } : { backgroundColor: COLORS.border }]} />
                    <View style={styles.flexOne}>
                      <View style={styles.rowBetween}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.itemTitle}>{guest.roomNumber}</Text>
                          <View style={styles.packageBadge}>
                            <Text style={styles.packageBadgeText}>{guest.packageType}</Text>
                          </View>
                        </View>
                        <Text style={[styles.itemSubText, guest.checkedIn && { color: COLORS.successText, fontFamily: FONTS.jost500 }]}>
                          {guest.checkedIn ? ('отмечены ' + (guest.checkInTime || '08:12')) : guest.guestsInfo}
                        </Text>
                      </View>
                      <Text style={styles.itemSubtitle}>{guest.guestName}</Text>
                    </View>
                    <View style={{ marginLeft: 10 }}>
                      {guest.checkedIn ? (
                        <CheckCircle2 size={22} color={COLORS.success} />
                      ) : (
                        <View style={styles.circleUnchecked} />
                      )}
                    </View>
                  </TouchableOpacity>
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
  dotIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  packageBadge: { backgroundColor: '#FAF0EB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  packageBadgeText: { fontFamily: FONTS.jost500, fontSize: 9, color: COLORS.primary },
  circleUnchecked: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: COLORS.border },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.dark, padding: 0 },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 12 }
});
