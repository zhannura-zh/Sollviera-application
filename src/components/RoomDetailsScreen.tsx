import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, AlertTriangle, ShieldCheck, ClipboardList, Clock, 
  Sparkles, Camera, Plus, CheckCircle, ChevronDown, ChevronRight, HelpCircle, ArrowLeft, Send, Check, Package
} from 'lucide-react';
import { Language, HotelRoom, RoomStatus, RoomCheckitem, ChecklistZone, SupplyItem } from '../types';
import { getTranslation } from '../locales';

interface RoomDetailsScreenProps {
  room: HotelRoom | null;
  onUpdateRoomStatus: (roomId: string, newStatus: RoomStatus) => void;
  onUpdateRoomChecklist: (roomId: string, newChecklist: RoomCheckitem[]) => void;
  lang: Language;
  onNavigateToTab: (tab: any) => void;
  onAddSystemNotification: (msgEn: string, msgRu: string, cat: string) => void;
  onSubmitMaintenance?: (req: any) => void;
  supplies?: SupplyItem[];
  onDeductSupplies?: (deductions: Record<string, number>) => void;
}

export const RoomDetailsScreen: React.FC<RoomDetailsScreenProps> = ({
  room,
  onUpdateRoomStatus,
  onUpdateRoomChecklist,
  lang,
  onNavigateToTab,
  onAddSystemNotification,
  onSubmitMaintenance,
  supplies = [],
  onDeductSupplies,
}) => {
  const t = getTranslation(lang);

  // States
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [roomComment, setRoomComment] = useState<string>('');

  // Custom states for spent supplies & minibar
  const [spentQuantities, setSpentQuantities] = useState<Record<string, number>>({});
  const [deductedSuccess, setDeductedSuccess] = useState<boolean>(false);

  // Custom states for maintenance reporting
  const [maintenanceDesc, setMaintenanceDesc] = useState<string>('');
  const [maintenancePhoto, setMaintenancePhoto] = useState<string>('');
  const [maintenanceSuccess, setMaintenanceSuccess] = useState<boolean>(false);

  // Expand / collapse states
  const [isSuppliesExpanded, setIsSuppliesExpanded] = useState<boolean>(false);
  const [isMaintenanceExpanded, setIsMaintenanceExpanded] = useState<boolean>(false);

  const handleUpdateSpent = (id: string, diff: number) => {
    setSpentQuantities(prev => {
      const val = prev[id] || 0;
      const nextVal = Math.max(0, val + diff);
      return { ...prev, [id]: nextVal };
    });
  };

  const handleConfirmDeductions = () => {
    if (onDeductSupplies) {
      onDeductSupplies(spentQuantities);
    }
    setSpentQuantities({});
    setDeductedSuccess(true);
    setTimeout(() => setDeductedSuccess(false), 2500);
  };

  const handleReportMaintenance = () => {
    if (!maintenanceDesc.trim() || !room) return;
    if (onSubmitMaintenance) {
      onSubmitMaintenance({
        roomNumber: room.roomNumber,
        category: 'OTHER',
        priority: 'MEDIUM',
        description: maintenanceDesc.trim(),
        blocksCleaning: false,
        photoUrl: maintenancePhoto || undefined
      });
    }
    setMaintenanceDesc('');
    setMaintenancePhoto('');
    setMaintenanceSuccess(true);
    setTimeout(() => setMaintenanceSuccess(false), 3000);
  };

  // Custom minibar refilling logic states & handlers
  const [minibarRefilled, setMinibarRefilled] = useState<Record<string, number>>({});
  const [minibarDeductedSuccess, setMinibarDeductedSuccess] = useState<boolean>(false);

  const handleUpdateMinibarRefilled = (id: string, diff: number) => {
    setMinibarRefilled(prev => {
      const val = prev[id] || 0;
      const nextVal = Math.max(0, val + diff);
      return { ...prev, [id]: nextVal };
    });
  };

  const handleConfirmMinibarDeduction = () => {
    if (onDeductSupplies) {
      onDeductSupplies(minibarRefilled);
    }
    setMinibarRefilled({});
    setMinibarDeductedSuccess(true);
    setTimeout(() => setMinibarDeductedSuccess(false), 2500);
  };
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({
    BEDROOM: true,
    BATHROOM: true,
    MINIBAR: false,
    BALCONY: false,
    OTHER: false
  });
  
  // Custom checklist items options
  const [checklistComments, setChecklistComments] = useState<Record<string, string>>({});
  const [checklistPhotos, setChecklistPhotos] = useState<Record<string, string>>({});
  const [confirmStandard, setConfirmStandard] = useState<boolean>(false);

  // Room Before/After photos
  const [photoBeforeUrl, setPhotoBeforeUrl] = useState<string>('');
  const [photoAfterUrl, setPhotoAfterUrl] = useState<string>('');

  // Zone specific photos
  const [zonePhotos, setZonePhotos] = useState<Record<string, string>>({});
  
  // Supply request dropdown simulator
  const [showSupplySelector, setShowSupplySelector] = useState<boolean>(false);
  const [supplyRequestSent, setSupplyRequestSent] = useState<boolean>(false);

  // Stopwatch effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (room && room.status === 'IN_PROGRESS' && isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [room?.status, isTimerRunning]);

  // Sync stopwatch state with room status
  useEffect(() => {
    if (room) {
      if (room.status === 'IN_PROGRESS') {
        setIsTimerRunning(true);
        if (timerSeconds === 0) {
          // Initialize with some random seconds to look realistic (e.g. 8 mins)
          setTimerSeconds(8 * 60 + 12);
        }
      } else {
        setIsTimerRunning(false);
      }
      
      // Reset confirmations
      setConfirmStandard(false);
    }
  }, [room?.id, room?.status]);

  if (!room) {
    return (
      <div className="w-full bg-slate-50 min-h-[750px] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="h-16 w-16 bg-sky-50 text-sky-600 rounded-3xl flex items-center justify-center border border-sky-100 shadow-sm animate-bounce">
          <ClipboardList className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-black text-slate-800">{t.noActiveRoom}</h2>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          {t.selectRoomWarning}
        </p>
        <button
          onClick={() => onNavigateToTab('DASHBOARD')}
          className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
        >
          {lang === 'RU' ? 'Перейти к списку номеров' : 'Go to Rooms List'}
        </button>
      </div>
    );
  }

  const formatTime = (sec: number) => {
    const mm = Math.floor(sec / 60).toString().padStart(2, '0');
    const ss = (sec % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handleStartCleaning = () => {
    onUpdateRoomStatus(room.id, 'IN_PROGRESS');
    setIsTimerRunning(true);
    onAddSystemNotification(
      `Cleaning started for Room ${room.roomNumber}`,
      `Начата уборка номера ${room.roomNumber}`,
      'SYSTEM'
    );
  };

  const handlePauseResume = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const toggleZone = (zone: string) => {
    setExpandedZones((prev) => ({ ...prev, [zone]: !prev[zone] }));
  };

  const handleToggleCheckitem = (itemId: string) => {
    const updated = room.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    onUpdateRoomChecklist(room.id, updated);
  };

  const handleSimulatePhoto = (itemId: string) => {
    const mockPhotos = [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=150&auto=format&fit=crop&q=80'
    ];
    const randPhoto = mockPhotos[Math.floor(Math.random() * mockPhotos.length)];
    
    // Update local state and checklist item
    const updatedPhotos = { ...checklistPhotos, [itemId]: randPhoto };
    setChecklistPhotos(updatedPhotos);

    const updated = room.checklist.map((item) =>
      item.id === itemId ? { ...item, photoUrl: randPhoto } : item
    );
    onUpdateRoomChecklist(room.id, updated);
  };

  const handleCommentChange = (itemId: string, text: string) => {
    setChecklistComments({ ...checklistComments, [itemId]: text });
    
    const updated = room.checklist.map((item) =>
      item.id === itemId ? { ...item, comment: text } : item
    );
    onUpdateRoomChecklist(room.id, updated);
  };

  const handleMarkFinished = () => {
    if (!confirmStandard) return;
    onUpdateRoomStatus(room.id, 'READY');
    setIsTimerRunning(false);
    onAddSystemNotification(
      `Room ${room.roomNumber} ready for inspection`,
      `Номер ${room.roomNumber} готов к проверке`,
      'SUPERVISOR'
    );
    onNavigateToTab('DASHBOARD');
  };

  const handleSimulateMainPhoto = (type: 'BEFORE' | 'AFTER') => {
    const imgUrl = type === 'BEFORE' 
      ? 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=300&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=300&auto=format&fit=crop&q=80';
    
    if (type === 'BEFORE') setPhotoBeforeUrl(imgUrl);
    else setPhotoAfterUrl(imgUrl);
  };

  const handleSimulateZonePhoto = (zone: string) => {
    const mockPhotos = [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=150&auto=format&fit=crop&q=80'
    ];
    const randPhoto = mockPhotos[Math.floor(Math.random() * mockPhotos.length)];
    setZonePhotos((prev) => ({ ...prev, [zone]: randPhoto }));
  };

  const handleSendQuickSupplyRequest = (supplyName: string) => {
    setSupplyRequestSent(true);
    onAddSystemNotification(
      `Support requested for Room ${room.roomNumber}: ${supplyName}`,
      `Запрошена помощь в номер ${room.roomNumber}: ${supplyName}`,
      'NEW_ROOM'
    );
    setTimeout(() => {
      setSupplyRequestSent(false);
      setShowSupplySelector(false);
    }, 2000);
  };

  // Group checklist items by zone
  const itemsByZone: Record<ChecklistZone, RoomCheckitem[]> = {
    BEDROOM: [],
    BATHROOM: [],
    MINIBAR: [],
    BALCONY: [],
    OTHER: []
  };
  room.checklist.forEach(item => {
    itemsByZone[item.zone || 'OTHER'].push(item);
  });

  const getZoneLabel = (zone: string) => {
    switch (zone) {
      case 'BEDROOM': return t.zoneBedroom;
      case 'BATHROOM': return t.zoneBathroom;
      case 'MINIBAR': return t.zoneMinibar;
      case 'BALCONY': return t.zoneBalcony;
      default: return t.zoneOther;
    }
  };

  const allTasksDone = room.checklist.every(item => item.done);

  return (
    <div className="w-full bg-[#FAF7F3] h-full overflow-hidden flex flex-col font-sans">
      
      {/* 1. HEADER BAR */}
      <div className="bg-[#241E1A] text-white px-4.5 pt-4.5 pb-4 space-y-3.5 border-b border-[#E7DFD5]/10 shrink-0">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => onNavigateToTab('DASHBOARD')}
            className="flex items-center gap-1 text-[#8A8177] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-[11px] font-sans font-normal tracking-wide">{lang === 'RU' ? 'Назад' : 'Back'}</span>
          </button>
          
          {room.priority && (
            <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-[4px] border ${
              room.priority === 'VIP' 
                ? 'bg-amber-950/50 text-[#E4762B] border-amber-800/30' 
                : room.priority === 'URGENT' 
                  ? 'bg-rose-950/50 text-rose-500 border-rose-800/30' 
                  : 'bg-white/5 text-[#8A8177] border-white/10'
            }`}>
              {room.priority}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div className="min-w-0">
            <h1 className="text-[28px] font-sans font-medium text-white tracking-tight leading-none">
              {lang === 'RU' ? `№ ${room.roomNumber}` : `No. ${room.roomNumber}`}
            </h1>
            <p className="text-[10.5px] text-[#8A8177] font-sans font-normal truncate mt-1.5 leading-none">
              {room.category} · {
                room.cleaningType === 'CHECKOUT' ? (lang === 'RU' ? 'выездная' : 'checkout') :
                room.cleaningType === 'STAYOVER' ? (lang === 'RU' ? 'текущая' : 'stayover') :
                room.cleaningType === 'DEEP_CLEAN' ? (lang === 'RU' ? 'генеральная' : 'deep clean') :
                (lang === 'RU' ? 'после ремонта' : 'after maintenance')
              }
            </p>
          </div>

          {/* Cleaning Timer or Status */}
          <div className="text-right flex flex-col items-end shrink-0">
            {room.status === 'IN_PROGRESS' ? (
              <>
                <span className="text-2xl font-mono font-medium text-[#E4762B] leading-none tracking-tight">
                  {formatTime(timerSeconds)}
                </span>
                <span className="text-[10px] text-[#8A8177] font-sans font-normal mt-1 leading-none">
                  {lang === 'RU' ? 'в работе' : 'in progress'}
                </span>
              </>
            ) : (
              <>
                <span className="text-lg font-sans font-medium text-[#FAF7F3] leading-none uppercase tracking-wide">
                  {room.status === 'READY' ? (lang === 'RU' ? 'готово' : 'ready') : 
                   room.status === 'PROBLEM' ? (lang === 'RU' ? 'поломка' : 'defect') : 
                   room.status === 'VERIFIED' ? (lang === 'RU' ? 'проверено' : 'verified') : 
                   (lang === 'RU' ? 'ожидает' : 'pending')}
                </span>
                <span className="text-[10px] text-[#8A8177] font-sans font-normal mt-1.5 leading-none">
                  {lang === 'RU' ? 'статус' : 'status'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. BODY CONTENT (SCROLLABLE) */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        
        {/* PMS SPECIAL NOTES / NOTES BANNER */}
        {(room.notesEn || room.notesRu) && (
          <div className="bg-[#FFFDF5] rounded-[14px] border border-[#FDE68A] p-3.5 flex items-start gap-2.5 text-xs text-[#241E1A] font-sans font-normal leading-relaxed shadow-2xs">
            <HelpCircle className="h-4 w-4 text-[#8A8177] shrink-0 mt-0.5" />
            <p>{lang === 'RU' ? room.notesRu : room.notesEn}</p>
          </div>
        )}

        {/* 2. ACTION BUTTONS ROW (WITHOUT STATUS/TIME DUPLICATION) */}
        <div className="flex items-center gap-3">
          {room.status === 'PENDING' && (
            <button
              onClick={handleStartCleaning}
              className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white py-3 px-4 rounded-xl text-xs font-medium cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 border border-[#C2410C]"
            >
              <Play className="h-4 w-4" />
              <span>{t.btnStartCleaning}</span>
            </button>
          )}

          {(room.status === 'IN_PROGRESS' || room.status === 'PROBLEM') && (
            <>
              <button
                onClick={handlePauseResume}
                className="flex-1 bg-white hover:bg-slate-50 border border-[#E4762B] text-[#241E1A] py-3 px-4 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs active:scale-95"
              >
                {isTimerRunning ? <Pause className="h-4 w-4 text-[#E4762B]" /> : <Play className="h-4 w-4 text-[#E4762B]" />}
                <span>{isTimerRunning ? t.btnPause : t.btnResume}</span>
              </button>
              
              <button
                onClick={() => onNavigateToTab('MAINTENANCE')}
                className="flex-1 bg-white hover:bg-slate-50 border border-[#B3261E] text-[#241E1A] py-3 px-4 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs active:scale-95"
              >
                <AlertTriangle className="h-4 w-4 text-[#B3261E]" />
                <span>{lang === 'RU' ? 'Поломка' : 'Damage'}</span>
              </button>
            </>
          )}
        </div>

        {/* 3. ZONE-GROUPED CHECKLISTS */}
        {room.status !== 'PENDING' && (
          <div className="space-y-3.5 pt-1">
            <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
              {lang === 'RU' ? 'Чек-лист уборки номера' : 'Room Cleaning Checklist'}
            </h3>

            {(Object.keys(itemsByZone) as ChecklistZone[]).map((zone) => {
              const items = itemsByZone[zone];
              if (items.length === 0) return null;

              const isExpanded = expandedZones[zone];
              const completedCount = items.filter(i => i.done).length;
              const totalCount = items.length;

              return (
                <div key={zone} className="bg-white rounded-[14px] border border-[#E5E2DD] overflow-hidden shadow-2xs">
                  {/* Zone Header Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleZone(zone)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50 transition-colors text-left ${isExpanded ? 'border-b border-[#E5E2DD]/60' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#241E1A] font-sans font-medium tracking-widest uppercase">
                        {getZoneLabel(zone)}
                      </span>
                      <span className="text-[10px] text-[#8A8177] font-sans font-normal ml-2">
                        {completedCount} {lang === 'RU' ? 'из' : 'of'} {totalCount}
                      </span>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-[#8A8177]" /> : <ChevronRight className="h-4 w-4 text-[#8A8177]" />}
                  </button>

                  {/* Zone Items */}
                  {isExpanded && (
                    <div className="p-3.5 space-y-3 bg-white">
                      {items.map((item) => (
                        <div key={item.id} className="space-y-2 pb-1.5 last:pb-0">
                          {/* Task Title & Checkbox */}
                          <div className="flex items-start gap-2.5">
                            <button
                              type="button"
                              disabled={room.status !== 'IN_PROGRESS'}
                              onClick={() => handleToggleCheckitem(item.id)}
                              className={`h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                                item.done 
                                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                                  : 'border-[#E5E2DD] hover:border-slate-400 bg-white'
                              } disabled:opacity-50`}
                            >
                              {item.done && <Check className="h-3 w-3 stroke-[3]" />}
                            </button>

                            <div className="flex-1">
                              <p className={`text-xs font-sans font-normal text-[#241E1A] leading-snug ${item.done ? 'line-through text-[#8A8177]' : ''}`}>
                                {lang === 'RU' ? item.textRu : item.textEn}
                              </p>
                            </div>
                          </div>

                          {/* If this is the MINIBAR zone and the room is IN_PROGRESS, show the minibar refill counter table */}
                          {zone === 'MINIBAR' && room.status === 'IN_PROGRESS' && (
                            <div className="mt-2.5 ml-6 space-y-2">
                              {/* Standard minibar items list */}
                              <div className="max-h-48 overflow-y-auto border border-[#E5E2DD] rounded-xl divide-y divide-[#E5E2DD]/50 bg-[#FAF7F3]/30 no-scrollbar">
                                {supplies
                                  .filter(s => s.category === 'MINIBAR')
                                  .map(s => {
                                    let standardQty = 2;
                                    if (s.id === 's14' || s.id === 's15') standardQty = 1;

                                    const refilledQty = minibarRefilled[s.id] || 0;
                                    
                                    return (
                                      <div key={s.id} className="flex items-center justify-between p-2 text-xs">
                                        <div className="min-w-0 flex-1 pr-2">
                                          <p className="font-sans font-normal text-[#241E1A] truncate leading-snug">
                                            {lang === 'RU' ? s.nameRu : s.nameEn}
                                          </p>
                                          <p className="text-[9px] text-[#8A8177] font-sans font-normal">
                                            {lang === 'RU' ? `Стандарт: ${standardQty} | В наличии: ${s.trolleyQty}` : `Standard: ${standardQty} | Trolley: ${s.trolleyQty}`}
                                          </p>
                                        </div>

                                        {/* Counter */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateMinibarRefilled(s.id, -1)}
                                            disabled={refilledQty <= 0}
                                            className="h-6 w-6 rounded-md bg-white border border-[#E5E2DD] text-[#241E1A] hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center font-bold cursor-pointer"
                                          >
                                            -
                                          </button>
                                          <span className="w-5 text-center font-sans font-normal text-[#241E1A] text-[11px]">
                                            {refilledQty}
                                          </span>
                                          <button
                                            type="button"
                                            disabled={refilledQty >= standardQty || refilledQty >= s.trolleyQty}
                                            onClick={() => handleUpdateMinibarRefilled(s.id, 1)}
                                            className="h-6 w-6 rounded-md bg-white border border-[#E5E2DD] text-[#241E1A] hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center font-bold cursor-pointer"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>

                              {/* Confirm Minibar Refill Button */}
                              {Object.keys(minibarRefilled).some(k => minibarRefilled[k] > 0) && (
                                <div className="pt-1.5 flex items-center justify-between gap-2.5">
                                  <span className="text-[9px] text-[#8A8177] font-sans font-normal leading-normal">
                                    {lang === 'RU' ? 'Спишется с тележки.' : 'Will deduct from trolley.'}
                                  </span>
                                  {minibarDeductedSuccess ? (
                                    <span className="text-[10px] font-sans font-normal text-emerald-600 flex items-center gap-0.5 animate-pulse">✓ {lang === 'RU' ? 'Готово!' : 'Done!'}</span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={handleConfirmMinibarDeduction}
                                      className="px-3 py-1.5 bg-[#C2410C] hover:bg-[#A93A0C] text-white text-[10px] font-sans font-normal rounded-lg cursor-pointer transition-all active:scale-95"
                                    >
                                      {lang === 'RU' ? 'Подтвердить списание' : 'Confirm Refills'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Zone Photo Capture */}
                      {room.status === 'IN_PROGRESS' && (
                        zonePhotos[zone] ? (
                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
                            <span className="text-[10px] text-[#8A8177] uppercase tracking-wider font-sans font-normal flex items-center gap-2">
                              <Camera className="h-4 w-4 text-[#8A8177]" />
                              {lang === 'RU' ? 'Фотофиксация зоны' : 'Zone Photo Capture'}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              <div className="relative rounded-lg overflow-hidden border border-[#E5E2DD] h-10 w-16 bg-[#FAF7F3] shrink-0">
                                <img src={zonePhotos[zone]} alt="zone" className="w-full h-full object-cover" />
                                <button 
                                  type="button"
                                  onClick={() => setZonePhotos(prev => ({ ...prev, [zone]: '' }))}
                                  className="absolute inset-0 bg-black/40 text-white font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-black/60"
                                >
                                  ×
                                </button>
                              </div>
                              <span className="text-[9px] font-sans font-normal text-emerald-600">✓ {lang === 'RU' ? 'Загружено' : 'Uploaded'}</span>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSimulateZonePhoto(zone)}
                            className="pt-2.5 border-t border-slate-100 w-full flex items-center gap-2 text-[10px] text-[#8A8177] hover:text-[#241E1A] uppercase tracking-wider font-sans font-normal transition-colors cursor-pointer"
                          >
                            <Camera className="h-4 w-4 text-[#8A8177]" />
                            <span>{lang === 'RU' ? 'Фотофиксация зоны' : 'Zone Photo Capture'}</span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Spent Supplies Deductions Component */}
        {room.status === 'IN_PROGRESS' && (
          <div className="bg-white rounded-[14px] border border-[#E5E2DD] overflow-hidden shadow-2xs">
            {/* Header toggle */}
            <button
              type="button"
              onClick={() => setIsSuppliesExpanded(!isSuppliesExpanded)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50 transition-colors text-left ${isSuppliesExpanded ? 'border-b border-[#E5E2DD]/60' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[#8A8177]" />
                <span className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase">
                  {lang === 'RU' ? 'Расход материалов' : 'Supplies Consumption'}
                </span>
              </div>
              {isSuppliesExpanded ? <ChevronDown className="h-4 w-4 text-[#8A8177]" /> : <ChevronRight className="h-4 w-4 text-[#8A8177]" />}
            </button>

            {isSuppliesExpanded && (
              <div className="p-3.5 space-y-3 bg-white">
                {/* Spent supplies list selector */}
                <div className="space-y-2">
                  <p className="text-[9px] text-[#8A8177] font-sans font-normal uppercase">
                    {lang === 'RU' ? 'Укажите количество использованных позиций:' : 'Specify used quantities:'}
                  </p>
                  
                  <div className="max-h-48 overflow-y-auto border border-[#E5E2DD] rounded-xl divide-y divide-[#E5E2DD]/50 bg-[#FAF7F3]/30 no-scrollbar">
                    {supplies
                      .filter(s => s.category !== 'CLEANING' && s.category !== 'MINIBAR')
                      .map(s => {
                        const currentSpent = spentQuantities[s.id] || 0;
                        return (
                          <div key={s.id} className="flex items-center justify-between p-2 text-xs">
                            <div className="min-w-0 flex-1 pr-2">
                              <p className="font-sans font-normal text-[#241E1A] truncate leading-snug">
                                {lang === 'RU' ? s.nameRu : s.nameEn}
                              </p>
                              <p className="text-[9px] text-[#8A8177] font-sans font-normal">
                                {lang === 'RU' ? 'В наличии на тележке: ' : 'Trolley stock: '}{s.trolleyQty} {s.unit}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateSpent(s.id, -1)}
                                disabled={currentSpent <= 0}
                                className="h-6 w-6 rounded-md bg-white border border-[#E5E2DD] text-[#241E1A] hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-5 text-center font-sans font-normal text-[#241E1A] text-[11px]">
                                {currentSpent}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateSpent(s.id, 1)}
                                disabled={currentSpent >= s.trolleyQty}
                                className="h-6 w-6 rounded-md bg-white border border-[#E5E2DD] text-[#241E1A] hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Deduct button */}
                  {Object.keys(spentQuantities).some(k => spentQuantities[k] > 0) && (
                    <div className="pt-1.5 flex items-center justify-between gap-2.5">
                      <span className="text-[9px] text-[#8A8177] font-sans font-normal leading-normal">
                        {lang === 'RU' ? 'Будет списано с тележки.' : 'Will be deducted from trolley.'}
                      </span>
                      {deductedSuccess ? (
                        <span className="text-[10px] font-sans font-normal text-emerald-600 flex items-center gap-0.5 animate-pulse">
                          ✓ {lang === 'RU' ? 'Списано!' : 'Deducted!'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleConfirmDeductions}
                          className="px-3 py-1.5 bg-[#C2410C] hover:bg-[#A93A0C] text-white text-[10px] font-sans font-normal rounded-lg cursor-pointer transition-all active:scale-95"
                        >
                          {lang === 'RU' ? 'Подтвердить списание' : 'Confirm Deductions'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. ATTACH GENERAL PHOTOS BEFORE / AFTER */}
        {room.status === 'IN_PROGRESS' && (
          <div className="bg-white rounded-xl border border-[#E5E2DD] p-3 shadow-2xs space-y-2.5">
            <h3 className="text-[10px] font-sans font-normal uppercase text-[#8A8177] tracking-widest pl-0.5">
              {lang === 'RU' ? 'Фотоотчет состояния комнаты' : 'Room Photo Inspection'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Photo Before */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-normal text-[#8A8177] uppercase block">{t.photoBefore}</span>
                {photoBeforeUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-[#E5E2DD] h-20 bg-slate-100">
                    <img src={photoBeforeUrl} alt="before" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setPhotoBeforeUrl('')}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-slate-900/60 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSimulateMainPhoto('BEFORE')}
                    className="w-full h-20 border-2 border-dashed border-[#E5E2DD] rounded-lg hover:border-slate-350 transition-colors flex flex-col items-center justify-center gap-1 text-[#8A8177] hover:text-[#241E1A] cursor-pointer bg-[#FAF7F3]"
                  >
                    <Camera className="h-4 w-4" />
                    <span className="text-[9px] font-normal">{t.btnUpload}</span>
                  </button>
                )}
              </div>

              {/* Photo After */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-normal text-[#8A8177] uppercase block">{t.photoAfter}</span>
                {photoAfterUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-[#E5E2DD] h-20 bg-slate-100">
                    <img src={photoAfterUrl} alt="after" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setPhotoAfterUrl('')}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-slate-900/60 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSimulateMainPhoto('AFTER')}
                    className="w-full h-20 border-2 border-dashed border-[#E5E2DD] rounded-lg hover:border-slate-355 transition-colors flex flex-col items-center justify-center gap-1 text-[#8A8177] hover:text-[#241E1A] cursor-pointer bg-[#FAF7F3]"
                  >
                    <Camera className="h-4 w-4" />
                    <span className="text-[9px] font-normal">{t.btnUpload}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Consolidated Room Comment */}
            <div className="space-y-1 pt-1.5 border-t border-[#E5E2DD]/50">
              <textarea
                rows={2}
                placeholder={lang === 'RU' ? 'Комментарии и примечания по комнате' : 'Room Comments & Notes'}
                value={roomComment}
                onChange={(e) => setRoomComment(e.target.value)}
                className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl p-2 text-xs text-[#241E1A] focus:outline-none focus:ring-1 focus:ring-[#C2410C] placeholder-[#8A8177] resize-none font-sans font-normal"
              />
            </div>
          </div>
        )}

        {/* Report Maintenance Issue Component */}
        {room.status === 'IN_PROGRESS' && (
          <div className="bg-white rounded-[14px] border border-[#E5E2DD] overflow-hidden shadow-2xs">
            {/* Header toggle */}
            <button
              type="button"
              onClick={() => setIsMaintenanceExpanded(!isMaintenanceExpanded)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50 transition-colors text-left ${isMaintenanceExpanded ? 'border-b border-[#E5E2DD]/60' : ''}`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#8A8177]" />
                <span className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase">
                  {lang === 'RU' ? 'Фиксация неполадок' : 'Report Defect'}
                </span>
              </div>
              {isMaintenanceExpanded ? <ChevronDown className="h-4 w-4 text-[#8A8177]" /> : <ChevronRight className="h-4 w-4 text-[#8A8177]" />}
            </button>

            {isMaintenanceExpanded && (
              <div className="p-3.5 space-y-3 bg-white">
                <div className="space-y-2.5">
                  <textarea
                    rows={1.5}
                    placeholder={lang === 'RU' ? 'Опишите проблему' : 'Describe defect'}
                    value={maintenanceDesc}
                    onChange={(e) => setMaintenanceDesc(e.target.value)}
                    className="w-full bg-[#FAF7F3] border border-[#E5E2DD] rounded-xl p-2 text-xs text-[#241E1A] focus:outline-none focus:ring-1 focus:ring-[#C2410C] placeholder-[#8A8177] resize-none font-sans font-normal"
                  />

                  {/* Photo fixation */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-normal text-[#8A8177] uppercase flex items-center gap-1">
                      <Camera className="h-3.5 w-3.5 text-[#8A8177]" />
                      {lang === 'RU' ? 'Фотофиксация' : 'Photo fixation'}
                    </span>
                    
                    {maintenancePhoto ? (
                      <div className="flex items-center gap-2">
                        <div className="relative rounded-lg overflow-hidden border border-[#E5E2DD] h-10 w-16 bg-[#FAF7F3] shrink-0">
                          <img src={maintenancePhoto} alt="defect" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setMaintenancePhoto('')}
                            className="absolute inset-0 bg-black/40 text-white font-bold text-xs flex items-center justify-center cursor-pointer hover:bg-black/60"
                          >
                            ×
                          </button>
                        </div>
                        <span className="text-[9px] font-sans font-normal text-emerald-600">✓ {lang === 'RU' ? 'Загружено' : 'Uploaded'}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMaintenancePhoto('https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=300&auto=format&fit=crop&q=80')}
                        className="px-2.5 py-1 text-[9px] bg-[#FAF7F3] hover:bg-slate-50 text-[#8A8177] hover:text-[#241E1A] font-sans font-normal rounded-lg transition-colors cursor-pointer border border-[#E5E2DD]"
                      >
                        {t.btnUpload}
                      </button>
                    )}
                  </div>

                  {/* Submit button */}
                  {maintenanceDesc.trim() && (
                    <div className="pt-1 border-t border-[#E5E2DD]/50 flex justify-end">
                      {maintenanceSuccess ? (
                        <span className="text-[10px] font-sans font-normal text-emerald-600">
                          ✓ {lang === 'RU' ? 'Заявка отправлена в техслужбу!' : 'Defect ticket sent to engineering!'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleReportMaintenance}
                          className="px-3.5 py-1.5 bg-[#C2410C] hover:bg-[#A93A0C] text-white text-[10px] font-sans font-normal rounded-lg cursor-pointer transition-all active:scale-95 shadow-xs"
                        >
                          {lang === 'RU' ? 'Заявить о неполадке' : 'Submit Defect Ticket'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. CONFIRMATION CHECK & FINISH SUBMISSION */}
        {room.status === 'IN_PROGRESS' && (
          <div className="bg-white rounded-xl border border-[#E5E2DD] p-3 shadow-2xs space-y-3.5">
            <div className="flex items-start gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmStandard(!confirmStandard)}
                className={`h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                  confirmStandard 
                    ? 'bg-[#C2410C] border-[#C2410C] text-white' 
                    : 'border-[#E5E2DD] hover:border-slate-400 bg-white'
                }`}
              >
                {confirmStandard && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </button>
              <p className="text-[10px] font-sans font-normal text-[#8A8177] leading-normal">
                {t.cleanerConfirm}
              </p>
            </div>

            <button
              onClick={handleMarkFinished}
              disabled={!confirmStandard || !allTasksDone}
              className={`w-full py-3 px-4 rounded-xl text-xs font-sans font-normal flex items-center justify-center gap-2 transition-all shadow-2xs ${
                confirmStandard && allTasksDone
                  ? 'bg-[#C2410C] hover:bg-[#A93A0C] text-white cursor-pointer'
                  : 'bg-[#FAF7F3] text-[#8A8177] border border-[#E5E2DD] cursor-not-allowed'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>{t.btnComplete}</span>
            </button>
          </div>
        )}

        {/* VERIFIED SCREEN CONFIRMATION */}
        {(room.status === 'READY' || room.status === 'VERIFIED') && (
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center space-y-2.5 shadow-inner">
            <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h4 className="text-xs font-sans font-medium text-emerald-950">✓ {lang === 'RU' ? 'Работа сдана' : 'Clean Submitted'}</h4>
            <p className="text-[11px] text-emerald-700 max-w-xs mx-auto leading-normal">
              {t.roomVerifiedText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
