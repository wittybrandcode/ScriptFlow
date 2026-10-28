import React from 'react';
import { Trash2 } from 'lucide-react';

export interface EdgeListProps {
  edges: any[];
  rawNodes: any[];
  partner1?: string | number | null;
  onEdgeClick: (edge: any) => void;
  handleRemoveEdge: (edgeId: string | number) => void;
}

export default function EdgeList({
  edges,
  rawNodes,
  partner1,
  onEdgeClick,
  handleRemoveEdge
}: EdgeListProps): React.JSX.Element | null {
  const displayedEdges = partner1 
    ? edges.filter((e: any) => String(e.source) === String(partner1) || String(e.target) === String(partner1)) 
    : edges;

  if (displayedEdges.length === 0) return null;

  return (
    <>
      <span className="text-[10px] font-bold text-muted-foreground shrink-0">
        الروابط ({displayedEdges.length}) {partner1 ? 'للمحدد' : ''}
      </span>
      {displayedEdges.map((edge: any) => {
        const s = rawNodes.find((n: any) => String(n.id) === String(edge.source))?.data?.name || edge.source;
        const t = rawNodes.find((n: any) => String(n.id) === String(edge.target))?.data?.name || edge.target;
        return (
          <div 
            key={edge.id} 
            onClick={() => onEdgeClick(edge)}
            className="shrink-0 flex items-center gap-1.5 bg-background border border-border rounded-lg px-2 py-1 group hover:border-primary/40 transition-colors cursor-pointer"
          >
            <span 
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white leading-none ${
                edge.data?.isMarriage ? 'bg-neutral-500' :
                edge.data?.isSibling ? 'bg-neutral-600' :
                edge.data?.category === 'DRAMATIC' ? 'bg-zinc-800' : 'bg-neutral-800'
              }`}
            >
              {edge.label || edge.data?.label || edge.type}
            </span>
            <span className="text-[10px] text-foreground font-medium">{s} ← {t}</span>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemoveEdge(edge.id); }}
              className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded p-0.5 transition-colors ml-1"
              title="فك العلاقة"
            >
              <Trash2 size={11} />
            </button>
          </div>
        );
      })}
    </>
  );
}
