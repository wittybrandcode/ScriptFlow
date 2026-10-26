import React, { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Grid, Square, Maximize2, Minimize2 } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

export interface WorkspaceCanvasProps {
  children?: ReactNode;
}

export default function WorkspaceCanvas({ children }: WorkspaceCanvasProps) {
  const mainRef = useRef<HTMLDivElement>(null);
  const refRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { showDebugGrid, toggleDebugGrid, showDebugMargins, toggleDebugMargins } = useUIStore();
  
  const [mainZoom, setMainZoom] = useState(1);
  const [refZoom, setRefZoom] = useState(1);
  const [splitRatio, setSplitRatio] = useState(50);
  const isDragging = useRef(false);

  const MIN_ZOOM = 0.3;
  const BASE_WIDTH = 794; // Unified A4 width for all editors

  // فصل الأطفال: الورقة الرئيسية والمرجع
  const childArray = React.Children.toArray(children);
  const mainChild = childArray[0] || null;
  const refChild = childArray[1] || null;
  const hasRef = !!refChild;

  const [zoomMode, setZoomMode] = useState<'fit-page' | 'fit-width'>('fit-page');

  const calculateFitZoom = useCallback((containerWidth: number, forceMode: 'fit-page' | 'fit-width' | null = null) => {
    // Add 60px padding for aesthetics
    const available = containerWidth - 60;
    if (available <= 0) return MIN_ZOOM;
    const ideal = available / BASE_WIDTH;
    const mode = forceMode || zoomMode;
    if (mode === 'fit-width') {
      return Math.max(ideal, MIN_ZOOM);
    }
    return Math.min(Math.max(ideal, MIN_ZOOM), 1.0);
  }, [zoomMode]);

  // مراقبة حجم العمود الرئيسي
  useEffect(() => {
    if (!mainRef.current) return;
    let rafId: number;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setMainZoom(calculateFitZoom(entry.contentRect.width));
        });
      }
    });
    observer.observe(mainRef.current);
    setMainZoom(calculateFitZoom(mainRef.current.clientWidth));
    return () => { observer.disconnect(); if (rafId) cancelAnimationFrame(rafId); };
  }, [calculateFitZoom, hasRef]);

  // مراقبة حجم عمود المرجع
  useEffect(() => {
    if (!refRef.current || !hasRef) return;
    let rafId: number;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setRefZoom(calculateFitZoom(entry.contentRect.width, 'fit-page'));
        });
      }
    });
    observer.observe(refRef.current);
    setRefZoom(calculateFitZoom(refRef.current.clientWidth, 'fit-page'));
    return () => { observer.disconnect(); if (rafId) cancelAnimationFrame(rafId); };
  }, [calculateFitZoom, hasRef]);

  // Handle Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      // Calculate new percentage based on mouse position (inverted for RTL layout)
      const newRatio = ((containerRect.right - e.clientX) / containerRect.width) * 100;
      // Clamp between 20% and 80%
      setSplitRatio(Math.max(20, Math.min(newRatio, 80)));
    };
    
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col flex-1 h-full overflow-hidden w-full bg-background">
      {/* Canvas Top Toolbar */}
      <div className="h-11 border-b border-border/50 bg-card flex items-center justify-between px-4 shrink-0 select-none z-20">
        <div className="flex items-center gap-1">
          <button
            onClick={toggleDebugGrid}
            className={`p-2 rounded-md transition-all flex items-center justify-center ${
              showDebugGrid 
                ? 'bg-foreground text-background shadow-sm' 
                : 'bg-secondary hover:bg-secondary/80 text-foreground'
            }`}
            title="إظهار شبكة الأسطر (33 خطاً)"
          >
            <Grid size={16} strokeWidth={2.5} />
          </button>
          
          <button
            onClick={toggleDebugMargins}
            className={`p-2 rounded-md transition-all flex items-center justify-center ${
              showDebugMargins 
                ? 'bg-foreground text-background shadow-sm' 
                : 'bg-secondary hover:bg-secondary/80 text-foreground'
            }`}
            title="إظهار هوامش الصفحة"
          >
            <Square size={16} strokeWidth={2.5} />
          </button>

          <button
            onClick={() => setZoomMode(prev => prev === 'fit-page' ? 'fit-width' : 'fit-page')}
            className={`p-2 rounded-md transition-all flex items-center justify-center ${
              zoomMode === 'fit-width'
                ? 'bg-foreground text-background shadow-sm' 
                : 'bg-secondary hover:bg-secondary/80 text-foreground'
            }`}
            title={zoomMode === 'fit-page' ? "ملء عرض الكانفا (Fit Width)" : "ملء الصفحة الافتراضي (Fit Page)"}
          >
            {zoomMode === 'fit-page' ? (
              <Maximize2 size={16} strokeWidth={2.5} />
            ) : (
              <Minimize2 size={16} strokeWidth={2.5} />
            )}
          </button>
        </div>
        
        {/* Placeholder for future tools */}
        <div className="flex items-center gap-1.5">
          {/* Future actions/icons go here */}
        </div>
      </div>

      {/* Main Canvas Workspace Split Container */}
      <div className="flex-1 h-full overflow-hidden flex flex-row w-full relative">

      {/* العمود الرئيسي */}
      <div
        ref={mainRef}
        style={{ 
          width: hasRef ? `${splitRatio}%` : '100%', 
          flexShrink: 0,
          backgroundColor: '#CCCCCC'
        }}
        className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar"
      >
        <div
          className="flex items-start justify-center py-12"
          style={{ minHeight: '100%' }}
        >
          {mainChild && React.isValidElement(mainChild)
            ? React.cloneElement(mainChild, { paperZoom: mainZoom } as any)
            : mainChild}
        </div>
      </div>

      {/* شريط السحب (Separator) */}
      {hasRef && (
        <div
          onMouseDown={() => {
            isDragging.current = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
          className="w-2 h-full bg-border/60 hover:bg-primary/30 active:bg-primary/40 cursor-col-resize flex-shrink-0 relative group z-50 transition-colors duration-200 flex flex-col items-center justify-between py-0"
        >
          {/* مقبض السحب العلوي (Top Knob) */}
          <div className="w-5 h-7 -mx-1.5 rounded-b-md bg-muted-foreground/20 group-hover:bg-primary/40 active:bg-primary/60 transition-colors duration-200 flex items-center justify-center shadow-sm border border-border/50 group-hover:border-primary/30">
            <svg width="8" height="10" viewBox="0 0 8 10" className="text-muted-foreground/60 group-hover:text-primary transition-colors">
              <circle cx="2" cy="3" r="1" fill="currentColor"/>
              <circle cx="6" cy="3" r="1" fill="currentColor"/>
              <circle cx="2" cy="7" r="1" fill="currentColor"/>
              <circle cx="6" cy="7" r="1" fill="currentColor"/>
            </svg>
          </div>

          {/* أيقونة النقاط المركزية (Center Grip) */}
          <div className="flex flex-col gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-[3px] h-[3px] bg-primary/70 rounded-full"></div>
            <div className="w-[3px] h-[3px] bg-primary/70 rounded-full"></div>
            <div className="w-[3px] h-[3px] bg-primary/70 rounded-full"></div>
          </div>

          {/* مقبض السحب السفلي (Bottom Knob) */}
          <div className="w-5 h-7 -mx-1.5 rounded-t-md bg-muted-foreground/20 group-hover:bg-primary/40 active:bg-primary/60 transition-colors duration-200 flex items-center justify-center shadow-sm border border-border/50 group-hover:border-primary/30">
            <svg width="8" height="10" viewBox="0 0 8 10" className="text-muted-foreground/60 group-hover:text-primary transition-colors">
              <circle cx="2" cy="3" r="1" fill="currentColor"/>
              <circle cx="6" cy="3" r="1" fill="currentColor"/>
              <circle cx="2" cy="7" r="1" fill="currentColor"/>
              <circle cx="6" cy="7" r="1" fill="currentColor"/>
            </svg>
          </div>
        </div>
      )}

      {/* عمود المرجع */}
      {hasRef && (
        <div
          ref={refRef}
          style={{ 
            width: `calc(${100 - splitRatio}% - 6px)`, 
            flexShrink: 0,
            backgroundColor: '#CCCCCC'
          }}
          className="h-full overflow-y-auto overflow-x-hidden custom-scrollbar border-l border-border/50"
        >
          <div
            className="flex items-start justify-center py-12"
            style={{ minHeight: '100%' }}
          >
            {React.isValidElement(refChild)
              ? React.cloneElement(refChild, { paperZoom: refZoom } as any)
              : refChild}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
