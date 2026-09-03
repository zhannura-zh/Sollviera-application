import React, { useState } from 'react';
import { 
  Package, Search, ChevronRight, ChevronDown, Check, Plus, Minus
} from 'lucide-react';
import { Language, SupplyItem } from '../types';
import { getTranslation } from '../locales';

interface SuppliesScreenProps {
  supplies: SupplyItem[];
  onUpdateSupplyQty: (supplyId: string, diff: number) => void;
  onRequestSupplyRefill: (supplyId: string, qty: number) => void;
  lang: Language;
}

export const SuppliesScreen: React.FC<SuppliesScreenProps> = ({
  supplies,
  onUpdateSupplyQty,
  onRequestSupplyRefill,
  lang,
}) => {
  const t = getTranslation(lang);

  // States
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'LINEN' | 'TOWELS' | 'AMENITIES' | 'CLEANING' | 'MINIBAR'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Local request state map (id -> qty to request)
  const [requestQuantities, setRequestQuantities] = useState<Record<string, number>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleRequestQtyChange = (itemId: string, diff: number) => {
    setRequestQuantities((prev) => {
      const current = prev[itemId] || 0;
      const updated = Math.max(0, current + diff);
      return { ...prev, [itemId]: updated };
    });
  };

  const handleGlobalSubmit = () => {
    let totalRequests = 0;
    supplies.forEach(item => {
      const qty = requestQuantities[item.id] || 0;
      if (qty > 0) {
        onRequestSupplyRefill(item.id, qty);
        totalRequests += qty;
      }
    });

    if (totalRequests === 0) return;

    setRequestQuantities({});
    setSuccessMessage(lang === 'RU' ? 'Запрос отправлен!' : 'Request sent!');
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const getCategoryTitle = (cat: string) => {
    switch (cat) {
      case 'LINEN': return t.categoryLinenLabel;
      case 'TOWELS': return t.categoryTowelsLabel;
      case 'AMENITIES': return t.categoryAmenitiesLabel;
      case 'MINIBAR': return lang === 'RU' ? 'Мини-бар' : 'Minibar';
      default: return t.categoryCleaningLabel;
    }
  };

  const filteredSupplies = (
    selectedCategory === 'ALL'
      ? supplies
      : supplies.filter(s => s.category === selectedCategory)
  ).filter(s => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.nameEn.toLowerCase().includes(q) ||
      s.nameRu.toLowerCase().includes(q)
    );
  });

  // Grouped by categories
  const groupedSupplies: Record<string, SupplyItem[]> = {};
  filteredSupplies.forEach(item => {
    if (!groupedSupplies[item.category]) {
      groupedSupplies[item.category] = [];
    }
    groupedSupplies[item.category].push(item);
  });

  const lowNormCount = supplies.filter(s => s.trolleyQty / s.neededQty < 0.7).length;
  const totalItemsToRequest = Object.keys(requestQuantities).reduce<number>((acc, key) => acc + (requestQuantities[key] || 0), 0);

  return (
    <div className="w-full bg-[#FAF7F3] h-full overflow-hidden flex flex-col font-sans">
      
      {/* 1. HEADER */}
      <div className="bg-[#FAF7F3] px-5 pt-7 pb-4 space-y-3.5 shrink-0">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-serif font-medium text-[#241E1A] leading-tight">
            {t.suppliesTitle}
          </h1>
          <p className="text-xs font-sans font-normal text-[#8A8177]">
            {lang === 'RU' ? 'Тележка' : 'Housekeeping Cart'}{' '}
            {lowNormCount > 0 && (
              <>
                {' · '}
                <span className="text-[#B3261E] font-medium">
                  {lowNormCount} {lang === 'RU' ? 'позиции ниже нормы' : 'items low on stock'}
                </span>
              </>
            )}
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'RU' ? 'Поиск по названию' : 'Search by name'}
            className="w-full bg-white border border-[#E5E2DD] rounded-xl pl-9 pr-3 py-2 text-xs text-[#241E1A] placeholder-[#8A8177]/80 focus:outline-none focus:ring-1 focus:ring-[#C2410C] font-sans font-normal h-10 shadow-2xs"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#8A8177]" />
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
          {(['ALL', 'LINEN', 'TOWELS', 'AMENITIES', 'CLEANING', 'MINIBAR'] as const).map((cat) => {
            const isSelected = selectedCategory === cat;
            const label = cat === 'ALL' ? (lang === 'RU' ? 'Все' : 'All') : getCategoryTitle(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-sans font-normal border whitespace-nowrap cursor-pointer transition-all ${
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
      </div>

      {/* 2. BODY CONTENT */}
      <div className="px-5 pb-5 space-y-5 flex-1 overflow-y-auto no-scrollbar">
        
        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <div className="bg-[#FFFDF5] rounded-xl border border-[#FDE68A] p-3.5 text-xs font-sans font-normal text-[#241E1A] flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-300 shadow-2xs">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* GROUPED LIST OF SUPPLIES */}
        {Object.keys(groupedSupplies).map((cat) => {
          const items = groupedSupplies[cat];
          return (
            <div key={cat} className="space-y-2">
              <h3 className="text-[10px] text-[#8A8177] font-sans font-normal tracking-widest uppercase px-1">
                {getCategoryTitle(cat)}
              </h3>

              <div className="bg-white rounded-[14px] border border-[#E5E2DD] overflow-hidden shadow-2xs divide-y divide-[#E5E2DD]/50">
                {items.map((item) => {
                  const stockPercent = Math.min(100, Math.round((item.trolleyQty / item.neededQty) * 100));
                  const isLow = item.trolleyQty / item.neededQty < 0.7;
                  const reqQty = requestQuantities[item.id] || 0;

                  return (
                    <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                      {/* Left side: name and progress bar */}
                      <div className="flex-1 min-w-0 space-y-3.5">
                        <span className="text-xs font-sans font-normal text-[#241E1A] leading-snug truncate block">
                          {lang === 'RU' ? item.nameRu : item.nameEn}
                        </span>
                        
                        {/* Visual progress bar */}
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-[#B3261E]' : 'bg-[#5B8C6E]'}`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Right side: stock ratio and counter box */}
                      <div className="shrink-0 flex flex-col items-end space-y-2">
                        {/* Stock ratio */}
                        <span className="text-xs font-sans font-normal leading-none pt-0.5">
                          <span className={isLow ? 'text-[#B3261E] font-medium' : 'text-[#241E1A]'}>
                            {item.trolleyQty}
                          </span>
                          <span className="text-[#8A8177]"> / {item.neededQty}</span>
                        </span>

                        {/* Counter box if low */}
                        {isLow && (
                          <div className="flex items-center bg-white border border-[#E5E2DD] rounded-xl px-1 py-0.5 text-xs h-7">
                            <button
                              type="button"
                              onClick={() => handleRequestQtyChange(item.id, -1)}
                              className="h-5 w-5 text-[#8A8177] hover:text-[#241E1A] font-bold flex items-center justify-center cursor-pointer transition-colors"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-sans font-normal text-xs text-[#241E1A]">
                              {reqQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRequestQtyChange(item.id, 1)}
                              className="h-5 w-5 text-[#8A8177] hover:text-[#241E1A] font-bold flex items-center justify-center cursor-pointer transition-colors"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. GLOBAL BATCH REQUEST SUBMISSION BUTTON */}
      {totalItemsToRequest > 0 && (
        <div className="p-5 bg-white border-t border-[#E5E2DD]/60 shrink-0">
          <button
            onClick={handleGlobalSubmit}
            className="w-full bg-[#C2410C] hover:bg-[#A93A0C] text-white py-3.5 px-4 rounded-xl text-sm font-sans font-medium text-center cursor-pointer shadow-xs transition-all active:scale-98"
          >
            <span>
              {lang === 'RU' 
                ? `Запросить пополнение · ${totalItemsToRequest} шт` 
                : `Request replenishment · ${totalItemsToRequest} pcs`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
