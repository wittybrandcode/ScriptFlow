import React from 'react';
import { Camera, Mic, Type, Layers } from 'lucide-react';

export interface ProductionTypeBreakdown {
  shot: number;
  audio: number;
  textOnScreen: number;
  directorNote: number;
}

export interface ProductionDensityWidgetProps {
  prodBreakdown: ProductionTypeBreakdown;
  totalProduction: number;
}

export const ProductionDensityWidget: React.FC<ProductionDensityWidgetProps> = ({
  prodBreakdown,
  totalProduction,
}) => {
  const total = totalProduction || 1;
  const items = [
    { label: 'لقطات كاميرا (SHOT)', count: prodBreakdown.shot, icon: Camera, color: 'bg-emerald-500 text-emerald-500' },
    { label: 'مؤثرات صوتية (AUDIO)', count: prodBreakdown.audio, icon: Mic, color: 'bg-amber-500 text-amber-500' },
    { label: 'نصوص شاشة (TEXT)', count: prodBreakdown.textOnScreen, icon: Type, color: 'bg-indigo-500 text-indigo-500' },
    { label: 'ملاحظات إخراجية', count: prodBreakdown.directorNote, icon: Layers, color: 'bg-rose-500 text-rose-500' },
  ];

  return (
    <section className="bg-card border border-border rounded-2xl p-6 shadow-xs">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
          <Camera size={24} />
        </div>
        <div>
          <h2 className="font-black text-xl">كثافة عناصر الإنتاج</h2>
          <p className="text-xs text-muted-foreground font-medium">توزيع الكتل الإنتاجية المسجلة في السيناريو الكامل</p>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => {
          const pct = Math.round((item.count / total) * 100);
          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-foreground">
                  <item.icon size={14} className={item.color.split(' ')[1]} />
                  {item.label}
                </span>
                <span className="tabular-nums text-muted-foreground">{item.count} ({pct}%)</span>
              </div>
              <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${item.color.split(' ')[0]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ProductionDensityWidget;
