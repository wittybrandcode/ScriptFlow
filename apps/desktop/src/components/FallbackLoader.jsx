import React from 'react';
import { Loader2 } from 'lucide-react';

export default function FallbackLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-background/50 animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shadow-inner">
          <Loader2 size={24} className="text-primary animate-spin" />
        </div>
        <p className="text-xs font-bold text-muted-foreground animate-pulse">جاري التحميل...</p>
      </div>
    </div>
  );
}
