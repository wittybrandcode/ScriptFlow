import React from 'react';
import { biologicalTypes, dramaticTypes } from '../utils/typeRegistry';
import { KinshipValidator } from 'nasab';

export interface PartnerSelectsProps {
  viewMode: string;
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
}

export default function PartnerSelects({
  viewMode,
  characters = [],
  rawEdges = [],
  partner1,
  partner2,
  setPartner2,
  relType,
  setRelType,
  showAllRelTypes,
  setShowAllRelTypes,
  onPartner1Change
}: PartnerSelectsProps): React.JSX.Element {

  return (
    <>
      <select 
        value={partner1} 
        onChange={e => onPartner1Change(e.target.value)} 
        className="bg-white border border-neutral-200 rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-neutral-900 min-w-[130px] font-medium"
      >
        <option value="">الشخصية الأولى...</option>
        {characters?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      
      <select 
        value={relType} 
        onChange={e => {
          if (e.target.value === 'SHOW_ALL') {
            setShowAllRelTypes(true);
          } else {
            setRelType(e.target.value);
          }
        }} 
        className="bg-white border border-neutral-200 rounded-sm px-2 py-1.5 text-xs font-black focus:outline-none focus:border-neutral-900 min-w-[140px]"
      >
        {(() => {
          const allTypes = viewMode === 'BIOLOGICAL' ? biologicalTypes : dramaticTypes;
          
          const p1PerspectiveTypes = new Set<string>();
          if (partner1) {
            rawEdges.forEach((e: any) => {
              if (e.data?.category !== viewMode) return;
              let edgeType = e.data?.relType;
              if (edgeType === 'FATHER') edgeType = 'FATHER_OF';
              if (edgeType === 'MOTHER') edgeType = 'MOTHER_OF';
              if (edgeType === 'SIBLING_INFERRED') edgeType = 'SIBLING_OF';
              
              if (String(e.source) === String(partner1)) {
                p1PerspectiveTypes.add(edgeType);
              } else if (String(e.target) === String(partner1)) {
                const typeInfo = allTypes.find(t => t.id === edgeType);
                if (typeInfo && typeInfo.inverseId) {
                  p1PerspectiveTypes.add(typeInfo.inverseId);
                } else if (edgeType === 'SIBLING_OF') {
                  p1PerspectiveTypes.add('SIBLING_OF');
                }
              }
            });
          }

          const potentialDisplayedTypes = allTypes.filter(t => p1PerspectiveTypes.has(t.id));
          const shouldFilter = partner1 && !showAllRelTypes && potentialDisplayedTypes.length > 0;
          let displayedTypes = shouldFilter ? potentialDisplayedTypes : allTypes;

          if (partner1 && viewMode === 'BIOLOGICAL') {
            const p1Char = characters?.find(c => String(c.id) === String(partner1));
            const p1Gender = p1Char?.gender?.toUpperCase() || 'MALE';
            displayedTypes = displayedTypes.filter(t => !t.sourceGender || t.sourceGender === p1Gender);
          }

          return (
            <>
              <option value="">نوع العلاقة...</option>
              {displayedTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              {shouldFilter && (
                <>
                  <option disabled>──────────</option>
                  <option value="SHOW_ALL" className="text-neutral-900 font-bold">➕ إظهار الكل (لإضافة جديد)</option>
                </>
              )}
            </>
          );
        })()}
      </select>

      <select 
        value={partner2} 
        onChange={e => setPartner2(e.target.value)} 
        className="bg-white border border-neutral-200 rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-neutral-900 min-w-[130px] font-medium"
      >
        {(() => {
          const p1 = String(partner1);
          const allTypes = viewMode === 'BIOLOGICAL' ? biologicalTypes : dramaticTypes;
          
          const p1PerspectiveTypes = new Set<string>();
          rawEdges.forEach((e: any) => {
            if (e.data?.category !== viewMode) return;
            let edgeType = e.data?.relType;
            if (edgeType === 'FATHER') edgeType = 'FATHER_OF';
            if (edgeType === 'MOTHER') edgeType = 'MOTHER_OF';
            if (edgeType === 'SIBLING_INFERRED') edgeType = 'SIBLING_OF';
            if (String(e.source) === p1) p1PerspectiveTypes.add(edgeType);
            else if (String(e.target) === p1) {
              const tInfo = allTypes.find(t => t.id === edgeType);
              if (tInfo?.inverseId) p1PerspectiveTypes.add(tInfo.inverseId);
              else if (edgeType === 'SIBLING_OF') p1PerspectiveTypes.add('SIBLING_OF');
            }
          });
          
          const isFilterMode = p1 && !showAllRelTypes && p1PerspectiveTypes.size > 0;

          let nasabNodes: any[] = [];
          let nasabEdges: any[] = [];
          if (viewMode === 'BIOLOGICAL' && relType) {
            nasabNodes = characters?.map(c => ({
              id: String(c.id),
              name: c.name,
              gender: (c.gender || 'MALE').toUpperCase(),
              birthDate: c.birth_date,
              deathDate: c.death_date,
              isDeceased: !!c.is_deceased
            })) || [];
            
            nasabEdges = rawEdges.filter((e: any) => e.data?.category === 'BIOLOGICAL' && !e.data?.isInferred).map((e: any) => ({
              sourceId: String(e.source),
              targetId: String(e.target),
              type: e.data?.relType || 'INFERRED'
            }));
          }

          return (
            <>
              {(!isFilterMode || !partner2) && <option value="">{isFilterMode ? "اختر الشخص المرتبط..." : "الشخصية الثانية..."}</option>}
              {characters?.map(c => {
                const cId = String(c.id);
                if (cId === p1) return null;

                let validationError: string | null = null;
                let validationWarning: string | null = null;
                if (viewMode === 'BIOLOGICAL' && relType && nasabNodes.length > 0) {
                   const result = KinshipValidator.validate(p1, cId, relType, nasabNodes, nasabEdges, 'DRAMATIC');
                   if (result.status === 'ERROR') {
                     validationError = result.error?.message || 'خطأ في العلاقة';
                   } else if (result.status === 'WARNING') {
                     validationWarning = result.error?.message ? `تحذير: ${result.error.message}` : 'تحذير';
                   }
                }

                let hasLink = false;
                if (relType && relType.includes('SIBLING') && viewMode === 'BIOLOGICAL') {
                  const getParents = (id: string) => rawEdges
                    .filter((e: any) => (e.data?.relType === 'PARENT_MALE' || e.data?.relType === 'PARENT_FEMALE') && String(e.target) === String(id))
                    .map((e: any) => String(e.source));
                  const p1Parents = getParents(p1);
                  const cParents = getParents(cId);
                  hasLink = p1Parents.length > 0 && p1Parents.some(p => cParents.includes(p));
                } else {
                  hasLink = rawEdges.some((e: any) => {
                    if (e.data?.category !== viewMode) return false;
                    const isDirect = (String(e.source) === p1 && String(e.target) === cId && e.data?.relType === relType);
                    const existsAny = (String(e.source) === p1 && String(e.target) === cId) || (String(e.source) === cId && String(e.target) === p1);
                    return isDirect || existsAny;
                  });
                }

                if (validationError && !hasLink) return null;

                const isDisabled = hasLink || !!validationError;
                
                let statusText = '';
                if (hasLink) statusText = ' ✓ (مرتبط)';
                else if (validationError) statusText = `(${validationError})`;
                else if (validationWarning) statusText = `(${validationWarning})`;

                const displayLabel = `${c.name} ${statusText}`;

                return (
                  <option key={c.id} value={c.id} disabled={isDisabled}>
                    {displayLabel}
                  </option>
                );
              })}
            </>
          );
        })()}
      </select>
    </>
  );
}
