import React from 'react';
import { X, Phone, Mail, Briefcase, ShieldCheck, AlignLeft, User, ClipboardList, CheckCircle2, DollarSign, FileSignature, CreditCard } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../hooks/queries/useScenarios';
import { useCrewAssignmentsQuery } from '../hooks/queries';

export default function CrewPreviewModal({ member, onClose }) {
  const { activeScenarioId } = useUIStore();
  const { data: assignments = [] } = useCrewAssignmentsQuery(activeScenarioId);
  const memberAssignments = assignments?.filter(a => a.crew_id === member?.id) || [];

  if (!member) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div 
        className="bg-card w-full max-w-3xl max-h-[90vh] rounded-2xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row"
        onClick={e => e.stopPropagation()}
      >
        {/* Left/Right Image Section */}
        <div className="md:w-2/5 bg-secondary relative shrink-0">
          {member.image_url ? (
            <img 
              src={member.image_url} 
              alt={member.name} 
              className="w-full h-64 md:h-full object-cover"
            />
          ) : (
            <div className="w-full h-64 md:h-full flex items-center justify-center text-muted-foreground/30">
              <User size={64} />
            </div>
          )}
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 flex flex-col p-6 md:p-8 relative overflow-y-auto">
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 hidden md:flex w-8 h-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary transition-colors z-10"
          >
            <X size={18} />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-black text-foreground mb-3">{member.name}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                <Briefcase size={12} />
                {member.job_title || member.role || 'تخصصات أخرى'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border border-border bg-secondary text-foreground">
                <ShieldCheck size={12} />
                {member.employment_type === 'FREELANCE' ? 'عمل حر (Freelance)' : 
                 member.employment_type === 'CONTRACTED' ? 'متعاقد' : 'متطوع'}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                member.contract_status === 'SIGNED' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                member.contract_status === 'NEGOTIATION' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                'bg-amber-500/10 text-amber-600 border border-amber-500/20'
              }`}>
                <FileSignature size={12} />
                {member.contract_status === 'SIGNED' ? 'عقد موقّع' :
                 member.contract_status === 'NEGOTIATION' ? 'قيد التفاوض' : 'بانتظار التوقيع'}
              </span>
            </div>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20">
            {/* Contact Info Grid */}
            <div className="grid grid-cols-1 gap-4">
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${member.phone ? 'bg-secondary/50 border-border/50' : 'bg-secondary/10 border-border/20 opacity-60'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${member.phone ? 'bg-background text-primary' : 'bg-background/50 text-muted-foreground'}`}>
                  <Phone size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">رقم الهاتف</p>
                  {member.phone ? (
                    <p className="text-sm font-bold text-foreground truncate" dir="ltr">{member.phone}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">غير متوفر</p>
                  )}
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-xl border ${member.email ? 'bg-secondary/50 border-border/50' : 'bg-secondary/10 border-border/20 opacity-60'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${member.email ? 'bg-background text-primary' : 'bg-background/50 text-muted-foreground'}`}>
                  <Mail size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">البريد الإلكتروني</p>
                  {member.email ? (
                    <p className="text-sm font-bold text-foreground truncate" dir="ltr">{member.email}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">غير متوفر</p>
                  )}
                </div>
              </div>
            </div>

            {/* Financial & Contract Info */}
            <div className="pt-2">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-3">
                <FileSignature size={14} className="text-primary" /> تفاصيل التعاقد
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <DollarSign size={12} />
                    <span className="text-[10px] font-bold">الأجر المتفق عليه</span>
                  </div>
                  <p className="text-sm font-black text-foreground">
                    {member.wage && member.wage > 0 ? `${member.wage} ${member.currency || 'USD'}` : 'لم يحدد بعد'}
                  </p>
                </div>
                
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <CreditCard size={12} />
                    <span className="text-[10px] font-bold">حالة الدفع</span>
                  </div>
                  <p className={`text-sm font-black ${member.payment_status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {member.payment_status === 'PAID' ? 'تم الدفع' : 
                     member.payment_status === 'PARTIAL' ? 'دفعة جزئية' : 'معلق'}
                  </p>
                </div>
              </div>
            </div>

            {/* Assignments Summary */}
            <div className="pt-2">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
                <ClipboardList size={14} className="text-primary" /> التكليفات المسندة ({memberAssignments.length})
              </p>
              {memberAssignments.length > 0 ? (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm flex flex-wrap gap-2">
                  {memberAssignments.map(a => (
                    <span key={a.id} className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                      <CheckCircle2 size={10} />
                      {a.scene_id ? `مشهد رقم ${a.scene_id}` : (a.episode_id ? `الحلقة رقم ${a.episode_id}` : 'تكليف عام')}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-secondary/20 border border-dashed border-border flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">لا توجد تكليفات مسندة حالياً</p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="pt-2">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
                <AlignLeft size={14} className="text-primary" /> ملاحظات ومعلومات إضافية
              </p>
              {member.notes ? (
                <div className="p-4 rounded-xl bg-secondary border border-border text-sm text-foreground/90 leading-relaxed min-h-[80px]">
                  {member.notes}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-secondary/20 border border-dashed border-border flex items-center justify-center min-h-[80px]">
                  <p className="text-xs text-muted-foreground">لا توجد ملاحظات مدونة</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
