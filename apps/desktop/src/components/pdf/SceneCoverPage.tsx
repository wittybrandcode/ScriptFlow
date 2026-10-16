import React from 'react';
import { formatDate } from '../../utils/dateUtils';
import PageFooter from './PageFooter';

const REVISION_COLORS_MAP: Record<string, { bg: string; text: string }> = {
  WHITE: { bg: '#FFFFFF', text: '#000' },
  BLUE: { bg: '#CCEEFF', text: '#003366' },
  PINK: { bg: '#FFD6E0', text: '#660033' },
  YELLOW: { bg: '#FFF9C4', text: '#6D5D00' },
  GREEN: { bg: '#C8E6C9', text: '#1B5E20' },
  GOLDENROD: { bg: '#FFE082', text: '#5D4037' },
  SALMON: { bg: '#FFAB91', text: '#BF360C' },
  CHERRY: { bg: '#F48FB1', text: '#880E4F' },
  TAN: { bg: '#D7CCC8', text: '#3E2723' },
};

export interface SceneCoverPageProps {
  scenarioTitle?: string;
  directorName?: string;
  episodeNumber?: number | string;
  episodeTitle?: string;
  sceneNumber?: number | string;
  sceneTitle?: string;
  writerName?: string;
  productionCompany?: string;
  revisionColor?: string;
  revisionDate?: string;
  revisionDraft?: string;
  itemId?: string;
  itemType?: string;
  pageNumber?: number | null;
}

export default function SceneCoverPage({ 
  scenarioTitle, 
  directorName, 
  episodeNumber,
  episodeTitle, 
  sceneNumber, 
  sceneTitle,
  writerName,
  productionCompany,
  revisionColor = 'WHITE',
  revisionDate,
  revisionDraft,
  itemId,
  itemType,
  pageNumber
}: SceneCoverPageProps) {
  const revision = REVISION_COLORS_MAP[revisionColor] || REVISION_COLORS_MAP.WHITE;
  const hasRevisionInfo = revisionDate || revisionDraft;
  
  return (
    <div className="cover-page" style={{ backgroundColor: revision.bg }} data-item-id={itemId} data-item-type={itemType}>
      <div className="text-center max-w-2xl mx-auto space-y-8 px-16 w-full" style={{ color: revision.text }}>
        
        {/* Production Company */}
        {productionCompany && (
          <div className="mb-4">
            <p className="text-sm font-bold tracking-[0.15em] uppercase opacity-60">{productionCompany}</p>
            <div className="w-12 h-[1px] bg-current opacity-20 mx-auto mt-2" />
          </div>
        )}

        {/* Project Title (Largest) */}
        {scenarioTitle && (
          <div className="mb-10">
            <h1 className="text-5xl font-black leading-tight">{scenarioTitle}</h1>
          </div>
        )}

        {/* Episode Info (Episode number in small size, title in larger size but less than Project Title) */}
        {(episodeNumber || episodeTitle) && (
          <div className="space-y-1 mb-6">
            {episodeNumber && (
              <p className="text-xs font-bold opacity-60 uppercase tracking-wider">الحلقة {episodeNumber}</p>
            )}
            {episodeTitle && (
              <h2 className="text-2xl font-black leading-tight">"{episodeTitle}"</h2>
            )}
          </div>
        )}

        {/* Scene Info (Scene number in small size, title in larger size but less than Project Title) */}
        {(sceneNumber || sceneTitle) && (
          <div className="space-y-1 mb-6">
            {sceneNumber && (
              <p className="text-xs font-bold opacity-60 uppercase tracking-wider">المشهد {sceneNumber}</p>
            )}
            {sceneTitle && (
              <h3 className="text-2xl font-black leading-tight">"{sceneTitle}"</h3>
            )}
          </div>
        )}

        {/* Director and Writer Info */}
        {(directorName || writerName) && (
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-current/10 max-w-md mx-auto">
            {directorName && (
              <p className="text-sm font-bold opacity-75">إخراج: {directorName}</p>
            )}
            {writerName && (
              <p className="text-sm font-bold opacity-75">تأليف: {writerName}</p>
            )}
          </div>
        )}

        {/* Revision Info */}
        {hasRevisionInfo && (
          <div className="pt-6">
            <div className="inline-flex items-center gap-4 border rounded-lg px-5 py-2 opacity-60" style={{ borderColor: revision.text + '30' }}>
              {revisionDraft && (
                <span className="text-xs font-bold">المسودة #{revisionDraft}</span>
              )}
              {revisionDate && (
                <span className="text-xs font-medium">
                  {formatDate(revisionDate, 'd MMMM yyyy')}
                </span>
              )}
              {revisionColor !== 'WHITE' && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: revision.text + '15' }}>
                  {revisionColor}
                </span>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Thin Signature at the bottom: SCRIPTFLOW only */}
      <div className="absolute bottom-16 left-0 right-0 text-center">
        <p className="text-sm font-[200] tracking-[0.3em] uppercase" style={{ color: revision.text, opacity: 0.4 }}>
          SCRIPTFLOW
        </p>
      </div>

      {itemType !== 'MASTER_COVER' && (
        <PageFooter scenarioName={scenarioTitle} pageNumber={pageNumber} />
      )}
    </div>
  );
}
