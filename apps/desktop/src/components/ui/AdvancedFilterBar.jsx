import React from 'react';
import { Search, Filter, X } from 'lucide-react';

export default function AdvancedFilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'بحث...',
  filters = [],
  onClearFilters,
  hasActiveFilters = false
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap gap-3 items-center relative z-20 shadow-sm">
      {/* Search Input */}
      {onSearchChange && (
        <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-secondary/30 px-3 py-2 rounded-lg border border-border focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            className="bg-transparent border-none outline-none text-sm font-bold w-full text-foreground placeholder:text-muted-foreground/50"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}

      {/* Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-muted-foreground mr-2 border-r border-border/50 pr-4">
            <Filter size={14} /> تصفية بـ:
          </div>

          {filters.map((filter, index) => {
            if (filter.type === 'select') {
              return (
                <div key={index} className="relative">
                  <select 
                    value={filter.value}
                    onChange={(e) => filter.onChange(e.target.value)}
                    className="appearance-none bg-background border border-border rounded-lg text-xs font-bold px-3 py-2 pr-8 outline-none focus:border-primary/50 hover:bg-secondary/20 transition-colors cursor-pointer"
                  >
                    {filter.options.map((opt, i) => (
                      <option key={i} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50">
                    ▼
                  </div>
                </div>
              );
            }
            if (filter.type === 'toggle') {
              return (
                <div key={index} className="flex items-center p-0.5 bg-secondary rounded-md border border-border">
                  {filter.options.map((opt, i) => (
                    <button 
                      key={i}
                      onClick={() => filter.onChange(opt.value)}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${filter.value === opt.value ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              );
            }
            if (filter.type === 'custom') {
              return <div key={index}>{filter.render()}</div>;
            }
            return null;
          })}

          {hasActiveFilters && onClearFilters && (
            <button 
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors border border-rose-500/20"
              title="إلغاء التصفية"
            >
              <X size={14} /> تفريغ
            </button>
          )}
        </div>
      )}
    </div>
  );
}
