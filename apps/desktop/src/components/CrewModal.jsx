import React, { useState, useEffect, useRef } from 'react';
import { X, User, Briefcase, Phone, Mail, Image as ImageIcon, AlignLeft, ShieldCheck, Upload, Loader2, Users } from 'lucide-react';
import { useCharactersQuery } from '../hooks/queries';
import { useUIStore } from '../store/useUIStore';
import { useScenarioQuery, useScenarioStatsQuery } from '../hooks/queries/useScenarios';

export default function CrewModal({ member, activeTab, onClose, onSubmit }) {
  const fileInputRef = useRef(null);
  const { activeScenarioId } = useUIStore();
  const { data: characters = [] } = useCharactersQuery(activeScenarioId);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: activeTab === 'CAST' ? '' : '',
    category: activeTab || 'TECHNICAL',
    custom_role: '', // for OTHER category
    job_title: '',
    phone: '',
    email: '',
    contract_status: 'PENDING',
    image_url: '',
    employment_type: 'FREELANCE',
    wage: 0,
    currency: 'DZD',
    payment_status: 'UNPAID',
    notes: '',
    assigned_characters: []
  });

  useEffect(() => {
    if (member) {
      // Check if the role is a predefined one, otherwise it's a custom role set to OTHER
      const isPredefined = ['DIRECTOR', 'PRODUCTION', 'CAMERA', 'LIGHTING', 'SOUND', 'ART', 'WARDROBE', 'MAKEUP', 'POST'].includes(member.role);
      
      setFormData({
        name: member.name || '',
        role: isPredefined ? member.role : 'OTHER',
        category: member.category || activeTab || 'TECHNICAL',
        custom_role: isPredefined ? '' : (member.role || ''),
        job_title: member.job_title || '',
        phone: member.phone || '',
        email: member.email || '',
        contract_status: member.contract_status || 'PENDING',
        image_url: member.image_url || '',
        employment_type: member.employment_type || 'FREELANCE',
        wage: member.wage || 0,
        currency: member.currency || 'DZD',
        payment_status: member.payment_status || 'UNPAID',
        notes: member.notes || '',
        assigned_characters: characters.filter(c => c.actor_id === member.id).map(c => c.id)
      });
    }
  }, [member, characters]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = { ...formData };
    if (finalData.role === 'OTHER' && finalData.custom_role.trim() !== '') {
      finalData.role = finalData.custom_role; // Save the custom role into the main role field
    }
    delete finalData.custom_role; // Clean up before sending
    onSubmit(finalData);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const base64Url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      setFormData(prev => ({ ...prev, image_url: base64Url }));
    } catch (err) {
      console.error('Upload error:', err);
      alert('حدث خطأ أثناء قراءة الصورة.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-card w-full max-w-lg rounded-xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground">
                {formData.category === 'CAST' 
                  ? (member ? 'تعديل بيانات الممثل' : 'إضافة ممثل جديد') 
                  : (member ? 'تعديل بيانات العضو' : 'إضافة تقني جديد')}
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                {formData.category === 'CAST' 
                  ? 'أدخل البيانات والتفاصيل الخاصة بالممثل' 
                  : 'أدخل التفاصيل اللوجستية لفرد الطاقم'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Identity & Avatar */}
          <div className="flex gap-4 items-start">
            <div className="shrink-0 flex flex-col items-center gap-2">
               <div className="w-20 h-20 rounded-xl bg-secondary border border-border flex items-center justify-center overflow-hidden relative group">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-muted-foreground/30" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 size={24} className="text-white animate-spin" />
                    </div>
                  )}
               </div>
               <input 
                 type="file" 
                 accept="image/*" 
                 ref={fileInputRef} 
                 onChange={handleImageUpload} 
                 className="hidden" 
               />
               <button 
                 type="button"
                 onClick={() => fileInputRef.current?.click()}
                 disabled={isUploading}
                 className="text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
               >
                 <Upload size={12} />
                 {formData.image_url ? 'تغيير الصورة' : 'رفع صورة'}
               </button>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5"><User size={12}/> الاسم الكامل</label>
                <input 
                  required type="text" value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" 
                  placeholder="مثال: أحمد محمود" 
                />
              </div>
            </div>
          </div>



          {/* Role & Employment */}
          <div className="grid grid-cols-2 gap-4">
            {formData.category !== 'CAST' && (
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5"><Briefcase size={12}/> القسم الرئيسي</label>
                <select 
                  required value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})} 
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">-- اختر القسم --</option>
                <option value="DIRECTOR">الإخراج (Direction)</option>
                <option value="PRODUCTION">الإنتاج (Production)</option>
                <option value="CAMERA">التصوير (Camera & DoP)</option>
                <option value="LIGHTING">الإضاءة (Lighting)</option>
                <option value="SOUND">الصوت (Sound)</option>
                <option value="ART">الديكور (Art Dept)</option>
                <option value="WARDROBE">الملابس (Wardrobe)</option>
                <option value="MAKEUP">المكياج (Makeup)</option>
                <option value="POST">مونتاج (Post-Production)</option>
                <option value="OTHER">أخرى (Other)</option>
              </select>
              {formData.role === 'OTHER' && (
                <input 
                  type="text" 
                  value={formData.custom_role} 
                  onChange={e => setFormData({...formData, custom_role: e.target.value})} 
                  className="w-full px-3 py-2 mt-2 bg-background border border-primary/30 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" 
                  placeholder="اكتب اسم القسم المخصص..." 
                  required
                />
              )}
            </div>
            )}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5"><Briefcase size={12}/> {formData.category === 'CAST' ? 'نوع الدور' : 'المسمى الوظيفي الدقيق'}</label>
              <input 
                type="text" value={formData.job_title} 
                onChange={e => setFormData({...formData, job_title: e.target.value})} 
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none" 
                placeholder="مثال: مخرج مساعد أول، مهندس ديكور..." 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5"><ShieldCheck size={12}/> نوع التعاقد</label>
              <select 
                value={formData.employment_type} 
                onChange={e => setFormData({...formData, employment_type: e.target.value})} 
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="FREELANCE">عمل حر (Freelance)</option>
                <option value="CONTRACTED">متعاقد (Contracted)</option>
                <option value="VOLUNTEER">متطوع (Volunteer)</option>
              </select>
            </div>
          </div>

          {/* Financials Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">الأجر / التسعيرة</label>
              <input 
                type="number" 
                min="0"
                value={formData.wage} 
                onChange={e => setFormData({...formData, wage: parseFloat(e.target.value) || 0})} 
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">العملة</label>
              <select 
                value={formData.currency} 
                onChange={e => setFormData({...formData, currency: e.target.value})} 
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="DZD">DZD (دينار جزائري)</option>
                <option value="USD">USD (دولار أمريكي)</option>
                <option value="EUR">EUR (يورو)</option>
                <option value="GBP">GBP (جنيه إسترليني)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">حالة الدفع</label>
              <select 
                value={formData.payment_status} 
                onChange={e => setFormData({...formData, payment_status: e.target.value})} 
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="UNPAID">غير مدفوع (Unpaid)</option>
                <option value="PARTIAL">دفعة مقدمة (Partial)</option>
                <option value="PAID">مدفوع بالكامل (Paid)</option>
              </select>
            </div>
          </div>

          {/* Characters Assignment (Only for Actors/CAST) */}
          {formData.category === 'CAST' && characters.length > 0 && (
            <div className="bg-secondary/20 p-4 rounded-xl border border-border">
              <label className="block text-xs font-bold text-muted-foreground mb-3 flex items-center gap-1.5">
                <Users size={12}/> ربط الممثل بشخصيات في السيناريو
              </label>
              <div className="flex flex-wrap gap-2">
                {characters.map(char => {
                  const isSelected = formData.assigned_characters.includes(char.id);
                  return (
                    <label 
                      key={char.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${isSelected ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-foreground hover:bg-secondary'}`}
                    >
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, assigned_characters: [...prev.assigned_characters, char.id] }));
                          } else {
                            setFormData(prev => ({ ...prev, assigned_characters: prev.assigned_characters.filter(id => id !== char.id) }));
                          }
                        }}
                      />
                      <div className={`w-3 h-3 rounded flex items-center justify-center border ${isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30 bg-transparent'}`}>
                        {isSelected && <svg viewBox="0 0 14 14" fill="none" className="w-2.5 h-2.5"><path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      {char.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5"><Phone size={12}/> رقم الهاتف</label>
              <input 
                type="text" dir="ltr" value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" 
                placeholder="+123456789" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5"><Mail size={12}/> البريد الإلكتروني</label>
              <input 
                type="email" dir="ltr" value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none" 
                placeholder="crew@example.com" 
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5"><AlignLeft size={12}/> ملاحظات ومعلومات إضافية</label>
            <textarea 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})} 
              className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none" 
              placeholder="مثال: يمتلك كاميرا خاصة، متاح فقط أيام الجمعة..." 
              rows={3}
            />
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
             <button 
               type="button" onClick={onClose} 
               className="px-4 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:bg-secondary transition-all"
             >
               إلغاء
             </button>
             <button 
               type="submit" 
               className="px-6 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-sm"
             >
               {member ? 'حفظ التعديلات' : 'إضافة للفريق'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
