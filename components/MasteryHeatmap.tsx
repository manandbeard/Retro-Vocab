'use client';

import React from 'react';

interface MasteryData {
  word: string;
  mastery: number; // 0 to 1
}

interface MasteryHeatmapProps {
  data: MasteryData[];
}

export default function MasteryHeatmap({ data }: MasteryHeatmapProps) {
  const getColor = (mastery: number) => {
    // Red (0) to Green (1)
    if (mastery < 0.2) return 'bg-red-600';
    if (mastery < 0.4) return 'bg-red-400';
    if (mastery < 0.6) return 'bg-yellow-500';
    if (mastery < 0.8) return 'bg-green-400';
    return 'bg-green-600';
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
      {data.map((item, idx) => (
        <div 
          key={idx}
          className={`p-3 rounded border border-white/10 flex flex-col items-center justify-center text-center transition-all hover:scale-105 cursor-help ${getColor(item.mastery)}`}
          title={`Mastery: ${Math.round(item.mastery * 100)}%`}
        >
          <span className="font-bold text-white text-sm truncate w-full">{item.word}</span>
          <span className="text-[10px] text-white/80 font-pixel">{Math.round(item.mastery * 100)}%</span>
        </div>
      ))}
      {data.length === 0 && (
        <div className="col-span-full p-8 border-2 border-dashed border-gray-800 text-center text-gray-500 font-pixel">
          NO REVIEW DATA DETECTED
        </div>
      )}
    </div>
  );
}
