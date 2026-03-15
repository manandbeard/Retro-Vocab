'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (classIds: string[]) => void;
  classes: any[];
  cardName: string;
}

export default function AssignModal({ isOpen, onClose, onAssign, classes, cardName }: AssignModalProps) {
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleClass = (id: string) => {
    setSelectedClasses(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-[#14141E] border-2 border-[#00FFD5] p-8 space-y-8 relative"
        style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="space-y-2">
          <h2 className="font-pixel text-xl text-[#00FFD5]">ASSIGN CONTENT</h2>
          <p className="text-xs text-gray-500 font-mono uppercase">Assigning: {cardName}</p>
        </div>

        <div className="space-y-4">
          <label className="font-pixel text-[10px] text-gray-400 uppercase">Select Classes</label>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => toggleClass(cls.id)}
                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                  selectedClasses.includes(cls.id) 
                    ? 'bg-[#00FFD5]/10 border-[#00FFD5] text-[#00FFD5]' 
                    : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20'
                }`}
              >
                <span className="font-bold text-sm">{cls.class_name}</span>
                {selectedClasses.includes(cls.id) && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onAssign(selectedClasses)}
          disabled={selectedClasses.length === 0}
          className="w-full py-4 bg-[#00FFD5] text-[#0A0A0F] font-pixel text-sm hover:bg-white transition-all disabled:opacity-50"
          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
        >
          CONFIRM ASSIGNMENT
        </button>
      </div>
    </div>
  );
}
