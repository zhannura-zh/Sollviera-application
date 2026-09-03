import React, { useState } from 'react';
import { 
  User, Shield, Calendar, Coffee, CheckCircle2, PauseCircle, Clock, 
  LogOut, Globe, Wrench, Package, Layers, HelpCircle, ArrowLeft, 
  Settings, Bell, Edit2, MessageSquare, PhoneCall, Check, Sparkles, Send, Eye, BarChart3, Search,
  ChevronDown, ChevronRight, ChevronLeft, RefreshCw, Lock
} from 'lucide-react';
import { Language, CleanerProfile, AppNotification, HotelRoom } from '../types';
import { getTranslation } from '../locales';
import { mockShiftHistory, mockCleaners } from '../data/mockData';
import { ReportsScreen } from './ReportsScreen';
import { SollvieraBrand, SollvieraLogo } from './SollvieraLogo';

interface AuthAndProfileScreenProps {
  currentLang?: Language;
  onLanguageChange?: (lang: Language) => void;
  offlineMode: boolean;
  onToggleOffline: () => void;
  systemLogs: string[];
  
  // States and actions passed from parent App.tsx
  cleanerProfile: CleanerProfile;
  onUpdateCleanerProfile: (profile: CleanerProfile) => void;
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  chatMessages: Array<{ sender: 'CLEANER' | 'SUPERVISOR'; text: string; time: string }>;
  onSendChatMessage: (text: string) => void;
  rooms: HotelRoom[];
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
}

// Available demo avatars for profile editing
const DEMO_AVATARS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120', // Default Elena
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120', // Alternative Female
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120', // Male Cleaner
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120', // Alternative Male
];

export const AuthAndProfileScreen: React.FC<AuthAndProfileScreenProps> = ({
  currentLang = 'EN',
  onLanguageChange,
  offlineMode,
  onToggleOffline,
  systemLogs,
  cleanerProfile,
  onUpdateCleanerProfile,
  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  chatMessages,
  onSendChatMessage,
  rooms,
  isLoggedIn,
  setIsLoggedIn,
}) => {
  const lang = currentLang as Language;
  const t = getTranslation(lang);

  // Core authorization simulator states
  const [emailInput, setEmailInput] = useState<string>('elena.vance@sollviera.com');
  const [passwordInput, setPasswordInput] = useState<string>('••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<boolean>(false);

  // Sub-screens toggles
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showReports, setShowReports] = useState<boolean>(false);
  const [showChats, setShowChats] = useState<boolean>(false);
  const [activeChatContactId, setActiveChatContactId] = useState<string | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [chatInputText, setChatInputText] = useState<string>('');
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [taskSound, setTaskSound] = useState<boolean>(false);
  const [selectedNotifFilter, setSelectedNotifFilter] = useState<'ALL' | 'TASK' | 'MAINTENANCE' | 'SHIFT'>('ALL');

  const [chatContacts, setChatContacts] = useState([
    {
      id: 'super-anna',
      name: 'Anna Peterson',
      nameRu: 'Анна Петерсон',
      role: 'Supervisor',
      roleRu: 'Супервайзер',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      phone: '+7 (999) 450-12-88',
      lastMessageEn: 'Good morning! Your shift is active. Check Floor 3.',
      lastMessageRu: 'Доброе утро! Ваша смена активирована. Проверьте этаж 3.',
      lastMessageTime: '08:00',
      unreadCount: 0,
      messages: [
        { sender: 'OTHER' as const, text: 'Доброе утро! Ваша смена активирована. Пожалуйста, проверьте этаж 3.', time: '08:00' }
      ],
      quickRepliesRu: [
        'Сообщение принято. Отправляю дежурного. Спасибо!',
        'Поняла вас, проверю в течение 10 минут.',
        'Спасибо за отчет!'
      ],
      quickRepliesEn: [
        'Message received. Directing shift crew. Thank you!',
        'Got it, will inspect in 10 minutes.',
        'Thanks for the report!'
      ]
    },
    {
      id: 'cleaner-marcus',
      name: 'Marcus Brody',
      nameRu: 'Маркус Броди',
      role: 'Housekeeper',
      roleRu: 'Горничная',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      phone: '+7 (999) 555-01-99',
      lastMessageEn: 'Hey, do you have spare large bath sheets on Floor 3?',
      lastMessageRu: 'Привет, у тебя есть лишние большие простыни на 3 этаже?',
      lastMessageTime: '13:02',
      unreadCount: 1,
      messages: [
        { sender: 'OTHER' as const, text: 'Привет, у тебя есть лишние большие простыни на 3 этаже? Нам не хватило для 208 номера.', time: '13:02' }
      ],
      quickRepliesRu: [
        'Привет! Да, есть 2 штуки на тележке, забирай у лифта.',
        'К сожалению, закончились, жду поставку.',
        'Спроси у Светланы, у нее был запас.'
      ],
      quickRepliesEn: [
        'Hey! Yes, I have 2 sheets on my trolley near the elevator.',
        'Sorry, ran out, waiting for refill.',
        'Ask Svetlana, she had a reserve.'
      ]
    },
    {
      id: 'senior-svetlana',
      name: 'Svetlana Kim',
      nameRu: 'Светлана Ким',
      role: 'Senior Housekeeper',
      roleRu: 'Старшая горничная',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      phone: '+7 (800) 100-20-30',
      lastMessageEn: 'Please verify Room 304 standards by 13:45.',
      lastMessageRu: 'Пожалуйста, сверьте стандарты по 304 номеру до 13:45.',
      lastMessageTime: '12:45',
      unreadCount: 0,
      messages: [
        { sender: 'OTHER' as const, text: 'Пожалуйста, сверьте стандарты по 304 номеру до 13:45. Заезд VIP гостя планируется раньше.', time: '12:45' }
      ],
      quickRepliesRu: [
        'Принято в работу, уже заканчиваю спальню.',
        'Всё готово, стандарты подтверждены.',
        'Хорошо, сейчас перепроверю мини-бар.'
      ],
      quickRepliesEn: [
        'Accepted, already finishing the bedroom details.',
        'All set, standards verified.',
        'Okay, will double check the minibar now.'
      ]
    },
    {
      id: 'head-oleg',
      name: 'Oleg Voronov',
      nameRu: 'Олег Воронов',
      role: 'Head of Housekeeping',
      roleRu: 'Руководитель службы',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      phone: '+7 (800) 100-20-30',
      lastMessageEn: 'Great job on the Floor 3 audits this week.',
      lastMessageRu: 'Отличная работа по аудитам 3 этажа на этой неделе.',
      lastMessageTime: 'Вчера',
      unreadCount: 0,
      messages: [
        { sender: 'OTHER' as const, text: 'Отличная работа по аудитам 3 этажа на этой неделе. Качество 99%. Так держать!', time: 'Вчера' }
      ],
      quickRepliesRu: [
        'Спасибо большое, Олег! Стараемся всей командой.',
        'Спасибо! Будем поддерживать этот уровень.'
      ],
      quickRepliesEn: [
        'Thank you very much, Oleg! Great team effort.',
        'Thank you! We will keep up this standard.'
      ]
    }
  ]);
  
  // Profile editing mode states
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);
  const [editFullName, setEditFullName] = useState<string>(cleanerProfile.fullName);
  const [editFullNameRu, setEditFullNameRu] = useState<string>(cleanerProfile.fullNameRu);
  const [editBadgeId, setEditBadgeId] = useState<string>(cleanerProfile.badgeId);
  const [editFloorAssigned, setEditFloorAssigned] = useState<string>(cleanerProfile.floorAssigned);
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>(cleanerProfile.avatarUrl);

  // Shift values
  const [shiftStatus, setShiftStatus] = useState<'ON_SHIFT' | 'ON_BREAK' | 'SHIFT_ENDED'>('ON_SHIFT');
  const [roomsCleaned, setRoomsCleaned] = useState<number>(cleanerProfile.currentShift.roomsCompleted);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(20669); // 5h 44m 29s

  // Chat input
  const [typedMessage, setTypedMessage] = useState<string>('');
  const [chatSegment, setChatSegment] = useState<'CHAT' | 'PUSH'>('CHAT');

  // Trigger login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    
    // Find matching cleaner
    const matchedProfile = mockCleaners.find(
      c => c.email.toLowerCase() === cleanEmail || cleanEmail.includes(c.badgeId.toLowerCase()) || cleanEmail.includes(c.fullName.toLowerCase().split(' ')[0])
    );
    
    if (matchedProfile) {
      onUpdateCleanerProfile(matchedProfile);
      setIsLoggedIn(true);
      setLoginError(false);
    } else if (cleanEmail.includes('elena') || cleanEmail.includes('8042')) {
      onUpdateCleanerProfile(mockCleaners[0]);
      setIsLoggedIn(true);
      setLoginError(false);
    } else if (cleanEmail.includes('svetlana') || cleanEmail.includes('7701')) {
      onUpdateCleanerProfile(mockCleaners[2]);
      setIsLoggedIn(true);
      setLoginError(false);
    } else if (cleanEmail.includes('oleg') || cleanEmail.includes('5501')) {
      onUpdateCleanerProfile(mockCleaners.find(c => c.role === 'TECHNICIAN') || mockCleaners[3]);
      setIsLoggedIn(true);
      setLoginError(false);
    } else if (cleanEmail.includes('aigerim') || cleanEmail.includes('dossova') || cleanEmail.includes('4092')) {
      onUpdateCleanerProfile(mockCleaners.find(c => c.role === 'WAITER') || mockCleaners[4]);
      setIsLoggedIn(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  // Trigger profile updates save
  const handleSaveProfile = () => {
    onUpdateCleanerProfile({
      ...cleanerProfile,
      fullName: editFullName,
      fullNameRu: editFullNameRu,
      badgeId: editBadgeId,
      floorAssigned: editFloorAssigned,
      avatarUrl: editAvatarUrl,
    });
    setIsEditingProfile(false);
  };

  // Format shift elapsed timer
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const getSupervisorName = (fullName: string) => {
    const match = fullName.match(/^([^(]+)\s*\(([^)]+)\)$/);
    if (match) {
      return currentLang === 'RU' ? match[2].trim() : match[1].trim();
    }
    return fullName;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalUnreadChats = chatContacts.reduce((acc, curr) => acc + curr.unreadCount, 0);

  const handleSendOverlayChatMessage = (contactId: string, text: string) => {
    if (!text.trim()) return;
    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    
    // Update local contacts messages
    setChatContacts(prev => prev.map(c => {
      if (c.id === contactId) {
        const newMsg = { sender: 'CLEANER' as const, text: text.trim(), time: timeStr };
        const updatedMsgs = [...c.messages, newMsg];
        return {
          ...c,
          messages: updatedMsgs,
          lastMessageEn: text.trim(),
          lastMessageRu: text.trim(),
          lastMessageTime: timeStr
        };
      }
      return c;
    }));
    
    setChatInputText('');

    // Trigger mock response
    setTimeout(() => {
      const repTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      setChatContacts(prev => prev.map(c => {
        if (c.id === contactId) {
          const replies = lang === 'RU' ? c.quickRepliesRu : c.quickRepliesEn;
          const randomReply = replies[Math.floor(Math.random() * replies.length)] || 'Ok';
          const newMsg = { sender: 'OTHER' as const, text: randomReply, time: repTime };
          return {
            ...c,
            messages: [...c.messages, newMsg],
            lastMessageEn: randomReply,
            lastMessageRu: randomReply,
            lastMessageTime: repTime,
            unreadCount: activeChatContactId === contactId ? 0 : c.unreadCount + 1
          };
        }
        return c;
      }));
    }, 1500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;
    onSendChatMessage(typedMessage.trim());
    setTypedMessage('');
  };

  const getNotificationCategoryClass = (cat: string) => {
    switch (cat) {
      case 'NEW_ROOM': return 'bg-[#FAF0EB] text-[#A93A0C] border-[#F1DDD3]';
      case 'URGENT': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'SUPERVISOR': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getNotificationCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'NEW_ROOM': return lang === 'RU' ? 'Новый номер' : 'New Room';
      case 'URGENT': return lang === 'RU' ? 'Срочно!' : 'Urgent';
      case 'SUPERVISOR': return lang === 'RU' ? 'Супервайзер' : 'Supervisor';
      default: return lang === 'RU' ? 'Система' : 'System';
    }
  };

  return (
    <>
      {/* Container simulating a mobile application viewport */}
      <div className="w-full bg-white overflow-hidden flex flex-col h-full relative text-slate-800">
        
        {/* ==================== 0.5 REPORTS OVERLAY SUB-SCREEN ==================== */}
        {showReports && (
          <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-[#FAF7F3] px-5 pt-7 pb-4 space-y-1 shrink-0 text-left">
              <div className="flex items-center gap-2 -ml-1">
                <button 
                  onClick={() => setShowReports(false)}
                  className="flex items-center justify-center text-[#241E1A] hover:opacity-75 transition-opacity cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-serif font-medium text-[#241E1A] pt-0.5 select-none">
                  {lang === 'RU' ? 'Мои отчёты' : 'My Reports'}
                </h2>
              </div>
              <p className="text-xs font-sans font-normal text-[#8A8177] pl-7">
                {lang === 'RU' ? 'Личная продуктивность' : 'Personal productivity'}
              </p>
            </div>

            {/* Reports content container */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <ReportsScreen
                cleanerProfile={cleanerProfile}
                shiftHistory={mockShiftHistory}
                rooms={rooms}
                lang={lang}
                hideHeader={true}
              />
            </div>
          </div>
        )}

        {/* ==================== 1. NOTIFICATIONS OVERLAY SUB-SCREEN ==================== */}
        {showNotifications && (
          <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-[#FAF7F3] px-5 pt-7 pb-4 space-y-1.5 shrink-0 text-left">
              <div className="flex items-center gap-2 -ml-1">
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="flex items-center justify-center text-[#241E1A] hover:opacity-75 transition-opacity cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-serif font-medium text-[#241E1A] pt-0.5 select-none">
                  {lang === 'RU' ? 'Уведомления' : 'Notifications'}
                </h2>
              </div>
              <p className="text-xs font-sans font-normal text-[#8A8177]">
                <span className="text-[#241E1A] font-medium">
                  {unreadCount} {lang === 'RU' ? 'новых' : 'new'}
                </span>
                {' · '}
                <button 
                  onClick={onMarkAllNotificationsAsRead} 
                  className="text-[#C2410C] hover:underline cursor-pointer font-sans"
                >
                  {lang === 'RU' ? 'отметить все прочитанными' : 'mark all as read'}
                </button>
              </p>
            </div>

            {/* Category Chips */}
            <div className="px-5 pb-3.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] shrink-0">
              {(['ALL', 'TASK', 'MAINTENANCE', 'SHIFT'] as const).map((filterType) => {
                const isSelected = selectedNotifFilter === filterType;
                const label = filterType === 'ALL' 
                  ? (lang === 'RU' ? 'Все' : 'All')
                  : filterType === 'TASK' 
                  ? (lang === 'RU' ? 'Задачи' : 'Tasks')
                  : filterType === 'MAINTENANCE' 
                  ? (lang === 'RU' ? 'Техслужба' : 'Maintenance')
                  : (lang === 'RU' ? 'Смена' : 'Shift');

                return (
                  <button
                    key={filterType}
                    type="button"
                    onClick={() => setSelectedNotifFilter(filterType)}
                    className={`px-4 py-1.5 rounded-full text-xs font-sans font-normal border whitespace-nowrap cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-[#241E1A] text-white border-[#241E1A] shadow-xs'
                        : 'bg-white text-[#8A8177] border-[#E5E2DD] hover:bg-[#FAF7F3]/40'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Notifications Feed */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 no-scrollbar">
              {(() => {
                // Filter notifications
                const filtered = notifications.filter(item => {
                  if (selectedNotifFilter === 'ALL') return true;
                  if (selectedNotifFilter === 'TASK') return item.category === 'NEW_ROOM' || item.category === 'URGENT';
                  if (selectedNotifFilter === 'MAINTENANCE') return item.category === 'SUPERVISOR';
                  if (selectedNotifFilter === 'SHIFT') return item.category === 'SYSTEM';
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-[#8A8177] font-sans font-normal text-xs bg-white rounded-[14px] border border-[#E5E2DD] shadow-2xs">
                      <Bell className="h-6 w-6 mx-auto text-[#8A8177] mb-1" />
                      <p>{lang === 'RU' ? 'Уведомлений пока нет' : 'No notifications yet'}</p>
                    </div>
                  );
                }

                // Group into Today and Yesterday/Earlier
                const todayNotifs = filtered.filter(n => n.timestamp !== 'вчера' && n.timestamp !== '25 авг');
                const earlierNotifs = filtered.filter(n => n.timestamp === 'вчера' || n.timestamp === '25 авг');

                const getNotifIcon = (item: AppNotification) => {
                  if (item.category === 'URGENT') return <Clock className="h-4.5 w-4.5 text-[#B3261E] shrink-0 mt-0.5" />;
                  if (item.category === 'NEW_ROOM') return <Clock className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
                  if (item.messageRu.includes('Техник') || item.messageEn.includes('Technician')) {
                    return <Wrench className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
                  }
                  if (item.messageRu.includes('Сообщение') || item.messageEn.includes('Message')) {
                    return <MessageSquare className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
                  }
                  if (item.messageRu.includes('Пополнение') || item.messageEn.includes('replenishment')) {
                    return <Package className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
                  }
                  if (item.messageRu.includes('проверен') || item.messageEn.includes('inspected')) {
                    return <CheckCircle2 className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
                  }
                  return <Clock className="h-4.5 w-4.5 text-[#8A8177] shrink-0 mt-0.5" />;
                };

                const renderCard = (item: AppNotification) => {
                  const hasLeftRedBorder = item.category === 'URGENT' && !item.isRead;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onMarkNotificationAsRead(item.id)}
                      className={`bg-white border border-[#E5E2DD] rounded-[14px] p-4 shadow-2xs relative transition-all cursor-pointer flex gap-3 ${
                        hasLeftRedBorder ? 'border-l-2 border-l-[#B3261E]' : ''
                      }`}
                    >
                      {getNotifIcon(item)}
                      
                      <div className="flex-1 text-left min-w-0">
                        <span className="text-xs font-sans font-medium text-[#241E1A] block">
                          {lang === 'RU' ? item.messageRu : item.messageEn}
                        </span>
                        
                        <span className="text-[10px] font-sans font-normal text-[#8A8177] block mt-0.5">
                          {lang === 'RU' ? (item.subtitleRu || item.timestamp) : (item.subtitleEn || item.timestamp)}
                        </span>
                      </div>

                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-[#C2410C] mt-2 self-start ml-auto shrink-0" />
                      )}
                    </div>
                  );
                };

                return (
                  <div className="space-y-4">
                    {/* Today Section */}
                    {todayNotifs.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
                          {lang === 'RU' ? 'СЕГОДНЯ' : 'TODAY'}
                        </h4>
                        <div className="space-y-2">
                          {todayNotifs.map(renderCard)}
                        </div>
                      </div>
                    )}

                    {/* Earlier Section */}
                    {earlierNotifs.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
                          {lang === 'RU' ? 'ВЧЕРА' : 'YESTERDAY'}
                        </h4>
                        <div className="space-y-2">
                          {earlierNotifs.map(renderCard)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ==================== 1.5 CHATS OVERLAY SUB-SCREEN ==================== */}
        {showChats && (
          <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-[#FAF7F3] px-5 pt-7 pb-4 space-y-1 shrink-0 text-left">
              <div className="flex items-center gap-2 -ml-1">
                <button 
                  onClick={() => {
                    if (activeChatContactId) {
                      setActiveChatContactId(null);
                    } else {
                      setShowChats(false);
                    }
                  }}
                  className="flex items-center justify-center text-[#241E1A] hover:opacity-75 transition-opacity cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-serif font-medium text-[#241E1A] pt-0.5 select-none">
                  {activeChatContactId 
                    ? (lang === 'RU' 
                        ? chatContacts.find(c => c.id === activeChatContactId)?.nameRu 
                        : chatContacts.find(c => c.id === activeChatContactId)?.name)
                    : (lang === 'RU' ? 'Чаты' : 'Chats')}
                </h2>
              </div>
            </div>

            {/* Content Switcher */}
            {activeChatContactId === null ? (
              /* Chat List View */
              <div className="flex-1 flex flex-col min-h-0">
                {/* Search contact */}
                <div className="px-5 pb-4 shrink-0">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={lang === 'RU' ? 'Поиск по имени' : 'Search by name'}
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      className="w-full bg-white border border-[#E5E2DD] rounded-xl pl-9 pr-3 py-2 text-xs text-[#241E1A] placeholder-[#8A8177]/80 focus:outline-none focus:ring-1 focus:ring-[#C2410C] font-sans font-normal h-10 shadow-2xs"
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-[#8A8177]" />
                  </div>
                </div>

                {/* Contacts Scroller */}
                <div className="flex-1 px-5 pb-5 overflow-y-auto no-scrollbar">
                  <div className="bg-white rounded-[14px] border border-[#E5E2DD] overflow-hidden divide-y divide-[#E5E2DD]/50 shadow-2xs">
                    {chatContacts
                      .filter(c => {
                        const q = chatSearchQuery.toLowerCase().trim();
                        if (!q) return true;
                        return (
                          c.name.toLowerCase().includes(q) ||
                          c.nameRu.toLowerCase().includes(q) ||
                          c.role.toLowerCase().includes(q) ||
                          c.roleRu.toLowerCase().includes(q)
                        );
                      })
                      .map(contact => {
                        const getInitials = (nameStr: string) => {
                          return nameStr.split(' ').map(n => n[0]).join('').toUpperCase();
                        };
                        const initials = getInitials(lang === 'RU' ? contact.nameRu : contact.name);

                        return (
                          <div
                            key={contact.id}
                            onClick={() => {
                              setActiveChatContactId(contact.id);
                              setChatContacts(prev => prev.map(item => item.id === contact.id ? { ...item, unreadCount: 0 } : item));
                            }}
                            className="p-4 hover:bg-[#FAF7F3]/40 transition-colors flex items-center gap-3.5 cursor-pointer"
                          >
                            {/* Initials Avatar */}
                            <div className="h-10 w-10 rounded-full bg-[#FAF2E6] text-[#241E1A] font-sans font-normal text-xs flex items-center justify-center shrink-0 border border-[#E5E2DD]">
                              {initials}
                            </div>

                            {/* Middle Text */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5 w-full">
                                <span className="text-xs font-sans font-medium text-[#241E1A] truncate whitespace-nowrap">
                                  {lang === 'RU' ? contact.nameRu : contact.name}
                                </span>
                                {(contact.id === 'super-anna' || contact.id === 'senior-svetlana') && (
                                  <span className="text-[#8A8177] text-[10px]">📌</span>
                                )}
                                <span className="text-[10px] font-sans font-normal text-[#8A8177] truncate">
                                  {lang === 'RU' ? contact.roleRu.toLowerCase() : contact.role.toLowerCase()}
                                </span>
                                <span className="text-[10px] font-sans font-normal text-[#8A8177] ml-auto shrink-0">
                                  {contact.lastMessageTime}
                                </span>
                                {contact.unreadCount > 0 && (
                                  <span className="h-4.5 w-4.5 rounded-full bg-[#C2410C] text-[9px] font-sans font-medium text-white flex items-center justify-center ml-1 shrink-0">
                                    {contact.unreadCount}
                                  </span>
                                )}
                              </div>

                              <p className="text-[10px] text-[#8A8177] font-sans font-normal truncate">
                                {lang === 'RU' ? contact.lastMessageRu : contact.lastMessageEn}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : (
              /* Conversation Detail View */
              (() => {
                const contact = chatContacts.find(c => c.id === activeChatContactId)!;
                const getInitials = (nameStr: string) => {
                  return nameStr.split(' ').map(n => n[0]).join('').toUpperCase();
                };
                const initials = getInitials(lang === 'RU' ? contact.nameRu : contact.name);

                return (
                  <div className="flex-1 flex flex-col min-h-0 bg-[#FAF7F3]">
                    {/* Detail Banner */}
                    <div className="bg-white border-y border-[#E5E2DD]/80 px-5 py-3.5 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#FAF2E6] text-[#241E1A] font-sans font-normal text-xs flex items-center justify-center shrink-0 border border-[#E5E2DD]">
                          {initials}
                        </div>
                        <div>
                          <h4 className="text-xs font-sans font-medium text-[#241E1A] leading-tight">
                            {lang === 'RU' ? contact.nameRu : contact.name}
                          </h4>
                          <p className="text-[10px] text-[#8A8177] font-sans font-normal mt-0.5">
                            {lang === 'RU' ? contact.roleRu : contact.role} • {contact.phone}
                          </p>
                        </div>
                      </div>
                      <a 
                        href={`tel:${contact.phone}`}
                        className="h-9 w-9 bg-white border border-[#E5E2DD] text-[#241E1A] rounded-xl flex items-center justify-center transition-all cursor-pointer hover:bg-[#FAF7F3]/40"
                      >
                        <PhoneCall className="h-4 w-4 text-[#8A8177]" />
                      </a>
                    </div>

                    {/* Messages List Scroller */}
                    <div className="flex-1 p-5 space-y-4 overflow-y-auto flex flex-col justify-end no-scrollbar">
                      <div className="space-y-3 overflow-y-auto max-h-[380px] no-scrollbar">
                        {contact.messages.map((msg, index) => {
                          const isCleaner = msg.sender === 'CLEANER';
                          return (
                            <div key={index} className={`flex ${isCleaner ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] rounded-[14px] p-3 text-xs leading-relaxed shadow-2xs ${
                                isCleaner 
                                  ? 'bg-[#241E1A] text-white rounded-br-none' 
                                  : 'bg-white text-[#241E1A] rounded-bl-none border border-[#E5E2DD]'
                              }`}>
                                <p className="font-sans font-normal break-words">{msg.text}</p>
                                <span className={`text-[9px] block text-right font-sans mt-1 ${isCleaner ? 'text-white/60' : 'text-[#8A8177]'}`}>
                                  {msg.time}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Chat Text Input Bar */}
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendOverlayChatMessage(contact.id, chatInputText);
                      }} 
                      className="p-5 bg-white border-t border-[#E5E2DD]/60 flex gap-2 shrink-0"
                    >
                      <input
                        type="text"
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        placeholder={lang === 'RU' ? 'Напишите сообщение...' : 'Type a message...'}
                        className="flex-1 bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#C2410C] text-[#241E1A] placeholder-[#8A8177]/80 font-sans font-normal h-10"
                      />
                      <button
                        type="submit"
                        disabled={!chatInputText.trim()}
                        className="h-10 w-10 bg-[#C2410C] hover:bg-[#A93A0C] disabled:opacity-50 text-white rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                );
              })()
            )}
          </div>
        )}
        {/* ==================== 2. SETTINGS OVERLAY SUB-SCREEN ==================== */}
        {showSettings && (
          <div className="absolute inset-0 bg-[#FAF7F3] z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="bg-[#FAF7F3] px-5 pt-7 pb-4 space-y-1 shrink-0 text-left">
              <div className="flex items-center gap-2 -ml-1">
                <button 
                  onClick={() => {
                    setShowSettings(false);
                    setIsEditingProfile(false);
                  }}
                  className="flex items-center justify-center text-[#241E1A] hover:opacity-75 transition-opacity cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-serif font-medium text-[#241E1A] pt-0.5 select-none">
                  {lang === 'RU' ? 'Настройки' : 'Settings'}
                </h2>
              </div>
              <p className="text-xs font-sans font-normal text-[#8A8177] pl-7">
                {lang === 'RU' ? 'Приложение и учётная запись' : 'App and Account Settings'}
              </p>
            </div>

            {/* Scrollable Settings Panel */}
            <div className="flex-1 px-5 pb-5 space-y-5 overflow-y-auto no-scrollbar">
              
              {/* SECTION 1: APPLICATION */}
              <div className="space-y-2 text-left">
                <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
                  {lang === 'RU' ? 'ПРИЛОЖЕНИЕ' : 'APPLICATION'}
                </h3>
                
                <div className="bg-white rounded-[14px] border border-[#E5E2DD] overflow-hidden divide-y divide-[#E5E2DD]/50 shadow-2xs">
                  {/* Interface Language */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-sans font-normal text-[#241E1A] block">
                        {lang === 'RU' ? 'Язык интерфейса' : 'Interface Language'}
                      </span>
                      <span className="text-[10px] font-sans font-normal text-[#8A8177] block mt-0.5">
                        {lang === 'RU' ? 'Русский' : 'English'}
                      </span>
                    </div>

                    <div className="flex bg-[#E5E2DD]/40 p-0.5 rounded-full text-[10px] font-sans font-medium shrink-0">
                      <button
                        type="button"
                        onClick={() => onLanguageChange && onLanguageChange('RU')}
                        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                          lang === 'RU' ? 'bg-[#241E1A] text-white' : 'text-[#8A8177]'
                        }`}
                      >
                        RU
                      </button>
                      <button
                        type="button"
                        onClick={() => onLanguageChange && onLanguageChange('EN')}
                        className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                          lang === 'EN' ? 'bg-[#241E1A] text-white' : 'text-[#8A8177]'
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  </div>

                  {/* Offline Mode */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-sans font-normal text-[#241E1A] block">
                        {lang === 'RU' ? 'Офлайн-режим' : 'Offline Mode'}
                      </span>
                      <span className="text-[10px] font-sans font-normal text-[#8A8177] block mt-0.5">
                        {lang === 'RU' ? 'данные синхронизируются при сети' : 'data syncs when connected'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={onToggleOffline}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        offlineMode ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          offlineMode ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Push Notifications */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-sans font-normal text-[#241E1A] block">
                        {lang === 'RU' ? 'Push-уведомления' : 'Push Notifications'}
                      </span>
                      <span className="text-[10px] font-sans font-normal text-[#8A8177] block mt-0.5">
                        {lang === 'RU' ? 'новые задачи и сообщения' : 'new tasks and messages'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPushNotifications(!pushNotifications)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        pushNotifications ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          pushNotifications ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Sound on new task */}
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-sans font-normal text-[#241E1A] block">
                        {lang === 'RU' ? 'Звук при новой задаче' : 'Sound on New Task'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTaskSound(!taskSound)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        taskSound ? 'bg-[#5B8C6E]' : 'bg-[#E5E2DD]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          taskSound ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 2: SYNCHRONIZATION */}
              <div className="space-y-2 text-left">
                <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
                  {lang === 'RU' ? 'СИНХРОНИЗАЦИЯ' : 'SYNCHRONIZATION'}
                </h3>
                
                <div 
                  onClick={() => alert(lang === 'RU' ? 'Данные синхронизированы успешно!' : 'Data synced successfully!')}
                  className="bg-white rounded-[14px] border border-[#E5E2DD] p-4 shadow-2xs flex items-center justify-between cursor-pointer hover:bg-[#FAF7F3]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-4.5 w-4.5 text-[#8A8177]" />
                    <div>
                      <span className="text-xs font-sans font-normal text-[#241E1A] block">
                        {lang === 'RU' ? 'Обновить данные' : 'Refresh Data'}
                      </span>
                      <span className="text-[10px] font-sans font-normal text-[#8A8177] block mt-0.5">
                        {lang === 'RU' ? 'последняя синхронизация 09:41' : 'last synced at 09:41'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                </div>
              </div>

              {/* SECTION 3: ACCOUNT */}
              <div className="space-y-2 text-left">
                <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
                  {lang === 'RU' ? 'УЧЁТНАЯ ЗАПИСЬ' : 'ACCOUNT'}
                </h3>
                
                <div className="bg-white rounded-[14px] border border-[#E5E2DD] overflow-hidden divide-y divide-[#E5E2DD]/50 shadow-2xs">
                  {/* Personal details */}
                  <div 
                    onClick={() => {
                      setEditFullName(cleanerProfile.fullName);
                      setEditFullNameRu(cleanerProfile.fullNameRu);
                      setEditBadgeId(cleanerProfile.badgeId);
                      setEditFloorAssigned(cleanerProfile.floorAssigned);
                      setEditAvatarUrl(cleanerProfile.avatarUrl);
                      setIsEditingProfile(true);
                    }}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F3]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-[#8A8177]" />
                      <span className="text-xs font-sans font-normal text-[#241E1A]">
                        {lang === 'RU' ? 'Личные данные' : 'Personal Details'}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                  </div>

                  {/* Change Password */}
                  <div 
                    onClick={() => alert(lang === 'RU' ? 'Смена пароля недоступна в демо-режиме' : 'Change password is not available in demo mode')}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F3]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="h-4 w-4 text-[#8A8177]" />
                      <span className="text-xs font-sans font-normal text-[#241E1A]">
                        {lang === 'RU' ? 'Сменить пароль' : 'Change Password'}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                  </div>

                  {/* Helpdesk */}
                  <div 
                    onClick={() => alert(lang === 'RU' ? 'Служба поддержки: +7 (800) 100-20-30' : 'Support Desk: +7 (800) 100-20-30')}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF7F3]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-4 w-4 text-[#8A8177]" />
                      <span className="text-xs font-sans font-normal text-[#241E1A]">
                        {lang === 'RU' ? 'Служба поддержки' : 'Support Desk'}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                  </div>
                </div>
              </div>

              {/* STANDALONE LOG OUT BUTTON */}
              <div 
                onClick={() => {
                  setIsLoggedIn(false);
                  setShowSettings(false);
                  setShowNotifications(false);
                  setShowReports(false);
                  setIsEditingProfile(false);
                  setShowChats(false);
                  setActiveChatContactId(null);
                }}
                className="bg-white rounded-[14px] border border-[#E5E2DD] p-4 shadow-2xs flex items-center gap-3 cursor-pointer text-[#8A8177] hover:text-[#B3261E] hover:bg-[#FAF7F3]/40 transition-all active:scale-98"
              >
                <LogOut className="h-4 w-4 text-[#8A8177]" />
                <span className="text-xs font-sans font-normal">
                  {lang === 'RU' ? 'Выйти из аккаунта' : 'Log Out'}
                </span>
              </div>
            </div>

            {/* Profile Edit Backdrop Modal */}
            {isEditingProfile && (
              <div className="absolute inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                <div className="bg-white rounded-[24px] w-full max-w-xs p-5 shadow-2xl border border-[#E5E2DD] space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center justify-between border-b border-[#E5E2DD]/50 pb-2">
                    <h3 className="text-sm font-serif font-medium text-[#241E1A]">
                      {lang === 'RU' ? 'Редактировать' : 'Edit Details'}
                    </h3>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="h-6 w-6 rounded-full bg-slate-50 text-[#8A8177] hover:bg-slate-100 flex items-center justify-center font-bold text-sm cursor-pointer"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs text-left">
                    {/* Avatar picker */}
                    <div className="flex flex-col items-center gap-2">
                      <img 
                        src={editAvatarUrl} 
                        className="h-14 w-14 rounded-full object-cover border border-[#E5E2DD] shadow-sm" 
                        alt="" 
                      />
                      <div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          id="modal-avatar-upload" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  setEditAvatarUrl(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('modal-avatar-upload')?.click()}
                          className="px-2.5 py-1 bg-white border border-[#E5E2DD] text-[#8A8177] text-[10px] font-sans font-normal rounded-lg cursor-pointer hover:bg-slate-50"
                        >
                          {lang === 'RU' ? 'Сменить фото' : 'Change photo'}
                        </button>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-2 font-sans">
                      {lang === 'RU' ? (
                        <div>
                          <label className="block text-[9px] text-[#8A8177] uppercase tracking-wider mb-0.5">ФИО</label>
                          <input
                            type="text"
                            value={editFullNameRu}
                            onChange={(e) => {
                              setEditFullNameRu(e.target.value);
                              setEditFullName(e.target.value);
                            }}
                            className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-2.5 py-1.5 text-xs text-[#241E1A] focus:outline-none focus:ring-1 focus:ring-[#C2410C]"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[9px] text-[#8A8177] uppercase tracking-wider mb-0.5">Full name</label>
                          <input
                            type="text"
                            value={editFullName}
                            onChange={(e) => {
                              setEditFullName(e.target.value);
                              setEditFullNameRu(e.target.value);
                            }}
                            className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-2.5 py-1.5 text-xs text-[#241E1A] focus:outline-none focus:ring-1 focus:ring-[#C2410C]"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] text-[#8A8177] uppercase tracking-wider mb-0.5">{lang === 'RU' ? 'Табель' : 'Staff ID'}</label>
                          <input
                            type="text"
                            value={editBadgeId}
                            onChange={(e) => setEditBadgeId(e.target.value)}
                            className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-2.5 py-1.5 text-xs text-[#241E1A] focus:outline-none focus:ring-1 focus:ring-[#C2410C]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-[#8A8177] uppercase tracking-wider mb-0.5">{lang === 'RU' ? 'Этаж' : 'Floor'}</label>
                          <input
                            type="text"
                            value={editFloorAssigned}
                            onChange={(e) => setEditFloorAssigned(e.target.value)}
                            className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-2.5 py-1.5 text-xs text-[#241E1A] focus:outline-none focus:ring-1 focus:ring-[#C2410C]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-[#E5E2DD]/50 font-sans">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="flex-1 py-1.5 border border-[#E5E2DD] rounded-xl font-normal text-[#8A8177] hover:bg-slate-50 cursor-pointer"
                      >
                        {lang === 'RU' ? 'Отмена' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="flex-1 py-1.5 bg-[#C2410C] hover:bg-[#A93A0C] text-white rounded-xl font-normal cursor-pointer text-center"
                      >
                        {lang === 'RU' ? 'Далее' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 3. CORPORATE HEADER (MAIN PROFILE) ==================== */}
        {isLoggedIn && (
          <header className="bg-[#FAF7F3] px-5 pt-4 pb-1.5 flex items-center justify-between shrink-0 relative">
            <h1 className="text-2xl font-serif font-medium text-[#241E1A] pt-0.5 select-none">
              {lang === 'RU' ? 'Профиль' : 'Profile'}
            </h1>

            {/* Minimalist Top Control Buttons */}
            <div className="flex items-center gap-1.5">
              {/* Chats Button */}
              <button
                onClick={() => setShowChats(true)}
                className="h-10 w-10 bg-white border border-[#E5E2DD] text-[#241E1A] rounded-xl flex items-center justify-center transition-all cursor-pointer relative hover:bg-[#FAF7F3]/40"
                title={lang === 'RU' ? 'Чаты' : 'Chats'}
              >
                <MessageSquare className="h-4 w-4" />
                {totalUnreadChats > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#C2410C] rounded-full text-[9px] font-sans font-medium text-white flex items-center justify-center">
                    {totalUnreadChats}
                  </span>
                )}
              </button>

              {/* Bell/Notifications Button */}
              <button
                onClick={() => setShowNotifications(true)}
                className="h-10 w-10 bg-white border border-[#E5E2DD] text-[#241E1A] rounded-xl flex items-center justify-center transition-all cursor-pointer relative hover:bg-[#FAF7F3]/40"
                title={lang === 'RU' ? 'Уведомления' : 'Notifications'}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#C2410C] rounded-full text-[9px] font-sans font-medium text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Gear/Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="h-10 w-10 bg-white border border-[#E5E2DD] text-[#241E1A] rounded-xl flex items-center justify-center transition-all cursor-pointer hover:bg-[#FAF7F3]/40"
                title={lang === 'RU' ? 'Настройки' : 'Settings'}
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </header>
        )}

        {/* ==================== 4. MAIN SCREEN CONTENT (SCROLLABLE) ==================== */}
        <main className="flex-1 bg-[#FAF7F3] flex flex-col overflow-y-auto no-scrollbar">
          {!isLoggedIn ? (
            /* ---------------- LOGIN SCREEN ---------------- */
            <div className="p-5 flex-1 flex flex-col justify-between space-y-6 bg-[#FAF7F3]">
              <div className="space-y-5">
                {/* Custom Sunset Circle Logo and Title */}
                <div className="flex flex-col items-center pt-8 pb-3">
                  <svg viewBox="0 0 100 100" className="h-[96px] w-[96px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#sollviera-sun-clip-login)">
                      <clipPath id="sollviera-sun-clip-login">
                        <circle cx="50" cy="50" r="46" />
                      </clipPath>
                      <rect x="0" y="4" width="100" height="15" fill="#F39B3D" />
                      <rect x="0" y="22" width="100" height="15" fill="#E4732C" />
                      <rect x="0" y="40" width="100" height="15" fill="#D55C20" />
                      <rect x="0" y="58" width="100" height="15" fill="#BD4312" />
                      <rect x="0" y="76" width="100" height="20" fill="#90250B" />
                    </g>
                  </svg>
                  <h1 className="text-[28px] font-serif font-medium tracking-[0.2em] text-[#241E1A] uppercase pt-4 leading-none select-none">
                    SOLLVIERA
                  </h1>
                </div>

                {/* Login Form Card */}
                <div className="bg-white rounded-[14px] border border-[#E5E2DD] p-5 shadow-2xs space-y-4 text-left">
                  {loginError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#B3261E] font-sans font-normal">
                      {t.loginError}
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email field */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-sans font-normal text-[#8A8177]">
                        {lang === 'RU' ? 'Email или табельный номер' : 'Email or Staff ID'}
                      </label>
                      <input
                        type="text"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="elena.vance@sollviera.com"
                        className="w-full bg-[#FAF7F3]/30 border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] placeholder-[#8A8177]/60 focus:outline-none focus:ring-1 focus:ring-[#C2410C] font-sans font-normal h-11 transition-all"
                      />
                    </div>

                    {/* Password field */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-sans font-normal text-[#8A8177]">
                        {lang === 'RU' ? 'Пароль' : 'Password'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#FAF7F3]/30 border border-[#E5E2DD] rounded-xl px-3.5 py-2.5 text-xs text-[#241E1A] placeholder-[#8A8177]/60 w-full pr-16 focus:outline-none focus:ring-1 focus:ring-[#C2410C] font-sans font-normal h-11 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center text-xs font-sans font-normal text-[#C2410C] hover:opacity-80 cursor-pointer"
                        >
                          {showPassword ? (lang === 'RU' ? 'Скрыть' : 'Hide') : (lang === 'RU' ? 'Показать' : 'Show')}
                        </button>
                      </div>
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white py-3 rounded-xl font-sans font-medium text-xs cursor-pointer text-center select-none active:scale-[0.98] transition-all"
                    >
                      {lang === 'RU' ? 'Войти на смену' : 'Login to shift'}
                    </button>
                  </form>

                  {/* Forgot password */}
                  <a
                    href="#support"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(t.contactHelpdesk + ': +7 (800) 100-20-30');
                    }}
                    className="text-center block text-xs font-sans font-normal text-[#C2410C] hover:underline cursor-pointer pt-1"
                  >
                    {lang === 'RU' ? 'Забыли пароль?' : 'Forgot password?'}
                  </a>
                </div>

                {/* Demo Profiles List */}
                <div className="space-y-2 text-left">
                  <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
                    {lang === 'RU' ? 'ДЕМО-ПРОФИЛИ' : 'DEMO PROFILES'}
                  </h3>

                  <div className="bg-white rounded-[14px] border border-[#E5E2DD] overflow-hidden divide-y divide-[#E5E2DD]/50 shadow-2xs">
                    {[
                      {
                        id: 'elena',
                        initials: lang === 'RU' ? 'ЕВ' : 'EB',
                        name: lang === 'RU' ? 'Елена Вэнс' : 'Elena Vance',
                        role: lang === 'RU' ? 'Клинер · 3 этаж' : 'Cleaner · Floor 3',
                        email: 'elena.vance@sollviera-pms.com',
                        pass: 'elena8042'
                      },
                      {
                        id: 'svetlana',
                        initials: lang === 'RU' ? 'СК' : 'CK',
                        name: lang === 'RU' ? 'Светлана Ким' : 'Svetlana Kim',
                        role: lang === 'RU' ? 'Супервизор' : 'Supervisor',
                        email: 'svetlana.kim@sollviera-pms.com',
                        pass: 'svetlana7701'
                      },
                      {
                        id: 'oleg',
                        initials: lang === 'RU' ? 'ОП' : 'OP',
                        name: lang === 'RU' ? 'Олег Петров' : 'Oleg Petrov',
                        role: lang === 'RU' ? 'Техник' : 'Technician',
                        email: 'oleg.petrov@sollviera-pms.com',
                        pass: 'oleg5501'
                      },
                      {
                        id: 'aigerim',
                        initials: lang === 'RU' ? 'АД' : 'AD',
                        name: lang === 'RU' ? 'Айгерим Досова' : 'Aigerim Dossova',
                        role: lang === 'RU' ? 'Официант' : 'Waiter',
                        email: 'aigerim.dossova@sollviera-pms.com',
                        pass: 'aigerim4092'
                      }
                    ].map((profile) => (
                      <div
                        key={profile.id}
                        onClick={() => {
                          setEmailInput(profile.email);
                          setPasswordInput(profile.pass);
                        }}
                        className="p-4 hover:bg-[#FAF7F3]/40 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#FAF2E6] text-[#241E1A] font-sans font-normal text-xs flex items-center justify-center shrink-0 border border-[#E5E2DD]">
                            {profile.initials}
                          </div>
                          <div>
                            <h4 className="text-xs font-sans font-medium text-[#241E1A]">
                              {profile.name}
                            </h4>
                            <p className="text-[10px] text-[#8A8177] font-sans font-normal mt-0.5">
                              {profile.role}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#8A8177] shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
              <p className="text-[10px] text-[#8A8177] font-sans font-normal tracking-wide text-center">
                {t.versionText}
              </p>
            </div>
          ) : (
            /* ---------------- EMPLOYEE PROFILE SCREEN ---------------- */
            <div className="px-5 pb-8 space-y-4 flex-1">
              
              {/* 1. CLEANER PROFILE HEADER */}
              <div className="flex items-center gap-3.5 pt-2">
                {/* Initials circle */}
                <div className="h-14 w-14 rounded-full bg-[#FAF2E6] text-[#241E1A] font-sans font-normal text-sm flex items-center justify-center shrink-0 border border-[#E5E2DD]">
                  {lang === 'RU' ? 'ЕВ' : 'EB'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-sans font-normal text-[#241E1A] leading-tight truncate">
                    {lang === 'RU' ? cleanerProfile.fullNameRu : cleanerProfile.fullName}
                  </h2>
                  <p className="text-xs font-sans font-normal text-[#8A8177] mt-0.5 truncate">
                    {cleanerProfile.role === 'SENIOR_CLEANER'
                      ? (lang === 'RU' ? 'Старший клинер' : 'Senior housekeeper')
                      : (lang === 'RU' ? 'Клинер' : 'Housekeeper')} · {
                        cleanerProfile.floorAssigned.includes('Floor 3')
                          ? (lang === 'RU' ? '3 этаж' : 'Floor 3')
                          : cleanerProfile.floorAssigned.includes('Floor 2')
                            ? (lang === 'RU' ? '2 этаж' : 'Floor 2')
                            : cleanerProfile.floorAssigned.replace(/\s*\(Rooms\s*\d+-\d+\)/gi, '')
                      }
                  </p>
                </div>
              </div>

              {/* 2. CURRENT SHIFT BLOCK */}
              <div className="space-y-2">
                <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
                  {lang === 'RU' ? 'ТЕКУЩАЯ СМЕНА' : 'CURRENT SHIFT'}
                </h3>
                
                <div className="bg-white rounded-[14px] border border-[#E5E2DD] p-4 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-sans font-medium text-[#241E1A]">
                      {cleanerProfile.currentShift.shiftNumber}
                    </span>
                    <span className="text-xs font-sans font-normal text-[#8A8177]">
                      {cleanerProfile.currentShift.date} · {lang === 'RU' ? 'с 08:00' : 'from 08:00'}
                    </span>
                  </div>

                  {/* Status buttons */}
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setShiftStatus('ON_SHIFT')}
                      className={`py-2 rounded-xl text-[11px] font-sans font-normal border transition-all cursor-pointer ${
                        shiftStatus === 'ON_SHIFT'
                          ? 'bg-[#241E1A] text-white border-[#241E1A]'
                          : 'bg-white text-[#8A8177] border-[#E5E2DD] hover:bg-[#FAF7F3]/40'
                      }`}
                    >
                      {lang === 'RU' ? 'На смене' : 'On shift'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShiftStatus('ON_BREAK')}
                      className={`py-2 rounded-xl text-[11px] font-sans font-normal border transition-all cursor-pointer ${
                        shiftStatus === 'ON_BREAK'
                          ? 'bg-[#241E1A] text-white border-[#241E1A]'
                          : 'bg-white text-[#8A8177] border-[#E5E2DD] hover:bg-[#FAF7F3]/40'
                      }`}
                    >
                      {lang === 'RU' ? 'Перерыв' : 'Break'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShiftStatus('SHIFT_ENDED')}
                      className={`py-2 rounded-xl text-[11px] font-sans font-normal border transition-all cursor-pointer ${
                        shiftStatus === 'SHIFT_ENDED'
                          ? 'bg-[#241E1A] text-white border-[#241E1A]'
                          : 'bg-white text-[#8A8177] border-[#E5E2DD] hover:bg-[#FAF7F3]/40'
                      }`}
                    >
                      {lang === 'RU' ? 'Завершить' : 'Finish'}
                    </button>
                  </div>

                  <div className="border-t border-[#E5E2DD]/50" />

                  {/* Shift Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-sans font-medium text-[#241E1A]">
                        {roomsCleaned}
                        <span className="text-xs text-[#8A8177] font-normal"> / {cleanerProfile.currentShift.roomsTotal}</span>
                      </div>
                      <span className="text-[10px] text-[#8A8177] font-sans font-normal uppercase tracking-wider block mt-0.5">
                        {lang === 'RU' ? 'убрано' : 'cleaned'}
                      </span>
                    </div>

                    <div>
                      <div className="text-lg font-sans font-medium text-[#241E1A]">
                        {cleanerProfile.currentShift.avgTimePerRoom.split(' ')[0]}
                        <span className="text-xs text-[#8A8177] font-normal"> {lang === 'RU' ? 'мин' : 'min'}</span>
                      </div>
                      <span className="text-[10px] text-[#8A8177] font-sans font-normal uppercase tracking-wider block mt-0.5">
                        {lang === 'RU' ? 'на номер' : 'per room'}
                      </span>
                    </div>

                    <div>
                      <div className="text-lg font-sans font-medium text-[#241E1A]">
                        {Math.floor(elapsedSeconds / 3600)}:
                        {String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0')}
                      </div>
                      <span className="text-[10px] text-[#8A8177] font-sans font-normal uppercase tracking-wider block mt-0.5">
                        {lang === 'RU' ? 'на смене' : 'on shift'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. WORK / ACTIONS SECTION */}
              <div className="space-y-2">
                <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
                  {lang === 'RU' ? 'РАБОТА' : 'WORK'}
                </h3>
                
                <div className="bg-white rounded-[14px] border border-[#E5E2DD] overflow-hidden shadow-2xs divide-y divide-[#E5E2DD]/50">
                  {/* Reports Row */}
                  <button
                    onClick={() => setShowReports(true)}
                    className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <BarChart3 className="h-4 w-4 text-[#8A8177]" />
                      <span className="text-xs font-sans font-normal text-[#241E1A]">
                        {lang === 'RU' ? 'Мои отчёты' : 'My Reports'}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8A8177]" />
                  </button>

                  {/* History Row */}
                  <div>
                    <button
                      onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                      className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 text-[#8A8177]" />
                        <span className="text-xs font-sans font-normal text-[#241E1A]">
                          {lang === 'RU' ? 'История смен' : 'Shift History'}
                        </span>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-[#8A8177] transition-transform ${isHistoryExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {isHistoryExpanded && (
                      <div className="p-3.5 bg-[#FAF7F3]/30 border-t border-[#E5E2DD]/50 space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                        {mockShiftHistory.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs py-1">
                            <div>
                              <p className="font-sans font-normal text-[#241E1A]">
                                {lang === 'RU' ? 'Смена' : 'Shift'} {item.shiftNumber} · <span className="text-[#8A8177]">{item.date}</span>
                              </p>
                              <p className="text-[10px] text-[#8A8177]">
                                {item.roomsCleaned} {t.historyRooms} · {item.hoursWorked} {lang === 'RU' ? 'ч.' : 'hrs'}
                              </p>
                            </div>
                            <span className="text-xs font-sans font-medium text-emerald-600">
                              {item.qualityScore}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default AuthAndProfileScreen;
