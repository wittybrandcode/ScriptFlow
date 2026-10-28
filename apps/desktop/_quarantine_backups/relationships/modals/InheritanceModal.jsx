import React from 'react';
import { Scale, X, ScrollText, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLORS } from '../../utils/relationColors';

export default function InheritanceModal({ inheritanceResult, characters, partner1, onClose }) {
  if (!inheritanceResult) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
              <Scale size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">المسألة الإرثية</h2>
              <p className="text-xs text-muted-foreground font-medium">وفاة {characters?.find(c => String(c.id) === String(partner1))?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
            <div className="text-emerald-500 text-sm font-bold flex items-center gap-2 mb-1">
              <ScrollText size={16} /> أصل المسألة (Base)
            </div>
            <div className="text-3xl font-black text-foreground">{inheritanceResult.base}</div>
          </div>
          
          <h3 className="text-sm font-bold text-muted-foreground mb-3 px-1">الورثة والنصيب</h3>
          <div className="flex flex-col gap-2">
            {inheritanceResult.shares.map((share, idx) => {
              const personName = characters?.find(c => String(c.id) === share.heirId)?.name || share.heirId;
              const isExcluded = share.share === 0;
              return (
                <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border ${isExcluded ? 'bg-muted/30 border-border/50 opacity-60' : 'bg-background border-border hover:border-primary/30 transition-colors shadow-sm'}`}>
                  <div className="flex items-center gap-3">
                     <div className="w-4 h-4 rounded-full" style={{ backgroundColor: isExcluded ? '#888' : COLORS[idx % COLORS.length] }}></div>
                     <div className="flex flex-col gap-1">
                       <span className={`font-bold ${isExcluded ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                         {personName}
                       </span>
                       <span className="text-xs text-muted-foreground">{share.relationAr}</span>
                     </div>
                  </div>
                  <div className="text-left">
                    {isExcluded ? (
                      <span className="text-xs font-bold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-md flex items-center gap-1.5"><Trash2 size={12}/> مُحجوب</span>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-black text-primary">{share.share} <span className="text-xs font-normal text-muted-foreground">سهم</span></span>
                        <span className="text-[10px] text-muted-foreground font-bold">بنسبة {((share.share / inheritanceResult.base) * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {inheritanceResult.shares.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm font-bold">لا يوجد ورثة مستحقون بناءً على البيانات المتوفرة.</div>
            )}
          </div>

          {/* Pie Chart Visualization */}
          {inheritanceResult.shares.filter(s => s.share > 0).length > 0 && (
            <div className="mt-8 pt-6 border-t border-border flex flex-col items-center">
              <h3 className="text-sm font-bold text-muted-foreground mb-4 w-full px-1">التمثيل البصري للتركة</h3>
              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inheritanceResult.shares.filter(s => s.share > 0).map(s => ({
                        name: characters?.find(c => String(c.id) === s.heirId)?.name || s.heirId,
                        value: s.share
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {inheritanceResult.shares.filter(s => s.share > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} سهم`, 'النصيب']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
