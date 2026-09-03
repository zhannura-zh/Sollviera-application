import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Users,
  Play,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  ShieldCheck,
  CheckSquare,
  Building2,
  Calendar,
  AlertCircle,
  Filter,
  Plus,
  Minus,
  DollarSign,
  X,
} from 'lucide-react';
import { Language, HotelRoom, RoomStatus, CleaningType, RoomPriority, CleanerProfile } from '../types';
import { getTranslation } from '../locales';
import { mockRooms, mockCleaners } from '../data/mockData';
import { RoomChecklistModal } from './RoomChecklistModal';

interface CleaningDashboardScreenProps {
  currentLang?: Language;
  cleanerProfile?: CleanerProfile;
  rooms?: HotelRoom[];
  onUpdateRoomStatus?: (roomId: string, newStatus: RoomStatus) => void;
  onSelectActiveRoom?: (roomId: string) => void;
}

export const CleaningDashboardScreen: React.FC<CleaningDashboardScreenProps> = ({
  currentLang = 'EN',
  cleanerProfile = mockCleaners[0],
  rooms: propRooms,
  onUpdateRoomStatus,
  onSelectActiveRoom,
}) => {
  const lang = currentLang as Language;
  const t = getTranslation(lang);

  // State
  const [localRooms, setLocalRooms] = useState<HotelRoom[]>(mockRooms);
  const rooms = propRooms || localRooms;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<RoomStatus | 'ALL'>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [selectedCleaningType, setSelectedCleaningType] = useState<CleaningType | 'ALL'>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<RoomPriority | 'ALL'>('ALL');

  // Modal room selection
  const [activeModalRoomId, setActiveModalRoomId] = useState<string | null>(null);
  const activeModalRoom = rooms.find((r) => r.id === activeModalRoomId) || null;

  const [activeCheckoutRoomId, setActiveCheckoutRoomId] = useState<string | null>(null);
  const activeCheckoutRoom = rooms.find((r) => r.id === activeCheckoutRoomId) || null;
  const [submittedCheckoutRoomIds, setSubmittedCheckoutRoomIds] = useState<string[]>([]);

  // Filter handlers
  const filteredRooms = rooms.filter((room) => {
    // Search query match
    const matchesSearch =
      room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `floor ${room.floor}`.toLowerCase().includes(searchQuery.toLowerCase());

    // Status match
    const matchesStatus = selectedStatus === 'ALL' || room.status === selectedStatus;

    // Floor match
    const matchesFloor = selectedFloor === 'ALL' || room.floor === selectedFloor;

    // Cleaning type match
    const matchesType =
      selectedCleaningType === 'ALL' || room.cleaningType === selectedCleaningType;

    // Priority match
    const matchesPriority =
      selectedPriority === 'ALL' || room.priority === selectedPriority;

    return matchesSearch && matchesStatus && matchesFloor && matchesType && matchesPriority;
  });

  // Calculate statistics
  const totalAssigned = rooms.length;
  const completedToday = rooms.filter((r) => r.status === 'READY' || r.status === 'VERIFIED').length;
  const remainingRooms = totalAssigned - completedToday;
  const urgentOrVip = rooms.filter(
    (r) => (r.priority === 'VIP' || r.priority === 'URGENT') && r.status !== 'VERIFIED'
  ).length;

  const getLeftLineColor = (status: RoomStatus) => {
    switch (status) {
      case 'PROBLEM': return 'bg-rose-600';
      case 'IN_PROGRESS': return 'bg-[#C2410C]'; // Terracotta
      case 'READY': return 'bg-[#009b72]'; // Green line as requested in SV
      case 'VERIFIED': return 'bg-slate-500';
      default: return 'bg-[#E5E2DD]';
    }
  };

  const getOverdueLabel = (room: HotelRoom) => {
    if (room.roomNumber === '312') return lang === 'RU' ? '13:00 · +24 мин' : '13:00 · +24 min';
    return `${room.deadline} · LATE`;
  };

  const getRightStatusText = (room: HotelRoom) => {
    if (room.isOverdue) {
      return getOverdueLabel(room);
    }
    if (room.status === 'IN_PROGRESS') {
      return lang === 'RU' ? 'в работе · 12 мин' : 'in progress · 12 min';
    }
    return '';
  };

  // Handle direct button click on room card
  const handleRoomAction = (e: React.MouseEvent, room: HotelRoom) => {
    e.stopPropagation();
    const activeRoomInProgress = rooms.find((r) => r.status === 'IN_PROGRESS');
    if (activeRoomInProgress && activeRoomInProgress.id !== room.id) {
      alert(
        lang === 'RU'
          ? `Сначала приостановите (нажмите паузу) активную уборку в номере #${activeRoomInProgress.roomNumber}.`
          : `Please pause the active cleaning in room #${activeRoomInProgress.roomNumber} first.`
      );
      return;
    }

    if (room.status === 'PENDING') {
      // Start cleaning
      updateRoomStatus(room.id, 'IN_PROGRESS');
      if (onSelectActiveRoom) onSelectActiveRoom(room.id);
    } else if (room.status === 'IN_PROGRESS' || room.status === 'PROBLEM') {
      // Open modal or select active room
      if (onSelectActiveRoom) {
        onSelectActiveRoom(room.id);
      } else {
        setActiveModalRoomId(room.id);
      }
    } else if (room.status === 'READY') {
      if (onSelectActiveRoom) {
        onSelectActiveRoom(room.id);
      } else {
        setActiveModalRoomId(room.id);
      }
    }
  };

  const updateRoomStatus = (roomId: string, newStatus: RoomStatus) => {
    if (onUpdateRoomStatus) {
      onUpdateRoomStatus(roomId, newStatus);
    } else {
      setLocalRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
      );
    }
  };

  const updateRoomChecklist = (roomId: string, newChecklist: any[]) => {
    setLocalRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, checklist: newChecklist } : r))
    );
  };

  // Helper badge color functions
  const getStatusBorderColor = (status: RoomStatus) => {
    switch (status) {
      case 'PENDING':
        return 'border-l-slate-400';
      case 'IN_PROGRESS':
        return 'border-l-sky-500';
      case 'READY':
        return 'border-l-emerald-500';
      case 'PROBLEM':
        return 'border-l-rose-500';
      case 'VERIFIED':
        return 'border-l-purple-500';
      default:
        return 'border-l-slate-300';
    }
  };

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'PENDING':
        return { label: t.filterPending, bg: 'bg-[#FAF2E6] text-[#E4762B] border-[#F5E0C2] border' };
      case 'IN_PROGRESS':
        return { label: t.filterInProgress, bg: 'bg-[#FAF0EB] text-[#A93A0C] border-[#F1DDD3] border animate-pulse' };
      case 'READY':
        return { label: t.filterReady, bg: 'bg-[#F6F5F4] text-[#A69C8F] border-[#E8E6E3] border' };
      case 'PROBLEM':
        return { label: t.filterProblem, bg: 'bg-[#FAF0EF] text-[#B3261E] border-[#F5D6D5] border' };
      case 'VERIFIED':
        return { label: t.filterVerified, bg: 'bg-[#F0F5F2] text-[#5B8C6E] border-[#D5E2D9] border' };
      default:
        return { label: status, bg: 'bg-slate-50 text-[#8A8177] border-[#E7DFD5] border' };
    }
  };

  const getPriorityBadge = (priority: RoomPriority) => {
    switch (priority) {
      case 'VIP':
        return { 
          label: 'VIP', 
          bg: 'bg-amber-500 text-white font-extrabold shadow-xs' 
        };
      case 'URGENT':
        return { 
          label: lang === 'RU' ? 'Срочно' : 'Urgent', 
          bg: 'bg-rose-600 text-white font-extrabold shadow-xs' 
        };
      case 'NORMAL':
      default:
        return { 
          label: lang === 'RU' ? 'Обычный' : 'Normal', 
          bg: 'bg-slate-100 text-slate-600 border border-slate-200' 
        };
    }
  };

  const getCleaningTypeLabel = (type: CleaningType) => {
    switch (type) {
      case 'CHECKOUT': return t.typeCheckout;
      case 'STAYOVER': return t.typeStayover;
      case 'DEEP_CLEAN': return t.typeDeepClean;
      case 'AFTER_MAINTENANCE': return t.typeAfterMaintenance;
    }
  };

  return (
    <div className="w-full bg-[#FAF7F3] h-full overflow-hidden flex flex-col font-sans">
      
      {/* 1. DASHBOARD HEADER */}
      <div className="bg-[#FAF7F3] px-3.5 pt-3.5 pb-2.5 space-y-2.5 shrink-0 select-none">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9.5px] text-[#8A8177] uppercase tracking-widest font-sans font-normal leading-none pb-1.5">
              {t.dashGreeting} {lang === 'RU' ? cleanerProfile.fullNameRu.split(' ')[0] : cleanerProfile.fullName.split(' ')[0]}
            </p>
            <h1 className="text-2xl font-serif font-medium text-[#241E1A] mt-1.5 leading-none">
              {lang === 'RU' ? 'Уборка номеров' : 'Room Cleaning'}
            </h1>
          </div>
        </div>

        {/* SUB STATS INLINE ROW */}
        {(() => {
          const floorNumber = cleanerProfile.floorAssigned.match(/\d+/)?.[0] || '3';
          return (
            <p className="text-[11px] text-[#8A8177] font-sans font-normal mt-1.5 leading-none">
              {floorNumber} {lang === 'RU' ? 'этаж' : 'floor'} · {remainingRooms} {lang === 'RU' ? 'осталось' : 'remaining'} · {completedToday} {lang === 'RU' ? 'убрано' : 'cleaned'} · <span className="text-rose-700">{rooms.filter(r => r.isOverdue).length} {lang === 'RU' ? 'просрочен' : 'overdue'}</span>
            </p>
          );
        })()}

        {/* SEARCH BAR */}
        <div className="relative font-sans pt-0.5">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A8177]">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'RU' ? 'Поиск по номеру комнаты' : 'Search by room number'}
            className="w-full bg-white border border-[#E5E2DD] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#2B2B2B] placeholder-[#8A8177] focus:outline-none focus:ring-1 focus:ring-[#C2410C]"
          />
        </div>
      </div>

      {/* 2. HORIZONTAL FILTERS */}
      <div className="px-3.5 py-1.5 bg-[#FAF7F3] space-y-2 shrink-0">
        
        {/* Status Chips (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'READY', 'PROBLEM', 'VERIFIED'] as const).map((status) => {
            const isSelected = selectedStatus === status;
            
            let count = status === 'ALL' ? rooms.length : rooms.filter(r => r.status === status).length;

            let label = t.filterAll;
            if (status === 'PENDING') label = lang === 'RU' ? 'Ожидают' : 'Pending';
            if (status === 'IN_PROGRESS') label = lang === 'RU' ? 'В работе' : 'In Work';
            if (status === 'READY') label = lang === 'RU' ? 'Готово' : 'Ready';
            if (status === 'PROBLEM') label = lang === 'RU' ? 'Проблема' : 'Problem';
            if (status === 'VERIFIED') label = lang === 'RU' ? 'Проверено' : 'Verified';

            return (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-sans font-medium whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#241E1A] text-white border-[#241E1A] shadow-xs'
                    : 'bg-white text-[#8A8177] border-[#E5E2DD] hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Secondary Selectors (Floor & Type) */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-[#E5E2DD]">
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="w-full bg-transparent text-[#241E1A] font-normal focus:outline-none text-[11px] cursor-pointer"
            >
              <option value="ALL">{t.floorAll}</option>
              <option value={2}>{t.floorLabel} 2</option>
              <option value={3}>{t.floorLabel} 3</option>
              <option value={4}>{t.floorLabel} 4</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-[#E5E2DD]">
            <select
              value={selectedCleaningType}
              onChange={(e) => setSelectedCleaningType(e.target.value as any)}
              className="w-full bg-transparent text-[#241E1A] font-normal focus:outline-none text-[11px] cursor-pointer truncate"
            >
              <option value="ALL">{t.typeAll}</option>
              <option value="CHECKOUT">{t.typeCheckout}</option>
              <option value="STAYOVER">{t.typeStayover}</option>
              <option value="DEEP_CLEAN">{t.typeDeepClean}</option>
              <option value="AFTER_MAINTENANCE">{t.typeAfterMaintenance}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. ROOM CARDS LIST */}
      <div className="px-3.5 py-2 space-y-4 flex-1 overflow-y-auto no-scrollbar">
        {filteredRooms.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <CheckSquare className="h-10 w-10 mx-auto text-slate-300" />
            <p className="text-xs font-bold">{lang === 'RU' ? 'Комнаты не найдены' : 'No rooms match filters'}</p>
          </div>
        ) : (
          (() => {
            const overdueRooms = filteredRooms.filter(r => r.isOverdue);
            const todayRooms = filteredRooms.filter(r => !r.isOverdue);

            const renderRoomCard = (room: HotelRoom) => {
              const rightText = getRightStatusText(room);

              return (
                <div
                  key={room.id}
                  onClick={() => {
                    if (onSelectActiveRoom) {
                      onSelectActiveRoom(room.id);
                    } else {
                      setActiveModalRoomId(room.id);
                    }
                  }}
                  className="bg-white rounded-[14px] border border-[#E5E2DD] shadow-xs hover:shadow-md transition-all p-4.5 space-y-3.5 relative overflow-hidden cursor-pointer"
                >
                  {/* Left stripe indicator - thin and curved */}
                  <div className={`absolute top-0 bottom-0 left-0 w-[3px] rounded-l-[13px] ${getLeftLineColor(room.status)}`} />

                  {/* Top Row: Room #, Priority Badge, Status/Overdue Tracker */}
                  <div className="flex items-center justify-between pl-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[17px] font-sans font-medium text-[#241E1A] leading-none">
                        {lang === 'RU' ? `№ ${room.roomNumber}` : `No. ${room.roomNumber}`}
                      </span>
                      
                      {/* Priority Badges */}
                      {room.priority === 'VIP' && (
                        <span className="bg-[#FAF7F3] text-amber-800 border border-amber-200/50 font-sans font-medium text-[8px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                          VIP
                        </span>
                      )}
                      {room.priority === 'URGENT' && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-100 font-sans font-medium text-[8px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {lang === 'RU' ? 'СРОЧНО' : 'URGENT'}
                        </span>
                      )}
                    </div>

                    {/* Right status text */}
                    {rightText && (
                      <span className={`text-[10px] font-sans font-normal ${room.isOverdue ? 'text-rose-700' : 'text-[#8A8177]'}`}>
                        {rightText}
                      </span>
                    )}
                  </div>

                  {/* Subtitle & Type Info */}
                  <div className="flex items-center justify-between text-[11px] font-sans font-normal text-[#8A8177] pl-1.5">
                    <span>
                      {room.category} · {getCleaningTypeLabel(room.cleaningType)} · {room.floor} {lang === 'RU' ? 'этаж' : 'floor'}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 pt-1">
                    {/* Main Action Button */}
                    <div className="flex-1">
                      {room.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={(e) => handleRoomAction(e, room)}
                          className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white py-3 rounded-xl text-xs font-sans font-medium shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95 border border-[#C2410C]"
                        >
                          <span>{lang === 'RU' ? 'Начать уборку' : 'Start cleaning'}</span>
                        </button>
                      )}

                      {room.status === 'IN_PROGRESS' && (
                        <button
                          type="button"
                          onClick={(e) => handleRoomAction(e, room)}
                          className="w-full bg-white hover:bg-[#FAF7F3] border border-[#E5E2DD] text-[#241E1A] py-3 rounded-xl text-xs font-sans font-medium shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
                        >
                          <span>{lang === 'RU' ? 'Продолжить' : 'Continue'}</span>
                        </button>
                      )}

                      {room.status === 'READY' && (
                        <button
                          type="button"
                          onClick={(e) => handleRoomAction(e, room)}
                          className="w-full bg-emerald-50 text-emerald-700 py-3 rounded-xl text-xs font-sans font-medium border border-emerald-200 cursor-pointer flex items-center justify-center hover:bg-emerald-100/50"
                        >
                          <span>{lang === 'RU' ? 'Готово' : 'Ready'}</span>
                        </button>
                      )}

                      {room.status === 'VERIFIED' && (
                        <button
                          type="button"
                          onClick={(e) => handleRoomAction(e, room)}
                          className="w-full bg-indigo-50 text-indigo-700 py-3 rounded-xl text-xs font-sans font-medium border border-indigo-200 cursor-pointer flex items-center justify-center hover:bg-indigo-100/50"
                        >
                          <span>{lang === 'RU' ? 'Проверено' : 'Verified'}</span>
                        </button>
                      )}

                      {room.status === 'PROBLEM' && (
                        <button
                          type="button"
                          onClick={(e) => handleRoomAction(e, room)}
                          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 py-3 rounded-xl text-xs font-sans font-medium border border-rose-200 shadow-sm flex items-center justify-center cursor-pointer transition-all active:scale-95"
                        >
                          <span>{lang === 'RU' ? 'Поломка' : 'Damage'}</span>
                        </button>
                      )}
                    </div>

                    {/* Guest Checkout Report Square Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCheckoutRoomId(room.id);
                      }}
                      className={`w-12 h-11 shrink-0 bg-white hover:bg-[#FAF7F3] border rounded-xl flex items-center justify-center cursor-pointer transition-colors text-slate-700 ${
                        submittedCheckoutRoomIds.includes(room.id) ? 'border-[#5B8C6E] ring-1 ring-[#5B8C6E]/40' : 'border-[#E5E2DD]'
                      }`}
                      title={lang === 'RU' ? 'Мини-бар / Ущерб' : 'Minibar / Extra charges'}
                    >
                      <DollarSign className="h-4.5 w-4.5 text-[#C2410C] stroke-[1.5]" />
                    </button>
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-4">
                {/* Overdue section */}
                {overdueRooms.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] text-[#8A8177] font-normal tracking-widest uppercase pl-1.5">
                      {lang === 'RU' ? 'ПРОСРОЧЕНО' : 'OVERDUE'}
                    </div>
                    <div className="space-y-3">
                      {overdueRooms.map(renderRoomCard)}
                    </div>
                  </div>
                )}

                {/* Today section */}
                {todayRooms.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[10px] text-[#8A8177] font-normal tracking-widest uppercase pl-1.5">
                      {lang === 'RU' ? 'СЕГОДНЯ' : 'TODAY'}
                    </div>
                    <div className="space-y-3">
                      {todayRooms.map(renderRoomCard)}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>


      {/* Checklist Modal */}
      {activeModalRoom && (
        <RoomChecklistModal
          key={activeModalRoom.id}
          room={activeModalRoom}
          isOpen={activeModalRoom !== null}
          onClose={() => setActiveModalRoomId(null)}
          onUpdateRoomStatus={updateRoomStatus}
          onUpdateRoomChecklist={updateRoomChecklist}
          lang={lang}
        />
      )}

      {/* Checkout Report Modal */}
      {activeCheckoutRoom && (
        <RoomCheckoutReportModal
          key={activeCheckoutRoom.id}
          room={activeCheckoutRoom}
          isOpen={activeCheckoutRoom !== null}
          onClose={() => setActiveCheckoutRoomId(null)}
          lang={lang}
          onSubmit={(roomId) => {
            if (!submittedCheckoutRoomIds.includes(roomId)) {
              setSubmittedCheckoutRoomIds((prev) => [...prev, roomId]);
            }
          }}
        />
      )}
    </div>
  );
};

interface RoomCheckoutReportModalProps {
  room: HotelRoom;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSubmit: (roomId: string) => void;
}

export const RoomCheckoutReportModal: React.FC<RoomCheckoutReportModalProps> = ({
  room,
  isOpen,
  onClose,
  lang,
  onSubmit
}) => {
  const [colaQty, setColaQty] = useState(0);
  const [chipsQty, setChipsQty] = useState(0);
  const [waterQty, setWaterQty] = useState(0);
  const [chocolateQty, setChocolateQty] = useState(0);
  const [hasDamage, setHasDamage] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    alert(
      lang === 'RU'
        ? `Данные отправлены на ресепшн для комнаты №${room.roomNumber}:\n` +
          `• Газированные напитки: ${colaQty} шт.\n` +
          `• Снеки/чипсы: ${chipsQty} шт.\n` +
          `• Вода: ${waterQty} шт.\n` +
          `• Шоколад: ${chocolateQty} шт.\n` +
          (hasDamage ? `• Ущерб имущества: ${damageDescription}` : '• Ущерб имущества отсутствует')
        : `Report sent to front desk for No. ${room.roomNumber}:\n` +
          `• Soda: ${colaQty} pcs\n` +
          `• Chips: ${chipsQty} pcs\n` +
          `• Water: ${waterQty} pcs\n` +
          `• Chocolate: ${chocolateQty} pcs\n` +
          (hasDamage ? `• Interior damage: ${damageDescription}` : '• No interior damage reported')
    );
    onSubmit(room.id);
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-[#241E1A]/40 backdrop-blur-xs flex items-center justify-center p-3.5 z-[60] select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-[14px] border border-[#E5E2DD] w-full max-w-sm p-4 space-y-4 shadow-xl flex flex-col max-h-[90%] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#E5E2DD]/50 pb-2">
          <div>
            <h3 className="text-sm font-sans font-medium text-[#241E1A] leading-tight">
              {lang === 'RU' ? `Мини-бар №${room.roomNumber}` : `Minibar No. ${room.roomNumber}`}
            </h3>
            <p className="text-[10px] text-[#8A8177] font-sans font-normal mt-0.5">
              {lang === 'RU' ? 'Передача доп. расходов на ресепшн' : 'Send extra room charges to front desk'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-[#FAF7F3] hover:bg-[#E5E2DD] text-[#241E1A] flex items-center justify-center cursor-pointer transition-colors border border-[#E5E2DD]/40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Consumables Counters */}
        <div className="space-y-2.5">
          <span className="block text-[9px] text-[#8A8177] uppercase font-sans font-normal tracking-wider">
            {lang === 'RU' ? 'Платный мини-бар / Расходники' : 'Consumables / Minibar'}
          </span>
          
          <div className="space-y-2">
            {/* Item 1 */}
            <div className="flex justify-between items-center text-xs font-sans font-medium bg-[#FAF7F3] p-2.5 rounded-xl border border-[#E5E2DD]/50">
              <span className="text-[#241E1A]">{lang === 'RU' ? 'Газировка / Пепси' : 'Soda / Soda drinks'}</span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setColaQty(q => Math.max(0, q - 1))}
                  className="h-6 w-6 rounded-lg bg-white border border-[#E5E2DD] flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-600"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center font-sans font-medium text-[#241E1A]">{colaQty}</span>
                <button
                  type="button"
                  onClick={() => setColaQty(q => q + 1)}
                  className="h-6 w-6 rounded-lg bg-white border border-[#E5E2DD] flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-600"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex justify-between items-center text-xs font-sans font-medium bg-[#FAF7F3] p-2.5 rounded-xl border border-[#E5E2DD]/50">
              <span className="text-[#241E1A]">{lang === 'RU' ? 'Чипсы / Снеки' : 'Chips / Snacks'}</span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setChipsQty(q => Math.max(0, q - 1))}
                  className="h-6 w-6 rounded-lg bg-white border border-[#E5E2DD] flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-600"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center font-sans font-medium text-[#241E1A]">{chipsQty}</span>
                <button
                  type="button"
                  onClick={() => setChipsQty(q => q + 1)}
                  className="h-6 w-6 rounded-lg bg-white border border-[#E5E2DD] flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-600"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex justify-between items-center text-xs font-sans font-medium bg-[#FAF7F3] p-2.5 rounded-xl border border-[#E5E2DD]/50">
              <span className="text-[#241E1A]">{lang === 'RU' ? 'Минеральная вода' : 'Mineral water'}</span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setWaterQty(q => Math.max(0, q - 1))}
                  className="h-6 w-6 rounded-lg bg-white border border-[#E5E2DD] flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-600"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center font-sans font-medium text-[#241E1A]">{waterQty}</span>
                <button
                  type="button"
                  onClick={() => setWaterQty(q => q + 1)}
                  className="h-6 w-6 rounded-lg bg-white border border-[#E5E2DD] flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-600"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex justify-between items-center text-xs font-sans font-medium bg-[#FAF7F3] p-2.5 rounded-xl border border-[#E5E2DD]/50">
              <span className="text-[#241E1A]">{lang === 'RU' ? 'Шоколад' : 'Chocolate'}</span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setChocolateQty(q => Math.max(0, q - 1))}
                  className="h-6 w-6 rounded-lg bg-white border border-[#E5E2DD] flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-600"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center font-sans font-medium text-[#241E1A]">{chocolateQty}</span>
                <button
                  type="button"
                  onClick={() => setChocolateQty(q => q + 1)}
                  className="h-6 w-6 rounded-lg bg-white border border-[#E5E2DD] flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-600"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Damage Section */}
        <div className="space-y-2 border-t border-[#E5E2DD]/50 pt-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="damage-check"
              checked={hasDamage}
              onChange={(e) => setHasDamage(e.target.checked)}
              className="rounded border-[#E5E2DD] text-[#C2410C] focus:ring-0 cursor-pointer h-4 w-4"
            />
            <label htmlFor="damage-check" className="text-xs font-sans font-normal text-[#241E1A] cursor-pointer select-none">
              {lang === 'RU' ? 'Есть повреждения имущества' : 'Interior damage detected'}
            </label>
          </div>

          {hasDamage && (
            <textarea
              rows={2}
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
              placeholder={lang === 'RU' ? 'Укажите сломанную технику / мебель...' : 'Specify broken assets...'}
              className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl px-2.5 py-1.5 text-xs font-sans font-normal text-[#2B2B2B] focus:outline-none focus:ring-1 focus:ring-[#C2410C]"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-[#FAF7F3] hover:bg-[#E5E2DD]/40 text-[#C2410C] text-xs font-sans font-medium rounded-xl border border-[#E5E2DD]/50 cursor-pointer transition-colors"
          >
            {lang === 'RU' ? 'Отмена' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-2.5 bg-[#C2410C] hover:bg-[#A93A0C] text-white text-xs font-sans font-medium rounded-xl cursor-pointer"
          >
            {lang === 'RU' ? 'Отправить ресепшну' : 'Submit to desk'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CleaningDashboardScreen;
