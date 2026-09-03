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
  Award, TrendingUp, Users, LogOut, MessageSquare, Bell, Settings, DollarSign, CheckCircle2, ChevronRight
} from 'lucide-react-native';
import { Language, HotelRoom } from '../../types';
import { COLORS, FONTS } from '../../theme/tokens';

interface DirectorScreensNativeProps {
  lang: Language;
  rooms: HotelRoom[];
  onLogout: () => void;
  activeTab: string;
  onOpenChat?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
}

export const DirectorScreensNative: React.FC<DirectorScreensNativeProps> = ({
  lang,
  rooms,
  onLogout,
  onOpenChat,
  onOpenNotifications,
  onOpenSettings
}) => {
  const occupied = rooms.filter(r => r.isOccupied).length;
  const ready = rooms.filter(r => r.status === 'READY').length;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.screenTitle}>{lang === 'RU' ? 'Управление отелем' : 'Management'}</Text>
            <Text style={styles.screenSubtitle}>Rixos Borovoe · Сводка дня</Text>
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

        {/* METRICS */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ</Text>
          <View style={styles.card}>
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>86%</Text>
                <Text style={styles.statLabel}>Загрузка ({occupied}/24)</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={[styles.statNumber, { color: COLORS.success }]}>98.4%</Text>
                <Text style={styles.statLabel}>Индекс чистоты</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>21 мин</Text>
                <Text style={styles.statLabel}>Ср. время уборки</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ROOM FUND */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>СТАТУС НОМЕРНОГО ФОНДА</Text>
          <View style={styles.card}>
            <View style={styles.keyValRow}>
              <Text style={styles.keyText}>Готовы к заселению</Text>
              <Text style={[styles.valText, { color: COLORS.success }]}>{ready} номеров</Text>
            </View>
            <View style={styles.keyValRow}>
              <Text style={styles.keyText}>Занято гостями</Text>
              <Text style={styles.valText}>{occupied} номеров</Text>
            </View>
            <View style={styles.keyValRow}>
              <Text style={styles.keyText}>В процессе уборки</Text>
              <Text style={[styles.valText, { color: COLORS.warning }]}>4 номера</Text>
            </View>
          </View>
        </View>

        {/* STAFF RATINGS */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeader}>ЛИДЕРЫ СМЕНЫ</Text>
          <View style={[styles.card, { padding: 0 }]}>
            {[
              { name: 'Елена Вэнс', role: 'Старший клинер', score: '99.2%', rooms: '8 номеров' },
              { name: 'Айгуль Мукан', role: 'Клинер', score: '98.5%', rooms: '6 номеров' },
              { name: 'Маркус Броди', role: 'Клинер', score: '95.0%', rooms: '5 номеров' }
            ].map((st, i) => (
              <View key={i} style={[styles.listItem, i > 0 && styles.itemBorderTop]}>
                <View style={styles.avatarBubble}>
                  <Text style={styles.avatarText}>{st.name[0]}</Text>
                </View>
                <View style={styles.flexOne}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.itemTitle}>{st.name}</Text>
                    <Text style={[styles.valText, { color: COLORS.success }]}>{st.score}</Text>
                  </View>
                  <Text style={styles.itemSubtitle}>{st.role} · {st.rooms}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Log out */}
        <View style={[styles.sectionBlock, { marginBottom: 30 }]}>
          <TouchableOpacity onPress={onLogout} style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            <LogOut size={18} color={COLORS.textSecondary} />
            <Text style={{ fontFamily: FONTS.jost500, fontSize: 14, color: COLORS.textPrimary }}>Выйти из аккаунта</Text>
          </TouchableOpacity>
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
  screenTitle: { fontFamily: FONTS.spectral500, fontSize: 22, color: COLORS.dark },
  screenSubtitle: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sectionBlock: { marginTop: 16 },
  sectionHeader: { fontFamily: FONTS.jost500, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: COLORS.textSecondary, marginBottom: 8 },
  card: { backgroundColor: COLORS.backgroundCard, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statCol: { alignItems: 'center', flex: 1 },
  statNumber: { fontFamily: FONTS.jost600, fontSize: 18, color: COLORS.dark },
  statLabel: { fontFamily: FONTS.jost400, fontSize: 10, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: COLORS.borderLight },
  keyValRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  keyText: { fontFamily: FONTS.jost400, fontSize: 13, color: COLORS.textSecondary },
  valText: { fontFamily: FONTS.jost500, fontSize: 13, color: COLORS.dark },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  itemBorderTop: { borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  itemTitle: { fontFamily: FONTS.jost500, fontSize: 14, color: COLORS.dark },
  itemSubtitle: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  flexOne: { flex: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarBubble: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E0D8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontFamily: FONTS.jost500, fontSize: 12, color: COLORS.textSecondary }
});
