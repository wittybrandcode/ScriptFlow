import React, { useState, useEffect } from 'react';
import { X, Upload, MapPin, Info, Home, Globe, Map, Phone, Trash2, CheckCircle2, FileText, Image as ImageIcon, Lightbulb } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import InteractiveMapPicker from './InteractiveMapPicker';
import { useLocationsQuery, useCreateLocationMutation, useUpdateLocationMutation } from '../hooks/queries/useLocations';
import { useToast } from '../hooks/useToast';
import { generateId } from '@scriptflow/core';
import InlineFieldError from './ui/InlineFieldError';
import { resolveMediaUrl, saveMediaFile } from '../services/mediaStorage';

export interface LocationImageItem {
  url?: string;
  image_url?: string;
  is_primary?: boolean;
}

export interface LocationItem {
  id: string | number;
  name?: string;
  type?: 'INT' | 'EXT';
  address?: string;
  description?: string;
  status?: string;
  image?: string;
  images?: LocationImageItem[];
  map_url?: string;
  latitude?: number | null;
  longitude?: number | null;
  contact_name?: string;
  contact_phone?: string;
  permit_status?: string;
  cost_per_day?: string | number;
  cost_currency?: string;
  technical_notes?: string;
  parent_location_id?: string | number | null;
  scenario_id?: string | number;
}

export interface LocationModalProps {
  location?: LocationItem | null;
  onClose: () => void;
  onLocationAdded?: (loc: any) => void;
  onLocationUpdated?: (loc: any) => void;
}

interface FieldError {
  path: string;
  message: string;
}

export default function LocationModal({ 
  location, 
  onClose, 
  onLocationAdded, 
  onLocationUpdated 
}: LocationModalProps): React.JSX.Element {
  const { activeScenarioId } = useUIStore();
  const { data: locations = [] } = useLocationsQuery(activeScenarioId ? String(activeScenarioId) : null);
  const createMutation = useCreateLocationMutation();
  const updateMutation = useUpdateLocationMutation();
  
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'images' | 'logistics'>('basic');
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  const [formData, setFormData] = useState({
    name: '', 
    type: 'INT' as 'INT' | 'EXT', 
    address: '', 
    description: '', 
    status: 'AVAILABLE',
    images: [] as LocationImageItem[], 
    map_url: '', 
    latitude: null as number | null, 
    longitude: null as number | null, 
    contact_name: '', 
    contact_phone: '', 
    permit_status: 'NOT_REQUIRED', 
    cost_per_day: '', 
    cost_currency: 'USD', 
    technical_notes: '', 
    parent_location_id: ''
  });

  const availableParents = (locations as any[]).filter(loc => loc.id !== location?.id && !loc.parent_location_id);

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || '',
        type: location.type || 'INT',
        address: location.address || '',
        description: location.description || '',
        status: location.status || 'AVAILABLE',
        images: location.images || (location.image ? [{ url: location.image, is_primary: true }] : []),
        map_url: location.map_url || '',
        latitude: location.latitude || null,
        longitude: location.longitude || null,
        contact_name: location.contact_name || '',
        contact_phone: location.contact_phone || '',
        permit_status: location.permit_status || 'NOT_REQUIRED',
        cost_per_day: location.cost_per_day ? String(location.cost_per_day) : '',
        cost_currency: location.cost_currency || 'USD',
        technical_notes: location.technical_notes || '',
        parent_location_id: location.parent_location_id ? String(location.parent_location_id) : ''
      });
    }
  }, [location]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setLoading(true);
    const uploadedImages = [...formData.images];
    const hasPrimary = uploadedImages.some(img => img.is_primary);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `loc_${Date.now()}_${i}.${ext}`;
        const mediaUri = await saveMediaFile(activeScenarioId ? String(activeScenarioId) : 'shared', fileName, file);
        
        // First uploaded image becomes primary if none exists
        uploadedImages.push({ 
          url: mediaUri,
          image_url: mediaUri,
          is_primary: (!hasPrimary && i === 0) 
        });
      }
      
      setFormData({ ...formData, images: uploadedImages });
      showToast(`تم رفع ${files.length} صورة بنجاح`, 'success');
    } catch {
      showToast('فشل رفع بعض الصور', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newImages = formData.images.filter((_, idx) => idx !== indexToRemove);
    if (newImages.length > 0 && !newImages.some(img => img.is_primary)) {
      newImages[0].is_primary = true;
    }
    setFormData({ ...formData, images: newImages });
  };

  const setPrimaryImage = (indexToSet: number) => {
    const newImages = formData.images.map((img, idx) => ({
      ...img,
      is_primary: idx === indexToSet
    }));
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFieldErrors([{ path: 'name', message: 'اسم الموقع مطلوب' }]);
      setActiveTab('basic');
      return;
    }

    setFieldErrors([]);
    setLoading(true);
    try {
      const payload = {
        ...formData,
        image: formData.images.find(img => img.is_primary)?.url || formData.images[0]?.url || ''
      };

      if (location) {
        const updatedLoc: any = await updateMutation.mutateAsync({ id: location.id as any, data: payload });
        showToast('تم تحديث الموقع بنجاح', 'success');
        onLocationUpdated?.(updatedLoc.data);
      } else {
        const newLoc: any = await createMutation.mutateAsync({ 
          ...payload, 
          scenario_id: activeScenarioId, 
          id: generateId('loc') 
        } as any);
        showToast('تم إضافة الموقع إلى المكتبة', 'success');
        onLocationAdded?.(newLoc);
      }
      onClose();
    } catch {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-xl bg-black/40 animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-3xl rounded-[3rem] border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="p-8 border-b border-border flex items-center justify-between bg-secondary/20">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
              <MapPin size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black">{location ? 'تعديل بيانات الموقع' : 'إضافة موقع جديد'}</h2>
              <p className="text-xs text-muted-foreground font-bold mt-0.5">سجل موقعك الاحترافي بكافة التفاصيل اللوجستية</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-secondary text-muted-foreground transition-all"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-8 border-b border-border bg-secondary/10">
           <button 
             type="button"
             onClick={() => setActiveTab('basic')}
             className={`flex-1 py-4 font-black text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'basic' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
           >
             <Info size={16} /> أساسيات
           </button>
           <button 
             type="button"
             onClick={() => setActiveTab('images')}
             className={`flex-1 py-4 font-black text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'images' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
           >
             <ImageIcon size={16} /> الصور ({formData.images.length})
           </button>
           <button 
             type="button"
             onClick={() => setActiveTab('logistics')}
             className={`flex-1 py-4 font-black text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${activeTab === 'logistics' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
           >
             <Map size={16} /> لوجستيات
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* BASIC INFO TAB */}
          {activeTab === 'basic' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">اسم الموقع</label>
                    <input 
                       type="text"
                       value={formData.name}
                       onChange={(e) => setFormData({...formData, name: e.target.value})}
                       placeholder="مثلاً: منزل البطل، المكتب الرئيسي..."
                       className={`w-full px-6 py-4 rounded-2xl bg-secondary/50 border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold ${fieldErrors.find(e => e.path === 'name') ? 'border-destructive' : 'border-border'}`}
                    />
                    <InlineFieldError errors={fieldErrors} fieldName="name" />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">نوع الموقع</label>
                    <div className="flex p-1.5 rounded-2xl bg-secondary/50 border border-border">
                       <button 
                          type="button"
                          onClick={() => setFormData({...formData, type: 'INT'})}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs transition-all ${formData.type === 'INT' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                       >
                          <Home size={14} /> داخلي
                       </button>
                       <button 
                          type="button"
                          onClick={() => setFormData({...formData, type: 'EXT'})}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-xs transition-all ${formData.type === 'EXT' ? 'bg-white shadow-sm text-emerald-500' : 'text-muted-foreground hover:text-foreground'}`}
                       >
                          <Globe size={14} /> خارجي
                       </button>
                    </div>
                 </div>
              </div>

              {availableParents.length > 0 && (
                <div className="space-y-2">
                   <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">التبعية (موقع فرعي من...)</label>
                   <select
                      value={formData.parent_location_id || ''}
                      onChange={(e) => setFormData({...formData, parent_location_id: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary transition-all outline-none font-bold text-sm"
                   >
                      <option value="">-- موقع رئيسي مستقل --</option>
                      {availableParents.map(parent => (
                        <option key={parent.id} value={parent.id}>{parent.name} ({parent.type === 'INT' ? 'داخلي' : 'خارجي'})</option>
                      ))}
                   </select>
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">العنوان</label>
                 <div className="relative">
                    <MapPin size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                       type="text"
                       value={formData.address}
                       onChange={(e) => setFormData({...formData, address: e.target.value})}
                       placeholder="المدينة، الشارع..."
                       className="w-full pr-12 pl-6 py-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-sm"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">وصف الموقع</label>
                 <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="وصف تفصيلي للموقع..."
                    rows={4}
                    className="w-full px-6 py-4 rounded-3xl bg-secondary/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-sm resize-none"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">الحالة الإنتاجية</label>
                 <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary transition-all outline-none font-black text-sm appearance-none cursor-pointer"
                 >
                    <option value="AVAILABLE">🟢 متاح للتصوير</option>
                    <option value="BUSY">🟡 مشغول</option>
                    <option value="UNAVAILABLE">🔴 غير متاح</option>
                    <option value="REVIEW">🔵 قيد المراجعة</option>
                 </select>
              </div>
            </div>
          )}

          {/* IMAGES TAB */}
          {activeTab === 'images' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
               {/* Dropzone */}
               <label className="cursor-pointer block relative group">
                 <div className="h-40 rounded-3xl bg-secondary/50 border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 group-hover:bg-primary/5">
                    <div className="p-4 rounded-full bg-primary/10 text-primary mb-3">
                       <Upload size={32} />
                    </div>
                    <div className="text-center">
                       <p className="font-black text-sm">اسحب صور الموقع هنا أو انقر للرفع</p>
                       <p className="text-xs text-muted-foreground mt-1 font-bold">يمكنك تحديد عدة صور (JPG, PNG)</p>
                    </div>
                 </div>
                 <input type="file" multiple className="hidden" onChange={handleImageUpload} accept="image/*" disabled={loading} />
               </label>

               {/* Gallery Grid */}
               {formData.images.length > 0 && (
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {formData.images.map((img, idx) => (
                     <div key={idx} className={`relative group rounded-2xl overflow-hidden aspect-video border-2 ${img.is_primary ? 'border-primary' : 'border-border'}`}>
                       <img src={resolveMediaUrl(img.image_url || img.url || '')} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                       
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button 
                            type="button"
                            onClick={() => setPrimaryImage(idx)}
                            className="p-2 rounded-full bg-white text-black hover:scale-110 transition-transform"
                            title="تعيين كصورة أساسية"
                          >
                            <CheckCircle2 size={16} className={img.is_primary ? "text-primary" : ""} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="p-2 rounded-full bg-red-500 text-white hover:scale-110 transition-transform"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                       
                       {img.is_primary && (
                         <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                           أساسية
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {/* LOGISTICS TAB */}
          {activeTab === 'logistics' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
               <InteractiveMapPicker 
                 latitude={formData.latitude} 
                 longitude={formData.longitude} 
                 onChange={({ latitude, longitude }) => setFormData({ ...formData, latitude, longitude })} 
               />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">اسم جهة الاتصال</label>
                    <input 
                       type="text"
                       value={formData.contact_name}
                       onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                       placeholder="المالك، الحارس، المدير..."
                       className="w-full px-6 py-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary transition-all outline-none font-bold"
                    />
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">رقم الهاتف</label>
                    <div className="relative">
                       <Phone size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                       <input 
                          type="tel"
                          value={formData.contact_phone}
                          onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                          placeholder="+213..."
                          className="w-full pr-12 pl-6 py-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary transition-all outline-none font-bold text-left"
                          dir="ltr"
                       />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">التكلفة (لليوم)</label>
                    <div className="flex bg-secondary/50 border border-border rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                       <select
                          value={formData.cost_currency}
                          onChange={(e) => setFormData({...formData, cost_currency: e.target.value})}
                          className="px-4 py-4 bg-transparent border-none text-muted-foreground font-black text-sm outline-none cursor-pointer appearance-none shrink-0"
                          dir="ltr"
                       >
                          <option value="USD">$</option>
                          <option value="EUR">€</option>
                          <option value="DZD">DA</option>
                       </select>
                       <div className="w-px bg-border/50 my-2"></div>
                       <input 
                          type="number"
                          value={formData.cost_per_day}
                          onChange={(e) => setFormData({...formData, cost_per_day: e.target.value})}
                          placeholder="0.00"
                          className="flex-1 w-full pl-4 pr-6 py-4 bg-transparent border-none outline-none font-bold text-left"
                          dir="ltr"
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">تصريح التصوير</label>
                    <div className="relative">
                       <FileText size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                       <select 
                          value={formData.permit_status}
                          onChange={(e) => setFormData({...formData, permit_status: e.target.value})}
                          className="w-full pr-12 pl-6 py-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary transition-all outline-none font-black text-sm appearance-none cursor-pointer"
                       >
                          <option value="NOT_REQUIRED">⚪ لا يتطلب تصريح</option>
                          <option value="PENDING">🟡 جاري الاستخراج</option>
                          <option value="APPROVED">🟢 مصرّح</option>
                       </select>
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">ملاحظات تقنية للإنتاج</label>
                 <div className="relative">
                    <Lightbulb size={18} className="absolute right-5 top-6 text-muted-foreground" />
                    <textarea 
                       value={formData.technical_notes}
                       onChange={(e) => setFormData({...formData, technical_notes: e.target.value})}
                       placeholder="توفر الكهرباء (3 فاز)، مستوى الضوضاء، مساحة ركن سيارات المعدات..."
                       rows={3}
                       className="w-full pr-12 pl-6 py-4 rounded-3xl bg-secondary/50 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-bold text-sm resize-none"
                    />
                 </div>
              </div>
            </div>
          )}

        </form>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-secondary/10 flex items-center justify-between">
           <div className="flex gap-2">
             {(['basic', 'images', 'logistics'] as const).map((tab) => (
               <div key={tab} className={`w-2 h-2 rounded-full transition-all ${activeTab === tab ? 'bg-primary w-6' : 'bg-border'}`} />
             ))}
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl font-black text-sm text-muted-foreground hover:bg-secondary transition-all"
              >
                 إلغاء
              </button>
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                 {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                 <span>{location ? 'حفظ التعديلات' : 'إضافة إلى المكتبة'}</span>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
