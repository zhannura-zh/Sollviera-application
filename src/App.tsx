/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthAndProfileScreen } from './components/AuthAndProfileScreen';
import { CleaningDashboardScreen } from './components/CleaningDashboardScreen';
import { RoomDetailsScreen } from './components/RoomDetailsScreen';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { SuppliesScreen } from './components/SuppliesScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { NotificationsScreen } from './components/NotificationsScreen';
import { SupervisorScreens } from './components/SupervisorScreens';
import { TechnicianScreens } from './components/TechnicianScreens';
import { WaiterScreens } from './components/WaiterScreens';
import { Language, HotelRoom, RoomStatus, SupplyItem, AppNotification, MaintenanceRequest, CleanerProfile } from './types';
import { getTranslation } from './locales';
import { 
  mockRooms, mockCleaners, mockSupplyItems, mockNotifications, mockMaintenanceRequests, mockShiftHistory
} from './data/mockData';
import { 
  Smartphone, Monitor, Globe, CheckSquare, User, LayoutDashboard, 
  Wrench, Package, BarChart3, Bell, WifiOff, Users, Clock, PlusCircle, Hammer,
  ConciergeBell, Utensils, Calendar, BookOpen
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<Language>('RU');
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [isRoundedFrame, setIsRoundedFrame] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    | 'DASHBOARD'
    | 'ACTIVE_ROOM'
    | 'MAINTENANCE'
    | 'SUPPLIES'
    | 'PROFILE'
    | 'SV_DASHBOARD'
    | 'SV_INSPECTION'
    | 'SV_MAINTENANCE'
    | 'SV_TEAM'
    | 'SV_PROFILE'
    | 'TECH_DASHBOARD'
    | 'TECH_ACTIVE'
    | 'TECH_CREATE'
    | 'TECH_INVENTORY'
    | 'TECH_PROFILE'
    | 'WAITER_TODAY'
    | 'WAITER_HALL'
    | 'WAITER_ROOM_SERVICE'
    | 'WAITER_MENU'
    | 'WAITER_PROFILE'
  >('DASHBOARD');

  // Shared States (Lifting state up for persistence across tabs)
  const [cleanerProfile, setCleanerProfile] = useState<CleanerProfile>(mockCleaners[0]);
  const [rooms, setRooms] = useState<HotelRoom[]>(mockRooms);
  const [activeRoomId, setActiveRoomId] = useState<string | null>('room-304');
  const [dashboardRoomId, setDashboardRoomId] = useState<string | null>(null);
  const [supplies, setSupplies] = useState<SupplyItem[]>(mockSupplyItems);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(mockMaintenanceRequests);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [systemLogs, setSystemLogs] = useState<string[]>([
    'Sollviera Housekeeping PMS initialized.',
    'Floor 3 assignments successfully pulled.',
    'Vite websocket hot reload active.'
  ]);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'CLEANER' | 'SUPERVISOR'; text: string; time: string }>>([
    { sender: 'SUPERVISOR', text: 'Доброе утро! Ваша смена активирована. Пожалуйста, проверьте этаж 3.', time: '08:00' }
  ]);

  // Switch tabs when user role changes
  React.useEffect(() => {
    if (isLoggedIn) {
      if (cleanerProfile.role === 'SUPERVISOR') {
        setActiveTab('SV_DASHBOARD');
      } else if (cleanerProfile.role === 'TECHNICIAN') {
        setActiveTab('TECH_DASHBOARD');
      } else if (cleanerProfile.role === 'WAITER') {
        setActiveTab('WAITER_TODAY');
      } else {
        setActiveTab('DASHBOARD');
      }
    }
  }, [cleanerProfile.role, isLoggedIn]);

  const t = getTranslation(lang);

  // Helper log event
  const logEvent = (msg: string) => {
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSystemLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setTimeout(() => {
      document.querySelectorAll('.overflow-y-auto').forEach((el) => {
        el.scrollTop = 0;
      });
      window.scrollTo({ top: 0, behavior: 'instant' as any });
    }, 20);
  };

  // State handlers
  const updateRoomStatus = (roomId: string, newStatus: RoomStatus) => {
    const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          const updated = { ...r, status: newStatus };
          if (newStatus === 'IN_PROGRESS' && !r.startTime) {
            updated.startTime = timeStr;
          }
          if ((newStatus === 'READY' || newStatus === 'VERIFIED') && !r.endTime) {
            updated.endTime = timeStr;
          }
          return updated;
        }
        return r;
      })
    );
    logEvent(`Room ${roomId.replace('room-', '')} status updated to: ${newStatus}`);
  };

  const updateRoomChecklist = (roomId: string, newChecklist: any[]) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, checklist: newChecklist } : r))
    );
  };

  const handleUpdateSupplyQty = (supplyId: string, diff: number) => {
    setSupplies((prev) =>
      prev.map((s) => (s.id === supplyId ? { ...s, trolleyQty: Math.max(0, s.trolleyQty + diff) } : s))
    );
    const item = supplies.find(s => s.id === supplyId);
    if (item) logEvent(`Trolley ${lang === 'RU' ? item.nameRu : item.nameEn}: ${diff > 0 ? '+' : ''}${diff}`);
  };

  const handleRequestSupplyRefill = (supplyId: string, qty: number) => {
    setSupplies((prev) =>
      prev.map((s) => (s.id === supplyId ? { ...s, requestedQty: s.requestedQty + qty } : s))
    );
    const item = supplies.find(s => s.id === supplyId);
    if (item) {
      logEvent(`Refill request: ${qty} x ${item.nameEn}`);
      addSystemNotification(
        `Supply refill requested: ${qty} x ${item.nameEn}`,
        `Запрошено пополнение: ${qty} шт. x ${item.nameRu}`,
        'SYSTEM'
      );
    }
  };

  const handleAddMaintenanceRequest = (req: Omit<MaintenanceRequest, 'id' | 'timestamp' | 'status'>) => {
    const timestamp = new Date().toLocaleString('ru-RU', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    const newReq: MaintenanceRequest = {
      ...req,
      id: `m-${Date.now()}`,
      status: 'CREATED',
      timestamp,
      descriptionEn: req.descriptionEn || req.description,
      descriptionRu: req.descriptionRu || req.description,
    };
    setMaintenanceRequests((prev) => [newReq, ...prev]);
    logEvent(`Reported maintenance issue: Room ${req.roomNumber} (${req.category})`);

    // If request blocks cleaning, update room status
    if (req.blocksCleaning) {
      const room = rooms.find(r => r.roomNumber === req.roomNumber);
      if (room) {
        updateRoomStatus(room.id, 'PROBLEM');
      }
    }

    addSystemNotification(
      `Issue reported in Room ${req.roomNumber}: ${req.description}`,
      `Неполадка в номере ${req.roomNumber}: ${req.description}`,
      'URGENT'
    );
  };

  const addSystemNotification = (msgEn: string, msgRu: string, cat: any) => {
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const newNotif: AppNotification = {
      id: `n-${Date.now()}`,
      timestamp: time,
      messageEn: msgEn,
      messageRu: msgRu,
      category: cat,
      isRead: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    logEvent('Marked all notification push feeds as read');
  };

  const handleSendChatMessage = (text: string) => {
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const newMsg = { sender: 'CLEANER' as const, text, time };
    setChatMessages((prev) => [...prev, newMsg]);
    logEvent(`Sent chat message: "${text}"`);

    // Simulate supervisor reply
    setTimeout(() => {
      const repTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const repMsg = { 
        sender: 'SUPERVISOR' as const, 
        text: lang === 'RU' 
          ? 'Сообщение принято. Отправляю дежурного. Спасибо!' 
          : 'Message received. Directing shift crew. Thank you!', 
        time: repTime 
      };
      setChatMessages((prev) => [...prev, repMsg]);
      logEvent('Received supervisor response');
      addSystemNotification(
        'Supervisor sent a message',
        'Супервайзер прислал сообщение',
        'SUPERVISOR'
      );
    }, 1500);
  };

  const handleToggleOffline = () => {
    setOfflineMode((prev) => {
      const next = !prev;
      logEvent(`Offline mode updated to ${next ? 'ON' : 'OFF'}`);
      return next;
    });
  };

  // Find active room object (only if status is IN_PROGRESS)
  const activeRoom = rooms.find((r) => r.status === 'IN_PROGRESS') || null;

  // Render current tab screen
  const renderTabContent = () => {
    if (!isLoggedIn) {
      return (
        <AuthAndProfileScreen
          currentLang={lang}
          onLanguageChange={setLang}
          offlineMode={offlineMode}
          onToggleOffline={handleToggleOffline}
          systemLogs={systemLogs}
          cleanerProfile={cleanerProfile}
          onUpdateCleanerProfile={setCleanerProfile}
          notifications={notifications}
          onMarkNotificationAsRead={handleMarkNotificationAsRead}
          onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
          chatMessages={chatMessages}
          onSendChatMessage={handleSendChatMessage}
          rooms={rooms}
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn}
        />
      );
    }

    switch (activeTab) {
      case 'DASHBOARD':
        if (dashboardRoomId) {
          const selectedRoom = rooms.find(r => r.id === dashboardRoomId) || null;
          return (
            <RoomDetailsScreen
              room={selectedRoom}
              onUpdateRoomStatus={(roomId, status) => {
                if (status === 'IN_PROGRESS') {
                  const activeRoomInProgress = rooms.find((r) => r.status === 'IN_PROGRESS');
                  if (activeRoomInProgress && activeRoomInProgress.id !== roomId) {
                    alert(
                      lang === 'RU'
                        ? `Нельзя начать уборку. Сначала приостановите (нажмите паузу) активную уборку в номере #${activeRoomInProgress.roomNumber}.`
                        : `Cannot start cleaning. Please pause the active cleaning in room #${activeRoomInProgress.roomNumber} first.`
                    );
                    return;
                  }
                }
                updateRoomStatus(roomId, status);
                if (status === 'IN_PROGRESS') {
                  setActiveRoomId(roomId);
                  setDashboardRoomId(null);
                  setActiveTab('ACTIVE_ROOM');
                  logEvent(`Started cleaning Room ${roomId.replace('room-', '')}`);
                }
              }}
              onUpdateRoomChecklist={updateRoomChecklist}
              lang={lang}
              onNavigateToTab={(tab) => {
                setDashboardRoomId(null);
              }}
              onAddSystemNotification={addSystemNotification}
            />
          );
        }
        return (
          <CleaningDashboardScreen
            currentLang={lang}
            cleanerProfile={cleanerProfile}
            rooms={rooms}
            onUpdateRoomStatus={updateRoomStatus}
            onSelectActiveRoom={(roomId) => {
              setDashboardRoomId(roomId);
              logEvent(`Viewing details for Room ${roomId.replace('room-', '')}`);
            }}
          />
        );
      case 'ACTIVE_ROOM':
        return (
          <RoomDetailsScreen
            room={activeRoom}
            onUpdateRoomStatus={updateRoomStatus}
            onUpdateRoomChecklist={updateRoomChecklist}
            lang={lang}
            onNavigateToTab={handleTabChange}
            onAddSystemNotification={addSystemNotification}
            onSubmitMaintenance={handleAddMaintenanceRequest}
            supplies={supplies}
            onDeductSupplies={(deductions: Record<string, number>) => {
              setSupplies((prev) =>
                prev.map((s) => {
                  const ded = deductions[s.id] || 0;
                  if (ded > 0) {
                    return { ...s, trolleyQty: Math.max(0, s.trolleyQty - ded) };
                  }
                  return s;
                })
              );
              logEvent(`Deducted spent supplies for Room ${activeRoom?.roomNumber || ''}`);
              addSystemNotification(
                `Supplies & Minibar spent for Room ${activeRoom?.roomNumber || ''}`,
                `Списаны расходники и мини-бар для номера ${activeRoom?.roomNumber || ''}`,
                'SYSTEM'
              );
            }}
          />
        );
      case 'MAINTENANCE':
        return (
          <MaintenanceScreen
            activeRoomNumber={activeRoom ? activeRoom.roomNumber : ''}
            maintenanceRequests={maintenanceRequests}
            onSubmitRequest={handleAddMaintenanceRequest}
            lang={lang}
          />
        );
      case 'SUPPLIES':
        return (
          <SuppliesScreen
            supplies={supplies}
            onUpdateSupplyQty={handleUpdateSupplyQty}
            onRequestSupplyRefill={handleRequestSupplyRefill}
            lang={lang}
          />
        );
      case 'PROFILE':
        return (
          <AuthAndProfileScreen
            currentLang={lang}
            onLanguageChange={setLang}
            offlineMode={offlineMode}
            onToggleOffline={handleToggleOffline}
            systemLogs={systemLogs}
            cleanerProfile={cleanerProfile}
            onUpdateCleanerProfile={setCleanerProfile}
            notifications={notifications}
            onMarkNotificationAsRead={handleMarkNotificationAsRead}
            onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
            chatMessages={chatMessages}
            onSendChatMessage={handleSendChatMessage}
            rooms={rooms}
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
          />
        );
      case 'SV_DASHBOARD':
      case 'SV_INSPECTION':
      case 'SV_MAINTENANCE':
      case 'SV_TEAM':
      case 'SV_PROFILE':
        return (
          <SupervisorScreens
            lang={lang}
            rooms={rooms}
            onUpdateRooms={setRooms}
            maintenanceRequests={maintenanceRequests}
            onUpdateMaintenanceRequests={setMaintenanceRequests}
            systemLogs={systemLogs}
            cleanerProfile={cleanerProfile}
            onUpdateCleanerProfile={setCleanerProfile}
            onLogout={() => {
              setIsLoggedIn(false);
              setCleanerProfile(mockCleaners[0]);
              setActiveTab('DASHBOARD');
            }}
            offlineMode={offlineMode}
            onToggleOffline={handleToggleOffline}
            activeTab={activeTab as any}
            onLanguageChange={setLang}
          />
        );
      case 'TECH_DASHBOARD':
      case 'TECH_ACTIVE':
      case 'TECH_CREATE':
      case 'TECH_INVENTORY':
      case 'TECH_PROFILE':
        return (
          <TechnicianScreens
            lang={lang}
            rooms={rooms}
            onUpdateRooms={setRooms}
            maintenanceRequests={maintenanceRequests}
            onUpdateMaintenanceRequests={setMaintenanceRequests}
            systemLogs={systemLogs}
            cleanerProfile={cleanerProfile}
            onUpdateCleanerProfile={setCleanerProfile}
            onLogout={() => {
              setIsLoggedIn(false);
              setCleanerProfile(mockCleaners[0]);
              setActiveTab('DASHBOARD');
            }}
            offlineMode={offlineMode}
            onToggleOffline={handleToggleOffline}
            activeTab={activeTab}
            onLanguageChange={setLang}
          />
        );
      case 'WAITER_TODAY':
      case 'WAITER_HALL':
      case 'WAITER_ROOM_SERVICE':
      case 'WAITER_MENU':
      case 'WAITER_PROFILE':
        return (
          <WaiterScreens
            lang={lang}
            cleanerProfile={cleanerProfile}
            onUpdateCleanerProfile={setCleanerProfile}
            onLogout={() => {
              setIsLoggedIn(false);
              setCleanerProfile(mockCleaners[0]);
              setActiveTab('DASHBOARD');
            }}
            offlineMode={offlineMode}
            onToggleOffline={handleToggleOffline}
            activeTab={activeTab}
            onLanguageChange={setLang}
          />
        );
      default:
        return null;
    }
  };

  const unreadPushes = notifications.filter(n => !n.isRead).length;

  const renderTabBar = () => {
    if (cleanerProfile.role === 'SUPERVISOR') {
      return (
        <div className="grid grid-cols-5 gap-0.5 text-center">
          {/* Tab 1: Rooms / Dashboard (SV_DASHBOARD) */}
          <button
            onClick={() => handleTabChange('SV_DASHBOARD')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'SV_DASHBOARD'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Номера' : 'Rooms'}</span>
          </button>

          {/* Tab 2: Inspection (SV_INSPECTION) */}
          <button
            onClick={() => handleTabChange('SV_INSPECTION')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'SV_INSPECTION'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <CheckSquare className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Активное' : 'Active'}</span>
          </button>

          {/* Tab 3: Maintenance (SV_MAINTENANCE) */}
          <button
            onClick={() => handleTabChange('SV_MAINTENANCE')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'SV_MAINTENANCE'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <Wrench className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Техслужба' : 'Maintenance'}</span>
          </button>

          {/* Tab 4: Team (SV_TEAM) */}
          <button
            onClick={() => handleTabChange('SV_TEAM')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'SV_TEAM'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Команда' : 'Team'}</span>
          </button>

          {/* Tab 5: Profile (SV_PROFILE) */}
          <button
            onClick={() => handleTabChange('SV_PROFILE')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'SV_PROFILE'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Профиль' : 'Profile'}</span>
          </button>
        </div>
      );
    }
    if (cleanerProfile.role === 'TECHNICIAN') {
      return (
        <div className="grid grid-cols-5 gap-0.5 text-center">
          {/* Tab 1: Rooms / Work Orders (TECH_DASHBOARD) */}
          <button
            onClick={() => handleTabChange('TECH_DASHBOARD')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'TECH_DASHBOARD'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Номера' : 'Rooms'}</span>
          </button>

          {/* Tab 2: Active Work Order (TECH_ACTIVE) */}
          <button
            onClick={() => handleTabChange('TECH_ACTIVE')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'TECH_ACTIVE'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <CheckSquare className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Активное' : 'Active'}</span>
          </button>

          {/* Tab 3: Create Work Order (TECH_CREATE) */}
          <button
            onClick={() => handleTabChange('TECH_CREATE')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'TECH_CREATE'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <Wrench className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Техслужба' : 'Maintenance'}</span>
          </button>

          {/* Tab 4: Warehouse / Inventory (TECH_INVENTORY) */}
          <button
            onClick={() => handleTabChange('TECH_INVENTORY')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'TECH_INVENTORY'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <Package className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Инвентарь' : 'Inventory'}</span>
          </button>

          {/* Tab 5: Profile (TECH_PROFILE) */}
          <button
            onClick={() => handleTabChange('TECH_PROFILE')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'TECH_PROFILE'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Профиль' : 'Profile'}</span>
          </button>
        </div>
      );
    }

    if (cleanerProfile.role === 'WAITER') {
      return (
        <div className="grid grid-cols-5 gap-0.5 text-center">
          {/* Tab 1: Сегодня (WAITER_TODAY) */}
          <button
            onClick={() => handleTabChange('WAITER_TODAY')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'WAITER_TODAY'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Сегодня' : 'Today'}</span>
          </button>

          {/* Tab 2: Зал (WAITER_HALL) */}
          <button
            onClick={() => handleTabChange('WAITER_HALL')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'WAITER_HALL'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Зал' : 'Hall'}</span>
          </button>

          {/* Tab 3: В номер (WAITER_ROOM_SERVICE) */}
          <button
            onClick={() => handleTabChange('WAITER_ROOM_SERVICE')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'WAITER_ROOM_SERVICE'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <ConciergeBell className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'В номер' : 'Room Service'}</span>
          </button>

          {/* Tab 4: Меню (WAITER_MENU) */}
          <button
            onClick={() => handleTabChange('WAITER_MENU')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'WAITER_MENU'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Меню' : 'Menu'}</span>
          </button>

          {/* Tab 5: Профиль (WAITER_PROFILE) */}
          <button
            onClick={() => handleTabChange('WAITER_PROFILE')}
            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'WAITER_PROFILE'
                ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
                : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
            }`}
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Профиль' : 'Profile'}</span>
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-5 gap-0.5 text-center">
        {/* Tab 1: Rooms list (DASHBOARD) */}
        <button
          onClick={() => handleTabChange('DASHBOARD')}
          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'DASHBOARD'
              ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
              : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Номера' : 'Rooms'}</span>
        </button>

        {/* Tab 2: Active Task Checklist */}
        <button
          onClick={() => handleTabChange('ACTIVE_ROOM')}
          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
            activeTab === 'ACTIVE_ROOM'
              ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
              : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
          }`}
        >
          <CheckSquare className="h-4 w-4 shrink-0" />
          <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Активное' : 'Active'}</span>
        </button>

        {/* Tab 3: Maintenance defects */}
        <button
          onClick={() => handleTabChange('MAINTENANCE')}
          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'MAINTENANCE'
              ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
              : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
          }`}
        >
          <Wrench className="h-4 w-4 shrink-0" />
          <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Техслужба' : 'Maintenance'}</span>
        </button>

        {/* Tab 4: Supplies trolley */}
        <button
          onClick={() => handleTabChange('SUPPLIES')}
          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'SUPPLIES'
              ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
              : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
          }`}
        >
          <Package className="h-4 w-4 shrink-0" />
          <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Инвентарь' : 'Inventory'}</span>
        </button>

        {/* Tab 5: Profile and shift info */}
        <button
          onClick={() => handleTabChange('PROFILE')}
          className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === 'PROFILE'
              ? 'bg-terracotta text-white font-extrabold shadow-inner border border-white/10'
              : 'text-[#8A8177] hover:text-[#FAF7F3] hover:bg-terracotta/20'
          }`}
        >
          <User className="h-4 w-4 shrink-0" />
          <span className="text-[8px] font-bold truncate block w-full">{lang === 'RU' ? 'Профиль' : 'Profile'}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#eae6df] text-slate-800 flex flex-col items-center justify-between font-sans selection:bg-[#C2410C] selection:text-white">
      
      {/* 1. TOP CONTROL BAR FOR PREVIEW DEV FRAMES */}
      <header className="w-full bg-transparent px-4 py-2 flex items-center justify-between text-xs z-40 select-none">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
          <span className="font-extrabold text-[#241E1A] tracking-wide text-sm font-serif">Sollviera <span className="text-[#C2410C]">PMS</span></span>
          <span className="text-[#8A8177] font-medium hidden sm:inline">• Housekeeping Pro Suite v2.4</span>
        </div>

        {/* Device Frame controls & Lang global toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center bg-white/70 p-1 rounded-lg border border-[#E5E2DD] backdrop-blur-xs">
              <button
                onClick={() => setIsPhoneFrame(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  isPhoneFrame ? 'bg-[#241E1A] text-white shadow-xs' : 'text-[#8A8177] hover:text-[#241E1A]'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile View</span>
              </button>
              <button
                onClick={() => setIsPhoneFrame(false)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  !isPhoneFrame ? 'bg-[#241E1A] text-white shadow-xs' : 'text-[#8A8177] hover:text-[#241E1A]'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>Full Screen</span>
              </button>
            </div>

            {isPhoneFrame && (
              <div className="flex items-center bg-white/70 p-1 rounded-lg border border-[#E5E2DD] backdrop-blur-xs">
                <button
                  onClick={() => setIsRoundedFrame(true)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    isRoundedFrame ? 'bg-[#241E1A] text-white shadow-xs' : 'text-[#8A8177] hover:text-[#241E1A]'
                  }`}
                >
                  {lang === 'RU' ? 'Закругленный' : 'Rounded'}
                </button>
                <button
                  onClick={() => setIsRoundedFrame(false)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    !isRoundedFrame ? 'bg-[#241E1A] text-white shadow-xs' : 'text-[#8A8177] hover:text-[#241E1A]'
                  }`}
                >
                  {lang === 'RU' ? 'Прямоугольный' : 'Rectangular'}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setLang(lang === 'EN' ? 'RU' : 'EN')}
            className="flex items-center gap-1.5 bg-white/75 hover:bg-white px-2.5 py-1.5 rounded-lg border border-[#E5E2DD] font-bold text-[#C2410C] transition-all cursor-pointer shadow-xs backdrop-blur-xs"
          >
            <Globe className="h-3.5 w-3.5 text-[#C2410C]" />
            <span>{lang === 'EN' ? 'EN' : 'RU'}</span>
          </button>
        </div>
      </header>

      {/* OFFLINE MODE BANNER */}
      {offlineMode && (
        <div className="w-full bg-amber-500 text-slate-950 font-bold text-xs py-1 px-4 flex items-center justify-center gap-1.5 animate-in slide-in-from-top-4 duration-300">
          <WifiOff className="h-3.5 w-3.5 animate-bounce" />
          <span>{lang === 'RU' ? 'Режим офлайн • Изменения кэшируются локально' : 'Offline Mode active • changes are queued locally'}</span>
        </div>
      )}

      {/* 2. DEVICE EMULATOR SIMULATOR WRAPPER */}
      <div className="flex-1 w-full flex items-center justify-center p-4">
        {isPhoneFrame ? (
          /* High-Fidelity Mobile Phone Bezel Mockup */
          <div className={`relative mx-auto w-[390px] h-[810px] bg-[#FAF7F3] border border-[#E5E2DD] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isRoundedFrame ? 'rounded-[40px]' : 'rounded-none'}`}>

            {/* Empty top padding spacer matching screen theme instead of status bar */}
            <div id="phone-top-spacer" className={`h-6 shrink-0 transition-colors duration-200 ${
              (!isLoggedIn) ? 'bg-[#FAF7F3]' :
              (activeTab.startsWith('WAITER_')) ? 'bg-[#FAF7F3]' :
              (activeTab === 'SV_DASHBOARD' || activeTab === 'SV_INSPECTION' || activeTab === 'SV_TEAM' || activeTab === 'SV_MAINTENANCE' || activeTab === 'SV_PROFILE') ? 'bg-[#FAF7F3]' :
              (activeTab === 'TECH_ACTIVE') ? 'bg-[#241E1A]' :
              (activeTab === 'TECH_DASHBOARD' || activeTab === 'TECH_CREATE' || activeTab === 'TECH_INVENTORY' || activeTab === 'TECH_PROFILE') ? 'bg-[#FAF7F3]' :
              (activeTab === 'ACTIVE_ROOM' || (activeTab === 'DASHBOARD' && dashboardRoomId !== null)) ? 'bg-[#241E1A]' : 'bg-[#FAF7F3]'
            }`} />

            {/* Application Screen Area */}
            <div className="flex-1 bg-[#FAF7F3] overflow-hidden flex flex-col relative">
              {renderTabContent()}
            </div>

            {/* Bottom Tab Bar (Inside phone) */}
            {isLoggedIn && (
              <div className="bg-[#241E1A] border-t border-[#E7DFD5]/15 px-2 py-1.5 shrink-0 z-40">
                {renderTabBar()}
              </div>
            )}

            {/* iOS Home Indicator Bar */}
            {isRoundedFrame && (
              <div className="h-5 bg-[#241E1A] flex items-center justify-center shrink-0 z-40 pb-1">
                <div className="w-28 h-1 bg-white/30 rounded-full" />
              </div>
            )}
          </div>
        ) : (
          /* Full Screen Tablet/Dashboard View */
          <div className="w-full max-w-4xl bg-[#241E1A] rounded-3xl border border-[#E7DFD5]/20 shadow-2xl overflow-hidden flex flex-col h-[810px] ring-2 ring-black/10">
            {/* Header / Screen view */}
            <div className="flex-1 bg-[#FAF7F3] overflow-hidden flex flex-col relative">
              {renderTabContent()}
            </div>

            {/* Bottom Tab Bar */}
            {isLoggedIn && (
              <div className="bg-[#241E1A] border-t border-[#E7DFD5]/15 p-2.5 shrink-0">
                {renderTabBar()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="w-full text-center py-2 text-[10px] text-slate-500 border-t border-slate-900 bg-slate-950">
        © 2026 Sollviera Hotel Management Systems • Geometric Balance UI
      </footer>
    </div>
  );
}
