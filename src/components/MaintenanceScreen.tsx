import React, { useState } from 'react';
import { 
  Wrench, AlertTriangle, Send, Camera, Clock, 
  CheckCircle, Play, ChevronDown, Check
} from 'lucide-react';
import { Language, MaintenanceRequest, MaintenanceCategory, MaintenancePriority } from '../types';
import { getTranslation } from '../locales';

interface MaintenanceScreenProps {
  activeRoomNumber: string;
  maintenanceRequests: MaintenanceRequest[];
  onSubmitRequest: (request: Omit<MaintenanceRequest, 'id' | 'timestamp' | 'status'>) => void;
  lang: Language;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  activeRoomNumber,
  maintenanceRequests,
  onSubmitRequest,
  lang,
}) => {
  const t = getTranslation(lang);

  // Form State
  const [roomNumber, setRoomNumber] = useState<string>(activeRoomNumber || '');
  const [category, setCategory] = useState<MaintenanceCategory>('PLUMBING');
  const [priority, setPriority] = useState<MaintenancePriority>('MEDIUM');
  const [description, setDescription] = useState<string>('');
  const [blocksCleaning, setBlocksCleaning] = useState<boolean>(false);
  
  // Simulation states
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const handleAddPhoto = () => {
    if (photoUrl) {
      setPhotoUrl('');
    } else {
      setPhotoUrl('https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=300&auto=format&fit=crop&q=80');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onSubmitRequest({
      roomNumber,
      category,
      priority,
      description,
      blocksCleaning,
      photoUrl: photoUrl || undefined,
    });

    // Reset Form
    setDescription('');
    setPhotoUrl('');
    setBlocksCleaning(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const getCategoryLabel = (cat: MaintenanceCategory) => {
    switch (cat) {
      case 'PLUMBING': return t.categoryPlumbing;
      case 'ELECTRICAL': return t.categoryElectrical;
      case 'FURNITURE': return t.categoryFurniture;
      case 'APPLIANCES': return t.categoryAppliances;
      case 'CLEANLINESS': return t.categoryCleanliness;
      default: return t.categoryOther;
    }
  };

  const getPriorityLabel = (prio: MaintenancePriority) => {
    switch (prio) {
      case 'LOW': return t.priorityLow;
      case 'MEDIUM': return t.priorityMedium;
      case 'HIGH': return t.priorityHigh;
      case 'CRITICAL': return t.priorityCritical;
    }
  };

  // Stats calculation
  const activeCount = maintenanceRequests.filter(r => r.status !== 'RESOLVED').length;
  const blockingCount = maintenanceRequests.filter(r => r.status !== 'RESOLVED' && r.blocksCleaning).length;

  return (
    <div className="w-full bg-[#FAF7F3] h-full overflow-hidden flex flex-col font-sans">
      
      {/* 1. HEADER */}
      <div className="bg-[#FAF7F3] px-5 pt-7 pb-4 space-y-1.5 shrink-0">
        <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight">
          {lang === 'RU' ? 'Техслужба' : 'Maintenance'}
        </h1>
        <p className="text-xs font-sans font-normal text-[#8A8177]">
          <span className="text-[#241E1A] font-medium">{activeCount}</span>{' '}
          {lang === 'RU' ? 'заявки в работе' : 'active tickets'}
          {blockingCount > 0 && (
            <>
              {' · '}
              <span className="text-[#B3261E] font-medium">
                {blockingCount} {lang === 'RU' ? 'блокирует уборку' : 'blocking cleaning'}
              </span>
            </>
          )}
        </p>
      </div>

      {/* 2. MAIN SCROLL BODY */}
      <div className="px-5 pb-5 space-y-4 flex-1 overflow-y-auto no-scrollbar">
        
        {/* SUCCESS NOTIFICATION */}
        {showSuccess && (
          <div className="bg-[#FFFDF5] rounded-xl border border-[#FDE68A] p-3.5 text-xs font-sans font-normal text-[#241E1A] flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xs">
            <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
            <span>
              {lang === 'RU' 
                ? 'Заявка успешно отправлена!' 
                : 'Repair ticket submitted successfully!'}
            </span>
          </div>
        )}

        {/* 2A. SUBMISSION FORM */}
        <div className="space-y-2">
          <h2 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
            {lang === 'RU' ? 'НОВАЯ ЗАЯВКА' : 'NEW REQUEST'}
          </h2>

          <form onSubmit={handleSubmit} className="bg-white rounded-[14px] border border-[#E5E2DD] p-4 shadow-2xs space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              {/* Room # */}
              <div className="space-y-1">
                <label className="block text-[10px] text-[#8A8177] font-sans font-normal uppercase">
                  {t.roomNumberLabel}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 304"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full bg-[#FAF7F3]/35 border border-[#E5E2DD] rounded-xl px-3 py-2 text-xs font-sans font-normal text-[#241E1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C2410C] h-10 transition-colors"
                />
              </div>

              {/* Categories */}
              <div className="space-y-1">
                <label className="block text-[10px] text-[#8A8177] font-sans font-normal uppercase">
                  {lang === 'RU' ? 'Категория' : 'Category'}
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MaintenanceCategory)}
                    className="w-full bg-[#FAF7F3]/35 border border-[#E5E2DD] rounded-xl pl-3 pr-8 py-2 text-xs font-sans font-normal text-[#241E1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C2410C] h-10 cursor-pointer appearance-none transition-colors"
                  >
                    {(['PLUMBING', 'ELECTRICAL', 'FURNITURE', 'APPLIANCES', 'CLEANLINESS', 'OTHER'] as const).map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-[#8A8177] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="block text-[10px] text-[#8A8177] font-sans font-normal uppercase">
                {lang === 'RU' ? 'Приоритет' : 'Priority'}
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-[9px]">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((prio) => (
                  <button
                    key={prio}
                    type="button"
                    onClick={() => setPriority(prio)}
                    className={`py-2 rounded-xl text-[11px] font-sans font-normal border transition-all cursor-pointer ${
                      priority === prio
                        ? 'bg-[#241E1A] text-white border-[#241E1A]'
                        : 'bg-white text-[#8A8177] border-[#E5E2DD] hover:bg-[#FAF7F3]/40'
                    }`}
                  >
                    {getPriorityLabel(prio)}
                  </button>
                ))}
              </div>
            </div>

            {/* Blocks Cleaning Toggle */}
            <div className="border-t border-[#E5E2DD]/50 pt-3.5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-[#241E1A] font-sans font-normal">
                  {t.blocksCleaningLabel}
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => setBlocksCleaning(!blocksCleaning)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer outline-none ${
                  blocksCleaning ? 'bg-[#C2410C]' : 'bg-[#E5E2DD]'
                }`}
              >
                <span
                  className={`block w-4.5 h-4.5 rounded-full bg-white transition-transform absolute top-0.75 left-0.75 shadow-xs ${
                    blocksCleaning ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Text Description */}
            <div className="border-t border-[#E5E2DD]/50 pt-3.5">
              <textarea
                rows={3}
                placeholder={lang === 'RU' ? 'Опишите проблему' : 'Describe defect'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#FAF7F3]/35 border border-[#E5E2DD] rounded-xl p-3 text-xs font-sans font-normal text-[#241E1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C2410C] resize-none h-20 placeholder-[#8A8177]/80"
              />
            </div>

            {/* Photo upload action button / preview */}
            <div className="pt-1">
              {photoUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-[#E5E2DD] h-24 bg-slate-100">
                  <img src={photoUrl} alt="preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-slate-900/60 text-white font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-slate-900/80 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="w-full py-2.5 px-3 border border-[#E5E2DD] rounded-xl flex items-center justify-center gap-2 text-[10px] font-sans font-normal uppercase tracking-wider text-[#8A8177] bg-[#FAF7F3] cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <Camera className="h-4 w-4 shrink-0 text-[#8A8177]" />
                  <span>{lang === 'RU' ? 'Добавить фото' : 'Add photo'}</span>
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white py-3.5 px-4 rounded-xl text-xs font-sans font-normal flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs cursor-pointer"
            >
              <span>{lang === 'RU' ? 'Отправить заявку' : 'Submit Ticket'}</span>
            </button>
          </form>
        </div>

        {/* 2B. TICKET ARCHIVE / LOGS LIST */}
        <div className="space-y-2">
          <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
            {lang === 'RU' ? 'ИСТОРИЯ ЗАЯВОК' : 'TICKET HISTORY'}
          </h3>

          {maintenanceRequests.length === 0 ? (
            <div className="bg-white rounded-[14px] border border-[#E5E2DD] p-8 text-center text-[#8A8177] space-y-2 shadow-2xs">
              <Wrench className="h-8 w-8 mx-auto text-[#8A8177]/40" />
              <p className="text-xs font-sans font-normal">{lang === 'RU' ? 'Нет активных заявок' : 'No active reported tickets'}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {maintenanceRequests.map((req) => {
                const isBlocked = req.blocksCleaning && req.status !== 'RESOLVED';
                return (
                  <div 
                    key={req.id} 
                    className="bg-white rounded-[14px] border border-[#E5E2DD] p-3.5 relative overflow-hidden flex flex-col gap-1.5 shadow-2xs"
                  >
                    {/* Left red vertical indicator line if it blocks cleaning */}
                    {isBlocked && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#B3261E]" />
                    )}

                    {/* Top row: Room #, badge, status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-sans font-medium text-[#241E1A]">№ {req.roomNumber}</span>
                        
                        {isBlocked && (
                          <span className="bg-[#B3261E]/10 text-[#B3261E] text-[8px] font-sans font-medium px-1.5 py-0.2 rounded tracking-wide uppercase">
                            {lang === 'RU' ? 'БЛОКИРУЕТ' : 'BLOCKS'}
                          </span>
                        )}
                      </div>

                      <span className="text-xs font-sans font-normal text-[#8A8177]">
                        {req.status === 'CREATED' ? (lang === 'RU' ? 'создана' : 'created') :
                         req.status === 'IN_PROGRESS' ? (lang === 'RU' ? 'в работе' : 'in progress') :
                         (lang === 'RU' ? 'решено' : 'resolved')}
                      </span>
                    </div>

                    {/* Bottom Details Row */}
                    <div className="text-[11px] font-sans font-normal text-[#8A8177] flex items-center flex-wrap gap-1 leading-normal">
                      <span>{getCategoryLabel(req.category)}</span>
                      <span>·</span>
                      <span className="text-[#241E1A]">{req.description}</span>
                      <span>·</span>
                      <span>{req.timestamp}</span>
                    </div>

                    {/* Attachments if any */}
                    {req.photoUrl && (
                      <div className="mt-1">
                        <img src={req.photoUrl} alt="defect" className="h-10 w-16 object-cover rounded border border-[#E5E2DD]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
