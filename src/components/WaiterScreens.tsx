import React, { useState, useEffect } from 'react';
import { 
  Utensils, Calendar, Clock, Check, ChevronRight, ChevronLeft, Search, 
  AlertCircle, AlertTriangle, MessageSquare, Bell, Settings, Phone, 
  RotateCcw, User, Lock, Headphones, LogOut, Plus, Minus, Info, 
  CheckCircle2, Coffee, Pin, Send, Wine, Flame, Eye, ChefHat, 
  Receipt, Users, HelpCircle
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
  // ----------------------------------------------------
  // SUB-SCREEN / MODAL STATES
  // ----------------------------------------------------
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<any | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);
  const [showSeatGuestsModal, setShowSeatGuestsModal] = useState<boolean>(false);
  const [showNewDeliveryModal, setShowNewDeliveryModal] = useState<boolean>(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<'ALL' | 'STARTER' | 'MAIN' | 'DESSERT' | 'DRINK'>('ALL');

  // Profile Sub-screens
  const [showChats, setShowChats] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showShiftReportModal, setShowShiftReportModal] = useState<boolean>(false);
  const [showOrdersHistoryModal, setShowOrdersHistoryModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showBanquetsModal, setShowBanquetsModal] = useState<boolean>(false);

  // Settings states
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [soundOnNewTask, setSoundOnNewTask] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('09:41');
  const [showPersonalDataModal, setShowPersonalDataModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

  // Shift Status
  const [shiftStatus, setShiftStatus] = useState<'ON_SHIFT' | 'ON_BREAK' | 'SHIFT_ENDED'>('ON_SHIFT');

  // ----------------------------------------------------
  // 01. СЕГОДНЯ (TODAY) DATA & STATE
  // ----------------------------------------------------
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
  // 02. ЗАЛ (HALL / TABLES) DATA & STATE
  // ----------------------------------------------------
  const [hallFilterScope, setHallFilterScope] = useState<'MY' | 'ALL'>('MY');
  const [hallStatusFilter, setHallStatusFilter] = useState<'ALL' | 'BUSY' | 'BILL' | 'CLEAN'>('ALL');
  
  const [tablesList, setTablesList] = useState([
    {
      id: 'tbl-7',
      number: 'Стол 7',
      category: 'ATTENTION',
      statusRu: 'счёт · 12 мин',
      statusEn: 'bill · 12 min',
      dotColor: 'bg-[#B3261E]',
      descRu: '2 гостя · № 208 · BB · 14 200 ₸',
      descEn: '2 guests · № 208 · BB · 14 200 ₸',
      isMyTable: true,
      package: 'BB',
      roomNumber: '№ 208',
      timer: '12:00',
      sum: '14 200 ₸'
    },
    {
      id: 'tbl-3',
      number: 'Стол 3',
      category: 'ATTENTION',
      statusRu: 'готово на выдаче',
      statusEn: 'ready for pickup',
      dotColor: 'bg-[#E4762B]',
      descRu: '3 гостя · № 105 · FB · основное',
      descEn: '3 guests · № 105 · FB · main course',
      isMyTable: true,
      package: 'FB',
      roomNumber: '№ 105',
      timer: '18:40',
      sum: '0 ₸'
    },
    {
      id: 'tbl-12',
      number: 'Стол 12',
      category: 'BUSY',
      tag: 'HB',
      statusRu: '24 мин',
      statusEn: '24 min',
      dotColor: 'bg-[#E4762B]',
      descRu: '4 гостя · № 304 · на кухне',
      descEn: '4 guests · № 304 · in kitchen',
      isMyTable: true,
      package: 'HB',
      roomNumber: '№ 304',
      timer: '24:06',
      sum: '8 400 ₸'
    },
    {
      id: 'tbl-5',
      number: 'Стол 5',
      category: 'BUSY',
      tag: 'AI',
      statusRu: '31 мин',
      statusEn: '31 min',
      dotColor: 'bg-[#E4762B]',
      descRu: '2 гостя · № 412 · подано',
      descEn: '2 guests · № 412 · served',
      isMyTable: true,
      package: 'AI',
      roomNumber: '№ 412',
      timer: '31:15',
      sum: '0 ₸'
    },
    {
      id: 'tbl-9',
      number: 'Стол 9',
      category: 'BUSY',
      tag: '',
      statusRu: '8 мин',
      statusEn: '8 min',
      dotColor: 'bg-[#E4762B]',
      descRu: '2 гостя · без брони · заказ не принят',
      descEn: '2 guests · walk-in · order pending',
      isMyTable: false,
      package: 'WALK_IN',
      roomNumber: '—',
      timer: '08:20',
      sum: '0 ₸'
    },
    {
      id: 'tbl-1',
      number: 'Стол 1',
      category: 'BUSY',
      tag: 'BB',
      statusRu: '42 мин',
      statusEn: '42 min',
      dotColor: 'bg-[#E4762B]',
      descRu: '3 гостя · № 311 · десерт',
      descEn: '3 guests · № 311 · dessert',
      isMyTable: true,
      package: 'BB',
      roomNumber: '№ 311',
      timer: '42:10',
      sum: '6 800 ₸'
    },
    {
      id: 'tbl-4',
      number: 'Стол 4',
      category: 'CLEAN',
      statusRu: 'убрать',
      statusEn: 'to clean',
      dotColor: 'bg-[#5C6B7A]',
      descRu: 'освободился 6 мин назад',
      descEn: 'freed 6 min ago',
      isMyTable: true,
      package: '',
      roomNumber: '',
      timer: '',
      sum: ''
    },
    {
      id: 'tbl-2',
      number: 'Стол 2',
      category: 'FREE',
      statusRu: 'свободен · 4 места',
      statusEn: 'free · 4 seats',
      dotColor: 'bg-[#E5E2DD]',
      descRu: '',
      descEn: '',
      isMyTable: true,
      package: '',
      roomNumber: '',
      timer: '',
      sum: ''
    },
    {
      id: 'tbl-6',
      number: 'Стол 6',
      category: 'FREE',
      statusRu: 'свободен · 2 места',
      statusEn: 'free · 2 seats',
      dotColor: 'bg-[#E5E2DD]',
      descRu: '',
      descEn: '',
      isMyTable: false,
      package: '',
      roomNumber: '',
      timer: '',
      sum: ''
    }
  ]);

  // ----------------------------------------------------
  // 04. ДОБАВИТЬ ПОЗИЦИЮ (ADD ITEM STATE)
  // ----------------------------------------------------
  const [addItemCategory, setAddItemCategory] = useState<'MAIN' | 'STARTER' | 'DESSERT' | 'DRINK' | 'BAR'>('MAIN');
  const [dishSearchQuery, setDishSearchQuery] = useState<string>('');
  const [selectedDishesOrder, setSelectedDishesOrder] = useState<Record<string, number>>({
    'ribeye': 2,
    'carbonara': 1
  });
  const [kitchenComment, setKitchenComment] = useState<string>('Без лука в салате, средняя прожарка стейка');

  // ----------------------------------------------------
  // 05. В НОМЕР (ROOM SERVICE) DATA & STATE
  // ----------------------------------------------------
  const [roomServiceFilter, setRoomServiceFilter] = useState<'DELIVERY' | 'BREAKFAST' | 'TRAYS'>('DELIVERY');

  const [roomDeliveries, setRoomDeliveries] = useState([
    {
      id: 'del-412',
      roomNumber: '№ 412',
      guestName: 'Абдиров К.',
      guestInitials: 'АК',
      suiteType: 'Presidential Suite',
      package: 'AI · всё включено',
      tag: '+6 МИН',
      tagColor: 'bg-[#FAF0EF] text-[#B3261E]',
      dueTime: 'до 12:56',
      timer: '36:12',
      statusRu: 'в пути',
      statusEn: 'in transit',
      dotColor: 'bg-[#B3261E]',
      itemsDescRu: 'Клубный сэндвич, чай · в пути',
      itemsDescEn: 'Club sandwich, tea · in transit',
      acceptedTime: '12:26',
      noteRu: 'Гость просил постучать, не звонить в дверь. Ребёнок спит.',
      dishes: [
        { nameRu: 'Клубный сэндвич · 1', noteRu: 'без острого соуса', priceRu: 'по пакету', isFree: true },
        { nameRu: 'Чай чёрный · 2', noteRu: '', priceRu: 'по пакету', isFree: true },
        { nameRu: 'Виски импортный · 1', noteRu: 'вне пакета AI', priceRu: '4 500 ₸', isFree: false }
      ],
      totalDishesRu: '4 500 ₸',
      serviceFeeRu: '900 ₸',
      totalPayableRu: '5 400 ₸',
      timeline: [
        { titleRu: 'Забран с кухни', time: '12:52', subRu: 'Айгерим Досова', dot: 'bg-[#E4762B]' },
        { titleRu: 'Передан на кухню', time: '12:28', subRu: '', dot: 'bg-[#E5E2DD]' },
        { titleRu: 'Заказ принят', time: '12:26', subRu: 'По телефону · Ресепшн', dot: 'bg-[#E5E2DD]' }
      ]
    },
    {
      id: 'del-208',
      roomNumber: '№ 208',
      guestName: 'Серикбаева Б.',
      guestInitials: 'БС',
      suiteType: 'Standard Twin',
      package: 'BB',
      tag: '',
      tagColor: '',
      dueTime: 'до 13:10',
      timer: '14:20',
      statusRu: 'на кухне',
      statusEn: 'in kitchen',
      dotColor: 'bg-[#E4762B]',
      itemsDescRu: 'Паста, минеральная вода · на кухне',
      itemsDescEn: 'Pasta, mineral water · in kitchen',
      acceptedTime: '12:45',
      noteRu: 'Доставить горячим, приборы на 1 персону.',
      dishes: [
        { nameRu: 'Паста карбонара · 1', noteRu: 'сыр пармезан', priceRu: '2 400 ₸', isFree: false },
        { nameRu: 'Вода минеральная 0.5 · 1', noteRu: 'без газа', priceRu: '1 200 ₸', isFree: false }
      ],
      totalDishesRu: '3 600 ₸',
      serviceFeeRu: '700 ₸',
      totalPayableRu: '4 300 ₸',
      timeline: [
        { titleRu: 'Передан на кухню', time: '12:48', subRu: 'В работе поваров', dot: 'bg-[#E4762B]' },
        { titleRu: 'Заказ принят', time: '12:45', subRu: 'Из приложения гостя', dot: 'bg-[#E5E2DD]' }
      ]
    }
  ]);

  // ----------------------------------------------------
  // 08. ЧАТЫ, УВЕДОМЛЕНИЯ, КОНТАКТЫ
  // ----------------------------------------------------
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [activeChatContactId, setActiveChatContactId] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState<string>('');
  
  const [waiterChatContacts, setWaiterChatContacts] = useState([
    {
      id: 'chat-kitchen',
      nameRu: 'Кухня · раздача',
      nameEn: 'Kitchen · Pickup',
      initials: 'КХ',
      tagRu: 'раздача',
      tagEn: 'kitchen',
      isPinned: true,
      unreadCount: 2,
      time: '09:12',
      lastMsgRu: 'Шеф: стол 3 и 12 горячее готово...',
      lastMsgEn: 'Chef: table 3 and 12 mains ready...'
    },
    {
      id: 'chat-manager',
      nameRu: 'Жанна Абаева',
      nameEn: 'Zhanna Abaeva',
      initials: 'ЖА',
      tagRu: 'менеджер',
      tagEn: 'manager',
      isPinned: true,
      unreadCount: 0,
      time: '08:45',
      lastMsgRu: 'Банкет на 19:00, сервируем в 17:30.',
      lastMsgEn: 'Banquet at 19:00, setup at 17:30.'
    },
    {
      id: 'chat-reception',
      nameRu: 'Ресепшн',
      nameEn: 'Reception',
      initials: 'РС',
      tagRu: 'диспетчер',
      tagEn: 'front desk',
      isPinned: false,
      unreadCount: 0,
      time: '08:20',
      lastMsgRu: '№ 412 заказал рум-сервис, передали вам.',
      lastMsgEn: 'Room 412 ordered room service.'
    }
  ]);

  const [waiterChatMessages, setWaiterChatMessages] = useState<Record<string, Array<{ sender: 'SENDER' | 'RECEIVER'; text: string; time: string }>>>({
    'chat-kitchen': [
      { sender: 'RECEIVER', text: 'Доброе утро! Стейки рибай на остатке 6 порций.', time: '08:15' },
      { sender: 'RECEIVER', text: 'Шеф: стол 3 и 12 горячее готово к подаче.', time: '09:12' },
      { sender: 'SENDER', text: 'Приняла, забираю стол 3!', time: '09:13' }
    ],
    'chat-manager': [
      { sender: 'RECEIVER', text: 'Айгерим, сегодня банкет на 30 человек в малом зале в 19:00.', time: '08:45' },
      { sender: 'SENDER', text: 'Поняла, сервировку начнем в 17:30.', time: '08:47' }
    ],
    'chat-reception': [
      { sender: 'RECEIVER', text: 'В 412 номер передан заказ на доставку завтрака.', time: '08:20' }
    ]
  });

  const [waiterNotifications, setWaiterNotifications] = useState([
    {
      id: 'wn-1',
      titleRu: 'Готово на раздаче · Стол 3',
      subRu: 'Основное блюдо · заберите в течение 3 мин',
      time: '09:12',
      isUnread: true,
      icon: 'CHEF'
    },
    {
      id: 'wn-2',
      titleRu: 'Просрочка доставки · № 412',
      subRu: 'Room service превысил норматив на +6 мин',
      time: '08:56',
      isUnread: true,
      icon: 'ALERT'
    },
    {
      id: 'wn-3',
      titleRu: 'Стоп-лист обновлен',
      subRu: 'Утиная ножка конфи снята с меню шефом',
      time: '08:20',
      isUnread: true,
      icon: 'STOP'
    },
    {
      id: 'wn-4',
      titleRu: 'Новый заказ в номер · № 208',
      subRu: 'Паста карбонара, минеральная вода',
      time: '08:05',
      isUnread: false,
      icon: 'ROOM'
    }
  ]);

  // Clean active overlays when navigation tab changes
  useEffect(() => {
    setShowChats(false);
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
      {/* -------------------- TAB 5: ПРОФИЛЬ (WAITER_PROFILE) -------------------- */}
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
                  <span className="absolute -top-1 -right-1 bg-[#C2410C] text-white text-[9px] font-sans font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-xs">
                    4
                  </span>
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

            {/* Section 2: РАБОТА */}
            <div className="space-y-2 pt-1">
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
                  onClick={() => setShowOrdersHistoryModal(true)}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="h-4 w-4 text-[#8A8177]" />
                    <span className="text-xs font-sans font-normal text-[#241E1A]">
                      {lang === 'RU' ? 'Мои заказы за смену' : 'My Shift Orders'}
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

            {/* Section 3: КОНТАКТЫ */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-sans font-medium tracking-[0.08em] text-[#8A8177] uppercase block select-none">
                {lang === 'RU' ? 'КОНТАКТЫ' : 'CONTACTS'}
              </span>

              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                {/* Kitchen */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] text-xs font-sans font-medium flex items-center justify-center shrink-0">
                      КХ
                    </div>
                    <div>
                      <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                        {lang === 'RU' ? 'Кухня · раздача' : 'Kitchen · Pass'}
                      </h4>
                      <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                        доб. 210
                      </p>
                    </div>
                  </div>
                  <a
                    href="tel:210"
                    className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-[#8A8177] hover:text-[#241E1A] transition-colors cursor-pointer"
                  >
                    <Phone className="h-4 w-4 text-[#8A8177]" />
                  </a>
                </div>

                {/* Zhanna Abaeva */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] text-xs font-sans font-medium flex items-center justify-center shrink-0">
                      ЖА
                    </div>
                    <div>
                      <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                        {lang === 'RU' ? 'Жанна Абаева' : 'Zhanna Abaeva'}
                      </h4>
                      <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                        {lang === 'RU' ? 'Менеджер ресторана' : 'Restaurant Manager'}
                      </p>
                    </div>
                  </div>
                  <a
                    href="tel:+79997001122"
                    className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-[#8A8177] hover:text-[#241E1A] transition-colors cursor-pointer"
                  >
                    <Phone className="h-4 w-4 text-[#8A8177]" />
                  </a>
                </div>

                {/* Reception */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-[#E5E0D8] text-[#8A8177] text-xs font-sans font-medium flex items-center justify-center shrink-0">
                      РС
                    </div>
                    <div>
                      <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                        {lang === 'RU' ? 'Ресепшн' : 'Reception'}
                      </h4>
                      <p className="text-[10px] font-sans font-normal text-[#8A8177] mt-0.5">
                        {lang === 'RU' ? 'Диспетчер · доб. 100' : 'Front desk · Ext. 100'}
                      </p>
                    </div>
                  </div>
                  <a
                    href="tel:100"
                    className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-[#8A8177] hover:text-[#241E1A] transition-colors cursor-pointer"
                  >
                    <Phone className="h-4 w-4 text-[#8A8177]" />
                  </a>
                </div>
              </div>
            </div>

            {/* Logout button */}
            <div className="pt-1 pb-6">
              <div
                onClick={onLogout}
                className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 shadow-2xs cursor-pointer hover:bg-slate-50/70 transition-colors flex items-center gap-3"
              >
                <LogOut className="h-4 w-4 text-[#8A8177] shrink-0" />
                <span className="text-xs font-sans font-medium text-[#8A8177] hover:text-[#241E1A]">
                  {lang === 'RU' ? 'Выйти из аккаунта' : 'Log out'}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modals for Shift Report, Orders History, Schedule, Banquets, Personal Data, Password, Support, Seat Guests */}
      {showShiftReportModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">Отчёт по смене</h3>
              <button type="button" onClick={() => setShowShiftReportModal(false)} className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer">✕</button>
            </div>
            <div className="bg-white rounded-[20px] border border-[#E5E2DD] p-4 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-[#8A8177]">Смена</span><span className="font-medium">SH-4092 (Зал А)</span></div>
              <div className="flex justify-between"><span className="text-[#8A8177]">Обслужено столов</span><span className="font-medium">6 столов (12 заказов)</span></div>
              <div className="flex justify-between"><span className="text-[#8A8177]">Среднее время подачи</span><span className="font-medium">14 мин</span></div>
              <div className="flex justify-between"><span className="text-[#8A8177]">Сумма чеков за смену</span><span className="font-medium text-[#5B8C6E]">128 400 ₸</span></div>
            </div>
          </div>
        </div>
      )}

      {showOrdersHistoryModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">Мои заказы за смену</h3>
              <button type="button" onClick={() => setShowOrdersHistoryModal(false)} className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
              <div className="bg-white rounded-[20px] border border-[#E5E2DD] divide-y divide-[#E5E2DD]/50 shadow-2xs overflow-hidden">
                <div className="p-3.5 space-y-1">
                  <div className="flex justify-between text-xs font-medium"><span>Стол 12 (№ 304)</span><span>8 400 ₸</span></div>
                  <p className="text-[10px] text-[#8A8177]">Стейк рибай, паста карбонара, вино · 18:44</p>
                </div>
                <div className="p-3.5 space-y-1">
                  <div className="flex justify-between text-xs font-medium"><span>Стол 7 (№ 208)</span><span>14 200 ₸</span></div>
                  <p className="text-[10px] text-[#8A8177]">Лосось гриль, салат, напитки · 17:30</p>
                </div>
                <div className="p-3.5 space-y-1">
                  <div className="flex justify-between text-xs font-medium"><span>Доставка № 412</span><span>5 400 ₸</span></div>
                  <p className="text-[10px] text-[#8A8177]">Клубный сэндвич, чай, виски · 12:56</p>
                </div>
              </div>
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

      {showSeatGuestsModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">Посадить гостей</h3>
              <button type="button" onClick={() => setShowSeatGuestsModal(false)} className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8A8177] mb-1">Номер стола</label>
                <input type="text" defaultValue="Стол 2 (4 места)" className="w-full bg-white border border-[#E5E2DD] rounded-xl p-3 text-[#241E1A]" />
              </div>
              <div>
                <label className="block text-[#8A8177] mb-1">Номер комнаты или Фамилия гостя</label>
                <input type="text" placeholder="№ 304 или Ким" className="w-full bg-white border border-[#E5E2DD] rounded-xl p-3 text-[#241E1A]" />
              </div>
              <button
                type="button"
                onClick={() => {
                  alert(lang === 'RU' ? 'Гости успешно посажены за Стол 2!' : 'Guests seated at Table 2!');
                  setShowSeatGuestsModal(false);
                }}
                className="w-full bg-[#C2410C] text-white font-medium py-3.5 rounded-xl shadow-xs cursor-pointer text-center mt-2"
              >
                Подтвердить посадку
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewDeliveryModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#FAF7F3] rounded-t-[24px] sm:rounded-[24px] w-full max-w-sm p-4.5 space-y-4 border border-[#E5E2DD] shadow-2xl">
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-serif font-medium text-lg text-[#241E1A]">Принять заказ в номер</h3>
              <button type="button" onClick={() => setShowNewDeliveryModal(false)} className="h-7 w-7 rounded-full bg-white border border-[#E5E2DD] text-xs cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#8A8177] mb-1">Номер комнаты</label>
                <input type="text" placeholder="№ 205" className="w-full bg-white border border-[#E5E2DD] rounded-xl p-3 text-[#241E1A]" />
              </div>
              <div>
                <label className="block text-[#8A8177] mb-1">Состав заказа</label>
                <input type="text" placeholder="Сэндвич, кофе, десерт" className="w-full bg-white border border-[#E5E2DD] rounded-xl p-3 text-[#241E1A]" />
              </div>
              <button
                type="button"
                onClick={() => {
                  alert(lang === 'RU' ? 'Заказ в номер принят и отправлен на кухню!' : 'Room service order accepted!');
                  setShowNewDeliveryModal(false);
                }}
                className="w-full bg-[#C2410C] text-white font-medium py-3.5 rounded-xl shadow-xs cursor-pointer text-center mt-2"
              >
                Принять заказ
              </button>
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
