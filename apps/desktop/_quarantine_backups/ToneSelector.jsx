import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useTonesQuery, useCreateToneMutation } from '../../hooks/queries';

/**
 * ToneSelector - مكون مخصص لاختيار المشاعر بتصميم احترافي
 * يستبدل عنصر <select> الافتراضي بقائمة منسدلة مصممة بشكل متسق مع هوية التطبيق
 */
export default function ToneSelector({ value, onChange, bare = false }) {
  const { data: tones = [] } = useTonesQuery();
  const createTone = useCreateToneMutation();
  const addTone = async (name) => {
    try {
      await createTone.mutateAsync(name);
      return {};
    } catch (e) {
      return { error: e.message };
    }
  };

  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newToneName, setNewToneName] = useState('');
  const [error, setError] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setAdding(false);
        setNewToneName('');
        setError('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus input when adding mode is activated
  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  const currentTone = tones.find(t => t.name === value);
  const displayLabel = value ? `(${value})` : '(عادي)';

  async function handleAddTone() {
    const trimmed = newToneName.trim();
    if (!trimmed) return;

    setError('');
    const result = await addTone(trimmed);
    if (result?.error) {
      setError(result.error);
      return;
    }

    // Select the new tone and close
    onChange(trimmed);
    setNewToneName('');
    setAdding(false);
    setOpen(false);
  }

  function handleSelect(toneName) {
    onChange(toneName);
    setOpen(false);
  }

  return (
    <div className="relative inline-block" ref={ref}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => { setOpen(!open); setAdding(false); setError(''); }}
        className={`
          inline-flex items-center gap-1 px-1.5 py-0.5 
          ${bare ? 'text-[13px] text-foreground opacity-60 font-medium tracking-wide' : 'text-[11px] font-bold'} rounded-md
          transition-all duration-200 cursor-pointer select-none
          ${!bare && open ? 'bg-primary/10 text-primary' : ''}
          ${!bare && !open ? 'text-muted-foreground hover:text-foreground hover:bg-secondary/50' : ''}
          ${bare ? 'hover:opacity-100' : ''}
        `}
      >
        <span>{displayLabel}</span>
        {!bare && <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div 
          className="
            absolute top-full left-0 mt-1 z-50
            min-w-[180px] max-h-[280px]
            bg-card/95 backdrop-blur-xl
            border border-border/80 
            rounded-xl shadow-2xl shadow-black/10
            overflow-hidden
            animate-in fade-in slide-in-from-top-2 duration-200
          "
        >
          {/* Tone List */}
          <div className="overflow-y-auto max-h-[200px] py-1">
            {/* Default empty = عادي */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`
                w-full text-right px-4 py-2 text-sm font-medium
                transition-colors duration-150
                ${!value ? 'bg-primary/10 text-primary font-bold' : 'text-foreground hover:bg-secondary/60'}
              `}
            >
              عادي
            </button>

            {tones.filter(t => t.name !== 'عادي').map(tone => (
              <button
                type="button"
                key={tone.id}
                onClick={() => handleSelect(tone.name)}
                className={`
                  w-full text-right px-4 py-2 text-sm font-medium
                  transition-colors duration-150
                  ${value === tone.name ? 'bg-primary/10 text-primary font-bold' : 'text-foreground hover:bg-secondary/60'}
                `}
              >
                {tone.name}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-border/60" />

          {/* Add New Tone Section */}
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="
                w-full flex items-center justify-center gap-1.5
                px-4 py-2.5 text-xs font-bold
                text-primary hover:bg-primary/5
                transition-colors duration-150
              "
            >
              <Plus size={14} />
              <span>إضافة شعور جديد</span>
            </button>
          ) : (
            <div className="p-2.5 space-y-2">
              <div className="flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={newToneName}
                  onChange={e => { setNewToneName(e.target.value); setError(''); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddTone();
                    if (e.key === 'Escape') { setAdding(false); setNewToneName(''); setError(''); }
                  }}
                  placeholder="اسم الشعور..."
                  className="
                    flex-1 px-2.5 py-1.5 text-sm font-medium
                    bg-background border border-input rounded-lg
                    text-foreground placeholder:text-muted-foreground/40
                    focus:outline-none focus:ring-2 focus:ring-primary/30
                    transition-all font-sans
                  "
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={handleAddTone}
                  disabled={!newToneName.trim()}
                  className="
                    p-1.5 rounded-lg bg-primary text-white
                    hover:bg-primary/90 disabled:opacity-40
                    transition-all shrink-0
                  "
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => { setAdding(false); setNewToneName(''); setError(''); }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-all shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
              {error && (
                <p className="text-[10px] text-destructive font-bold px-1">{error}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
