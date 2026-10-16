import React from 'react';

export interface PageFooterProps {
  scenarioName?: string;
  pageNumber?: number | null;
}

const PageFooter = React.memo(({ scenarioName, pageNumber }: PageFooterProps) => {
  if (pageNumber === undefined || pageNumber === null) return null;
  
  return (
    <div 
      className="absolute left-[96px] right-[96px] select-none flex items-center justify-between text-black font-sans pointer-events-none z-30" 
      style={{ top: '1048px', height: '28px', lineHeight: '28px', fontSize: '13px', boxSizing: 'border-box' }}
    >
      <div className="font-bold text-black">{scenarioName || 'مشروع بدون عنوان'}</div>
      <div className="flex items-center justify-center border-[1.5px] border-black font-bold text-black min-w-[24px] h-[24px] px-1.5 rounded-md text-[13px] bg-white">
        {pageNumber}
      </div>
    </div>
  );
});

export default PageFooter;
