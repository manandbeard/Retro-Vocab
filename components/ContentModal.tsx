'use client';

import { useState } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  classes: any[];
}

export default function ContentModal({ isOpen, onClose, onSave, classes }: ContentModalProps) {
  const [formData, setFormData] = useState({
    vocabulary_word: '',
    definition: '',
    question_type: 'vocabulary',
    passage: '',
    example: '',
    part_of_speech: '',
    assignToClasses: [] as string[]
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    onClose();
  };

  const toggleClass = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      assignToClasses: prev.assignToClasses.includes(classId)
        ? prev.assignToClasses.filter(id => id !== classId)
        : [...prev.assignToClasses, classId]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#14141E] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <header className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-pixel text-lg text-[#00FFD5]">CREATE_NEW_CONTENT</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-pixel text-gray-500 uppercase">Word / Question</label>
              <input 
                required
                value={formData.vocabulary_word}
                onChange={e => setFormData({...formData, vocabulary_word: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 focus:border-[#00FFD5] outline-none transition-all"
                placeholder="e.g. Ephemeral"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-pixel text-gray-500 uppercase">Question Type</label>
              <select 
                value={formData.question_type}
                onChange={e => setFormData({...formData, question_type: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 focus:border-[#00FFD5] outline-none transition-all"
              >
                <option value="vocabulary">Vocabulary</option>
                <option value="reading">Reading Comprehension</option>
                <option value="grammar">Grammar</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-pixel text-gray-500 uppercase">Definition / Reference Answer</label>
            <textarea 
              required
              value={formData.definition}
              onChange={e => setFormData({...formData, definition: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 focus:border-[#00FFD5] outline-none transition-all min-h-[100px]"
              placeholder="The correct answer or definition..."
            />
          </div>

          {formData.question_type === 'reading' && (
            <div className="space-y-2">
              <label className="text-[10px] font-pixel text-gray-500 uppercase">Reading Passage</label>
              <textarea 
                value={formData.passage}
                onChange={e => setFormData({...formData, passage: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 focus:border-[#00FFD5] outline-none transition-all min-h-[150px]"
                placeholder="The text the student will read..."
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-pixel text-gray-500 uppercase">Example Sentence (Optional)</label>
            <input 
              value={formData.example}
              onChange={e => setFormData({...formData, example: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 focus:border-[#00FFD5] outline-none transition-all"
              placeholder="e.g. The beauty of the sunset was ephemeral."
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-pixel text-gray-500 uppercase">Assign to Classes</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => toggleClass(cls.id)}
                  className={`p-3 text-left rounded-xl border text-xs transition-all ${formData.assignToClasses.includes(cls.id) ? 'bg-[#00FFD5]/10 border-[#00FFD5] text-[#00FFD5]' : 'bg-black/20 border-white/5 text-gray-500'}`}
                >
                  {cls.class_name}
                </button>
              ))}
            </div>
          </div>
        </form>

        <footer className="p-6 border-t border-white/5 bg-black/20 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 font-pixel text-xs text-gray-400 hover:text-white transition-all"
          >
            CANCEL
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-[2] py-4 bg-[#00FFD5] text-[#0A0A0F] font-pixel text-xs hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isSaving ? 'SAVING...' : 'CREATE_CONTENT'}
          </button>
        </footer>
      </div>
    </div>
  );
}
