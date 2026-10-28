import React from 'react';
import { getSmoothStepPath, EdgeLabelRenderer, EdgeProps } from '@xyflow/react';

export default function CustomRelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps): React.JSX.Element {
  const { category, relType, label, isSibling, isMarriage } = (data || {}) as Record<string, any>;
  const isInferred = category === 'INFERRED' || category === 'INFERRED_CO_PARENT';
  const isDramatic = category === 'DRAMATIC';

  // Always use sharp orthogonal step paths (borderRadius: 0) for an architectural drawing style
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0, // Sharp right-angle corners
  });

  // Modern Monochromatic Blueprint Palette
  let strokeColor = '#18181b'; // Charcoal for primary lineage
  let strokeWidth = 1.2;
  let strokeDash = 'none';

  if (isInferred) {
    strokeColor = '#a1a1aa'; // Muted gray
    strokeWidth = 1.0;
    strokeDash = '3 3'; // Dotted/dashed
  } else if (isDramatic) {
    strokeColor = '#52525b'; // Zinc gray
    strokeWidth = 1.2;
    strokeDash = '4 3';
  } else if (isMarriage) {
    strokeColor = '#71717a'; // Marriage line
    strokeWidth = 1.5;
  } else if (isSibling) {
    strokeColor = '#3f3f46'; // Sibling line
    strokeWidth = 1.2;
  }

  const updatedStyle: React.CSSProperties = {
    ...style,
    stroke: strokeColor,
    strokeWidth,
    strokeDasharray: strokeDash,
  };

  // Select relationship symbol for architectural legend look
  let icon = '◆'; // Default lineage parent-child
  let labelBgBorder = 'border-neutral-900';

  if (isMarriage) {
    icon = '⚭'; // Marriage symbol
    labelBgBorder = 'border-neutral-500';
  } else if (isSibling) {
    icon = '⚬'; // Sibling dot
    labelBgBorder = 'border-neutral-400';
  } else if (isDramatic) {
    icon = '✦'; // Dramatic dynamic action
    labelBgBorder = 'border-neutral-700';
  }

  // Clear directional marker for sibling and marriage relations (mutual, not hierarchical)
  const finalMarkerEnd = (isSibling || isMarriage) ? undefined : markerEnd;

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path cursor-pointer transition-all duration-300 hover:stroke-[2px]"
        d={edgePath}
        markerEnd={finalMarkerEnd}
        style={updatedStyle}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan select-none"
        >
          {/* Swiss-style Flat Capsule */}
          <div 
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-none border-[0.5px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${labelBgBorder} transition-all duration-200 hover:shadow-md`}
          >
            {/* Symbol indicator */}
            <span className="text-[7px] font-bold opacity-60 font-mono select-none">
              {icon}
            </span>
            
            {/* Relationship Label Text */}
            <span 
              className="text-[7.5px] font-extrabold tracking-widest text-neutral-900 font-sans"
              dir="rtl"
            >
              {(label as string) || (relType as string)}
            </span>

            {/* Inferred Badge */}
            {isInferred && (
              <span className="text-[5.5px] tracking-normal bg-neutral-100 text-neutral-500 px-1 py-0.2 rounded-none border-[0.5px] border-neutral-300 font-bold font-mono uppercase">
                INF
              </span>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
