import React from 'react';
import { ChevronRight, Clock, Wrench, MessageSquare, Package, CheckCircle2 } from 'lucide-react';
import { Language, CleanerProfile, ShiftHistoryItem, HotelRoom } from '../types';
import { getTranslation } from '../locales';

interface ReportsScreenProps {
  cleanerProfile: CleanerProfile;
  shiftHistory: ShiftHistoryItem[];
  rooms: HotelRoom[];
  lang: Language;
  hideHeader?: boolean;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  cleanerProfile,
  shiftHistory,
  rooms,
  lang,
  hideHeader = false,
}) => {
  const t = getTranslation(lang);

  const [expandedShiftId, setExpandedShiftId] = React.useState<string | null>(null);

  // Stats calculation
  const completedRoomsCount = rooms.filter(r => r.status === 'READY' || r.status === 'VERIFIED').length;
  
  // Average quality score
  const avgQuality = shiftHistory.length > 0
    ? Math.round(shiftHistory.reduce((acc, curr) => acc + curr.qualityScore, 0) / shiftHistory.length)
    : 96;

  // Chart data matching the mockup
  const roomChartData = [
    { room: '301', minutes: 14 },
    { room: '205', minutes: 18 },
    { room: '306', minutes: 20 },
    { room: '310', minutes: 31 },
    { room: '214', minutes: 16 },
    { room: '402', minutes: 23 }
  ];

  const totalRoomsCleaned = completedRoomsCount + cleanerProfile.currentShift.roomsCompleted;
  const targetRooms = 12; // Shift target
  const avgTimeRoom = cleanerProfile.currentShift.avgTimePerRoom;
  const cleanAvgTime = avgTimeRoom.replace(/[^0-9]/g, '') || '22';

  return (
    <div className="w-full bg-[#FAF7F3] h-full overflow-hidden flex flex-col font-sans">
      
      {/* 1. HEADER (used if shown directly outside of popup) */}
      {!hideHeader && (
        <div className="bg-[#FAF7F3] px-5 pt-7 pb-4 space-y-1 shrink-0 text-left">
          <div className="flex items-center gap-2 -ml-1">
            <h2 className="text-2xl font-serif font-medium text-[#241E1A] pt-0.5 select-none">
              {lang === 'RU' ? 'Мои отчёты' : 'My Reports'}
            </h2>
          </div>
          <p className="text-xs font-sans font-normal text-[#8A8177]">
            {lang === 'RU' ? 'Личная продуктивность' : 'Personal productivity'}
          </p>
        </div>
      )}

      {/* 2. SCROLLABLE BODY */}
      <div className="px-5 pb-5 space-y-5 overflow-y-auto no-scrollbar flex-1">
        
        {/* SECTION 1: KEY METRICS */}
        <div className="space-y-2 text-left">
          <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
            {lang === 'RU' ? 'ЗА СЕГОДНЯ' : 'FOR TODAY'}
          </h3>
          
          <div className="bg-white rounded-[14px] border border-[#E5E2DD] p-4 shadow-2xs">
            <div className="grid grid-cols-3 divide-x divide-[#E5E2DD]/50 text-center">
              {/* Rooms Completed */}
              <div className="space-y-1">
                <div className="text-xs font-sans font-normal text-[#8A8177]">
                  <span className="text-xl font-medium text-[#241E1A]">{totalRoomsCleaned}</span>
                  {` / ${targetRooms}`}
                </div>
                <p className="text-[10px] font-sans font-normal text-[#8A8177]">
                  {lang === 'RU' ? 'убрано' : 'cleaned'}
                </p>
              </div>

              {/* Avg Time */}
              <div className="space-y-1">
                <div className="text-xs font-sans font-normal text-[#8A8177]">
                  <span className="text-xl font-medium text-[#241E1A]">{cleanAvgTime}</span>
                  {lang === 'RU' ? ' мин' : ' min'}
                </div>
                <p className="text-[10px] font-sans font-normal text-[#8A8177]">
                  {lang === 'RU' ? 'на номер' : 'per room'}
                </p>
              </div>

              {/* Quality Score */}
              <div className="space-y-1">
                <div className="text-xs font-sans font-normal text-[#8A8177]">
                  <span className="text-xl font-medium text-[#241E1A]">{avgQuality}</span>
                  %
                </div>
                <p className="text-[10px] font-sans font-normal text-[#8A8177]">
                  {lang === 'RU' ? 'без замечаний' : 'no issues'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: DURATION BY ROOMS PROGRESS BARS */}
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase">
              {lang === 'RU' ? 'ДЛИТЕЛЬНОСТЬ ПО НОМЕРАМ' : 'DURATION BY ROOMS'}
            </h3>
            <span className="text-[10px] text-[#8A8177] font-sans font-normal">
              {lang === 'RU' ? 'норма 25 мин' : 'standard 25 min'}
            </span>
          </div>
          
          <div className="bg-white rounded-[14px] border border-[#E5E2DD] p-5 shadow-2xs space-y-4">
            {roomChartData.map((data, index) => {
              const norm = 25;
              // Scale max width of bar to 35 minutes to leave padding space
              const widthPct = Math.min(100, (data.minutes / 35) * 100);
              const barColor = data.minutes > norm ? 'bg-[#B3261E]' : 'bg-[#C2410C]';

              return (
                <div key={index} className="flex items-center gap-3.5 text-xs font-sans">
                  <span className="w-11 text-[#241E1A] font-normal shrink-0">
                    {lang === 'RU' ? `№ ${data.room}` : `#${data.room}`}
                  </span>
                  
                  {/* Progress Bar Container */}
                  <div className="flex-1 h-2 bg-[#E5E2DD]/40 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>

                  <span className="w-12 text-right text-[#241E1A] font-normal shrink-0">
                    {data.minutes} {lang === 'RU' ? 'мин' : 'min'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: SHIFT HISTORY */}
        <div className="space-y-2 text-left">
          <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
            {lang === 'RU' ? 'ИСТОРИЯ СМЕН' : 'SHIFT HISTORY'}
          </h3>

          <div className="bg-white rounded-[14px] border border-[#E5E2DD] overflow-hidden divide-y divide-[#E5E2DD]/50 shadow-2xs">
            {shiftHistory.map((item) => {
              const isExpanded = expandedShiftId === item.id;
              return (
                <div key={item.id} className="flex flex-col">
                  {/* Trigger Header */}
                  <div 
                    className="p-4 hover:bg-[#FAF7F3]/40 transition-colors flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedShiftId(isExpanded ? null : item.id)}
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-sans font-normal text-[#241E1A]">
                        {item.date}
                      </h4>
                      <p className="text-[10px] text-[#8A8177] font-sans font-normal">
                        {lang === 'RU' 
                          ? `${item.roomsCleaned} номеров · ${item.avgTimePerRoom || '22 мин'} в среднем`
                          : `${item.roomsCleaned} rooms · ${item.avgTimePerRoom || '22 min'} avg`}
                      </p>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-[#8A8177] shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 bg-[#FAF7F3]/30 border-t border-[#E5E2DD]/20 space-y-3.5 text-left font-sans">
                      <div className="grid grid-cols-3 gap-2 pt-3 text-[10px] text-[#8A8177]">
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-[#8A8177] mb-0.5">{lang === 'RU' ? 'Качество' : 'Quality'}</span>
                          <span className="font-sans font-medium text-[#241E1A] text-xs">{item.qualityScore}%</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-[#8A8177] mb-0.5">{lang === 'RU' ? 'Комнат' : 'Rooms'}</span>
                          <span className="font-sans font-medium text-[#241E1A] text-xs">{item.roomsCleaned}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase tracking-wider text-[#8A8177] mb-0.5">{lang === 'RU' ? 'Часов' : 'Hours'}</span>
                          <span className="font-sans font-medium text-[#241E1A] text-xs">{item.hoursWorked} {lang === 'RU' ? 'ч.' : 'hrs'}</span>
                        </div>
                      </div>

                      {item.notes && (
                        <div className="bg-[#FAF7F3] p-3 rounded-xl border border-[#E5E2DD] text-[10px] text-[#8A8177] italic font-sans font-normal">
                          "{lang === 'RU' ? item.notesRu : item.notes}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
