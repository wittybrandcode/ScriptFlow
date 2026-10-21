import { renderToString } from 'react-dom/server';
import ScenePaperRenderer from '../components/editor/ScenePaperRenderer';
import SceneCoverPage from '../components/pdf/SceneCoverPage';
import CallSheetPage from '../components/pdf/CallSheetPage';
import { groupBlocksByPage, expandBlocksToLayoutNodes } from '../components/editor/TextMeasurementEngine';

let cachedFontFacesCss = '';
let fontsPromise: Promise<string> | null = null;

async function getEmbeddedFontsCSS(): Promise<string> {
  if (cachedFontFacesCss) return cachedFontFacesCss;
  if (fontsPromise) return fontsPromise;
  
  const timeoutPromise = new Promise<string>((resolve) => {
    setTimeout(() => {
      console.warn('[ExportPDF] Font embedding timed out (1000ms limit reached), falling back to @import');
      resolve('@import url("/fonts/font_faces.css");');
    }, 1000);
  });

  const loadFontsPromise = (async () => {
    try {
      const controller = new AbortController();
      const fetchTimer = setTimeout(() => controller.abort(), 900);
      const fontFacesRes = await fetch('/fonts/font_faces.css', { signal: controller.signal });
      clearTimeout(fetchTimer);
      if (!fontFacesRes.ok) throw new Error('Could not load font_faces.css');
      let cssText = await fontFacesRes.text();
      
      const regex = /url\(([^)]+)\)/g;
      const urls: string[] = [];
      let match;
      while ((match = regex.exec(cssText)) !== null) {
        urls.push(match[1]);
      }
      
      const urlToDataUriMap = new Map<string, string>();
      await Promise.all(
        urls.map(async (url) => {
          try {
            const fontCtrl = new AbortController();
            const fontTimer = setTimeout(() => fontCtrl.abort(), 700);
            const res = await fetch(url, { signal: fontCtrl.signal });
            clearTimeout(fontTimer);
            if (!res.ok) return;
            const blob = await res.blob();
            
            const dataUri = await new Promise<string>((resolveUri, rejectUri) => {
              const reader = new FileReader();
              const readerTimer = setTimeout(() => rejectUri(new Error('FileReader timeout')), 500);
              reader.onload = () => {
                clearTimeout(readerTimer);
                resolveUri(reader.result as string);
              };
              reader.onerror = () => {
                clearTimeout(readerTimer);
                rejectUri(reader.error);
              };
              reader.readAsDataURL(blob);
            });
            urlToDataUriMap.set(url, dataUri);
          } catch (e) {
            // Non-critical: continue without this specific font data-uri
          }
        })
      );

      for (const [url, dataUri] of urlToDataUriMap.entries()) {
        cssText = cssText.replace(url, dataUri);
      }
      
      cachedFontFacesCss = cssText;
      return cssText;
    } catch (err) {
      console.warn('[ExportPDF] Failed to embed fonts, fallback to @import / system fonts:', err);
      return '@import url("/fonts/font_faces.css");';
    } finally {
      fontsPromise = null;
    }
  })();

  fontsPromise = Promise.race([loadFontsPromise, timeoutPromise]);
  return fontsPromise;
}

export interface ExportPDFData {
  scenario: any;
  scenes: any[];
  characters?: any[];
  episodes?: any[];
  pageNumbering?: any[];
}

export interface ExportPDFOptions {
  exportType?: 'SINGLE_PDF' | 'ZIP_EPISODES' | 'CALL_SHEET' | string;
  exportLevel?: 'PROJECT' | 'EPISODE' | 'SCENE' | string;
  exportSettings?: Record<string, any>;
  startPageNumber?: number;
  scenarioName?: string;
  filterEpisodeId?: string | null;
  filterSceneId?: string | null;
  targetEntityId?: string | null;
  includeMasterCover?: boolean;
  includeEpisodeCovers?: boolean;
  includeSceneCovers?: boolean;
  coverPage?: Record<string, any>;
}

/**
 * يصدّر السيناريو إلى PDF باستخدام المحرك المحلي السريع في بيئة Tauri.
 * يدعم: ترقيم الصفحات، العلامة المائية، ألوان المراجعة، كشف الاستدعاء.
 */
export async function exportToPDF(
  { scenario, scenes, characters = [], episodes = [], pageNumbering = [] }: ExportPDFData,
  options: ExportPDFOptions = {}
): Promise<any> {
  return await exportViaPrintEngine({ scenario, scenes, characters, episodes, pageNumbering }, options);
}

/**
 * المحرك السينمائي السريع بالتصدير عبر Iframe مخفي في بيئة Tauri / Desktop
 */
async function exportViaPrintEngine(
  { scenario, scenes, characters = [], episodes = [], pageNumbering = [] }: ExportPDFData,
  options: ExportPDFOptions
): Promise<any> {
  try {
    const rawSettings = options.exportSettings || {};
    const exportSettings = {
      ...rawSettings,
      enablePageNumbers: rawSettings.enablePageNumbers !== undefined ? rawSettings.enablePageNumbers : (rawSettings.enablePagination !== undefined ? rawSettings.enablePagination : true),
      pageNumberPosition: rawSettings.pageNumberPosition || rawSettings.paginationPosition || 'bottom-center',
      enableWatermark: rawSettings.enableWatermark || false,
      watermarkText: rawSettings.watermarkText || 'سري للغاية / CONFIDENTIAL',
      watermarkOpacity: rawSettings.watermarkOpacity !== undefined ? rawSettings.watermarkOpacity : 0.08,
      revisionColor: rawSettings.revisionColor || 'WHITE',
      writerName: rawSettings.writerName || scenario?.writer_name || '',
      directorName: rawSettings.directorName || scenario?.director_name || '',
      productionCompany: rawSettings.productionCompany || '',
      revisionDraft: rawSettings.revisionDraft || '',
      revisionDate: rawSettings.revisionDate || '',
    };

    const isZipMode = options.exportType === 'ZIP_EPISODES';
    if (isZipMode) {
      alert("تصدير ZIP قيد التطوير التقني في الخلفية... سيتم تحويلك إلى تصدير PDF واحد مؤقتاً.");
    }

    let cumulativePage = options.startPageNumber || 1;
    const scenarioTitleVal = options.scenarioName || scenario?.title || scenario?.name || 'مشروع بدون عنوان';

    // 1. Resolve active level & dynamic filters
    const exportLevel = options.exportLevel || (options.filterEpisodeId ? 'EPISODE' : (options.filterSceneId || options.targetEntityId ? 'SCENE' : 'PROJECT'));
    const filterEpisodeId = options.filterEpisodeId || (exportLevel === 'EPISODE' ? options.targetEntityId : null);
    const filterSceneId = options.filterSceneId || (exportLevel === 'SCENE' ? options.targetEntityId : null);

    let filteredScenes = scenes;
    let filteredEpisodes = episodes || [];
    
    if (filterSceneId) {
      filteredScenes = scenes.filter(s => s.id === filterSceneId);
      filteredEpisodes = [];
    } else if (filterEpisodeId) {
      filteredScenes = scenes.filter(s => s.episode_id === filterEpisodeId);
      filteredEpisodes = (episodes || []).filter(e => e.id === filterEpisodeId);
    }

    // Sort scenes to match pagination order
    filteredScenes = [...filteredScenes].sort((a, b) => {
      if (a.episode_id !== b.episode_id) {
        if (!a.episode_id) return 1;
        if (!b.episode_id) return -1;
        const epA = (episodes || []).find(e => e.id === a.episode_id);
        const epB = (episodes || []).find(e => e.id === b.episode_id);
        const numA = epA ? epA.episode_number : 9999;
        const numB = epB ? epB.episode_number : 9999;
        if (numA !== numB) return numA - numB;
      }
      return (a.scene_number || 0) - (b.scene_number || 0);
    });

    // Grouping Logic
    let renderGroups: { episode: any; scenes: any[] }[] = [];
    if (filteredEpisodes && filteredEpisodes.length > 0) {
      const sortedEpisodes = [...filteredEpisodes].sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0));
      sortedEpisodes.forEach(ep => {
        const epScenes = filteredScenes
          .filter(s => s.episode_id === ep.id)
          .sort((a, b) => (a.scene_number || 0) - (b.scene_number || 0));
        renderGroups.push({ episode: ep, scenes: epScenes });
      });
      
      if (exportLevel === 'PROJECT') {
        const assignedSceneIds = new Set(renderGroups.flatMap(g => g.scenes.map(s => s.id)));
        const unassignedScenes = filteredScenes
          .filter(s => !assignedSceneIds.has(s.id))
          .sort((a, b) => (a.scene_number || 0) - (b.scene_number || 0));
        if (unassignedScenes.length > 0) {
          renderGroups.push({ episode: { episode_number: '—', title: 'مشاهد غير مصنفة' }, scenes: unassignedScenes });
        }
      }
    } else {
      renderGroups.push({ episode: null, scenes: filteredScenes });
    }

    let scenesHtml = '';

    // 1. Master Cover Page for Project
    if (exportLevel === 'PROJECT' && options.includeMasterCover) {
      cumulativePage += 1;
      scenesHtml += renderToString(
        <SceneCoverPage 
          scenarioTitle={scenarioTitleVal}
          writerName={exportSettings.writerName}
          directorName={exportSettings.directorName}
          productionCompany={exportSettings.productionCompany}
          revisionColor={exportSettings.revisionColor}
          revisionDate={exportSettings.revisionDate}
          revisionDraft={exportSettings.revisionDraft}
          itemId={scenario?.id}
          itemType="MASTER_COVER"
        />
      );
    }
    
    // 2. Scene Cover Page for Single Scene
    const shouldIncludeSceneCover = exportLevel === 'SCENE' && (
      options.includeMasterCover || 
      options.includeSceneCovers || 
      Boolean(options.coverPage) || 
      Boolean(options.exportSettings?.enableCoverPage)
    );

    if (shouldIncludeSceneCover && filteredScenes[0]) {
      const sceneCoverRec = pageNumbering?.find(r => r.item_id === filteredScenes[0].id && r.item_type === 'SCENE_COVER');
      const sceneCoverPageNum = sceneCoverRec ? sceneCoverRec.start_page : 1;
      const coverData = options.coverPage || {};
      
      scenesHtml += renderToString(
        <SceneCoverPage 
          scenarioTitle={coverData.scenarioTitle || scenarioTitleVal}
          sceneNumber={filteredScenes[0].scene_number || coverData.sceneNumber || '1'}
          sceneTitle={filteredScenes[0].title || coverData.sceneTitle || 'مشهد بدون عنوان'}
          episodeTitle={coverData.episodeTitle || ''}
          writerName={coverData.writerName || exportSettings.writerName}
          directorName={coverData.directorName || exportSettings.directorName}
          productionCompany={coverData.productionCompany || exportSettings.productionCompany}
          revisionColor={exportSettings.revisionColor}
          revisionDate={exportSettings.revisionDate}
          revisionDraft={exportSettings.revisionDraft}
          itemId={filteredScenes[0].id}
          itemType="SCENE_COVER"
          pageNumber={sceneCoverPageNum}
        />
      );
    }
    
    // 3. Render Groups (Chunked Asynchronously to prevent UI freeze)
    if (options.exportType !== 'CALL_SHEET') {
      for (let gIndex = 0; gIndex < renderGroups.length; gIndex++) {
        const group = renderGroups[gIndex];
        
        // Episode Cover Page
        if (options.includeEpisodeCovers && group.episode) {
          const epCoverRec = pageNumbering?.find(r => r.item_id === group.episode.id && r.item_type === 'EPISODE_COVER');
          const epCoverPageNum = epCoverRec ? epCoverRec.start_page : cumulativePage;
          if (!epCoverRec) cumulativePage += 1;
          
          scenesHtml += renderToString(
            <SceneCoverPage 
              scenarioTitle={scenarioTitleVal}
              episodeNumber={group.episode.episode_number}
              episodeTitle={group.episode.title}
              writerName={exportSettings.writerName}
              directorName={exportSettings.directorName}
              productionCompany={exportSettings.productionCompany}
              revisionColor={exportSettings.revisionColor}
              revisionDate={exportSettings.revisionDate}
              revisionDraft={exportSettings.revisionDraft}
              itemId={group.episode.id}
              itemType="EPISODE_COVER"
              pageNumber={epCoverPageNum}
            />
          );
        }

        // Scenes for this group
        for (let sIndex = 0; sIndex < group.scenes.length; sIndex++) {
          const scene = group.scenes[sIndex];
          const sceneBlocks = scene.blocks || [];
          const layoutNodes = expandBlocksToLayoutNodes(sceneBlocks.map((b: any) => ({
            id: b.id,
            type: b.type || 'ACTION',
            content: b.content,
            character_id: b.character_id,
            metadata: b.metadata
          })), characters);
          
          const { totalPages } = groupBlocksByPage(layoutNodes, { hasSceneHeader: true });
          const scenePageCount = totalPages || 1;
          
          const dbRecord = pageNumbering?.find(r => r.item_id === scene.id && r.item_type === 'SCENE');
          const currentSceneStartPage = dbRecord ? dbRecord.start_page : cumulativePage;
          
          cumulativePage = currentSceneStartPage + scenePageCount;
          const sceneEpisode = group.episode || (episodes && episodes.find(e => e.id === scene.episode_id));

          let sceneChunkHtml = '';

          // Scene Cover Page
          if (options.includeSceneCovers) {
            const innerSceneCoverRec = pageNumbering?.find(r => r.item_id === scene.id && r.item_type === 'SCENE_COVER');
            const innerSceneCoverPageNum = innerSceneCoverRec ? innerSceneCoverRec.start_page : cumulativePage;
            if (!innerSceneCoverRec) cumulativePage += 1;
            
            sceneChunkHtml += renderToString(
              <SceneCoverPage 
                scenarioTitle={scenarioTitleVal}
                episodeNumber={sceneEpisode?.episode_number}
                episodeTitle={sceneEpisode?.title}
                sceneNumber={scene.scene_number}
                sceneTitle={scene.title}
                writerName={exportSettings.writerName}
                directorName={exportSettings.directorName}
                productionCompany={exportSettings.productionCompany}
                itemId={scene.id}
                itemType="SCENE_COVER"
                pageNumber={innerSceneCoverPageNum}
              />
            );
          }

          // Main Scene Pages
          sceneChunkHtml += renderToString(
            <ScenePaperRenderer 
              scene={scene}
              blocks={sceneBlocks}
              characters={characters}
              episodes={episodes}
              isPrintMode={true}
              scenarioName={scenarioTitleVal}
              startPageNumber={currentSceneStartPage}
            />
          );

          scenesHtml += sceneChunkHtml;
          
          // Yield to main thread after every scene to prevent UI freezing
          if (typeof (globalThis as any).scheduler?.yield === 'function') {
            await (globalThis as any).scheduler.yield();
          } else {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      }
    }

    // 4. Call Sheet Page Option
    if (options.exportType === 'CALL_SHEET') {
      scenesHtml += renderToString(
        <CallSheetPage 
          scenarioTitle={scenarioTitleVal}
          scenes={filteredScenes}
          characters={characters}
          settings={options.exportSettings || {}}
        />
      );
    }

    // Ultra-fast style extraction (10ms)
    const styleElements = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    const watermarkHtml = exportSettings.enableWatermark ? `
      <div class="watermark" style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 5rem;
        font-weight: 900;
        color: rgba(0, 0, 0, ${exportSettings.watermarkOpacity});
        pointer-events: none;
        white-space: nowrap;
        z-index: 9999;
        text-transform: uppercase;
        letter-spacing: 0.2em;
      ">
        ${exportSettings.watermarkText}
      </div>
    ` : '';

    const embeddedFontsHtml = await getEmbeddedFontsCSS();

    const htmlDocument = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>${scenarioTitleVal} - PDF Export</title>
          ${styleElements}
          <style>
            ${embeddedFontsHtml}
            
            @page {
              size: A4 portrait;
              margin: 0 !important;
            }

            @media print {
              html, body {
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              .print-scene-pages-container {
                display: block !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              .print-page-individual {
                width: 794px !important;
                height: 1123px !important;
                max-height: 1123px !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                padding: 0 !important;
                page-break-after: always !important;
                break-after: page !important;
                position: relative !important;
                overflow: hidden !important;
                background: white !important;
              }

              .cover-page {
                width: 794px !important;
                height: 1123px !important;
                max-height: 1123px !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                padding: 0 !important;
                page-break-after: always !important;
                break-after: page !important;
                position: relative !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
              }

              body::before, body::after,
              .print-page-individual::before, .print-page-individual::after {
                display: none !important;
                content: "" !important;
              }
            }

            .print-page-individual {
              width: 794px;
              height: 1123px;
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              page-break-after: always;
              break-after: page;
              position: relative;
              overflow: hidden;
              background: white;
            }

            .paper-content {
              min-height: auto !important;
              box-sizing: border-box !important;
            }

            body {
              margin: 0;
              padding: 0;
              font-family: 'IBM Plex Sans Arabic', sans-serif;
              background-color: #ffffff;
            }

            .print-wrapper {
              display: block;
              width: 794px;
              margin: 0 auto;
              padding: 0;
            }

            .cover-page {
              width: 794px;
              height: 1123px;
              background-color: white;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              position: relative;
              box-sizing: border-box;
              page-break-after: always;
              break-after: page;
            }
          </style>
        </head>
        <body>
          ${watermarkHtml}
          <div class="print-wrapper">
            ${scenesHtml}
          </div>
        </body>
      </html>
    `;

    // Fast, non-blocking hidden iframe print engine for Tauri / WebView2
    let printIframe = document.getElementById('scriptflow-print-iframe') as HTMLIFrameElement;
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'scriptflow-print-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0px';
      printIframe.style.height = '0px';
      printIframe.style.border = 'none';
      printIframe.style.opacity = '0';
      printIframe.style.pointerEvents = 'none';
      printIframe.style.zIndex = '-9999';
      document.body.appendChild(printIframe);
    }

    const iframeDoc = printIframe.contentWindow?.document || printIframe.contentDocument;
    if (!iframeDoc) {
      throw new Error('تعذر إعداد إطار التصدير في بيئة التطبيق');
    }

    iframeDoc.open();
    iframeDoc.write(htmlDocument);
    iframeDoc.close();

    // Trigger printing smoothly inside iframe and decouple promise resolution so modals close cleanly
    setTimeout(() => {
      try {
        const iframeWindow = printIframe.contentWindow;
        if (iframeWindow) {
          iframeWindow.focus();
          
          // Clean up iframe DOM and HTML contents after print dialog closes to prevent memory leaks
          const cleanupIframeMemory = () => {
            try {
              if (iframeDoc) {
                iframeDoc.open();
                iframeDoc.write('<!DOCTYPE html><html><body></body></html>');
                iframeDoc.close();
              }
            } catch (_) {
              // Ignore cleanup errors
            }
          };

          // Use onafterprint if supported by browser/WebView2
          iframeWindow.onafterprint = cleanupIframeMemory;
          iframeWindow.print();

          // Safety cleanup fallback timer (reclaims memory after 12s if onafterprint does not trigger)
          setTimeout(cleanupIframeMemory, 12000);
        }
      } catch (printErr) {
        console.error('[ExportPDF] Print error:', printErr);
      }
    }, 250);

    return { success: true, count: filteredScenes.length };
  } catch (error) {
    console.error('[ExportPDF] Failed to export PDF:', error);
    // Cleanup any lingering iframe content on error
    try {
      const printIframe = document.getElementById('scriptflow-print-iframe') as HTMLIFrameElement;
      const iframeDoc = printIframe?.contentWindow?.document || printIframe?.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write('<!DOCTYPE html><html><body></body></html>');
        iframeDoc.close();
      }
    } catch (_) {}
    throw error;
  }
}
