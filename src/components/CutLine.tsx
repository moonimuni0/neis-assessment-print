import React from 'react';
import { Scissors } from 'lucide-react';

interface CutLineProps {
  className?: string;
}

export const CutLine: React.FC<CutLineProps> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center my-3 select-none ${className}`}>
      {/* 점선 */}
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t-2 border-dashed border-slate-400" />
      </div>
      
      {/* 절취선 배지 */}
      <div className="relative px-3 bg-white text-xs text-slate-500 font-medium flex items-center gap-1.5 border border-slate-300 rounded-full shadow-xs">
        <Scissors className="w-3.5 h-3.5 transform -rotate-90 text-slate-600" />
        <span className="tracking-widest">자 르 는 선 (절 취 선)</span>
        <Scissors className="w-3.5 h-3.5 transform rotate-90 text-slate-600" />
      </div>
    </div>
  );
};
