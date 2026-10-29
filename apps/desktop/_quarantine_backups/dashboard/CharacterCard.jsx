import React from 'react';
import { User, Edit3, Trash2, Eye, Maximize2, Phone, Mail, AlertTriangle, MessageSquare, FileText, Film, BarChart3 } from 'lucide-react';
import { resolveMediaUrl } from '../../services/mediaStorage';

const ROLE_COLORS = {
  'بطل رئيسي': { dot: 'bg-indigo-500', text: 'text-indigo-600', bg: 'bg-indigo-50' },
  'بطل مساعد': { dot: 'bg-sky-500', text: 'text-sky-600', bg: 'bg-sky-50' },
  'شرير': { dot: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
  'ثانوي': { dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50' },
  'كومبارس': { dot: 'bg-stone-400', text: 'text-stone-500', bg: 'bg-stone-50' },
};

const STATUS_MAP = {
  'CASTED': { label: 'تم التعاقد', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  'SHORTLISTED': { label: 'مرشح', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  'REPLACED': { label: 'مستبدل', cls: 'bg-red-500/10 text-red-600 border-red-500/20' },
  'SEARCHING': { label: 'جاري البحث', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
};

export default function CharacterCard({ character, onPreview, onOpenFull, onDelete, charStats = {} }) {
  const roleStyle = ROLE_COLORS[character.role] || { dot: 'bg-muted-foreground/40', text: 'text-muted-foreground', bg: 'bg-secondary' };
  const statusInfo = STATUS_MAP[character.status] || STATUS_MAP['SEARCHING'];
  const isIncomplete = !character.role && !character.description;

  const { dialogueCount = 0, wordCount = 0, sceneCount = 0, appearancePercent = 0 } = charStats;

  return (
    <div className="group bg-card border border-border rounded-lg p-4 hover:shadow-lg hover:border-primary/20 transition-all duration-300 relative overflow-hidden">
      
      <div className="flex items-start gap-4">
        {/* Avatar - Bigger */}
        <div className="shrink-0">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary border border-border/50 shadow-sm cursor-pointer" onClick={onOpenFull}>
            {character.actor_photo ? (
              <img 
                src={resolveMediaUrl(character.actor_photo)} 
                alt={character.actor_name} 
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/25 hover:bg-secondary-foreground/5 transition-colors">
                <User size={28} />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Name + Actions */}
          <div className="flex items-center justify-between mb-0.5">
             <h3 className="font-bold text-sm text-foreground truncate cursor-pointer hover:text-primary transition-colors" onClick={onOpenFull}>
               {character.name}
             </h3>
             <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={onPreview} className="p-1 rounded text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10 transition-all" title="معاينة وتعديل سريع">
                   <Eye size={14} />
                </button>
                <button onClick={onOpenFull} className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="فتح الملف الكامل">
                   <Maximize2 size={14} />
                </button>
                <button onClick={onDelete} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" title="حذف">
                   <Trash2 size={14} />
                </button>
             </div>
          </div>

          {/* Row 2: Role + Status + Incomplete */}
          <div className="flex items-center gap-2 mb-2">
             <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${roleStyle.dot} shrink-0`} />
                <span className={`text-xs font-bold ${roleStyle.text}`}>{character.role || 'غير محدد'}</span>
             </div>
             {character.age && <span className="text-[10px] text-muted-foreground">• {character.age}</span>}
             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${statusInfo.cls}`}>
                {statusInfo.label}
             </span>
             {isIncomplete && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                   <AlertTriangle size={10} /> غير مكتمل
                </span>
             )}
          </div>

          {/* Row 3: Actor */}
          {character.actor_name && (
            <div className="text-xs text-muted-foreground mb-2 truncate">
               الممثل: <span className="font-bold text-foreground">{character.actor_name}</span>
            </div>
          )}

          {/* Row 4: Description */}
          {character.description && (
             <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed mb-2">{character.description}</p>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-1.5 text-xs" title="عدد الحوارات">
            <MessageSquare size={13} className="text-indigo-500" />
            <span className="font-bold text-foreground">{dialogueCount}</span>
            <span className="text-muted-foreground text-[10px]">حوار</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" title="عدد الكلمات">
            <FileText size={13} className="text-sky-500" />
            <span className="font-bold text-foreground">{wordCount}</span>
            <span className="text-muted-foreground text-[10px]">كلمة</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs" title="عدد المشاهد">
            <Film size={13} className="text-emerald-500" />
            <span className="font-bold text-foreground">{sceneCount}</span>
            <span className="text-muted-foreground text-[10px]">مشهد</span>
          </div>
          
          {/* Contact icons */}
          <div className="mr-auto flex items-center gap-2">
            {character.phone && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone size={10} /> <span dir="ltr">{character.phone}</span></span>}
            {character.email && <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-[100px]"><Mail size={10} /> {character.email}</span>}
          </div>
        </div>

        {/* Appearance Progress Bar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 shrink-0">
            <BarChart3 size={11} className="text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground">نسبة الظهور</span>
          </div>
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-l from-primary to-indigo-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(appearancePercent, 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-black text-primary shrink-0 w-8 text-left">{appearancePercent}%</span>
        </div>
      </div>
    </div>
  );
}
