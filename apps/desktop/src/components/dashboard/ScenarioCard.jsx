import React, { useState, useEffect, useRef } from 'react';
import { Film, Clock, Edit3, Trash2, Save, X, FileDown, Image as ImageIcon, Tag, FileText, FileJson, CheckCircle, Archive, Clapperboard, Tv } from 'lucide-react';
import { resolveMediaUrl, saveMediaFile } from '../../services/mediaStorage';

/**
 * مكون بطاقة السيناريو مع مراجعة التعديل والحذف والتصدير
 */
const ScenarioCard = ({ scenario, editing, onEdit, onCancel, onSave, onDelete, onOpen, onExport, onExportJSON, onExportPackage }) => {
  const [title, setTitle] = useState(scenario?.title || '');
  const [desc, setDesc] = useState(scenario?.description || '');
  // Start with scenario prop (which might be empty from fetchScenarios, but populated during edit)
  const [coverImage, setCoverImage] = useState(scenario?.cover_image ? resolveMediaUrl(scenario.cover_image) : '');
  const [coverVideo, setCoverVideo] = useState(scenario?.cover_video ? resolveMediaUrl(scenario.cover_video) : '');
  const [status, setStatus] = useState(scenario?.status || 'DRAFT');
  const [genre, setGenre] = useState(scenario?.genre || '');
  const [notes, setNotes] = useState(scenario?.notes || '');
  const [isClosing, setIsClosing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Lazy video loading states
  const [lazyVideoSrc, setLazyVideoSrc] = useState(null); // Loaded from DB on hover
  const [videoReady, setVideoReady] = useState(false);     // True when <video> can actually play
  const [renderVideo, setRenderVideo] = useState(false);   // Controls DOM mount of <video>
  const videoRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const STATUS_MAP = {
    DRAFT: { label: 'مسودة', icon: Edit3, color: 'text-zinc-400 bg-zinc-500/20 border-zinc-500/30' },
    IN_PROGRESS: { label: 'قيد الكتابة', icon: Edit3, color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
    IN_PRODUCTION: { label: 'قيد الإنتاج', icon: Clapperboard, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
    COMPLETED: { label: 'مكتمل', icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
    ARCHIVED: { label: 'مؤرشف', icon: Archive, color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' }
  };

  useEffect(() => { 
    setTitle(scenario?.title || ''); 
    setDesc(scenario?.description || ''); 
    if (scenario?.cover_image) setCoverImage(resolveMediaUrl(scenario.cover_image));
    if (scenario?.cover_video) setCoverVideo(resolveMediaUrl(scenario.cover_video));
    setStatus(scenario?.status || 'DRAFT');
    setGenre(scenario?.genre || '');
    setNotes(scenario?.notes || '');
  }, [scenario]);

  const cardRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Preload slightly before it enters the viewport
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  // === Lazy load cover_image from DB when in view ===
  useEffect(() => {
    if (!isInView) return;
    // If we already have it (from edit mode prop update), do nothing
    if (scenario?.cover_image || !scenario?.id || scenario.id === '__new__') return;
    
    let cancelled = false;
    const fetchImage = async () => {
      try {
        const { ScenarioRepository } = await import('@scriptflow/database');
        const scenarioRepo = new ScenarioRepository();
        const row = await scenarioRepo.findById(scenario.id);
        if (!cancelled && row?.cover_image) {
          setCoverImage(resolveMediaUrl(row.cover_image));
        }
      } catch (e) {
        console.error('Failed to load poster image', e);
      }
    };
    fetchImage();
    return () => { cancelled = true; };
  }, [scenario?.id, scenario?.cover_image, isInView]);

  // We remove the automatic background fetch.
  // Instead, we only fetch the video when the user actually hovers over the card.
  const fetchVideoOnDemand = async () => {
    if (lazyVideoSrc) return; // already loaded
    if (!scenario?.id || scenario.id === '__new__') return;
    
    try {
      const { ScenarioRepository } = await import('@scriptflow/database');
      const scenarioRepo = new ScenarioRepository();
      const row = await scenarioRepo.findById(scenario.id);
      if (row?.cover_video) {
        setLazyVideoSrc(resolveMediaUrl(row.cover_video));
      } else {
        // Mark as empty so we don't keep fetching
        setLazyVideoSrc('none');
      }
    } catch (e) {
      console.error('Failed to load video on demand', e);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        console.warn('الملف المختار ليس صورة أو فيديو');
        return;
      }

      const targetId = scenario?.id && scenario.id !== '__new__' ? scenario.id : 'temp';

      if (file.type.startsWith('video/')) {
        // === VIDEO: Extract first frame as PNG, store video directly to disk ===
        setIsExtracting(true);
        try {
          const videoUrl = URL.createObjectURL(file);

          // Extract first frame via offscreen video + canvas
          const thumbnailPng = await new Promise((resolve, reject) => {
            const vid = document.createElement('video');
            vid.preload = 'auto';
            vid.muted = true;
            vid.playsInline = true;
            vid.crossOrigin = 'anonymous';
            vid.src = videoUrl;

            const fallbackTimeout = setTimeout(() => reject(new Error('Video frame extraction timed out')), 5000);

            vid.addEventListener('loadedmetadata', () => {
              vid.currentTime = 0.1;
            });

            vid.addEventListener('seeked', () => {
              clearTimeout(fallbackTimeout);
              try {
                const canvas = document.createElement('canvas');
                canvas.width = vid.videoWidth || 800;
                canvas.height = vid.videoHeight || 600;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
                const png = canvas.toDataURL('image/png', 0.85);
                resolve(png);
              } catch (err) {
                reject(err);
              }
            });

            vid.addEventListener('error', (err) => {
              clearTimeout(fallbackTimeout);
              reject(err);
            });
            
            vid.load();
          });

          URL.revokeObjectURL(videoUrl);

          // Save thumbnail PNG to project media directory
          const thumbUri = await saveMediaFile(targetId, `cover_${Date.now()}.png`, thumbnailPng);
          
          // Save video file directly to project media directory
          const ext = file.name.split('.').pop() || 'mp4';
          const videoUri = await saveMediaFile(targetId, `video_${Date.now()}.${ext}`, file);

          setCoverImage(resolveMediaUrl(thumbUri) || thumbnailPng);
          setCoverVideo(videoUri);
          setLazyVideoSrc(resolveMediaUrl(videoUri));
          setVideoReady(false);
        } catch (err) {
          console.error('[ScenarioCard] Error extracting/saving video frame:', err);
        } finally {
          setIsExtracting(false);
        }
      } else {
        // === IMAGE: Save directly to project media directory ===
        try {
          const ext = file.name.split('.').pop() || 'png';
          const imageUri = await saveMediaFile(targetId, `cover_${Date.now()}.${ext}`, file);
          setCoverImage(resolveMediaUrl(imageUri));
          setCoverVideo('');
          setLazyVideoSrc('none');
        } catch (err) {
          console.error('[ScenarioCard] Error saving cover image:', err);
        }
      }
    }
  };

  const handleCancelClick = () => {
    setIsClosing(true);
    setTimeout(() => {
      onCancel();
      setIsClosing(false);
    }, 400); // Wait for the close animation to finish
  };

  const handleSaveClick = () => {
    setIsClosing(true);
    setTimeout(() => {
      onSave(title, desc, coverImage, status, genre, notes, coverVideo);
    }, 400);
  };

  const isVideo = (url) => !!url && (url.startsWith('data:video') || url.endsWith('.mp4') || url.endsWith('.webm') || url.includes('video_'));
  const hasVideo = !!lazyVideoSrc && lazyVideoSrc !== 'none';

  // Once on-demand fetch completes, if we are still hovering, mount it!
  useEffect(() => {
    if (isHovered && lazyVideoSrc && lazyVideoSrc !== 'none') {
      setRenderVideo(true);
      setTimeout(() => {
        if (videoRef.current && videoReady) {
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    }
  }, [lazyVideoSrc, isHovered, videoReady]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    // Add a small delay before fetching video to prevent rapid hover fetches
    hoverTimeoutRef.current = setTimeout(() => {
      fetchVideoOnDemand();
    }, 150);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    
    // Unmount video element after fade-out to free memory
    hoverTimeoutRef.current = setTimeout(() => {
      setRenderVideo(false);
      setVideoReady(false);
    }, 700);
  };

  if (editing) {
    return (
      <>
      <style>{`
        @keyframes slideFromSidebar {
          0% { 
            opacity: 0; 
            transform: translateX(120%) scale(0.9); 
            max-width: 0; 
            padding: 0; 
            margin: 0;
            border-width: 0;
          }
          40% { 
            opacity: 0.6; 
            max-width: 400px; 
            padding: 1.5rem;
            border-width: 2px;
          }
          100% { 
            opacity: 1; 
            transform: translateX(0) scale(1); 
            max-width: 400px; 
            padding: 1.5rem;
            border-width: 2px;
          }
        }
        @keyframes slideToSidebar {
          0% { 
            opacity: 1; 
            transform: translateX(0) scale(1); 
            max-width: 400px; 
            padding: 1.5rem;
            border-width: 2px;
          }
          100% { 
            opacity: 0; 
            transform: translateX(120%) scale(0.9); 
            max-width: 0; 
            padding: 0; 
            margin: 0;
            border-width: 0;
          }
        }
      `}</style>
      <div 
        className="shrink-0 h-full w-[300px] sm:w-[350px] lg:w-auto lg:aspect-[2/3] bg-card border-2 border-primary/60 rounded-2xl p-6 shadow-[0_0_40px_rgba(var(--primary-rgb,99,102,241),0.15)] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20"
        style={{ 
          animation: isClosing 
            ? 'slideToSidebar 0.4s cubic-bezier(0.36, 0, 0.66, -0.56) forwards' 
            : 'slideFromSidebar 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards' 
        }}
      >
        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-input rounded-xl text-foreground text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="عنوان السيناريو"
          />
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full px-4 py-2 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            placeholder="وصف السيناريو (اختياري)"
            rows={2}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-muted-foreground mb-1 uppercase tracking-widest">حالة المشروع</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="DRAFT">مسودة</option>
                <option value="IN_PRODUCTION">قيد الإنتاج</option>
                <option value="COMPLETED">مكتمل</option>
                <option value="ARCHIVED">مؤرشف</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-muted-foreground mb-1 uppercase tracking-widest">التصنيف (Genre)</label>
              <input
                type="text"
                value={genre}
                onChange={e => setGenre(e.target.value)}
                placeholder="فيلم قصير، مسلسل، إعلان..."
                className="w-full px-3 py-2 bg-background border border-input rounded-xl text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-muted-foreground mb-1 uppercase tracking-widest">ملاحظات عامة</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              placeholder="ملاحظات عامة عن المشروع..."
              rows={2}
            />
          </div>
          
          <div 
            className="flex items-center gap-4 border border-dashed border-border rounded-xl p-3 bg-background/50 hover:bg-background transition-colors cursor-pointer relative overflow-hidden group"
          >
            <input type="file" accept="image/*,video/webm,video/mp4,.webm,.mp4" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" title="رفع صورة أو فيديو الغلاف" />
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
               {isExtracting ? (
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
               ) : coverImage ? (
                  <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
               ) : (
                  <ImageIcon size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
               )}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-bold text-foreground truncate">
                 {isExtracting ? 'جاري استخراج البوستر...' : coverImage ? (coverVideo ? 'تم اختيار فيديو + بوستر' : 'تم اختيار صورة') : 'صورة أو فيديو الغلاف'}
               </p>
               <p className="text-[10px] text-muted-foreground truncate">انقر وتصفح لاختيار ملف من جهازك (WebM/MP4/JPG)</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveClick}
              disabled={isClosing}
              className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all font-sans disabled:opacity-70"
            >
              {isClosing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save size={14} />
                  حفظ التعديلات
                </>
              )}
            </button>
            <button
              onClick={handleCancelClick}
              disabled={isClosing}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary text-secondary-foreground text-xs font-bold hover:bg-muted transition-all font-sans disabled:opacity-50"
            >
              <X size={14} />
              إلغاء
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <div 
      ref={cardRef}
      className={`group shrink-0 h-full w-auto aspect-[2/3] bg-[#0d0d1a] border border-border/50 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-primary/50 transition-all duration-500 relative flex flex-col justify-end cursor-pointer`}
      onClick={onOpen}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      
      {coverImage ? (
        <>
          {/* Default Dark Background */}
          <div className="absolute inset-0 bg-[#0d0d1a] z-0" />

          {/* Thumbnail image — always visible instantly */}
          <img 
            src={coverImage}
            alt={scenario.title}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 z-0 ${hasVideo ? '' : 'group-hover:scale-105'}`}
            onError={(e) => {
              // Hide broken image so it falls back to dark background
              e.target.style.opacity = '0';
            }}
          />

          {/* Video overlay — only mounts when hovered AND lazily loaded from DB */}
          {(lazyVideoSrc && renderVideo) && (
            <video 
              ref={videoRef}
              src={lazyVideoSrc} 
              loop muted playsInline preload="auto"
              onCanPlay={() => {
                setVideoReady(true);
                if (isHovered && videoRef.current) {
                  videoRef.current.play().catch(() => {});
                }
              }}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 z-10 ${isHovered && videoReady ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
          
          {/* Gradients */}
          <div className="absolute inset-0 bg-primary/20 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0 z-20 pointer-events-none" />
          <div className="absolute inset-0 bg-[#0d0d1a]/20 transition-opacity duration-500 group-hover:opacity-0 z-20 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/70 to-transparent opacity-95 z-20 pointer-events-none" />

          {/* Content at bottom */}
          <div className="relative z-30 p-8 lg:p-12 w-full flex flex-col justify-end font-sans h-full">
            <div className="mt-auto">
              {/* Text Information Block */}
              <div className={`flex flex-col gap-2 transition-all duration-700 transform opacity-100 translate-y-0 relative`}>
                {scenario.director_name && (
                  <p className="text-xl md:text-2xl font-black text-white mb-1 drop-shadow-md tracking-wide">
                    إخراج: {scenario.director_name}
                  </p>
                )}
                <h3 className="font-black text-white text-3xl md:text-5xl leading-normal drop-shadow-2xl mb-3 break-words">{scenario.title}</h3>
                {scenario.description && (
                  <p className="text-white/80 text-base md:text-lg font-medium leading-relaxed drop-shadow-md mb-4 line-clamp-3 max-w-2xl">
                    {scenario.description}
                  </p>
                )}
                {scenario.genre && (
                  <p className="text-base md:text-lg font-bold text-white/80 drop-shadow-md mb-2 line-clamp-1 uppercase tracking-wider">
                    {scenario.genre}
                  </p>
                )}

                {/* Notes on Hover - ALWAYS show on hover so information appears completely */}
                {scenario.notes && (
                  <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] opacity-0 group-hover:opacity-100 transition-all duration-500 overflow-hidden">
                    <div className="min-h-0">
                      <p className="mt-3 text-xs text-white/60 leading-relaxed line-clamp-3 drop-shadow-md bg-black/30 p-2 rounded-lg border border-white/5 backdrop-blur-sm">
                        {scenario.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Row - fades in on hover */}
              <div className={`flex items-center justify-between pt-4 border-t border-white/10 mt-4 transition-all duration-400 transform ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
                <div className="flex items-center gap-1.5">
                  {scenario.episode_count > 0 && (
                    <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-lg backdrop-blur-md border border-white/5 text-xs font-bold text-white/60" title="عدد الحلقات">
                      <Tv size={13} className="text-white" /> {scenario.episode_count}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-lg backdrop-blur-md border border-white/5 text-xs font-bold text-white/60" title="عدد المشاهد">
                    <Film size={13} className="text-white" /> {scenario.scene_count || 0}
                  </span>
                  {scenario.status && scenario.status !== 'DRAFT' && (() => {
                    const StatusIcon = STATUS_MAP[scenario.status]?.icon;
                    return (
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg border backdrop-blur-md ${STATUS_MAP[scenario.status]?.color}`} title={STATUS_MAP[scenario.status]?.label}>
                        {StatusIcon && <StatusIcon size={13} />}
                      </div>
                    );
                  })()}
                </div>
                
                <div className="flex items-center gap-1.5">
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="w-9 h-9 rounded-lg bg-black/50 border border-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all shadow-lg pointer-events-auto" title="تعديل"><Edit3 size={15}/></button>
                <div className="w-[1px] h-5 bg-white/20 mx-0.5" />
                <button onClick={(e) => { e.stopPropagation(); onExport(); }} className="w-9 h-9 rounded-lg bg-black/50 border border-white/10 backdrop-blur-md flex items-center justify-center text-white hover:text-black hover:bg-white transition-all shadow-lg pointer-events-auto" title="تصدير PDF"><FileText size={15}/></button>
                <button onClick={(e) => { e.stopPropagation(); onExportJSON(); }} className="w-9 h-9 rounded-lg bg-black/50 border border-white/10 backdrop-blur-md flex items-center justify-center text-white hover:text-black hover:bg-white transition-all shadow-lg pointer-events-auto" title="تصدير JSON"><FileJson size={15}/></button>
              </div>
            </div>
          </div>
        </div>
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/10 to-background" />
          
          {/* Abstract Teaser Graphic */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <Film size={100} className="text-primary rotate-12" />
          </div>

          <div className="relative z-10 p-8 lg:p-12 w-full flex flex-col gap-2 font-sans">
            {scenario.director_name && (
              <p className="text-xl md:text-2xl font-black text-foreground mb-1 drop-shadow-sm tracking-wide">
                إخراج: {scenario.director_name}
              </p>
            )}
            <h3 className="font-black text-foreground text-5xl md:text-7xl leading-normal mb-4 break-words group-hover:text-primary transition-colors">{scenario.title}</h3>
            {scenario.description && (
              <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed mb-4 line-clamp-3 max-w-2xl">
                {scenario.description}
              </p>
            )}
            {scenario.genre && (
              <p className="text-base md:text-lg font-bold text-muted-foreground mb-2 line-clamp-1 uppercase tracking-wider">
                {scenario.genre}
              </p>
            )}
            
            {/* Notes on Hover - plain text, no container */}
            {scenario.notes && (
              <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] opacity-0 group-hover:opacity-100 transition-all duration-500 overflow-hidden">
                <div className="min-h-0">
                  <p className="mt-3 text-xs text-muted-foreground/70 leading-relaxed line-clamp-3">
                    {scenario.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Actions Row - all hidden until hover */}
            <div className="flex items-center justify-between pt-4 border-t border-border mt-4 opacity-0 group-hover:opacity-100 transition-all duration-400 translate-y-3 group-hover:translate-y-0">
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1.5 bg-secondary px-2.5 py-1.5 rounded-lg border border-border text-xs font-bold text-muted-foreground">
                  <Film size={13} className="text-primary" /> {scenario.scene_count || 0}
                </span>
                {scenario.status && scenario.status !== 'DRAFT' && (() => {
                  const StatusIcon = STATUS_MAP[scenario.status]?.icon;
                  return (
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg border ${STATUS_MAP[scenario.status]?.color}`} title={STATUS_MAP[scenario.status]?.label}>
                      {StatusIcon && <StatusIcon size={13} />}
                    </div>
                  );
                })()}
              </div>
              
              <div className="flex items-center gap-1.5">
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:text-white hover:bg-primary transition-all shadow-sm" title="تعديل"><Edit3 size={15}/></button>
                <div className="w-[1px] h-5 bg-border mx-0.5" />
                <button onClick={(e) => { e.stopPropagation(); onExport(); }} className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:text-black hover:bg-white transition-all shadow-sm" title="تصدير PDF"><FileText size={15}/></button>
                <button onClick={(e) => { e.stopPropagation(); onExportJSON(); }} className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-foreground hover:text-black hover:bg-white transition-all shadow-sm" title="تصدير JSON"><FileJson size={15}/></button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(ScenarioCard, (prev, next) => {
  return prev.scenario?.id === next.scenario?.id && 
         prev.editing === next.editing && 
         prev.scenario?.title === next.scenario?.title &&
         prev.scenario?.cover_image === next.scenario?.cover_image;
});
