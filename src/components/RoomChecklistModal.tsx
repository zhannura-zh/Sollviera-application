import React, { useState } from 'react';
import { X, CheckSquare, Square, AlertCircle, Clock, User, ShieldCheck, Play, ArrowRight, Sparkles } from 'lucide-react';
import { Language, HotelRoom } from '../types';
import { getTranslation } from '../locales';

interface RoomChecklistModalProps {
  room: HotelRoom | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRoomStatus: (roomId: string, newStatus: HotelRoom['status']) => void;
  onUpdateRoomChecklist: (roomId: string, newChecklist: any[]) => void;
  lang: Language;
}

export const RoomChecklistModal: React.FC<RoomChecklistModalProps> = ({
  room,
  isOpen,
  onClose,
  onUpdateRoomStatus,
  onUpdateRoomChecklist,
  lang,
}) => {
  if (!isOpen || !room) return null;

  const t = getTranslation(lang);

  const [checklist, setChecklist] = useState(room.checklist);

  const toggleItem = (itemId: string) => {
    const updated = checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item));
    setChecklist(updated);
    onUpdateRoomChecklist(room.id, updated);
  };

  const handleCompleteAll = () => {
    const updated = checklist.map((i) => ({ ...i, done: true }));
    setChecklist(updated);
    onUpdateRoomChecklist(room.id, updated);
  };

  const allDone = checklist.every((item) => item.done);

  const handleMarkReady = () => {
    onUpdateRoomStatus(room.id, 'READY');
    onClose();
  };

  const handleStartCleaning = () => {
    onUpdateRoomStatus(room.id, 'IN_PROGRESS');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-3 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header with Geometric Balance theme */}
        <div className="bg-[#0f172a] px-5 py-4 text-white flex items-center justify-between border-b border-[#1e3a8a]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0284c7] font-black text-white shadow-md text-lg">
              {room.roomNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base leading-tight">
                  {lang === 'RU' ? 'Комната' : 'Room'} {room.roomNumber}
                </h3>
                <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-400/30">
                  {t.roomFloorLabel} {room.floor}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">{room.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-slate-50">
          {/* Quick timing & guest badge */}
          <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">{t.checkoutShort} / {t.checkinShort}</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {room.checkoutTime} → {room.checkinTime}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">{t.guestsLabel}</span>
              <p className="font-bold text-slate-800 mt-0.5">
                {room.adults} {t.adultsShort}, {room.children} {t.childrenShort}
              </p>
            </div>
          </div>

          {/* PMS Special Instructions / Notes */}
          {(room.notesEn || room.notesRu) && (
            <div className="rounded-2xl bg-amber-50 p-3.5 border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {t.notesTitle}
              </span>
              <p className="font-medium leading-relaxed">
                {lang === 'RU' ? room.notesRu : room.notesEn}
              </p>
            </div>
          )}

          {/* Task Checklist Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.checklistTitle}
              </span>
              <button
                type="button"
                onClick={handleCompleteAll}
                className="text-[11px] font-bold text-[#0284c7] hover:underline"
              >
                {t.markAllDone}
              </button>
            </div>

            <div className="space-y-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    item.done
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {item.done ? (
                    <CheckSquare className="h-5 w-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="h-5 w-5 text-slate-400 shrink-0" />
                  )}
                  <span className={`text-xs font-semibold ${item.done ? 'line-through text-slate-500' : ''}`}>
                    {lang === 'RU' ? item.textRu : item.textEn}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
          {room.status === 'PENDING' && (
            <button
              type="button"
              onClick={handleStartCleaning}
              className="w-full bg-[#0284c7] hover:bg-[#0369a1] text-white py-3 px-4 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Play className="h-4 w-4" />
              <span>{t.btnStartCleaning}</span>
            </button>
          )}

          {room.status === 'IN_PROGRESS' && (
            <button
              type="button"
              onClick={handleMarkReady}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{t.submitInspection}</span>
            </button>
          )}

          {(room.status === 'READY' || room.status === 'VERIFIED') && (
            <div className="w-full text-center py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
              ✓ {t.roomVerifiedText}
            </div>
          )}

          {room.status === 'PROBLEM' && (
            <button
              type="button"
              onClick={handleStartCleaning}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>{t.btnContinueCleaning}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
