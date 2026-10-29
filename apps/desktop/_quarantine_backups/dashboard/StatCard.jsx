import React from 'react';

/**
 * مكون بطاقة الإحصائيات في لوحة التحكم
 */
export default function StatCard({ icon: Icon, label, value, color, lightBg, textColor }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className={`w-12 h-12 rounded-xl ${lightBg} flex items-center justify-center mb-4`}>
        <Icon size={24} className={textColor} />
      </div>
      <div className="text-2xl font-black text-foreground tabular-nums">{value}</div>
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}
