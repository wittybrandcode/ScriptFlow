import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function UnionNode({ data, selected }) {
  return (
    <div className="relative flex items-center justify-center w-5 h-5 rounded-full border border-neutral-300 bg-white shadow-sm hover:scale-105 transition-all duration-300 z-10 select-none">
      {/* Left parent handle */}
      <Handle type="target" position={Position.Left} id="left-parent" 
        className="!w-2 !h-2 !bg-transparent !border-none !opacity-0" 
      />
      {/* Right parent handle */}
      <Handle type="target" position={Position.Right} id="right-parent" 
        className="!w-2 !h-2 !bg-transparent !border-none !opacity-0" 
      />
      {/* Top handle (hidden) */}
      <Handle type="target" position={Position.Top} id="top-parent" className="!w-1 !h-1 !opacity-0" />
      
      {/* Tiny clean dot instead of big colorful heart */}
      <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />

      {/* Bottom child handle */}
      <Handle type="source" position={Position.Bottom} id="bottom-child" 
        className="!w-2 !h-2 !bg-transparent !border-none !opacity-0" 
      />
    </div>
  );
}
