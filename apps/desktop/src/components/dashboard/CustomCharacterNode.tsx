import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { resolveMediaUrl } from '../../services/mediaStorage';

// Format patrilineal chain
const formatNasabChain = (chain?: string[], gender?: string): string | null => {
  if (!chain || !Array.isArray(chain) || chain.length <= 1) return null;
  let formatted = '';
  for (let i = 0; i < chain.length; i++) {
    if (i === 0) {
      formatted += chain[i];
    } else if (i === 1) {
      formatted += (gender === 'FEMALE' ? ' بنت ' : ' بن ') + chain[i];
    } else {
      formatted += ' بن ' + chain[i];
    }
  }
  return formatted;
};

export interface CustomCharacterNodeData {
  name: string;
  gender?: string;
  isDeceased?: boolean;
  nasabChain?: string[];
  role?: string;
  image?: string;
  actor_photo?: string;
  birth_date?: string;
  death_date?: string;
  traits?: string[];
  onToggleDeceased?: (id: string) => void;
  [key: string]: any;
}

export interface CustomCharacterNodeProps {
  id: string;
  data: CustomCharacterNodeData;
  selected?: boolean;
}

export default function CustomCharacterNode({ id, data, selected }: CustomCharacterNodeProps): React.JSX.Element {
  const isFemale = data.gender?.toUpperCase() === 'FEMALE';
  const isDeceased = !!data.isDeceased;
  const formattedChain = formatNasabChain(data.nasabChain, data.gender);

  const cardBorder = selected 
    ? 'border-neutral-900 ring-1 ring-neutral-900 shadow-md scale-[1.01]' 
    : 'border-neutral-200 shadow-sm';

  const cardBg = isDeceased 
    ? 'bg-neutral-50/80 text-neutral-400' 
    : 'bg-white text-neutral-800';

  return (
    <div 
      className={`relative w-60 rounded-sm ${cardBg} border ${cardBorder} transition-all duration-200 p-3 select-none`}
      dir="rtl"
    >
      {/* Top handle — receiving parents */}
      <Handle type="target" position={Position.Top} id="top" 
        className="!w-2 !h-2 !bg-transparent !border-none !opacity-0" 
      />

      {/* Hover action tray */}
      {selected && (
        <div 
          className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 flex items-center bg-neutral-900 border border-neutral-800 rounded-sm px-2 py-1 shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-150"
          style={{ animation: 'fadeSlideIn 0.15s ease-out' }}
        >
          <button
            type="button"
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider transition-colors ${
              isDeceased 
                ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' 
                : 'bg-neutral-950 hover:bg-neutral-850 text-neutral-300'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (data.onToggleDeceased) data.onToggleDeceased(id);
            }}
            title={isDeceased ? 'تعيين حي' : 'تعيين متوفى'}
          >
            <span>{isDeceased ? '✦ حي' : '✦ متوفى'}</span>
          </button>
        </div>
      )}

      {/* Deceased Indicator */}
      {isDeceased && (
        <div className="absolute top-0 left-0 w-full flex justify-center">
          <div className="bg-neutral-100 text-neutral-400 text-[7px] font-bold px-2 py-0.5 rounded-b-sm border-x border-b border-neutral-200 tracking-wider">
            {isFemale ? 'مـتـوفـاة' : 'مـتـوفـى'}
          </div>
        </div>
      )}

      {/* Main content row */}
      <div className={`flex items-center gap-3 ${isDeceased ? 'mt-1.5' : ''}`}>
        {/* Avatar */}
        <div className="relative shrink-0">
          {data.image || data.actor_photo ? (
            <img 
              src={resolveMediaUrl(data.image || data.actor_photo || '')} 
              alt={data.name} 
              className={`w-10 h-10 rounded-sm object-cover border border-neutral-200 ${isDeceased ? 'grayscale opacity-40' : ''}`}
            />
          ) : (
            <div className={`w-10 h-10 rounded-sm flex items-center justify-center text-xs font-black border border-neutral-200 ${isDeceased ? 'bg-neutral-100 text-neutral-300' : 'bg-neutral-50 text-neutral-600'}`}>
              {data.name ? data.name[0] : '؟'}
            </div>
          )}
          {/* Gender Indicator dot */}
          <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-neutral-900 text-white text-[8px] font-bold border border-white flex items-center justify-center shadow-sm">
            {isFemale ? '♀' : '♂'}
          </div>
        </div>

        {/* Text info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`font-bold text-xs tracking-wide truncate ${isDeceased ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
              {data.name}
            </span>
          </div>
          <div className={`text-[9px] ${isDeceased ? 'text-neutral-400' : 'text-neutral-500'} truncate mt-0.5 font-medium`}>
            {data.role || 'شخصية رئيسية'}
          </div>
          {/* Age / Dates */}
          {(data.birth_date || data.death_date) && (
            <div className="text-[7.5px] text-neutral-400 mt-0.5 truncate font-mono">
              {data.birth_date && <span>*{data.birth_date}</span>}
              {data.birth_date && data.death_date && <span> — </span>}
              {data.death_date && <span>†{data.death_date}</span>}
            </div>
          )}
          {/* RPG Traits */}
          {data.traits && data.traits.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {data.traits.map((t, idx) => (
                <span key={idx} className="bg-neutral-50 text-neutral-500 text-[6.5px] font-bold px-1 py-0.2 rounded-none border border-neutral-200">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nasab chain preview */}
      {formattedChain && (
        <div className={`mt-2 pt-2 border-t border-neutral-100 flex flex-col gap-0.5`}>
          <div className="text-[7px] text-neutral-400 font-bold uppercase tracking-widest">النسب:</div>
          <div className={`text-[9px] ${isDeceased ? 'text-neutral-400' : 'text-neutral-600'} font-medium truncate`} dir="rtl">
            {formattedChain}
          </div>
        </div>
      )}

      {/* Left/Right handles — sibling/marriage */}
      <Handle type="target" position={Position.Left} id="left" 
        className="!w-2 !h-2 !bg-transparent !border-none !opacity-0" 
      />
      <Handle type="source" position={Position.Left} id="left-source" 
        className="!w-2 !h-2 !bg-transparent !border-none !opacity-0" 
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />
      
      <Handle type="source" position={Position.Right} id="right" 
        className="!w-2 !h-2 !bg-transparent !border-none !opacity-0" 
      />
      <Handle type="target" position={Position.Right} id="right-target" 
        className="!w-2 !h-2 !bg-transparent !border-none !opacity-0" 
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />
      
      {/* Bottom handle — children */}
      <Handle type="source" position={Position.Bottom} id="bottom" 
        className="!w-2 !h-2 !bg-transparent !border-none !opacity-0" 
      />

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translate(-50%, 2px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
