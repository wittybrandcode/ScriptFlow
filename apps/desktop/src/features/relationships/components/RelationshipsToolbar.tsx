import React, { useRef } from 'react';
import { Users, Activity, Plus, Trash2, Loader2, Download, Upload } from 'lucide-react';
import { biologicalTypes, dramaticTypes } from '../utils/typeRegistry';
import PartnerSelects from './PartnerSelects';

export interface RelationshipsToolbarProps {
  viewMode: string;
  setViewMode: (mode: string) => void;
  characters?: any[];
  rawEdges?: any[];
  partner1: string | number;
  setPartner1: (val: any) => void;
  partner2: string | number;
  setPartner2: (val: any) => void;
  relType: string;
  setRelType: (val: any) => void;
  showAllRelTypes: boolean;
  setShowAllRelTypes: (val: boolean) => void;
  onPartner1Change: (val: any) => void;
  handleAddPartner: (isBypass?: boolean) => void;
  handleRemoveEdge: (edgeId: string | number) => void;
  handleExportGedcom?: () => void;
  handleImportGedcom?: (file: File) => void;
  addingPartner?: boolean;
}

export default function RelationshipsToolbar({
  viewMode,
  setViewMode,
  characters = [],
  rawEdges = [],
  partner1,
  setPartner1,
  partner2,
  setPartner2,
  relType,
  setRelType,
  showAllRelTypes,
  setShowAllRelTypes,
  onPartner1Change,
  handleAddPartner,
  handleRemoveEdge,
  handleExportGedcom,
  handleImportGedcom,
  addingPartner
}: RelationshipsToolbarProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && handleImportGedcom) {
      handleImportGedcom(file);
    }
    // reset input
    e.target.value = '';
  };
  
  return (
    <div className="shrink-0 bg-white border-b border-neutral-200 px-4 py-3 z-20 flex justify-between items-center" dir="rtl">
      <div className="flex items-center gap-3 flex-wrap">
        {/* View Toggle */}
        <div className="bg-neutral-50 rounded-sm p-1 flex items-center border border-neutral-200 shadow-sm">
          <button 
            type="button"
            onClick={() => { setViewMode('BIOLOGICAL'); setRelType(biologicalTypes[0]?.id || ''); }}
            className={`flex items-center gap-1.5 text-xs font-black py-1.5 px-3 rounded-sm transition-all ${viewMode === 'BIOLOGICAL' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}`}
          >
            <Users size={13} /> البيولوجية
          </button>
          <button 
            type="button"
            onClick={() => { setViewMode('DRAMATIC'); setRelType(dramaticTypes[0]?.id || ''); }}
            className={`flex items-center gap-1.5 text-xs font-black py-1.5 px-3 rounded-sm transition-all ${viewMode === 'DRAMATIC' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}`}
          >
            <Activity size={13} /> الدرامية
          </button>
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-neutral-200 shrink-0" />

        {/* Add Form - PartnerSelects */}
        <PartnerSelects
          viewMode={viewMode}
          characters={characters}
          rawEdges={rawEdges}
          partner1={partner1} 
          setPartner1={setPartner1}
          partner2={partner2} 
          setPartner2={setPartner2}
          relType={relType} 
          setRelType={setRelType}
          showAllRelTypes={showAllRelTypes} 
          setShowAllRelTypes={setShowAllRelTypes}
          onPartner1Change={onPartner1Change}
        />

        {(() => {
          const p1 = String(partner1);
          const p2 = String(partner2);
          
          const allTypes = viewMode === 'BIOLOGICAL' ? biologicalTypes : dramaticTypes;
          const existingEdge = partner1 && partner2 ? rawEdges.find((e: any) => {
            if (e.data?.category !== viewMode) return false;
            let eType = e.data?.relType;
            if (eType === 'FATHER') eType = 'FATHER_OF';
            if (eType === 'MOTHER') eType = 'MOTHER_OF';
            
            const isDirect = (String(e.source) === p1 && String(e.target) === p2 && eType === relType);
            
            const actualEdgeTypeInfo = allTypes.find(t => t.id === eType);
            const edgeInverseType = actualEdgeTypeInfo?.inverseId;
            const isInverse = (String(e.target) === p1 && String(e.source) === p2 && edgeInverseType === relType);
            
            return isDirect || isInverse;
          }) : null;

          if (existingEdge) {
            return (
              <button 
                type="button"
                onClick={() => handleRemoveEdge(existingEdge.id)}
                className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 font-black py-1.5 px-4 rounded-sm text-xs transition-colors flex items-center gap-1.5 h-8"
              >
                <Trash2 size={14} /> فك الربط
              </button>
            );
          }

          return (
            <button 
              type="button"
              onClick={() => handleAddPartner(false)}
              disabled={!partner1 || !partner2 || partner1 === partner2 || addingPartner}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-black py-1.5 px-4 rounded-sm text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 h-8"
            >
              {addingPartner ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> ربط</>}
            </button>
          );
        })()}

      </div>

      <div className="flex items-center gap-2">
        <input 
          type="file" 
          accept=".ged" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={onFileChange} 
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-white text-neutral-800 hover:bg-neutral-50 font-black py-1.5 px-3 rounded-sm text-xs transition-colors flex items-center gap-1.5 h-8 shadow-sm border border-neutral-200"
          title="استيراد ملف GEDCOM"
        >
          <Upload size={14} /> استيراد
        </button>
        <button 
          type="button"
          onClick={() => handleExportGedcom && handleExportGedcom()}
          className="bg-white text-neutral-800 hover:bg-neutral-50 font-black py-1.5 px-3 rounded-sm text-xs transition-colors flex items-center gap-1.5 h-8 shadow-sm border border-neutral-200"
          title="تصدير شجرة العائلة كملف GEDCOM"
        >
          <Download size={14} /> تصدير
        </button>
      </div>
    </div>
  );
}
