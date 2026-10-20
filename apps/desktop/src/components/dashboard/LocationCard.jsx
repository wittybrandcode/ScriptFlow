import React from 'react';
import { MapPin, Edit3, Trash2, Home, Trees, ImageOff, Film, BarChart3, Eye, Image as ImageIcon, Map, Phone } from 'lucide-react';
import { resolveMediaUrl } from '../../services/mediaStorage';

const STATUS_MAP = {
  'AVAILABLE': { label: 'متاح', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  'BUSY': { label: 'مشغول', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  'UNAVAILABLE': { label: 'غير متاح', cls: 'bg-red-500/10 text-red-600 border-red-500/20' },
  'REVIEW': { label: 'قيد المراجعة', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
};

export default function LocationCard({ location, parentLocation, onEdit, onDelete, onPreview, sceneCount = 0, totalScenes = 0 }) {
  const statusInfo = STATUS_MAP[location.status] || STATUS_MAP['REVIEW'];
  const percent = totalScenes > 0 ? Math.round((sceneCount / totalScenes) * 100) : 0;
  const isInt = location.type === 'INT';
  const images = location.images || [];
  const primaryImage = images.find(img => img.is_primary)?.image_url || images.find(img => img.is_primary)?.url || images[0]?.image_url || images[0]?.url || location.image;
  const hasMultipleImages = images.length > 1;

  return (
    <div className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col">
      
      {/* Image - clickable to preview */}
      <div className="relative h-28 overflow-hidden bg-secondary cursor-pointer shrink-0" onClick={onPreview}>
        {primaryImage ? (
          <img 
            src={resolveMediaUrl(primaryImage)} 
            alt={location.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/15">
            <ImageOff size={32} />
          </div>
        )}
        
        {/* Overlay actions on hover */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
           <button onClick={onPreview} className="p-1.5 rounded-md bg-black/40 backdrop-blur-sm text-white hover:bg-sky-500 transition-all" title="تصفح الموقع">
              <Eye size={12} />
           </button>
           <button onClick={onEdit} className="p-1.5 rounded-md bg-black/40 backdrop-blur-sm text-white hover:bg-primary transition-all" title="تعديل">
              <Edit3 size={12} />
           </button>
           <button onClick={onDelete} className="p-1.5 rounded-md bg-black/40 backdrop-blur-sm text-white hover:bg-destructive transition-all" title="حذف">
              <Trash2 size={12} />
           </button>
        </div>

        {/* Multi-Image Badge */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 backdrop-blur-md bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
            <ImageIcon size={9} />
            +{images.length - 1}
          </div>
        )}

        {/* Type badge - distinct colors for INT vs EXT */}
        <div className="absolute bottom-2 right-2">
          <div className={`flex items-center gap-1 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isInt ? 'bg-blue-600/80 text-white' : 'bg-emerald-600/80 text-white'}`}>
            {isInt ? <Home size={9} /> : <Trees size={9} />}
            {isInt ? 'داخلي' : 'خارجي'}
          </div>
        </div>

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border backdrop-blur-sm ${statusInfo.cls}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 flex-1 flex flex-col">
        {/* Name - clickable to preview */}
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 
            className="font-bold text-sm text-foreground truncate cursor-pointer hover:text-primary transition-colors flex-1" 
            onClick={onPreview}
          >
            {location.name}
          </h3>
          <div className="flex gap-1 shrink-0">
            {location.map_url && <Map size={12} className="text-sky-500" title="خريطة متوفرة" />}
            {location.contact_phone && <Phone size={12} className="text-emerald-500" title="هاتف اتصال متوفر" />}
          </div>
        </div>

        {/* Address */}
        {location.address && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground mb-1.5 truncate">
            <MapPin size={10} className="text-primary shrink-0" />
            <span className="truncate">{location.address}</span>
          </div>
        )}

        {/* Parent Location */}
        {parentLocation && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 mb-1.5 truncate bg-amber-500/10 px-1.5 py-0.5 rounded w-fit">
            <Home size={10} className="shrink-0" />
            <span className="truncate">تابع لـ: {parentLocation.name}</span>
          </div>
        )}

        <div className="mt-auto">
        {/* Stats Row */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1 text-xs" title="عدد المشاهد في هذا الموقع">
              <Film size={12} className="text-emerald-500" />
              <span className="font-bold text-foreground">{sceneCount}</span>
              <span className="text-muted-foreground text-[10px]">مشهد</span>
            </div>
            <span className="text-xs font-black text-primary">{percent}%</span>
          </div>

          {/* Usage Progress Bar */}
          <div className="flex items-center gap-1.5">
            <BarChart3 size={10} className="text-muted-foreground/50 shrink-0" />
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-l from-primary to-indigo-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
