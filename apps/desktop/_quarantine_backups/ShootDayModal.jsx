import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Save, Type, Cloud, Tag, FileText, ListOrdered } from 'lucide-react';

export default function ShootDayModal({ day, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    shoot_date: '',
    start_time: '08:00',
    end_time: '20:00',
    call_time: '07:00',
    wrap_time: '21:00',
    day_type: 'SHOOT',
    production_phase: 'PRODUCTION',
    weather_forecast: '',
    week_number: 1,
    notes: ''
  });

  useEffect(() => {
    if (day) {
      setFormData({
        title: day.title || '',
        shoot_date: day.shoot_date ? new Date(day.shoot_date).toISOString().split('T')[0] : '',
        start_time: day.start_time || '08:00',
        end_time: day.end_time || '20:00',
        call_time: day.call_time || '07:00',
        wrap_time: day.wrap_time || '21:00',
        day_type: day.day_type || 'SHOOT',
        production_phase: day.production_phase || 'PRODUCTION',
        weather_forecast: day.weather_forecast || '',
        week_number: day.week_number || 1,
        notes: day.notes || ''
      });
    }
  }, [day]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      week_number: Number(formData.week_number)
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            بيانات يوم التصوير
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Type size={12}/> عنوان اليوم (اختياري)
              </label>
              <input 
                type="text"
                placeholder="مثال: يوم التقاط المشاهد الخارجية للفيلا"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Calendar size={12}/> تاريخ التصوير
              </label>
              <input 
                type="date"
                value={formData.shoot_date}
                onChange={e => setFormData({...formData, shoot_date: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Tag size={12}/> نوع اليوم
              </label>
              <select 
                value={formData.day_type}
                onChange={e => setFormData({...formData, day_type: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="SHOOT">تصوير (Shoot)</option>
                <option value="REHEARSAL">بروفة (Rehearsal)</option>
                <option value="TRAVEL">تنقل (Travel)</option>
                <option value="SETUP">تجهيز الموقع (Setup)</option>
                <option value="REST">يوم راحة (Rest)</option>
                <option value="REVIEW">مراجعة/مونتاج (Review)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Clock size={12}/> وقت الحضور (Call)
              </label>
              <input 
                type="time"
                value={formData.call_time}
                onChange={e => setFormData({...formData, call_time: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Clock size={12}/> وقت الانصراف (Wrap)
              </label>
              <input 
                type="time"
                value={formData.wrap_time}
                onChange={e => setFormData({...formData, wrap_time: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Clock size={12}/> وقت بداية التصوير
              </label>
              <input 
                type="time"
                value={formData.start_time}
                onChange={e => setFormData({...formData, start_time: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Clock size={12}/> وقت نهاية التصوير
              </label>
              <input 
                type="time"
                value={formData.end_time}
                onChange={e => setFormData({...formData, end_time: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <ListOrdered size={12}/> المرحلة الإنتاجية
              </label>
              <select 
                value={formData.production_phase}
                onChange={e => setFormData({...formData, production_phase: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="PRE_PRODUCTION">ما قبل الإنتاج</option>
                <option value="PRODUCTION">الإنتاج (التصوير)</option>
                <option value="POST_PRODUCTION">ما بعد الإنتاج</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Calendar size={12}/> الأسبوع الإنتاجي
              </label>
              <input 
                type="number"
                min="1"
                value={formData.week_number}
                onChange={e => setFormData({...formData, week_number: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Cloud size={12}/> الطقس المتوقع
              </label>
              <input 
                type="text"
                placeholder="مثال: مشمس، 25 درجة"
                value={formData.weather_forecast}
                onChange={e => setFormData({...formData, weather_forecast: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>



            <div className="col-span-2">
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <FileText size={12}/> ملاحظات إنتاجية
              </label>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                rows={3}
                placeholder="ملاحظات حول الطاقم، المعدات، أو أي تحذيرات..."
                className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none custom-scrollbar"
              />
            </div>

          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2 sticky bottom-0 bg-card">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:bg-secondary transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm shadow-primary/20"
            >
              <Save size={14} />
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
