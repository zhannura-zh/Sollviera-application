import React, { useState, useEffect } from 'react';
import {
  Utensils, Calendar, Clock, Check, ChevronRight, ChevronLeft, Search,
  AlertCircle, AlertTriangle, MessageSquare, Bell, Settings, Phone,
  RotateCcw, User, Lock, Headphones, LogOut, Plus, Minus, Info,
  CheckCircle2, Coffee, Pin, Send, Wine, Flame, Eye, ChefHat,
  Receipt, Users, HelpCircle, ConciergeBell, Sparkles, RefreshCw
} from 'lucide-react';
import { Language, CleanerProfile, HotelRoom } from '../types';

interface WaiterScreensProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  cleanerProfile: CleanerProfile;
  onUpdateCleanerProfile: (profile: CleanerProfile) => void;
  onLogout: () => void;
  offlineMode: boolean;
  onToggleOffline: () => void;
  activeTab: string;
}

export const WaiterScreens: React.FC<WaiterScreensProps> = ({
  lang,
  onLanguageChange,
  cleanerProfile,
  onUpdateCleanerProfile,
  onLogout,
  offlineMode,
  onToggleOffline,
  activeTab
}) => {
  // Sub-screen / Modal States
  const [showChats, setShowChats] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showShiftReportModal, setShowShiftReportModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showBanquetsModal, setShowBanquetsModal] = useState<boolean>(false);

  // Settings states
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [soundOnNewTask, setSoundOnNewTask] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('12:04');
  const [showPersonalDataModal, setShowPersonalDataModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

  // Shift Status
  const [shiftStatus, setShiftStatus] = useState<'ON_SHIFT' | 'ON_BREAK' | 'SHIFT_ENDED'>('ON_SHIFT');

  // 01. СЕГОДНЯ (TODAY) & 02. ЗАЛ (HALL ATTENDANCE) DATA
  const [guestSearchQuery, setGuestSearchQuery] = useState<string>('');
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

  // ----------------------------------------------------
  // 09. ЧАТЫ DATA & STATE
  // ----------------------------------------------------
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [activeChatContactId, setActiveChatContactId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState<string>('');

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

  // ----------------------------------------------------
  // 10. УВЕДОМЛЕНИЯ DATA & STATE
  // ----------------------------------------------------
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

  const markAllNotifsRead = () => {
    setWaiterNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  };

  // Clean active overlays when navigation tab changes
  useEffect(() => {
    setShowChats(false);
    setShowNotifications(false);
    setShowSettings(false);
    setActiveChatContactId(null);
  }, [activeTab]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3] relative font-sans select-none">
      
      {/* ========================================================================= */}
      {/* -------------------- TAB 1: СЕГОДНЯ (WAITER_TODAY) -------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'WAITER_TODAY' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3]">
          <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
            
            {/* Header */}
            <div className="pt-2 pb-1">
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Сегодня' : 'Today'}
              </h1>
              <p className="text-xs font-sans font-normal text-[#8A8177] pt-1">
                {lang === 'RU' ? '27 авг · основной ресторан · загрузка 78%' : 'Aug 27 · main restaurant · 78% occupancy'}
              </p>
            </div>

            {/* Breakfast Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'ЗАВТРАК' : 'BREAKFAST'}
                </span>
                <span className="text-xs font-sans font-normal text-[#8A8177]">
                  07:00–10:30
                </span>
              </div>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 space-y-3.5 shadow-2xs">
                <div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif font-medium text-2xl text-[#241E1A]">96</span>
                      <span className="text-xs font-sans font-normal text-[#8A8177]">
                        {lang === 'RU' ? 'из 142 пришли' : 'of 142 attended'}
                      </span>
                    </div>
                    <span className="text-xs font-sans font-normal text-[#8A8177]">
                      {lang === 'RU' ? 'осталось 46' : '46 remaining'}
                    </span>
                  </div>

                  {/* Meal bar */}
                  <div className="h-1.5 bg-[#EFE9E2] rounded-full overflow-hidden flex mt-2.5">
                    <div className="h-full bg-[#5B8C6E] rounded-full" style={{ width: '68%' }} />
                  </div>
                </div>

                <div className="divide-y divide-[#E5E2DD]/50 border-t border-[#E5E2DD]/50 pt-1 text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#8A8177]">{lang === 'RU' ? 'BB · завтрак включён' : 'BB · breakfast included'}</span>
                    <span className="font-medium text-[#241E1A]">88</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#8A8177]">{lang === 'RU' ? 'HB · полупансион' : 'HB · half board'}</span>
                    <span className="font-medium text-[#241E1A]">34</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#8A8177]">{lang === 'RU' ? 'AI · всё включено' : 'AI · all inclusive'}</span>
                    <span className="font-medium text-[#241E1A]">20</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-[#8A8177]">{lang === 'RU' ? 'Дети до 6 лет · бесплатно' : 'Kids under 6 · free'}</span>
                    <span className="font-medium text-[#241E1A]">12</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lunch Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'ОБЕД' : 'LUNCH'}
                </span>
                <span className="text-xs font-sans font-normal text-[#8A8177]">
                  12:30–15:00
                </span>
              </div>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 shadow-2xs flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif font-medium text-2xl text-[#241E1A]">54</span>
                  <span className="text-xs font-sans font-normal text-[#8A8177]">
                    {lang === 'RU' ? 'ожидается' : 'expected'}
                  </span>
                </div>
                <span className="text-xs font-sans font-normal text-[#8A8177]">
                  FB 34 · AI 20
                </span>
              </div>
            </div>

            {/* Dinner Card */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'УЖИН' : 'DINNER'}
                </span>
                <span className="text-xs font-sans font-normal text-[#8A8177]">
                  18:30–22:00
                </span>
              </div>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 shadow-2xs flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif font-medium text-2xl text-[#241E1A]">88</span>
                  <span className="text-xs font-sans font-normal text-[#8A8177]">
                    {lang === 'RU' ? 'ожидается' : 'expected'}
                  </span>
                </div>
                <span className="text-xs font-sans font-normal text-[#8A8177]">
                  HB 34 · FB 34 · AI 20
                </span>
              </div>
            </div>

            {/* Important Today Section */}
            <div className="space-y-2 pt-1 pb-6">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ВАЖНОЕ СЕГОДНЯ' : 'IMPORTANT TODAY'}
              </span>

              <div className="space-y-2.5">
                {/* Allergy warning card */}
                <div className="bg-white rounded-[20px] border border-[#E5E2DD] border-l-4 border-l-[#B3261E] p-4 flex items-start gap-3 shadow-2xs">
                  <AlertTriangle className="h-4 w-4 text-[#B3261E] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Аллергия · орехи' : 'Allergy · nuts'}
                    </h4>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'Ким А., № 304 · предупредить кухню' : 'Kim A., № 304 · notify kitchen'}
                    </p>
                  </div>
                </div>

                {/* Birthday card */}
                <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 flex items-start gap-3 shadow-2xs">
                  <span className="text-sm shrink-0">🎉</span>
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'День рождения гостя' : 'Guest Birthday'}
                    </h4>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'Абдиров К., № 412 · комплимент от отеля' : 'Abdirov K., № 412 · hotel compliment'}
                    </p>
                  </div>
                </div>

                {/* Banquet card */}
                <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 flex items-start gap-3 shadow-2xs">
                  <Users className="h-4 w-4 text-[#8A8177] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Банкет в 19:00 · 30 человек' : 'Banquet at 19:00 · 30 guests'}
                    </h4>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'Малый зал · отдельное меню' : 'Small hall · separate menu'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- TAB 2: ЗАЛ (WAITER_HALL) -------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'WAITER_HALL' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3]">
          <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
            
            {/* Header */}
            <div className="pt-2 pb-1">
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Зал' : 'Dining Hall'}
              </h1>
              <p className="text-xs font-sans font-normal text-[#8A8177] pt-1">
                <strong className="text-[#241E1A] font-medium">
                  {mealAttendanceList.filter(g => g.checkedIn).length}
                </strong> {lang === 'RU' ? `из ${mealAttendanceList.length} гостей пришли · ` : `of ${mealAttendanceList.length} guests checked in · `}
                <span className="text-[#5B8C6E] font-medium">
                  {lang === 'RU' ? 'завтрак' : 'breakfast'}
                </span>
              </p>
            </div>

            {/* Meal selector / filter chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer bg-[#241E1A] text-white font-medium shadow-xs"
              >
                {lang === 'RU' ? 'Завтрак' : 'Breakfast'} <span className="opacity-70 ml-1">07:00–10:30</span>
              </button>
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal"
              >
                {lang === 'RU' ? 'Обед' : 'Lunch'} <span className="opacity-70 ml-1">12:30–15:00</span>
              </button>
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal"
              >
                {lang === 'RU' ? 'Ужин' : 'Dinner'} <span className="opacity-70 ml-1">18:30–22:00</span>
              </button>
            </div>

            {/* Attendance Check-in Section */}
            <div className="space-y-2 pt-1 pb-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                  {lang === 'RU' ? 'ОТМЕТКА ПРИХОДА' : 'ATTENDANCE CHECK-IN'}
                </span>
                <span className="text-xs font-sans font-normal text-[#8A8177]">
                  {lang === 'RU' ? 'завтрак' : 'breakfast'}
                </span>
              </div>

              {/* Search */}
              <div className="bg-white rounded-2xl border border-[#E5E2DD] px-3.5 py-2.5 flex items-center gap-2.5 shadow-2xs">
                <Search className="h-4 w-4 text-[#8A8177] shrink-0" />
                <input
                  type="text"
                  placeholder={lang === 'RU' ? 'Номер комнаты или фамилия' : 'Room number or guest name'}
                  value={guestSearchQuery}
                  onChange={(e) => setGuestSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#241E1A] placeholder-[#8A8177] focus:outline-none font-sans font-normal"
                />
              </div>

              {/* Guests List */}
              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {mealAttendanceList
                  .filter(g => {
                    const q = guestSearchQuery.toLowerCase();
                    return g.roomNumber.toLowerCase().includes(q) || g.guestName.toLowerCase().includes(q);
                  })
                  .map((guest) => (
                    <div
                      key={guest.id}
                      onClick={() => {
                        setMealAttendanceList(prev => prev.map(item => {
                          if (item.id === guest.id) {
                            const newChecked = !item.checkedIn;
                            return {
                              ...item,
                              checkedIn: newChecked,
                              checkInTime: newChecked ? new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''
                            };
                          }
                          return item;
                        }));
                      }}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${guest.checkedIn ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-sans font-medium text-[#241E1A]">
                              {guest.roomNumber}
                            </span>
                            <span className="bg-[#FAF0EB] text-[#C2410C] text-[9px] font-sans font-medium px-1.5 py-0.5 rounded leading-none">
                              {guest.packageType}
                            </span>
                            <span className={`text-[10px] font-sans ${guest.checkedIn ? 'text-[#5B8C6E] font-medium' : 'text-[#8A8177]'}`}>
                              {guest.checkedIn ? `отмечены ${guest.checkInTime || '08:12'}` : guest.guestsInfo}
                            </span>
                          </div>
                          <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5 truncate">
                            {guest.guestName}
                          </p>
                        </div>
                      </div>

                      {guest.checkedIn ? (
                        <CheckCircle2 className="h-5 w-5 text-[#5B8C6E] shrink-0" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-[#D4CECA] shrink-0" />
                      )}
                    </div>
                  ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- TAB 3: ПРОФИЛЬ (WAITER_PROFILE) -------------------- */}
      {/* ========================================================================= */}
      {activeTab === 'WAITER_PROFILE' && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3]">
          <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
            
            {/* Top Bar with 'SOLLVIERA' / 'Профиль' in Spectral 500 and 3 Action Icons */}
            <div className="pt-2 pb-1 flex items-center justify-between">
              <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                {lang === 'RU' ? 'Профиль' : 'Profile'}
              </h1>

              <div className="flex items-center gap-2">
                {/* Chat button with badge */}
                <button
                  type="button"
                  onClick={() => setShowChats(true)}
                  className="h-10 w-10 bg-white rounded-2xl border border-[#E5E2DD] flex items-center justify-center text-[#241E1A] hover:bg-slate-50 transition-colors shadow-2xs relative cursor-pointer"
                >
                  <MessageSquare className="h-4.5 w-4.5 text-[#241E1A]" />
                  <span className="absolute -top-1 -right-1 bg-[#C2410C] text-white text-[9px] font-sans font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-xs">
                    2
                  </span>
                </button>

                {/* Notifications button with badge */}
                <button
                  type="button"
                  onClick={() => setShowNotifications(true)}
                  className="h-10 w-10 bg-white rounded-2xl border border-[#E5E2DD] flex items-center justify-center text-[#241E1A] hover:bg-slate-50 transition-colors shadow-2xs relative cursor-pointer"
                >
                  <Bell className="h-4.5 w-4.5 text-[#241E1A]" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#C2410C] text-white text-[9px] font-sans font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-xs">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>

                {/* Settings button */}
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="h-10 w-10 bg-white rounded-2xl border border-[#E5E2DD] flex items-center justify-center text-[#241E1A] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <Settings className="h-4.5 w-4.5 text-[#241E1A]" />
                </button>
              </div>
            </div>

            {/* Profile Header */}
            <div className="flex items-center gap-3.5 pt-1">
              <div className="h-12 w-12 rounded-full bg-[#E5E0D8] text-[#8A8177] font-serif font-medium text-base flex items-center justify-center shrink-0 select-none">
                АД
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-serif font-medium text-xl text-[#241E1A] leading-tight">
                  {lang === 'RU' ? cleanerProfile.fullNameRu : cleanerProfile.fullName}
                </h2>
                <p className="text-xs font-sans font-normal text-[#8A8177] pt-0.5">
                  {lang === 'RU' ? 'Официант · основной ресторан, зал А' : 'Server · main restaurant, Hall A'}
                </p>
              </div>
            </div>

            {/* Section 1: ТЕКУЩАЯ СМЕНА */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ТЕКУЩАЯ СМЕНА' : 'CURRENT SHIFT'}
              </span>

              <div className="bg-white rounded-[24px] border border-[#E5E2DD] p-4.5 space-y-4 shadow-2xs">
                {/* Shift ID & start time */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-sans font-medium text-[#241E1A]">
                    SH-4092
                  </span>
                  <span className="text-xs font-sans font-normal text-[#8A8177]">
                    {lang === 'RU' ? '27 авг · с 08:00' : 'Aug 27 · from 08:00'}
                  </span>
                </div>

                {/* Status Toggle Pills */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setShiftStatus('ON_SHIFT')}
                    className={`py-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
                      shiftStatus === 'ON_SHIFT'
                        ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                        : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                    }`}
                  >
                    {lang === 'RU' ? 'На смене' : 'On Shift'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShiftStatus('ON_BREAK')}
                    className={`py-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
                      shiftStatus === 'ON_BREAK'
                        ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                        : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                    }`}
                  >
                    {lang === 'RU' ? 'Перерыв' : 'Break'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShiftStatus('SHIFT_ENDED')}
                    className={`py-2.5 rounded-xl text-xs font-sans transition-all cursor-pointer text-center ${
                      shiftStatus === 'SHIFT_ENDED'
                        ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                        : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                    }`}
                  >
                    {lang === 'RU' ? 'Завершить' : 'End'}
                  </button>
                </div>

                {/* 3 Shift Metrics */}
                <div className="grid grid-cols-3 divide-x divide-[#E5E2DD]/50 pt-2 border-t border-[#E5E2DD]/50 text-center">
                  <div className="px-1">
                    <div className="text-base font-sans">
                      <span className="font-medium text-[#241E1A]">12</span>
                    </div>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'заказов' : 'orders'}
                    </p>
                  </div>

                  <div className="px-1">
                    <div className="text-base font-sans">
                      <span className="font-medium text-[#241E1A]">14</span>
                      <span className="text-xs font-normal text-[#8A8177]"> мин</span>
                    </div>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'подача' : 'avg delivery'}
                    </p>
                  </div>

                  <div className="px-1">
                    <div className="text-base font-sans">
                      <span className="font-medium text-[#241E1A]">6</span>
                    </div>
                    <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                      {lang === 'RU' ? 'столов' : 'tables'}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Section 2: РАБОТА (Cleaned: No Contacts, No Orders button, No Logout) */}
            <div className="space-y-2 pt-1 pb-6">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'РАБОТА' : 'WORK'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                <div
                  onClick={() => setShowShiftReportModal(true)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Coffee className="h-4 w-4 text-[#8A8177]" />
                    <span className="text-xs font-sans font-normal text-[#241E1A]">
                      {lang === 'RU' ? 'Отчёт по смене' : 'Shift Report'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                <div
                  onClick={() => setShowScheduleModal(true)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-[#8A8177]" />
                    <span className="text-xs font-sans font-normal text-[#241E1A]">
                      {lang === 'RU' ? 'График смен' : 'Shift Schedule'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                <div
                  onClick={() => setShowBanquetsModal(true)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-[#8A8177]" />
                    <span className="text-xs font-sans font-normal text-[#241E1A]">
                      {lang === 'RU' ? 'Банкеты и брони зала' : 'Banquets & Reservations'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- 09 · ЧАТЫ (FULL SCREEN / MODAL) ------------------- */}
      {/* ========================================================================= */}
      {showChats && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col min-h-0 font-sans animate-in slide-in-from-right duration-200">
          {!activeChatContactId ? (
            <div className="flex-1 flex flex-col min-h-0 p-4.5 space-y-3.5 overflow-y-auto no-scrollbar">
              {/* Head with Back button */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowChats(false)}
                  className="h-9 w-9 -ml-2 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6 text-[#241E1A]" />
                </button>
                <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                  {lang === 'RU' ? 'Чаты' : 'Chats'}
                </h1>
              </div>

              {/* Search */}
              <div className="bg-white rounded-2xl border border-[#E5E2DD] px-3.5 py-2.5 flex items-center gap-2.5 shadow-2xs">
                <Search className="h-4 w-4 text-[#8A8177] shrink-0" />
                <input
                  type="text"
                  placeholder={lang === 'RU' ? 'Поиск по имени' : 'Search by name'}
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#241E1A] placeholder-[#8A8177] focus:outline-none font-sans font-normal"
                />
              </div>

              {/* Dialogs Card */}
              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {waiterChatContacts
                  .filter(c => c.nameRu.toLowerCase().includes(chatSearchQuery.toLowerCase()))
                  .map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setActiveChatContactId(contact.id)}
                      className="p-3.5 flex items-start gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] text-xs font-sans font-medium flex items-center justify-center shrink-0 mt-0.5">
                        {contact.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-sans font-medium text-[#241E1A] truncate">
                            {lang === 'RU' ? contact.nameRu : contact.nameEn}
                          </span>
                          {contact.isPinned && (
                            <Pin className="h-3 w-3 text-[#8A8177] rotate-45 shrink-0" />
                          )}
                          <span className="text-[10px] font-sans text-[#8A8177] truncate">
                            {lang === 'RU' ? contact.tagRu : contact.tagEn}
                          </span>
                          <span className="text-[10px] font-sans text-[#8A8177] ml-auto shrink-0">
                            {contact.time}
                          </span>
                        </div>
                        <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5 truncate">
                          {lang === 'RU' ? contact.lastMsgRu : contact.lastMsgEn}
                        </p>
                      </div>
                      {contact.unreadCount > 0 && (
                        <span className="bg-[#C2410C] text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center shrink-0 mt-0.5">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* Active Conversation Screen */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 bg-white border-b border-[#E5E2DD] flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveChatContactId(null)}
                  className="h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5 text-[#241E1A]" />
                </button>
                <div>
                  <h3 className="text-sm font-sans font-medium text-[#241E1A]">
                    {waiterChatContacts.find(c => c.id === activeChatContactId)?.nameRu}
                  </h3>
                  <p className="text-[10px] font-sans text-[#8A8177]">
                    {waiterChatContacts.find(c => c.id === activeChatContactId)?.tagRu} · онлайн
                  </p>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                {(waiterChatMessages[activeChatContactId] || []).map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'SENDER' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs font-sans ${
                        msg.sender === 'SENDER'
                          ? 'bg-[#C2410C] text-white rounded-br-xs'
                          : 'bg-white border border-[#E5E2DD] text-[#241E1A] rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-[#8A8177] mt-1 px-1">{msg.time}</span>
                  </div>
                ))}
              </div>

              {/* Typing box */}
              <div className="p-3 bg-white border-t border-[#E5E2DD] flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Написать сообщение..."
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && typedMessage.trim()) {
                      setWaiterChatMessages(prev => ({
                        ...prev,
                        [activeChatContactId]: [
                          ...(prev[activeChatContactId] || []),
                          { sender: 'SENDER', text: typedMessage.trim(), time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }
                        ]
                      }));
                      setTypedMessage('');
                    }
                  }}
                  className="flex-1 bg-[#FAF7F3] border border-[#E5E2DD] rounded-full px-4 py-2 text-xs text-[#241E1A] placeholder-[#8A8177] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!typedMessage.trim()) return;
                    setWaiterChatMessages(prev => ({
                      ...prev,
                      [activeChatContactId]: [
                        ...(prev[activeChatContactId] || []),
                        { sender: 'SENDER', text: typedMessage.trim(), time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) }
                      ]
                    }));
                    setTypedMessage('');
                  }}
                  className="h-9 w-9 rounded-full bg-[#C2410C] text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ----------------- 10 · УВЕДОМЛЕНИЯ (FULL SCREEN / MODAL) ---------------- */}
      {/* ========================================================================= */}
      {showNotifications && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col min-h-0 font-sans animate-in slide-in-from-right duration-200">
          <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
            {/* Head with Back button */}
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="h-9 w-9 -ml-2 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6 text-[#241E1A]" />
                </button>
                <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                  {lang === 'RU' ? 'Уведомления' : 'Notifications'}
                </h1>
              </div>
              <div className="text-xs font-sans text-[#8A8177] pt-1 pl-7 flex items-center gap-1.5">
                <span><b>{unreadNotifsCount}</b> новых</span>
                <span>·</span>
                <button
                  type="button"
                  onClick={markAllNotifsRead}
                  className="text-[#C2410C] hover:underline font-medium cursor-pointer"
                >
                  {lang === 'RU' ? 'отметить все прочитанными' : 'mark all as read'}
                </button>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setNotifFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  notifFilter === 'ALL'
                    ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                    : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                }`}
              >
                {lang === 'RU' ? 'Все' : 'All'}
              </button>
              <button
                type="button"
                onClick={() => setNotifFilter('ROOM')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  notifFilter === 'ROOM'
                    ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                    : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                }`}
              >
                {lang === 'RU' ? 'В номер' : 'Room Service'}
              </button>
              <button
                type="button"
                onClick={() => setNotifFilter('BREAKFAST')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  notifFilter === 'BREAKFAST'
                    ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                    : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                }`}
              >
                {lang === 'RU' ? 'Завтраки' : 'Breakfasts'}
              </button>
              <button
                type="button"
                onClick={() => setNotifFilter('SHIFT')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                  notifFilter === 'SHIFT'
                    ? 'bg-[#241E1A] text-white font-medium shadow-xs'
                    : 'bg-white border border-[#E5E2DD] text-[#8A8177] hover:text-[#241E1A] font-normal'
                }`}
              >
                {lang === 'RU' ? 'Смена' : 'Shift'}
              </button>
            </div>

            {/* Section 1: СЕГОДНЯ */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'СЕГОДНЯ' : 'TODAY'}
              </span>

              <div className="space-y-2">
                {waiterNotifications
                  .filter(n => n.period === 'TODAY' && (notifFilter === 'ALL' || n.category === notifFilter))
                  .map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => setWaiterNotifications(prev => prev.map(item => item.id === notif.id ? { ...item, isUnread: false } : item))}
                      className={`bg-white rounded-[14px] border border-[#E5E2DD] p-3.5 flex items-start gap-3 shadow-2xs cursor-pointer hover:bg-slate-50/70 transition-colors ${
                        notif.isAlert ? 'border-l-2 border-l-[#B3261E]' : ''
                      }`}
                    >
                      {notif.icon === 'TIMER' && <Clock className="h-4.5 w-4.5 text-[#B3261E] shrink-0 mt-0.5" />}
                      {notif.icon === 'ROOM' && <ConciergeBell className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />}
                      {notif.icon === 'WARNING' && <AlertTriangle className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />}
                      {notif.icon === 'COFFEE' && <Coffee className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />}
                      {notif.icon === 'USERS' && <Users className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs font-sans font-medium ${notif.isUnread ? 'text-[#241E1A]' : 'text-[#8A8177]'}`}>{lang === 'RU' ? notif.titleRu : notif.titleEn}</h4>
                        <p className="text-[10px] font-sans text-[#8A8177] mt-0.5">{lang === 'RU' ? notif.subRu : notif.subEn}</p>
                      </div>

                      {notif.isUnread && (
                        <span className="h-2 w-2 rounded-full bg-[#C2410C] shrink-0 mt-1" />
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Section 2: ВЧЕРА */}
            <div className="space-y-2 pt-2 pb-6">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ВЧЕРА' : 'YESTERDAY'}
              </span>

              <div className="space-y-2">
                {waiterNotifications
                  .filter(n => n.period === 'YESTERDAY' && (notifFilter === 'ALL' || n.category === notifFilter))
                  .map((notif) => (
                    <div
                      key={notif.id}
                      className="bg-white rounded-[14px] border border-[#E5E2DD] p-3.5 flex items-start gap-3 shadow-2xs"
                    >
                      {notif.icon === 'CHECK' && <CheckCircle2 className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />}
                      {notif.icon === 'CLOCK' && <Clock className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-sans font-medium text-[#8A8177]">{lang === 'RU' ? notif.titleRu : notif.titleEn}</h4>
                        <p className="text-[10px] font-sans text-[#8A8177] mt-0.5">{lang === 'RU' ? notif.subRu : notif.subEn}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- 11 · НАСТРОЙКИ (FULL SCREEN / MODAL) ---------------- */}
      {/* ========================================================================= */}
      {showSettings && (
        <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col min-h-0 font-sans animate-in slide-in-from-right duration-200">
          <div className="flex-1 overflow-y-auto no-scrollbar p-4.5 space-y-4">
            {/* Head with Back button */}
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="h-9 w-9 -ml-2 rounded-full flex items-center justify-center text-[#241E1A] hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6 text-[#241E1A]" />
                </button>
                <h1 className="font-serif font-medium text-2xl text-[#241E1A] leading-tight">
                  {lang === 'RU' ? 'Настройки' : 'Settings'}
                </h1>
              </div>
              <p className="text-xs font-sans text-[#8A8177] pt-1 pl-7">
                {lang === 'RU' ? 'Приложение и учётная запись' : 'App & Account settings'}
              </p>
            </div>

            {/* Section 1: ПРИЛОЖЕНИЕ */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'ПРИЛОЖЕНИЕ' : 'APPLICATION'}
              </span>

              <div className="bg-white rounded-[14px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden text-xs">
                {/* Language switch */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-sans text-xs font-medium text-[#241E1A]">{lang === 'RU' ? 'Язык интерфейса' : 'Interface Language'}</div>
                    <div className="text-[10px] text-[#8A8177] mt-0.5">{lang === 'RU' ? 'Русский' : 'English'}</div>
                  </div>
                  <div className="flex bg-[#EFECE6] p-0.5 rounded-full border border-[#E5E2DD] text-xs">
                    <button
                      type="button"
                      onClick={() => onLanguageChange('RU')}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
                        lang === 'RU' ? 'bg-[#241E1A] text-white shadow-xs' : 'text-[#8A8177]' 
                      }`}
                    >
                      RU
                    </button>
                    <button
                      type="button"
                      onClick={() => onLanguageChange('EN')}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer font-medium ${
                        lang === 'EN' ? 'bg-[#241E1A] text-white shadow-xs' : 'text-[#8A8177]' 
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                {/* Offline Mode */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-sans text-xs font-medium text-[#241E1A]">{lang === 'RU' ? 'Офлайн-режим' : 'Offline Mode'}</div>
                    <div className="text-[10px] text-[#8A8177] mt-0.5">{lang === 'RU' ? 'данные синхронизируются при сети' : 'data synced when online'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleOffline}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      offlineMode ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        offlineMode ? 'left-5.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Push notifications */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-sans text-xs font-medium text-[#241E1A]">{lang === 'RU' ? 'Push-уведомления' : 'Push Notifications'}</div>
                    <div className="text-[10px] text-[#8A8177] mt-0.5">{lang === 'RU' ? 'новые задачи и сообщения' : 'new tasks & messages'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPushNotifications(!pushNotifications)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      pushNotifications ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        pushNotifications ? 'left-5.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Sound on new task */}
                <div className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-sans text-xs font-medium text-[#241E1A]">{lang === 'RU' ? 'Звук при новой задаче' : 'Sound on New Task'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundOnNewTask(!soundOnNewTask)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      soundOnNewTask ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        soundOnNewTask ? 'left-5.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: СИНХРОНИЗАЦИЯ */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'СИНХРОНИЗАЦИЯ' : 'SYNC'}
              </span>

              <div className="bg-white rounded-[14px] border border-[#E5E2DD] shadow-2xs overflow-hidden text-xs">
                <div
                  onClick={() => {
                    setLastSyncTime(new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
                    alert(lang === 'RU' ? 'Данные успешно синхронизированы!' : 'Data synced!');
                  }}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-4 w-4 text-[#8A8177]" />
                    <div>
                      <div className="font-sans text-xs font-medium text-[#241E1A]">{lang === 'RU' ? 'Обновить данные' : 'Refresh Data'}</div>
                      <div className="text-[10px] text-[#8A8177] mt-0.5">{lang === 'RU' ? `последняя синхронизация ${lastSyncTime}` : `last sync ${lastSyncTime}`}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>
              </div>
            </div>

            {/* Section 3: УЧЁТНАЯ ЗАПИСЬ */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'УЧЁТНАЯ ЗАПИСЬ' : 'ACCOUNT'}
              </span>

              <div className="bg-white rounded-[14px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden text-xs">
                <div
                  onClick={() => setShowPersonalDataModal(true)}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-[#8A8177]" />
                    <span className="font-medium text-[#241E1A]">{lang === 'RU' ? 'Личные данные' : 'Personal Data'}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                <div
                  onClick={() => setShowChangePasswordModal(true)}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-[#8A8177]" />
                    <span className="font-medium text-[#241E1A]">{lang === 'RU' ? 'Сменить пароль' : 'Change Password'}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>

                <div
                  onClick={() => setShowSupportModal(true)}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Headphones className="h-4 w-4 text-[#8A8177]" />
                    <span className="font-medium text-[#241E1A]">{lang === 'RU' ? 'Служба поддержки' : 'Support Desk'}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>
              </div>
            </div>

            {/* Logout button (Moved into Settings card) */}
            <div className="pt-1">
              <div
                onClick={onLogout}
                className="bg-white rounded-[14px] border border-[#E5E2DD] p-3.5 shadow-2xs cursor-pointer hover:bg-slate-50/70 transition-colors flex items-center gap-3 text-xs"
              >
                <LogOut className="h-4 w-4 text-[#8A8177] shrink-0" />
                <span className="font-medium text-[#8A8177] hover:text-[#241E1A]">
                  {lang === 'RU' ? 'Выйти из аккаунта' : 'Log out'}
                </span>
              </div>
            </div>

            <div className="py-2 text-center text-[11px] font-sans text-[#8A8177]">
              Sollviera PMS v2.4 · Rixos Borovoe
            </div>
          </div>
        </div>
      )}

      {/* Modals for Shift Report, Schedule, Banquets, Personal Data, Password, Support */}
      {showShiftReportModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">Отчёт по смене</h3>
              <button type="button" onClick={() => setShowShiftReportModal(false)} className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer">✕</button>
            </div>
            <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-[#8A8177]">Смена</span><span className="font-medium">SH-4092 (Зал А)</span></div>
              <div className="flex justify-between"><span className="text-[#8A8177]">Обслужено гостей</span><span className="font-medium">96 гостей (12 заказов)</span></div>
              <div className="flex justify-between"><span className="text-[#8A8177]">Среднее время подачи</span><span className="font-medium">14 мин</span></div>
              <div className="flex justify-between"><span className="text-[#8A8177]">Сумма чеков за смену</span><span className="font-medium text-[#5B8C6E]">128 400 ₸</span></div>
            </div>
          </div>
        </div>
      )}

      {showBanquetsModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">Банкеты и брони зала</h3>
              <button type="button" onClick={() => setShowBanquetsModal(false)} className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer">✕</button>
            </div>
            <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 space-y-2 text-xs">
              <h4 className="font-medium text-[#241E1A]">Банкет в 19:00 · 30 человек</h4>
              <p className="text-[10px] text-[#8A8177]">Малый зал · Отдельное сет-меню шефа. Сервировка к 17:30.</p>
              <div className="border-t border-[#E5E2DD]/50 pt-2 flex justify-between text-[10px] text-[#8A8177]">
                <span>Ответственный: Айгерим Д.</span>
                <span className="text-[#5B8C6E] font-medium">Подтверждено</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">График смен</h3>
              <button type="button" onClick={() => setShowScheduleModal(false)} className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer">✕</button>
            </div>
            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden text-xs">
              <div className="p-3.5 flex justify-between"><span className="font-medium text-[#241E1A]">27 авг (Сегодня)</span><span className="text-[#5B8C6E]">08:00 – 20:00 (Зал А)</span></div>
              <div className="p-3.5 flex justify-between"><span className="font-medium text-[#241E1A]">28 авг (Завтра)</span><span>08:00 – 20:00 (Зал B)</span></div>
              <div className="p-3.5 flex justify-between"><span className="font-medium text-[#241E1A]">29 авг</span><span className="text-[#8A8177]">Выходной</span></div>
            </div>
          </div>
        </div>
      )}

      {showPersonalDataModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">Личные данные</h3>
              <button type="button" onClick={() => setShowPersonalDataModal(false)} className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer">✕</button>
            </div>
            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden text-xs">
              <div className="p-3.5 flex justify-between"><span className="text-[#8A8177]">ФИО</span><span className="font-medium text-[#241E1A]">Айгерим Досова</span></div>
              <div className="p-3.5 flex justify-between"><span className="text-[#8A8177]">Должность</span><span className="font-medium text-[#241E1A]">Официант ресторана</span></div>
              <div className="p-3.5 flex justify-between"><span className="text-[#8A8177]">Табельный номер</span><span className="font-medium text-[#241E1A]">SLV-4092</span></div>
              <div className="p-3.5 flex justify-between"><span className="text-[#8A8177]">Локация</span><span className="font-medium text-[#241E1A]">Основной ресторан, зал А</span></div>
            </div>
          </div>
        </div>
      )}

      {showChangePasswordModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">Сменить пароль</h3>
              <button type="button" onClick={() => setShowChangePasswordModal(false)} className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div><label className="block text-[#8A8177] mb-1">Новый пароль</label><input type="password" placeholder="••••••••" className="w-full bg-white border border-[#E5E2DD] rounded-xl p-3 text-[#241E1A]" /></div>
              <button type="button" onClick={() => { alert('Пароль успешно изменён!'); setShowChangePasswordModal(false); }} className="w-full bg-[#C2410C] text-white font-medium py-3 rounded-xl shadow-xs cursor-pointer text-center">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {showSupportModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">Служба поддержки</h3>
              <button type="button" onClick={() => setShowSupportModal(false)} className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer">✕</button>
            </div>
            <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden text-xs">
              <div className="p-3.5 flex justify-between"><span className="text-[#8A8177]">Горячая линия</span><a href="tel:88005553535" className="font-medium text-[#C2410C]">8 (800) 555-35-35</a></div>
              <div className="p-3.5 flex justify-between"><span className="text-[#8A8177]">F&B отдел</span><span className="font-medium">fb@sollviera.hotel</span></div>
              <div className="p-3.5 flex justify-between"><span className="text-[#8A8177]">Система</span><span className="font-medium">Sollviera PMS v2.4</span></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
