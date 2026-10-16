import React, { useState, useEffect } from 'react';
import { ImageOff, ChevronLeft, ChevronRight, Map, MapPin, Clapperboard, FileDown, Home, Trees, X, BarChart3, Sun, Phone, DollarSign, Lightbulb } from 'lucide-react';
import MapDisplay from './MapDisplay';
import WeatherWidget from './WeatherWidget';

export default function LocationPreviewModal({
  previewLocation,
  sceneCounts,
  totalScenes,
  allScenes,
  onClose,
  onExportAllScenesPdf,
  onExportScenePdf
}) {
  const [showMapInPreview, setShowMapInPreview] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    setImgIndex(0);
    setShowMapInPreview(false);
  }, [previewLocation]);

  if (!previewLocation) return null;

  const pSceneCount = sceneCounts[previewLocation.id] || 0;
  const pPercent = totalScenes > 0 ? Math.round((pSceneCount / totalScenes) * 100) : 0;
  const isInt = previewLocation.type === 'INT';
  const pStatus = {
    'AVAILABLE': { label: 'متاح للتصوير', icon: '🟢', cls: 'text-emerald-600' },
    'BUSY': { label: 'مشغول', icon: '🟡', cls: 'text-amber-600' },
    'UNAVAILABLE': { label: 'غير متاح', icon: '🔴', cls: 'text-red-600' },
    'REVIEW': { label: 'قيد المراجعة', icon: '🔵', cls: 'text-blue-600' },
  }[previewLocation.status] || { label: 'غير محدد', icon: '⚪', cls: 'text-muted-foreground' };
  
  const linkedScenes = allScenes.filter(s => s.location_id === previewLocation.id);

  const images = previewLocation.images?.length > 0 
    ? previewLocation.images.map(i => i.image_url) 
    : (previewLocation.image ? [previewLocation.image] : []);
  const hasMultiple = images.length > 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xl bg-black/50 animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-5xl rounded-lg border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isInt ? 'bg-blue-500/10 text-blue-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
              {isInt ? <Home size={18} /> : <Trees size={18} />}
            </div>
            <h2 className="text-lg font-black text-foreground">{previewLocation.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold flex items-center gap-1.5 ${pStatus.cls}`}>
              <span>{pStatus.icon}</span> {pStatus.label}
            </span>
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main Left Area: Gallery/Map + Scenes */}
          <div className="flex-1 flex flex-col overflow-hidden border-l border-border/50">
            {/* Gallery or Map */}
            <div className="relative shrink-0 h-72 bg-secondary flex flex-col">
              {showMapInPreview ? (
                <MapDisplay 
                  latitude={previewLocation.latitude} 
                  longitude={previewLocation.longitude} 
                  address={previewLocation.address} 
                />
              ) : (
                images.length > 0 ? (
                  <img 
                    key={images[imgIndex]}
                    src={images[imgIndex]} 
                    alt={previewLocation.name} 
                    className="w-full h-full object-cover animate-in fade-in duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                    <ImageOff size={40} />
                  </div>
                )
              )}

              {/* Navigation arrows */}
              {!showMapInPreview && hasMultiple && (
                <>
                  <button 
                    onClick={() => setImgIndex((imgIndex - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all border border-white/10"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => setImgIndex((imgIndex + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all border border-white/10"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    {images.map((_, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === imgIndex ? 'bg-white scale-110' : 'bg-white/40'}`} />
                    ))}
                  </div>
                </>
              )}

              {/* Map Toggle Button */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                 <button 
                   onClick={() => setShowMapInPreview(!showMapInPreview)}
                   className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/60 backdrop-blur-md text-white font-bold text-[10px] hover:bg-black/80 transition-all border border-white/10"
                 >
                   {showMapInPreview ? <><ImageOff size={12}/> عرض الصور</> : <><Map size={12}/> الخريطة الحية</>}
                 </button>
              </div>

              {/* Bottom overlay for Gallery Mode */}
              {!showMapInPreview && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 pt-14 pointer-events-none">
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-white/70 mb-1">
                        <MapPin size={13} className="shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider">{isInt ? 'داخلي' : 'خارجي'} - {previewLocation.name}</span>
                      </div>
                      {previewLocation.description && (
                        <p className="text-sm text-white/80 font-medium line-clamp-2 leading-relaxed">{previewLocation.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Linked Scenes List */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0 bg-background/50">
                <div className="flex items-center gap-2">
                  <Clapperboard size={16} className="text-primary" />
                  <h4 className="text-sm font-black text-foreground">المشاهد المرتبطة</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded">{linkedScenes.length} مشهد</span>
                  {linkedScenes.length > 0 && (
                    <button
                      onClick={() => onExportAllScenesPdf(linkedScenes)}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-md text-xs font-bold transition-all"
                      title="تصدير جميع المشاهد كـ PDF"
                    >
                      <FileDown size={13} /> تصدير الكل
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {linkedScenes.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {linkedScenes.map(scene => (
                      <div key={scene.id} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/40 transition-colors">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-md min-w-[40px] text-center mt-0.5">
                            #{scene.scene_number}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-foreground truncate max-w-[280px]">
                              {scene.title || 'بدون عنوان'}
                            </div>
                            {scene.description && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-[320px]">
                                {scene.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-secondary/50 px-2 py-1 rounded-md">
                            {scene.time_of_day === 'DAY' ? 'نهاراً' : scene.time_of_day === 'NIGHT' ? 'ليلاً' : scene.time_of_day}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${scene.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                            {scene.status === 'COMPLETED' ? 'مكتمل' : 'مسودة'}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onExportScenePdf(scene.id); }}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                            title="تصدير المشهد كـ PDF"
                          >
                            <FileDown size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center py-12">
                    <div className="text-center">
                      <Clapperboard size={28} className="mx-auto mb-2 text-muted-foreground/20" />
                      <div className="text-sm text-muted-foreground">لا توجد مشاهد مرتبطة.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Logistics */}
          <div className="w-[320px] shrink-0 bg-secondary/10 flex flex-col overflow-y-auto custom-scrollbar p-5 gap-6">
            {/* Utilization Stats */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                 <BarChart3 size={12}/> إحصائيات الاستخدام
              </h4>
              <div className="grid grid-cols-2 gap-2">
                 <div className="bg-background rounded-lg p-3 border border-border">
                    <div className="text-2xl font-black text-foreground mb-1 leading-none">{pSceneCount}</div>
                    <div className="text-[10px] font-bold text-muted-foreground">مشهد مجدول</div>
                 </div>
                 <div className="bg-background rounded-lg p-3 border border-border">
                    <div className="text-2xl font-black text-primary mb-1 leading-none">{pPercent}%</div>
                    <div className="text-[10px] font-bold text-muted-foreground">نسبة الاستخدام</div>
                 </div>
              </div>
            </div>

            {/* Weather Widget */}
            {previewLocation.latitude && previewLocation.longitude && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                   <Sun size={12}/> حالة الطقس المباشرة
                </h4>
                <WeatherWidget latitude={previewLocation.latitude} longitude={previewLocation.longitude} />
              </div>
            )}

            {/* Logistics Info */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                 <Map size={12}/> بيانات لوجستية
              </h4>
              <div className="bg-background rounded-lg border border-border divide-y divide-border/50">
                 
                 <div className="p-3 flex items-start gap-3">
                   <div className="p-1.5 bg-secondary rounded text-muted-foreground shrink-0"><MapPin size={14} /></div>
                   <div className="min-w-0 flex-1">
                     <div className="text-[10px] font-bold text-muted-foreground mb-0.5">العنوان</div>
                     <div className="text-xs font-bold text-foreground break-words leading-tight">{previewLocation.address || 'غير محدد'}</div>
                     {previewLocation.map_url && (
                       <a href={previewLocation.map_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline mt-1 block">فتح في خرائط جوجل ↗</a>
                     )}
                   </div>
                 </div>

                 <div className="p-3 flex items-start gap-3">
                   <div className="p-1.5 bg-secondary rounded text-muted-foreground shrink-0"><Phone size={14} /></div>
                   <div className="min-w-0 flex-1">
                     <div className="text-[10px] font-bold text-muted-foreground mb-0.5">جهة الاتصال</div>
                     <div className="text-xs font-bold text-foreground">{previewLocation.contact_name || 'غير محدد'}</div>
                     {previewLocation.contact_phone && (
                       <div className="text-xs font-mono mt-0.5" dir="ltr">{previewLocation.contact_phone}</div>
                     )}
                   </div>
                 </div>

                 <div className="p-3 flex items-start gap-3">
                   <div className="p-1.5 bg-secondary rounded text-muted-foreground shrink-0"><DollarSign size={14} /></div>
                   <div className="min-w-0 flex-1">
                     <div className="text-[10px] font-bold text-muted-foreground mb-0.5">التكلفة اليومية</div>
                     <div className="text-xs font-black text-emerald-600" dir="ltr">
                       {previewLocation.cost_per_day ? `${previewLocation.cost_per_day} ${previewLocation.cost_currency === 'EUR' ? '€' : previewLocation.cost_currency === 'DZD' ? 'DA' : '$'}` : 'غير محدد'}
                     </div>
                   </div>
                 </div>

              </div>
            </div>

            {/* Technical Notes */}
            {previewLocation.technical_notes && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-black tracking-widest text-muted-foreground uppercase flex items-center gap-2">
                   <Lightbulb size={12}/> ملاحظات تقنية
                </h4>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs leading-relaxed text-amber-700 font-medium">
                   {previewLocation.technical_notes}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
