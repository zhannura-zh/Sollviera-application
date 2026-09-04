import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal
} from 'react-native';
import {
  Coffee, Clock, Check, ChevronRight, ChevronLeft,
  Search, MessageSquare, Bell, Settings, User, LogOut,
  CheckCircle2, AlertTriangle, Users, ConciergeBell, Pin, Send, Lock, Headphones, RefreshCw
} from 'lucide-react-native';
import { Language, CleanerProfile } from '../../types';
import { COLORS, FONTS } from '../../theme/tokens';

interface WaiterScreensNativeProps {
  lang: Language;
  onLanguageChange?: (lang: Language) => void;
  cleanerProfile?: CleanerProfile;
  onLogout: () => void;
  activeTab: 'WAITER_TODAY' | 'WAITER_HALL' | 'WAITER_PROFILE';
}

export const WaiterScreensNative: React.FC<WaiterScreensNativeProps> = ({
  lang,
  onLanguageChange,
  cleanerProfile = {
    id: 'cleaner-1',
    fullName: 'Aigerim Dossova',
    fullNameRu: 'Айгерим Досова',
    phone: '+7 701 555-40-92',
    roomsAssigned: 12,
    roomsCleaned: 8,
    activeShift: 'SH-4092',
    status: 'AVAILABLE'
  },
  onLogout,
  activeTab
}) => {
  // Modal / overlay states
  const [showChats, setShowChats] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings states
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundOnNewTask, setSoundOnNewTask] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('12:04');

  // Shift Status
  const [shiftStatus, setShiftStatus] = useState<'ON_SHIFT' | 'ON_BREAK' | 'SHIFT_ENDED'>('ON_SHIFT');

  // Hall search & attendance
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

  // Chats data & state
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [activeChatContactId, setActiveChatContactId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [waiterChatContacts, setWaiterChatContacts] = useState([
    {
      id: 'chat-reception',
      nameRu: 'Ресепшн',
      nameEn: 'Reception',
      initials: 'РС',
      tagRu: 'диспетчер',
      tagEn: 'front desk',
      isPinned: true,
      unreadCount: 2,
      time: '12:26',
      lastMsgRu: 'В 412 гость просил постучать, не звонить в дверь',
      lastMsgEn: 'Guest in 412 asked to knock, do not ring bell'
    },
    {
      id: 'chat-manager',
      nameRu: 'Жанна Абаева',
      nameEn: 'Zhanna Abaeva',
      initials: 'ЖА',
      tagRu: 'менеджер зала',
      tagEn: 'floor manager',
      isPinned: true,
      unreadCount: 1,
      time: '11:05',
      lastMsgRu: 'Банкет в 19:00, выходим на час раньше',
      lastMsgEn: 'Banquet at 19:00, starting an hour early'
    },
    {
      id: 'chat-shift-a',
      nameRu: 'Смена зала А',
      nameEn: 'Hall A Shift',
      initials: 'СМ',
      tagRu: 'группа',
      tagEn: 'group',
      isPinned: false,
      unreadCount: 0,
      time: '10:42',
      lastMsgRu: 'Марат: подмени на завтраках, я на перерыве',
      lastMsgEn: 'Marat: cover for me at breakfast, I am on break'
    },
    {
      id: 'chat-housekeeping',
      nameRu: 'Хаускипинг',
      nameEn: 'Housekeeping',
      initials: 'ХК',
      tagRu: 'группа',
      tagEn: 'group',
      isPinned: false,
      unreadCount: 0,
      time: 'вчера',
      lastMsgRu: 'Подносы с 3 этажа забрали, спасибо',
      lastMsgEn: 'Trays picked up from floor 3, thanks'
    },
    {
      id: 'chat-supervisor',
      nameRu: 'Светлана Ким',
      nameEn: 'Svetlana Kim',
      initials: 'СК',
      tagRu: 'супервайзер',
      tagEn: 'supervisor',
      isPinned: false,
      unreadCount: 0,
      time: 'вчера',
      lastMsgRu: 'В 105 ранний заезд, завтрак к 07:00',
      lastMsgEn: 'Early check-in in 105, breakfast at 07:00'
    }
  ]);

  const [waiterChatMessages, setWaiterChatMessages] = useState<Record<string, Array<{ sender: 'SENDER' | 'RECEIVER'; text: string; time: string }>>>({
    'chat-reception': [
      { sender: 'RECEIVER', text: 'Доброе утро! В 412 гость просил постучать, не звонить в дверь.', time: '12:25' },
      { sender: 'SENDER', text: 'Принято, передам официантам.', time: '12:26' }
    ],
    'chat-manager': [
      { sender: 'RECEIVER', text: 'Банкет в 19:00, выходим на час раньше для сервировки.', time: '11:05' },
      { sender: 'SENDER', text: 'Поняла, к 17:30 зал будет готов.', time: '11:07' }
    ],
    'chat-shift-a': [
      { sender: 'RECEIVER', text: 'Марат: подмени на завтраках, я на перерыве 15 минут.', time: '10:42' },
      { sender: 'SENDER', text: 'Хорошо, встаю на шведский стол.', time: '10:43' }
    ],
    'chat-housekeeping': [
      { sender: 'RECEIVER', text: 'Подносы с 3 этажа забрали, спасибо.', time: 'вчера' }
    ],
    'chat-supervisor': [
      { sender: 'RECEIVER', text: 'В 105 ранний заезд, завтрак к 07:00.', time: 'вчера' }
    ]
  });

  // Notifications data & state
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'ROOM' | 'BREAKFAST' | 'SHIFT'>('ALL');
  const [waiterNotifications, setWaiterNotifications] = useState([
    {
      id: 'wn-1',
      category: 'ROOM',
      period: 'TODAY',
      titleRu: 'Доставка в № 412 просрочена',
      titleEn: 'Delivery to № 412 overdue',
      subRu: '+6 мин к сроку · 12:56',
      subEn: '+6 min overdue · 12:56',
      isUnread: true,
      isAlert: true,
      icon: 'TIMER'
    },
    {
      id: 'wn-2',
      category: 'ROOM',
      period: 'TODAY',
      titleRu: 'Новая доставка в № 208',
      titleEn: 'New room delivery № 208',
      subRu: 'Срок до 13:10 · 12:58',
      subEn: 'Due 13:10 · 12:58',
      isUnread: true,
      isAlert: false,
      icon: 'ROOM'
    },
    {
      id: 'wn-3',
      category: 'BREAKFAST',
      period: 'TODAY',
      titleRu: 'Аллергия у гостя № 304',
      titleEn: 'Guest allergy № 304',
      subRu: 'Орехи · стол 12',
      subEn: 'Nuts · table 12',
      isUnread: true,
      isAlert: false,
      icon: 'WARNING'
    },
    {
      id: 'wn-4',
      category: 'BREAKFAST',
      period: 'TODAY',
      titleRu: '6 завтраков в номер на завтра',
      titleEn: '6 room breakfasts for tomorrow',
      subRu: 'Приём заявок закрыт в 23:00',
      subEn: 'Orders closed at 23:00',
      isUnread: false,
      isAlert: false,
      icon: 'COFFEE'
    },
    {
      id: 'wn-5',
      category: 'SHIFT',
      period: 'TODAY',
      titleRu: 'Банкет в 19:00 · 30 человек',
      titleEn: 'Banquet at 19:00 · 30 guests',
      subRu: 'Малый зал · столы 15–18',
      subEn: 'Small hall · tables 15–18',
      isUnread: false,
      isAlert: false,
      icon: 'USERS'
    },
    {
      id: 'wn-6',
      category: 'ROOM',
      period: 'YESTERDAY',
      titleRu: 'Подносы с 3 этажа собраны',
      titleEn: 'Trays collected from 3rd floor',
      subRu: 'Передано хаускипингу · 12:40',
      subEn: 'Transferred to housekeeping · 12:40',
      isUnread: false,
      isAlert: false,
      icon: 'CHECK'
    },
    {
      id: 'wn-7',
      category: 'SHIFT',
      period: 'YESTERDAY',
      titleRu: 'Смена завершена',
      titleEn: 'Shift completed',
      subRu: '6 столов, 4 доставки · 17:05',
      subEn: '6 tables, 4 deliveries · 17:05',
      isUnread: false,
      isAlert: false,
      icon: 'CLOCK'
    }
  ]);

  const unreadNotifsCount = waiterNotifications.filter(n => n.isUnread).length;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.screenTitle}>
              {activeTab === 'WAITER_TODAY' ? (lang === 'RU' ? 'Сегодня' : 'Today')
                : activeTab === 'WAITER_HALL' ? (lang === 'RU' ? 'Зал' : 'Dining Hall')
                : (lang === 'RU' ? 'Профиль' : 'Profile')}
            </Text>
            <Text style={styles.screenSubtitle}>
              {lang === 'RU' ? '27 авг · основной ресторан · зал А' : 'Aug 27 · main restaurant · Hall A'}
            </Text>
          </View>
          <View style={styles.topIconsRow}>
            <TouchableOpacity onPress={() => setShowChats(true)} style={styles.topIconBtn}>
              <MessageSquare size={18} color={COLORS.dark} />
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>2</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.topIconBtn}>
              <Bell size={18} color={COLORS.dark} />
              {unreadNotifsCount > 0 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeCountText}>{unreadNotifsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.topIconBtn}>
              <Settings size={18} color={COLORS.dark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. TODAY MEAL PLAN */}
        {activeTab === 'WAITER_TODAY' && (
          <View style={{ gap: 16 }}>
            {/* Breakfast Card */}
            <View style={styles.sectionBlock}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionHeader}>{lang === 'RU' ? 'ЗАВТРАК' : 'BREAKFAST'}</Text>
                <Text style={styles.itemSubText}>07:00–10:30</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                    <Text style={[styles.screenTitle, { fontSize: 24 }]}>96</Text>
                    <Text style={styles.itemSubText}>{lang === 'RU' ? 'из 142 пришли' : 'of 142 attended'}</Text>
                  </View>
                  <Text style={styles.itemSubText}>{lang === 'RU' ? 'осталось 46' : '46 remaining'}</Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '68%' }]} />
                </View>

                <View style={styles.divider} />
                <View style={{ gap: 8 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.itemSubText}>{lang === 'RU' ? 'BB · завтрак включён' : 'BB · breakfast included'}</Text>
                    <Text style={styles.itemTitle}>88</Text>
                  </View>
                  <View style={styles.rowBetween}>
                    <Text style={styles.itemSubText}>{lang === 'RU' ? 'HB · полупансион' : 'HB · half board'}</Text>
                    <Text style={styles.itemTitle}>34</Text>
                  </View>
                  <View style={styles.rowBetween}>
                    <Text style={styles.itemSubText}>{lang === 'RU' ? 'AI · всё включено' : 'AI · all inclusive'}</Text>
                    <Text style={styles.itemTitle}>20</Text>
                  </View>
                  <View style={styles.rowBetween}>
                    <Text style={styles.itemSubText}>{lang === 'RU' ? 'Дети до 6 лет · бесплатно' : 'Kids under 6 · free'}</Text>
                    <Text style={styles.itemTitle}>12</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Lunch & Dinner expected */}
            <View style={styles.sectionBlock}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionHeader}>{lang === 'RU' ? 'ОБЕД' : 'LUNCH'}</Text>
                <Text style={styles.itemSubText}>12:30–15:00</Text>
              </View>
              <View style={[styles.card, styles.rowBetween]}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={[styles.screenTitle, { fontSize: 22 }]}>54</Text>
                  <Text style={styles.itemSubText}>{lang === 'RU' ? 'ожидается' : 'expected'}</Text>
                </View>
                <Text style={styles.itemSubText}>FB 34 · AI 20</Text>
              </View>
            </View>

            <View style={styles.sectionBlock}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionHeader}>{lang === 'RU' ? 'УЖИН' : 'DINNER'}</Text>
                <Text style={styles.itemSubText}>18:30–22:00</Text>
              </View>
              <View style={[styles.card, styles.rowBetween]}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Text style={[styles.screenTitle, { fontSize: 22 }]}>88</Text>
                  <Text style={styles.itemSubText}>{lang === 'RU' ? 'ожидается' : 'expected'}</Text>
                </View>
                <Text style={styles.itemSubText}>HB 34 · FB 34 · AI 20</Text>
              </View>
            </View>

            {/* Important today */}
            <View style={[styles.sectionBlock, { marginBottom: 30 }]}>
              <Text style={styles.sectionHeader}>{lang === 'RU' ? 'ВАЖНОЕ СЕГОДНЯ' : 'IMPORTANT TODAY'}</Text>
              <View style={{ gap: 10 }}>
                <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: COLORS.error, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                  <AlertTriangle size={18} color={COLORS.error} />
                  <View style={styles.flexOne}>
                    <Text style={styles.itemTitle}>{lang === 'RU' ? 'Аллергия · орехи' : 'Allergy · nuts'}</Text>
                    <Text style={styles.itemSubtitle}>{lang === 'RU' ? 'Ким А., № 304 · предупредить кухню' : 'Kim A., № 304 · notify kitchen'}</Text>
                  </View>
                </View>
                <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                  <Users size={18} color={COLORS.textSecondary} />
                  <View style={styles.flexOne}>
                    <Text style={styles.itemTitle}>{lang === 'RU' ? 'Банкет в 19:00 · 30 человек' : 'Banquet at 19:00 · 30 guests'}</Text>
                    <Text style={styles.itemSubtitle}>{lang === 'RU' ? 'Малый зал · отдельное меню' : 'Small hall · separate menu'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 2. HALL ATTENDANCE CHECK-IN WITH SEARCH */}
        {activeTab === 'WAITER_HALL' && (
          <View style={[styles.sectionBlock, { marginBottom: 30 }]}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionHeader}>{lang === 'RU' ? 'ОТМЕТКА ПРИХОДА' : 'ATTENDANCE CHECK-IN'}</Text>
              <Text style={[styles.itemSubText, { color: COLORS.textSecondary }]}>{lang === 'RU' ? 'завтрак' : 'breakfast'}</Text>
            </View>

            <View style={styles.searchBox}>
              <Search size={16} color={COLORS.textSecondary} />
              <TextInput
                placeholder={lang === 'RU' ? 'Номер комнаты или фамилия' : 'Room number or guest name'}
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

        {/* 3. PROFILE (Cleaned: No Contacts, No Orders button, No Logout button) */}
        {activeTab === 'WAITER_PROFILE' && (
          <View style={[styles.sectionBlock, { gap: 16, marginBottom: 30 }]}>
            {/* Header info */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>АД</Text>
              </View>
              <View style={styles.flexOne}>
                <Text style={styles.screenTitle}>
                  {lang === 'RU' ? cleanerProfile.fullNameRu : cleanerProfile.fullName}
                </Text>
                <Text style={styles.screenSubtitle}>
                  {lang === 'RU' ? 'Официант · основной ресторан, зал А' : 'Server · main restaurant, Hall A'}
                </Text>
              </View>
            </View>

            {/* Current shift card */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>{lang === 'RU' ? 'ТЕКУЩАЯ СМЕНА' : 'CURRENT SHIFT'}</Text>
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.itemTitle}>SH-4092</Text>
                  <Text style={styles.itemSubText}>{lang === 'RU' ? '27 авг · с 08:00' : 'Aug 27 · from 08:00'}</Text>
                </View>

                {/* Status Toggle Pills */}
                <View style={{ flexDirection: 'row', gap: 8, marginVertical: 14 }}>
                  <TouchableOpacity
                    onPress={() => setShiftStatus('ON_SHIFT')}
                    style={[styles.pillBtn, shiftStatus === 'ON_SHIFT' ? styles.pillBtnActive : styles.pillBtnInactive]}
                  >
                    <Text style={[styles.pillBtnText, shiftStatus === 'ON_SHIFT' && styles.pillBtnTextActive]}>
                      {lang === 'RU' ? 'На смене' : 'On Shift'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShiftStatus('ON_BREAK')}
                    style={[styles.pillBtn, shiftStatus === 'ON_BREAK' ? styles.pillBtnActive : styles.pillBtnInactive]}
                  >
                    <Text style={[styles.pillBtnText, shiftStatus === 'ON_BREAK' && styles.pillBtnTextActive]}>
                      {lang === 'RU' ? 'Перерыв' : 'Break'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShiftStatus('SHIFT_ENDED')}
                    style={[styles.pillBtn, shiftStatus === 'SHIFT_ENDED' ? styles.pillBtnActive : styles.pillBtnInactive]}
                  >
                    <Text style={[styles.pillBtnText, shiftStatus === 'SHIFT_ENDED' && styles.pillBtnTextActive]}>
                      {lang === 'RU' ? 'Завершить' : 'End'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Metrics */}
                <View style={styles.divider} />
                <View style={styles.statsRow}>
                  <View style={styles.statCol}>
                    <Text style={styles.statNumber}>12</Text>
                    <Text style={styles.statLabel}>{lang === 'RU' ? 'заказов' : 'orders'}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statNumber}>14 мин</Text>
                    <Text style={styles.statLabel}>{lang === 'RU' ? 'подача' : 'delivery'}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statNumber}>6</Text>
                    <Text style={styles.statLabel}>{lang === 'RU' ? 'столов' : 'tables'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Work actions */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeader}>{lang === 'RU' ? 'РАБОТА' : 'WORK'}</Text>
              <View style={[styles.card, { padding: 0 }]}>
                <TouchableOpacity
                  onPress={() => Alert.alert('Отчёт по смене', 'Смена SH-4092: 96 гостей, 12 заказов, сумма 128 400 ₸')}
                  style={styles.listItem}
                >
                  <Coffee size={18} color={COLORS.textSecondary} />
                  <Text style={[styles.itemTitle, { marginLeft: 12, flex: 1 }]}>
                    {lang === 'RU' ? 'Отчёт по смене' : 'Shift Report'}
                  </Text>
                  <ChevronRight size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => Alert.alert('График смен', '27 авг: 08:00 - 20:00 (Зал А)\n28 авг: 08:00 - 20:00 (Зал B)\n29 авг: Выходной')}
                  style={[styles.listItem, styles.itemBorderTop]}
                >
                  <Clock size={18} color={COLORS.textSecondary} />
                  <Text style={[styles.itemTitle, { marginLeft: 12, flex: 1 }]}>
                    {lang === 'RU' ? 'График смен' : 'Shift Schedule'}
                  </Text>
                  <ChevronRight size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => Alert.alert('Банкеты и брони', 'Банкет в 19:00 на 30 чел (Малый зал). Ответственный: Айгерим Д.')}
                  style={[styles.listItem, styles.itemBorderTop]}
                >
                  <Users size={18} color={COLORS.textSecondary} />
                  <Text style={[styles.itemTitle, { marginLeft: 12, flex: 1 }]}>
                    {lang === 'RU' ? 'Банкеты и брони зала' : 'Banquets & Reservations'}
                  </Text>
                  <ChevronRight size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ================= MODAL: 09 · CHATS ================= */}
      <Modal visible={showChats} animationType="slide">
        <View style={[styles.container, { padding: 16 }]}>
          {!activeChatContactId ? (
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 }}>
                <TouchableOpacity onPress={() => setShowChats(false)}>
                  <ChevronLeft size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>{lang === 'RU' ? 'Чаты' : 'Chats'}</Text>
              </View>

              <View style={[styles.searchBox, { marginVertical: 10 }]}>
                <Search size={16} color={COLORS.textSecondary} />
                <TextInput
                  placeholder={lang === 'RU' ? 'Поиск по имени' : 'Search by name'}
                  placeholderTextColor={COLORS.textSecondary}
                  value={chatSearchQuery}
                  onChangeText={setChatSearchQuery}
                  style={styles.searchInput}
                />
              </View>

              <ScrollView style={{ flex: 1 }}>
                <View style={[styles.card, { padding: 0 }]}>
                  {waiterChatContacts
                    .filter(c => c.nameRu.toLowerCase().includes(chatSearchQuery.toLowerCase()))
                    .map((contact, idx) => (
                      <TouchableOpacity
                        key={contact.id}
                        onPress={() => setActiveChatContactId(contact.id)}
                        style={[styles.listItem, idx > 0 && styles.itemBorderTop]}
                      >
                        <View style={styles.avatarCircleSmall}>
                          <Text style={styles.avatarTextSmall}>{contact.initials}</Text>
                        </View>
                        <View style={styles.flexOne}>
                          <View style={styles.rowBetween}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.itemTitle}>{lang === 'RU' ? contact.nameRu : contact.nameEn}</Text>
                              {contact.isPinned && <Pin size={12} color={COLORS.textSecondary} />}
                            </View>
                            <Text style={styles.itemSubText}>{contact.time}</Text>
                          </View>
                          <Text style={styles.itemSubtitle} numberOfLines={1}>
                            {lang === 'RU' ? contact.lastMsgRu : contact.lastMsgEn}
                          </Text>
                        </View>
                        {contact.unreadCount > 0 && (
                          <View style={[styles.badgeCount, { position: 'relative', top: 0, right: 0, marginLeft: 8 }]}>
                            <Text style={styles.badgeCountText}>{contact.unreadCount}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                </View>
              </ScrollView>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 }}>
                <TouchableOpacity onPress={() => setActiveChatContactId(null)}>
                  <ChevronLeft size={24} color={COLORS.dark} />
                </TouchableOpacity>
                <View>
                  <Text style={styles.itemTitle}>{waiterChatContacts.find(c => c.id === activeChatContactId)?.nameRu}</Text>
                  <Text style={styles.itemSubText}>{waiterChatContacts.find(c => c.id === activeChatContactId)?.tagRu} · онлайн</Text>
                </View>
              </View>

              <ScrollView style={{ flex: 1, paddingVertical: 10 }}>
                {(waiterChatMessages[activeChatContactId] || []).map((msg, idx) => (
                  <View
                    key={idx}
                    style={{
                      alignSelf: msg.sender === 'SENDER' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      marginVertical: 4
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: msg.sender === 'SENDER' ? COLORS.primary : COLORS.backgroundCard,
                        padding: 12,
                        borderRadius: 16,
                        borderWidth: msg.sender === 'SENDER' ? 0 : 1,
                        borderColor: COLORS.border
                      }}
                    >
                      <Text style={{ color: msg.sender === 'SENDER' ? '#FFFFFF' : COLORS.dark, fontFamily: FONTS.jost400, fontSize: 13 }}>
                        {msg.text}
                      </Text>
                    </View>
                    <Text style={[styles.itemSubText, { fontSize: 10, alignSelf: msg.sender === 'SENDER' ? 'flex-end' : 'flex-start', marginTop: 2 }]}>
                      {msg.time}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
                <TextInput
                  placeholder="Написать сообщение..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={typedMessage}
                  onChangeText={setTypedMessage}
                  style={[styles.searchBox, { flex: 1 }]}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (!typedMessage.trim()) return;
                    setWaiterChatMessages(prev => ({
                      ...prev,
                      [activeChatContactId]: [
                        ...(prev[activeChatContactId] || []),
                        { sender: 'SENDER', text: typedMessage.trim(), time: '12:30' }
                      ]
                    }));
                    setTypedMessage('');
                  }}
                  style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Send size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* ================= MODAL: 10 · NOTIFICATIONS ================= */}
      <Modal visible={showNotifications} animationType="slide">
        <View style={[styles.container, { padding: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 }}>
            <TouchableOpacity onPress={() => setShowNotifications(false)}>
              <ChevronLeft size={24} color={COLORS.dark} />
            </TouchableOpacity>
            <View>
              <Text style={styles.screenTitle}>{lang === 'RU' ? 'Уведомления' : 'Notifications'}</Text>
              <Text style={styles.itemSubText}>
                {unreadNotifsCount} новых ·{' '}
                <Text
                  onPress={() => setWaiterNotifications(prev => prev.map(n => ({ ...n, isUnread: false })))}
                  style={{ color: COLORS.primary, fontFamily: FONTS.jost500 }}
                >
                  {lang === 'RU' ? 'отметить все' : 'mark all read'}
                </Text>
              </Text>
            </View>
          </View>

          {/* Filter pills */}
          <View style={{ flexDirection: 'row', gap: 8, marginVertical: 10 }}>
            {(['ALL', 'ROOM', 'BREAKFAST', 'SHIFT'] as const).map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setNotifFilter(f)}
                style={[styles.pillBtn, notifFilter === f ? styles.pillBtnActive : styles.pillBtnInactive]}
              >
                <Text style={[styles.pillBtnText, notifFilter === f && styles.pillBtnTextActive]}>
                  {f === 'ALL' ? (lang === 'RU' ? 'Все' : 'All')
                    : f === 'ROOM' ? (lang === 'RU' ? 'В номер' : 'Room')
                    : f === 'BREAKFAST' ? (lang === 'RU' ? 'Завтраки' : 'Breakfast')
                    : (lang === 'RU' ? 'Смена' : 'Shift')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={{ flex: 1 }}>
            <View style={{ gap: 8 }}>
              {waiterNotifications
                .filter(n => notifFilter === 'ALL' || n.category === notifFilter)
                .map((notif) => (
                  <TouchableOpacity
                    key={notif.id}
                    onPress={() => setWaiterNotifications(prev => prev.map(item => item.id === notif.id ? { ...item, isUnread: false } : item))}
                    style={[
                      styles.card,
                      { flexDirection: 'row', alignItems: 'center', gap: 12 },
                      notif.isAlert && { borderLeftWidth: 4, borderLeftColor: COLORS.error }
                    ]}
                  >
                    {notif.icon === 'TIMER' ? <Clock size={18} color={COLORS.error} />
                      : notif.icon === 'ROOM' ? <ConciergeBell size={18} color={COLORS.textSecondary} />
                      : notif.icon === 'WARNING' ? <AlertTriangle size={18} color={COLORS.textSecondary} />
                      : notif.icon === 'COFFEE' ? <Coffee size={18} color={COLORS.textSecondary} />
                      : <Users size={18} color={COLORS.textSecondary} />}
                    
                    <View style={styles.flexOne}>
                      <Text style={[styles.itemTitle, notif.isUnread ? { color: COLORS.dark } : { color: COLORS.textSecondary }]}>
                        {lang === 'RU' ? notif.titleRu : notif.titleEn}
                      </Text>
                      <Text style={styles.itemSubtitle}>{lang === 'RU' ? notif.subRu : notif.subEn}</Text>
                    </View>

                    {notif.isUnread && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary }} />
                    )}
                  </TouchableOpacity>
                ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ================= MODAL: 11 · SETTINGS (WITH LOGOUT) ================= */}
      <Modal visible={showSettings} animationType="slide">
        <View style={[styles.container, { padding: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 }}>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <ChevronLeft size={24} color={COLORS.dark} />
            </TouchableOpacity>
            <View>
              <Text style={styles.screenTitle}>{lang === 'RU' ? 'Настройки' : 'Settings'}</Text>
              <Text style={styles.screenSubtitle}>{lang === 'RU' ? 'Приложение и учётная запись' : 'App & Account settings'}</Text>
            </View>
          </View>

          <ScrollView style={{ flex: 1 }}>
            <View style={{ gap: 16, paddingBottom: 40 }}>
              {/* App Settings */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeader}>{lang === 'RU' ? 'ПРИЛОЖЕНИЕ' : 'APPLICATION'}</Text>
                <View style={[styles.card, { padding: 0 }]}>
                  {/* Lang switch */}
                  <View style={[styles.listItem, styles.rowBetween]}>
                    <View>
                      <Text style={styles.itemTitle}>{lang === 'RU' ? 'Язык интерфейса' : 'Interface Language'}</Text>
                      <Text style={styles.itemSubText}>{lang === 'RU' ? 'Русский' : 'English'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', backgroundColor: '#EFECE6', borderRadius: 20, padding: 2 }}>
                      <TouchableOpacity
                        onPress={() => onLanguageChange?.('RU')}
                        style={[styles.pillBtn, lang === 'RU' ? styles.pillBtnActive : { backgroundColor: 'transparent' }]}
                      >
                        <Text style={[styles.pillBtnText, lang === 'RU' && styles.pillBtnTextActive]}>RU</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onLanguageChange?.('EN')}
                        style={[styles.pillBtn, lang === 'EN' ? styles.pillBtnActive : { backgroundColor: 'transparent' }]}
                      >
                        <Text style={[styles.pillBtnText, lang === 'EN' && styles.pillBtnTextActive]}>EN</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Offline switch */}
                  <TouchableOpacity
                    onPress={() => setOfflineMode(!offlineMode)}
                    style={[styles.listItem, styles.itemBorderTop, styles.rowBetween]}
                  >
                    <View>
                      <Text style={styles.itemTitle}>{lang === 'RU' ? 'Офлайн-режим' : 'Offline Mode'}</Text>
                      <Text style={styles.itemSubText}>{lang === 'RU' ? 'синхронизация при сети' : 'sync when online'}</Text>
                    </View>
                    <View style={[styles.toggleTrack, offlineMode && styles.toggleTrackActive]}>
                      <View style={[styles.toggleThumb, offlineMode && styles.toggleThumbActive]} />
                    </View>
                  </TouchableOpacity>

                  {/* Push switch */}
                  <TouchableOpacity
                    onPress={() => setPushNotifications(!pushNotifications)}
                    style={[styles.listItem, styles.itemBorderTop, styles.rowBetween]}
                  >
                    <View>
                      <Text style={styles.itemTitle}>{lang === 'RU' ? 'Push-уведомления' : 'Push Notifications'}</Text>
                    </View>
                    <View style={[styles.toggleTrack, pushNotifications && styles.toggleTrackActive]}>
                      <View style={[styles.toggleThumb, pushNotifications && styles.toggleThumbActive]} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sync section */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeader}>{lang === 'RU' ? 'СИНХРОНИЗАЦИЯ' : 'SYNC'}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setLastSyncTime('12:35');
                    Alert.alert('Синхронизация', 'Данные успешно обновлены!');
                  }}
                  style={[styles.card, styles.rowBetween]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <RefreshCw size={18} color={COLORS.textSecondary} />
                    <View>
                      <Text style={styles.itemTitle}>{lang === 'RU' ? 'Обновить данные' : 'Refresh Data'}</Text>
                      <Text style={styles.itemSubText}>{lang === 'RU' ? `последняя синхронизация ${lastSyncTime}` : `last sync ${lastSyncTime}`}</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Account section */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeader}>{lang === 'RU' ? 'УЧЁТНАЯ ЗАПИСЬ' : 'ACCOUNT'}</Text>
                <View style={[styles.card, { padding: 0 }]}>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Личные данные', 'Айгерим Досова\nОфициант ресторана\nSLV-4092')}
                    style={styles.listItem}
                  >
                    <User size={18} color={COLORS.textSecondary} />
                    <Text style={[styles.itemTitle, { marginLeft: 12, flex: 1 }]}>{lang === 'RU' ? 'Личные данные' : 'Personal Data'}</Text>
                    <ChevronRight size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => Alert.alert('Сменить пароль', 'Для смены пароля обратитесь к супервайзеру или в IT')}
                    style={[styles.listItem, styles.itemBorderTop]}
                  >
                    <Lock size={18} color={COLORS.textSecondary} />
                    <Text style={[styles.itemTitle, { marginLeft: 12, flex: 1 }]}>{lang === 'RU' ? 'Сменить пароль' : 'Change Password'}</Text>
                    <ChevronRight size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => Alert.alert('Служба поддержки', 'Горячая линия: 8 (800) 555-35-35\nF&B: fb@sollviera.hotel')}
                    style={[styles.listItem, styles.itemBorderTop]}
                  >
                    <Headphones size={18} color={COLORS.textSecondary} />
                    <Text style={[styles.itemTitle, { marginLeft: 12, flex: 1 }]}>{lang === 'RU' ? 'Служба поддержки' : 'Support Desk'}</Text>
                    <ChevronRight size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Logout button (Moved into Settings) */}
              <TouchableOpacity
                onPress={() => {
                  setShowSettings(false);
                  onLogout();
                }}
                style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}
              >
                <LogOut size={18} color={COLORS.textSecondary} />
                <Text style={[styles.itemTitle, { color: COLORS.textSecondary }]}>
                  {lang === 'RU' ? 'Выйти из аккаунта' : 'Log out'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  topIconBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badgeCount: { position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.primary, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeCountText: { color: '#FFFFFF', fontSize: 9, fontFamily: FONTS.jost600 },
  screenTitle: { fontFamily: FONTS.spectral500, fontSize: 22, color: COLORS.dark },
  screenSubtitle: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  sectionBlock: { marginTop: 14 },
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
  itemTitle: { fontFamily: FONTS.jost500, fontSize: 13, color: COLORS.dark },
  itemSubtitle: { fontFamily: FONTS.jost400, fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  itemSubText: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary },
  flexOne: { flex: 1 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E5E0D8', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONTS.spectral500, fontSize: 16, color: COLORS.textSecondary },
  avatarCircleSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E0D8', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarTextSmall: { fontFamily: FONTS.jost500, fontSize: 12, color: COLORS.textSecondary },
  dotIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  packageBadge: { backgroundColor: '#FAF0EB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  packageBadgeText: { fontFamily: FONTS.jost500, fontSize: 9, color: COLORS.primary },
  circleUnchecked: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: COLORS.border },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.dark, padding: 0 },
  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: 12 },
  progressBarBg: { height: 6, backgroundColor: '#EFE9E2', borderRadius: 3, overflow: 'hidden', marginVertical: 10 },
  progressBarFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: 3 },
  pillBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  pillBtnActive: { backgroundColor: COLORS.dark },
  pillBtnInactive: { backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border },
  pillBtnText: { fontFamily: FONTS.jost400, fontSize: 12, color: COLORS.textSecondary },
  pillBtnTextActive: { fontFamily: FONTS.jost500, color: '#FFFFFF' },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, backgroundColor: COLORS.border, padding: 2 },
  toggleTrackActive: { backgroundColor: COLORS.success },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  toggleThumbActive: { transform: [{ translateX: 20 }] }
});
