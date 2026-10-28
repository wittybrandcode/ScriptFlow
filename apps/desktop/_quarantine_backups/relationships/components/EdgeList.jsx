import React from 'react';
import { Trash2 } from 'lucide-react';

export default function EdgeList({ edges, rawNodes, partner1, onEdgeClick, handleRemoveEdge }) {
  const displayedEdges = partner1 
    ? edges.filter(e => e.source === partner1 || e.target === partner1) 
    : edges;

  if (displayedEdges.length === 0) return null;

  return (
    <>
      <span className="text-[10px] font-bold text-muted-foreground shrink-0">
        الروابط ({displayedEdges.length}) {partner1 ? 'للمحدد' : ''}
      </span>
      {displayedEdges.map(edge => {
        const s = rawNodes.find(n => n.id === edge.source)?.data.name;
        const t = rawNodes.find(n => n.id === edge.target)?.data.name;
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
