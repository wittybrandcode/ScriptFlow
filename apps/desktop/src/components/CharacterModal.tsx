import React, { useState, useEffect } from 'react';
import { X, UserPlus, Briefcase, User, ShieldCheck } from 'lucide-react';
import InlineFieldError from './ui/InlineFieldError';
import { useUIStore } from '../store/useUIStore';
import { useCreateCharacterMutation, useUpdateCharacterMutation } from '../hooks/queries';
import { useCrewQuery } from '../hooks/queries';

export interface CharacterItem {
  id: string | number;
  name?: string;
  description?: string;
  color?: string;
  age?: string;
  role?: string;
  actor_id?: string | number | null;
  status?: string;
  gender?: 'MALE' | 'FEMALE';
  birth_date?: string;
  death_date?: string;
  is_deceased?: number | boolean;
  scenario_id?: string | number;
}

export interface CharacterModalProps {
  character?: CharacterItem | null;
  onClose: () => void;
  onCharacterAdded?: (char: any) => void;
  onCharacterUpdated?: (char: any) => void;
}

interface FieldError {
  path: string;
  message: string;
}

export default function CharacterModal({ 
  character, 
  onClose, 
  onCharacterAdded, 
  onCharacterUpdated 
}: CharacterModalProps): React.JSX.Element {
  const isEdit = !!character;
  const activeScenarioId = useUIStore.getState().activeScenarioId;
  const { data: crew = [] } = useCrewQuery(activeScenarioId ? String(activeScenarioId) : null);
  const createMutation = useCreateCharacterMutation();
  const updateMutation = useUpdateCharacterMutation();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    age: '',
    role: '',
    actor_id: '',
    status: 'SEARCHING',
    gender: 'MALE',
    birth_date: '',
    death_date: '',
    is_deceased: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  useEffect(() => {
    if (character) {
      setFormData({
        name: character.name || '',
        description: character.description || '',
        color: character.color || '#6366f1',
        age: character.age || '',
        role: character.role || '',
        actor_id: character.actor_id ? String(character.actor_id) : '',
        status: character.status || 'SEARCHING',
        gender: character.gender || 'MALE',
        birth_date: character.birth_date || '',
        death_date: character.death_date || '',
        is_deceased: character.is_deceased ? 1 : 0
      });
    }
  }, [character]);

  const actors = (crew as any[]).filter(c => c.category === 'CAST');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    const scenarioId = useUIStore.getState().activeScenarioId;
    if (!scenarioId && !isEdit) {
      setError('يجب اختيار مشروع أولاً قبل إضافة شخصيات');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    setFieldErrors([]);
    
    try {
      let data: any;
      if (isEdit && character) {
        data = await updateMutation.mutateAsync({ id: character.id as any, data: formData });
      } else {
        data = await createMutation.mutateAsync({ ...formData, scenario_id: activeScenarioId } as any);
      }

      if (isEdit) {
        onCharacterUpdated?.(data.data);
      } else {
        onCharacterAdded?.(data);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'فشل حفظ الشخصية');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-[2.5rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-border/50 flex items-center justify-between bg-secondary/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <UserPlus size={24} />
            </div>
            <div>
              <h3 className="font-black text-xl text-foreground">
                {isEdit ? 'تعديل بروفايل الشخصية' : 'إضافة شخصية جديدة'}
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                {isEdit ? 'تحديث البيانات الإنتاجية والدرامية' : 'إنشاء سجل شخصية وممثل جديد'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
          
          {/* Section 1: Character (Drama) */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
               <Briefcase size={16} className="text-primary" />
               <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">المؤشرات الدرامية (الشخصية)</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground mr-1">اسم الشخصية في العمل</label>
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="مثال: ليلى، القبطان..."
                  className={`w-full px-5 py-3 border rounded-2xl bg-background text-foreground text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none ${fieldErrors.find(e => e.path === 'name') ? 'border-destructive' : 'border-border'}`}
                />
                <InlineFieldError errors={fieldErrors} fieldName="name" />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-black text-muted-foreground mr-1">نوع الدور</label>
                 <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-5 py-3 border border-border rounded-2xl bg-background text-foreground text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                 >
                    <option value="">غير محدد</option>
                    <option value="بطل رئيسي">بطل رئيسي</option>
                    <option value="بطل مساعد">بطل مساعد</option>
                    <option value="شرير">شرير / خصم</option>
                    <option value="ثانوي">شخصية ثانوية</option>
                    <option value="كومبارس">كومبارس متحدث</option>
                 </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground mr-1">المدى العمري</label>
                  <input
                    name="age"
                    type="text"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="مثال: 25 - 30 سنة"
                    className="w-full px-5 py-3 border border-border rounded-2xl bg-background text-foreground text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground mr-1">لون تمييز الشخصية</label>
                  <div className="flex items-center gap-4 px-4 py-2.5 border border-border rounded-2xl bg-background">
                     <input
                        name="color"
                        type="color"
                        value={formData.color}
                        onChange={handleChange}
                        className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
                     />
                     <span className="text-xs font-mono font-black uppercase text-muted-foreground">{formData.color}</span>
                  </div>
               </div>
            </div>

            {/* ═══ NASAB: Gender, Dates & Life Status ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground mr-1">الجنس</label>
                  <select
                     name="gender"
                     value={formData.gender}
                     onChange={handleChange}
                     className="w-full px-5 py-3 border border-border rounded-2xl bg-background text-foreground text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                  >
                     <option value="MALE">♂ ذكر</option>
                     <option value="FEMALE">♀ أنثى</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground mr-1">تاريخ الميلاد</label>
                  <input
                     name="birth_date"
                     type="text"
                     value={formData.birth_date}
                     onChange={handleChange}
                     placeholder="مثال: 1980"
                     className="w-full px-5 py-3 border border-border rounded-2xl bg-background text-foreground text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-muted-foreground mr-1">حالة الحياة</label>
                  <div className="flex items-center gap-3">
                     <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, is_deceased: prev.is_deceased ? 0 : 1, death_date: prev.is_deceased ? '' : prev.death_date }))}
                        className={`flex-1 px-5 py-3 rounded-2xl border text-sm font-black transition-all ${
                           formData.is_deceased 
                              ? 'bg-red-500/10 border-red-500/40 text-red-400' 
                              : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        }`}
                     >
                        {formData.is_deceased ? '🕊️ متوفى' : '💚 حي'}
                     </button>
                  </div>
               </div>
            </div>

            {formData.is_deceased ? (
               <div className="space-y-2">
                  <label className="text-xs font-black text-red-400 mr-1">تاريخ الوفاة</label>
                  <input
                     name="death_date"
                     type="text"
                     value={formData.death_date}
                     onChange={handleChange}
                     placeholder="مثال: 2020"
                     className="w-full px-5 py-3 border border-red-500/30 rounded-2xl bg-background text-foreground text-sm font-bold focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                  />
               </div>
            ) : null}

            <div className="space-y-2">
               <label className="text-xs font-black text-muted-foreground mr-1">شرح الشخصية (نبذة درامية)</label>
               <textarea
                 name="description"
                 value={formData.description}
                 onChange={handleChange}
                 placeholder="اشرح ملامح الشخصية وتطورها..."
                 rows={3}
                 className="w-full px-5 py-3 border border-border rounded-2xl bg-background text-foreground text-sm leading-relaxed focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
               />
            </div>
          </section>

          {/* Section 2: Actor (Production) */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
               <User size={16} className="text-amber-500" />
               <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">بيانات الممثل والكاستينج</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-xs font-black text-muted-foreground mr-1">الممثل المرشح / المتعاقد</label>
                 <div className="relative">
                    <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <select
                       name="actor_id"
                       value={formData.actor_id}
                       onChange={handleChange}
                       className="w-full pl-10 pr-5 py-3 border border-border rounded-2xl bg-background text-foreground text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all outline-none appearance-none"
                    >
                       <option value="">بدون ممثل (جاري البحث)</option>
                       {actors.map(actor => (
                         <option key={actor.id} value={actor.id}>{actor.name}</option>
                       ))}
                    </select>
                 </div>
                 <p className="text-[10px] text-muted-foreground mr-1">يمكنك إدارة بيانات الممثلين (صورهم، هواتفهم، رواتبهم) من قسم "طاقم العمل".</p>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-black text-muted-foreground mr-1">حالة الكاستينج</label>
                 <div className="relative">
                    <ShieldCheck size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <select
                       name="status"
                       value={formData.status}
                       onChange={handleChange}
                       className="w-full pl-10 pr-5 py-3 border border-border rounded-2xl bg-background text-foreground text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all outline-none appearance-none"
                    >
                       <option value="SEARCHING">🔍 جاري البحث</option>
                       <option value="SHORTLISTED">📋 قائمة الترشيح</option>
                       <option value="CASTED">✅ تم التعاقد</option>
                       <option value="REPLACED">🔄 استبدال</option>
                    </select>
                 </div>
              </div>
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-border/50 flex items-center justify-between bg-card">
           {error && <p className="text-destructive text-xs font-bold animate-pulse">{error}</p>}
           {!error && <div />}
           <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl border border-border bg-secondary/50 text-foreground text-sm font-black hover:bg-secondary transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.name.trim()}
                className="px-10 py-3 rounded-2xl bg-gradient-to-l from-primary to-indigo-500 text-white text-sm font-black shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {loading ? 'جاري الحفظ...' : (isEdit ? 'تحديث البيانات' : 'حفظ الشخصية')}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
