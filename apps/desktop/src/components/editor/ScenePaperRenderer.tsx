import { memo, useMemo } from 'react';
import { TIME_MAP } from '../../constants/sceneConstants';
import { GRID, expandBlocksToLayoutNodes, groupBlocksByPage } from './TextMeasurementEngine';
import { useUIStore } from '../../store/useUIStore';
import PageFooter from '../pdf/PageFooter';
import './paper/paper-editor.css';

export interface ScenePaperRendererProps {
  scene: any;
  blocks?: any[];
  characters?: any[];
  paperZoom?: number;
  isReference?: boolean;
  isPrintMode?: boolean;
  onCloseReference?: (() => void) | null;
  startPageNumber?: number;
  scenarioName?: string;
  episodes?: any[];
}

const ScenePaperRendererComponent = ({
  scene,
  blocks = [],
  characters = [],
  paperZoom = 1,
  isReference = false,
  isPrintMode = false,
  onCloseReference: _onCloseReference = null,
  startPageNumber = 1,
  scenarioName = 'مشروع بدون عنوان',
  episodes = []
}: ScenePaperRendererProps) => {
  const { showDebugGrid, showDebugMargins } = useUIStore();
  const currentEpisode = episodes?.find(e => e.id === scene?.episode_id);

  // Synchronous pagination calculation: guarantees pages are immediately populated on the first render,
  // which is strictly required for SSR (renderToString) during PDF export and eliminates client flicker.
  const { pages, totalPages } = useMemo(() => {
    if (!scene) return { pages: [], totalPages: 0 };
    const effectiveBlocks = (blocks && blocks.length > 0) ? blocks : (scene?.blocks || []);
    const layoutNodes = expandBlocksToLayoutNodes(effectiveBlocks, characters || []);
    return groupBlocksByPage(layoutNodes, { hasSceneHeader: true });
  }, [blocks, characters, scene]);

  if (!scene) return null;

  const scale = isPrintMode ? 1 : paperZoom;
  const PAGE_GAP = isPrintMode ? 0 : GRID.GRID_UNIT; // 28px physical gap

  // === مكوّن رسم عقدة تخطيط فردية ===
  const renderBlock = (b: any) => {
    const animClass = (!isReference && !isPrintMode) ? 'slide-in-from-bottom-2 animate-in duration-500' : '';

    if (b.type === 'action') {
      return (
        <div key={b.id} className={`paper-block paper-node-action ${animClass}`}
          dangerouslySetInnerHTML={{ __html: b.content }}
        />
      );
    }
    if (b.type === 'character') {
      return (
        <div key={b.id} className={`paper-block paper-node-character ${animClass}`}>
          {b.content}
        </div>
      );
    }
    if (b.type === 'parenthetical') {
      return (
        <div key={b.id} className={`paper-block paper-node-parenthetical ${animClass}`}>
          {b.content}
        </div>
      );
    }
    if (b.type === 'dialogue') {
      return (
        <div key={b.id} className={`paper-block paper-node-dialogue ${animClass}`}
          dangerouslySetInnerHTML={{ __html: b.content }}
        />
      );
    }
    if (b.type === 'transition') {
      return (
        <div key={b.id} className={`paper-block paper-node-transition ${animClass}`}
          dangerouslySetInnerHTML={{ __html: b.content }}
        />
      );
    }
    if (b.type === 'shot') {
      return (
        <div key={b.id} className={`paper-block paper-node-shot ${animClass}`}
          dangerouslySetInnerHTML={{ __html: b.content }}
        />
      );
    }
    if (b.type === 'audio') {
      return (
        <div key={b.id} className={`paper-block paper-node-audio ${animClass}`}>
          :: SFX - <span dangerouslySetInnerHTML={{ __html: b.content }} /> ::
        </div>
      );
    }
    if (b.type === 'directorNote') {
      return (
        <div key={b.id} className={`paper-block paper-node-director-note ${animClass}`}>
          (ملاحظة إخراجية: <span dangerouslySetInnerHTML={{ __html: b.content }} />)
        </div>
      );
    }
    if (b.type === 'textOnScreen') {
      return (
        <div key={b.id} className={`paper-block paper-node-text ${animClass}`}
          dangerouslySetInnerHTML={{ __html: b.content }}
        />
      );
    }
    return null;
  };

  // === حساب الارتفاع الكلي ===
  const totalHeight = totalPages * GRID.PAGE_HEIGHT + (totalPages - 1) * PAGE_GAP;

  const renderPagesList = () => (
    pages.map((page: any, pageIndex: number) => (
      <div
        key={pageIndex}
        className={`bg-white text-black font-sans relative rounded-[2px] overflow-hidden ${isPrintMode ? 'print-page-individual' : ''}`}
        style={{
          width: `${GRID.PAGE_WIDTH}px`,
          height: `${GRID.PAGE_HEIGHT}px`,
          overflow: 'hidden',
          direction: 'rtl',
          boxSizing: 'border-box',
        }}
      >
        {/* Episode Running Header (28px high, top 68px) */}
        {scene?.episode_id && (
          <div 
            className="absolute left-[96px] right-[96px] select-none flex items-center justify-between text-black font-sans pointer-events-none" 
            style={{ top: '68px', height: '28px', lineHeight: '28px', fontSize: '14px', boxSizing: 'border-box' }}
          >
            <div className="font-bold">
              {currentEpisode ? `الحلقة ${currentEpisode.episode_number}` : 'الحلقة ...'}
            </div>
            <div className="font-bold">
              {currentEpisode?.title ? `( ${currentEpisode.title} )` : ''}
            </div>
          </div>
        )}

        {/* Page Footer (28px high, top 1048px) */}
        <PageFooter scenarioName={scenarioName} pageNumber={startPageNumber + pageIndex} />
        {showDebugGrid && (
          <div className="absolute inset-x-[96px] pointer-events-none z-20" style={{ top: '96px', height: '924px' }}>
            {Array.from({ length: 33 }).map((_, lineIdx) => (
              <div 
                key={lineIdx} 
                className="absolute left-0 right-0 border-t border-indigo-400/25 flex items-center justify-between"
                style={{ top: `${lineIdx * 28}px`, height: '28px' }}
              >
                <span className="text-[9px] font-mono text-indigo-400/40 select-none mr-[-24px]">{lineIdx + 1}</span>
              </div>
            ))}
          </div>
        )}
        {showDebugMargins && (
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute left-0 right-0 border-b border-dashed border-rose-500/30" style={{ top: '96px' }} />
            <div className="absolute left-0 right-0 border-t border-dashed border-rose-500/30" style={{ bottom: '103px' }} />
            <div className="absolute top-0 bottom-0 border-r border-dashed border-rose-500/30" style={{ left: '96px' }} />
            <div className="absolute top-0 bottom-0 border-l border-dashed border-rose-500/30" style={{ right: '96px' }} />
            
            <div className="absolute top-[36px] left-1/2 -translate-x-1/2 bg-rose-500/10 text-rose-500 text-[10px] px-1.5 py-0.5 rounded font-sans">96px</div>
            <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2 bg-rose-500/10 text-rose-500 text-[10px] px-1.5 py-0.5 rounded font-sans">103px</div>
            <div className="absolute top-1/2 left-[30px] -translate-y-1/2 bg-rose-500/10 text-rose-500 text-[10px] px-1.5 py-0.5 rounded font-sans -rotate-90">96px</div>
            <div className="absolute top-1/2 right-[30px] -translate-y-1/2 bg-rose-500/10 text-rose-500 text-[10px] px-1.5 py-0.5 rounded font-sans rotate-90">96px</div>
          </div>
        )}

        {/* Top Margin (96px) */}
        <div style={{ height: `${GRID.MARGIN_TOP}px` }}></div>

        {/* Scene Header (Slugline) (84px) */}
        <div 
          className="select-none flex flex-col relative z-10" 
          style={{ 
            height: `${GRID.SCENE_HEADER_UNITS * GRID.GRID_UNIT}px`, 
            marginLeft: `${GRID.MARGIN_LEFT}px`,
            marginRight: `${GRID.MARGIN_RIGHT}px`,
            boxSizing: 'border-box'
          }}
        >
          <div className="flex items-center justify-between text-black border-b-[2px] border-black" style={{ fontSize: '18px', height: '28px', lineHeight: '28px', boxSizing: 'border-box' }}>
            <div className="font-bold">
              مشهد {scene.scene_number} ( ص {pageIndex + 1} ) {pageIndex > 0 && <span style={{ fontSize: '12px' }}>(تابع)</span>}
            </div>
            <div className="font-bold">( {scene.title || 'بدون عنوان'} )</div>
          </div>
          <div className="flex items-center justify-between font-bold text-black" style={{ fontSize: '14px', height: '28px', lineHeight: '28px', boxSizing: 'border-box' }}>
            <span>
              {scene.location_type === 'INT' ? 'داخلي' : scene.location_type === 'EXT' ? 'خارجي' : scene.location_type} / {scene.location_name || '...'}
            </span>
            <span className="text-right">
              {(TIME_MAP as any)[scene.time_of_day] || scene.time_of_day}
            </span>
          </div>
        </div>

        {/* Spacer between header and first block (exactly 1 line = 28px) */}
        <div style={{ height: '28px' }}></div>

        {/* Page Content area */}
        <div className="paper-content">
          {page.blocks?.map((b: any) => renderBlock(b))}

          {/* Empty state for first page with no blocks */}
          {pageIndex === 0 && !isReference && page.blocks?.length === 0 && (
            <div className="py-20 text-center text-gray-200 uppercase tracking-[1em] select-none pointer-events-none font-bold">
              Cinematic Void
            </div>
          )}
        </div>
      </div>
    ))
  );

  if (isPrintMode) {
    return (
      <div className="print-scene-pages-container">
        {renderPagesList()}
      </div>
    );
  }

  return (
    <div 
      style={{ 
        width: `${GRID.PAGE_WIDTH * scale}px`, 
        height: `${totalHeight * scale}px`,
        flexShrink: 0
      }}
      className="relative"
    >
      <div
        data-paper-wrapper="true"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${GRID.PAGE_WIDTH}px`,
        }}
        className="absolute top-0 left-0"
      >
        <div className="flex flex-col" style={{ gap: `${PAGE_GAP}px` }}>
          {renderPagesList()}
        </div>
      </div>
    </div>
  );
};

export default memo(ScenePaperRendererComponent, (prevProps, nextProps) => {
  if (prevProps.scene?.id !== nextProps.scene?.id) return false;
  if (prevProps.paperZoom !== nextProps.paperZoom) return false;
  if (prevProps.isPrintMode !== nextProps.isPrintMode) return false;
  if (prevProps.blocks !== nextProps.blocks) {
    if (prevProps.blocks?.length !== nextProps.blocks?.length) return false;
    // deep compare blocks version/content if needed, but strict equality is usually fine 
    // if immutable state updates are used (which React Query / Zustand / setState do).
  }
  return true;
});
