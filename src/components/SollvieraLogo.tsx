import React from 'react';

export const SollvieraLogo: React.FC<{ className?: string }> = ({ className = 'h-16 w-16' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#sollviera-sun-clip)">
      <clipPath id="sollviera-sun-clip">
        <circle cx="50" cy="50" r="46" />
      </clipPath>
      {/* 5 sunset horizontal slices with gaps */}
      <rect x="0" y="4" width="100" height="15" fill="#E4762B" />
      <rect x="0" y="22" width="100" height="15" fill="#E4762B" />
      <rect x="0" y="40" width="100" height="15" fill="#C2410C" />
      <rect x="0" y="58" width="100" height="15" fill="#A93A0C" />
      <rect x="0" y="76" width="100" height="20" fill="#881B04" />
    </g>
  </svg>
);

export const SollvieraBrand: React.FC<{ 
  layout?: 'vertical' | 'horizontal';
  logoSize?: string;
  showSubtitle?: boolean;
}> = ({ layout = 'vertical', logoSize = 'h-16 w-16', showSubtitle = true }) => {
  if (layout === 'horizontal') {
    return (
      <div className="flex items-center gap-4">
        <SollvieraLogo className={logoSize} />
        <div className="text-left font-serif">
          <h1 className="text-xl font-medium tracking-[0.2em] text-[#241E1A] leading-none uppercase">
            Sollviera
          </h1>
          {showSubtitle && (
            <p className="text-[7.5px] tracking-[0.25em] text-[#8A8177] uppercase font-sans font-bold mt-1.5 leading-none">
              Property Management System
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center font-serif">
      <SollvieraLogo className={logoSize} />
      <h1 className="text-2xl font-medium tracking-[0.2em] text-[#241E1A] uppercase mt-4 leading-none">
        Sollviera
      </h1>
      {showSubtitle && (
        <p className="text-[8.5px] tracking-[0.25em] text-[#8A8177] uppercase font-sans font-bold mt-2.5 leading-none">
          Property Management System
        </p>
      )}
    </div>
  );
};
