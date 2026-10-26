import { useState, useEffect } from 'react';
import { MapPin, Clock, BookOpen, Edit3, Users, Plus, Tv, X, CloudRain, Layers } from 'lucide-react';

export interface LocationItem {
  id: string | number;
  name: string;
  [key: string]: any;
}

export interface CharacterItem {
  id: string | number;
  name: string;
  [key: string]: any;
}

export interface EpisodeItem {
  id: string | number;
  episode_number: number;
  title?: string;
  [key: string]: any;
}

export interface SceneMetadataFormProps {
  scene: {
    id?: string | number;
    episode_id?: number | null;
    location_type?: string;
    location_id?: number | null;
    location_name?: string;
    time_of_day?: string;
    exact_time?: string;
    planned_shoot_date?: string;
    weather?: string;
    continuity?: string;
    time_shift?: string;
    revision_color?: string;
    description?: string;
    director_notes?: string;
    present_characters?: string;
    extras_note?: string;
    [key: string]: any;
  };
  onSceneChange: (field: string, value: any) => void;
  locations?: LocationItem[];
  characters?: CharacterItem[];
  episodes?: EpisodeItem[];
  onEditLocation?: (locationId: string) => void;
  onAddLocation?: () => void;
}

/**
 * مكون نموذج بيانات ميتا المشهد (العنوان، المكان، الزمان، الملاحظات)
 */
export default function SceneMetadataForm({
  scene,
  onSceneChange,
  locations = [],
  characters = [],
  episodes = [],
  onEditLocation,
  onAddLocation
}: SceneMetadataFormProps) {
  // Parse present_characters from stringified JSON
  const presentCharsIds: number[] = (() => {
    try {
      return JSON.parse(scene.present_characters || '[]');
    } catch {
      return [];
    }
  })();

  const standardTimes = ["DAWN", "MORNING", "DAY", "AFTERNOON", "EVENING", "DUSK", "NIGHT", "LATE_NIGHT"];
  const [showCustomTime, setShowCustomTime] = useState(
    Boolean(scene.time_of_day && !standardTimes.includes(scene.time_of_day))
  );

  useEffect(() => {
    const reverseMap: Record<string, string> = {
      'نهار': 'DAY',
      'ليل': 'NIGHT',
      'فجر': 'DAWN',
      'صباح': 'MORNING',
      'بعد الظهر': 'AFTERNOON',
      'غروب': 'DUSK',
      'مساء': 'EVENING',
      'منتصف الليل': 'LATE_NIGHT',
      'عصر': 'AFTERNOON'
    };

    if (scene.time_of_day) {
      const trimmed = scene.time_of_day.trim();
      if (reverseMap[trimmed]) {
        onSceneChange('time_of_day', reverseMap[trimmed]);
        setShowCustomTime(false);
      } else if (!standardTimes.includes(trimmed)) {
        setShowCustomTime(true);
      } else {
        setShowCustomTime(false);
      }
    }
  }, [scene.time_of_day]);

  const toggleCharacterPresence = (charId: string | number) => {
    const id = parseInt(String(charId), 10);
    let newIds = [...presentCharsIds];
    if (newIds.includes(id)) {
      newIds = newIds.filter(i => i !== id);
    } else {
      newIds.push(id);
    }
    onSceneChange('present_characters', JSON.stringify(newIds));
  };

  return (
    <div className="max-w-lg mx-auto space-y-2 mt-2">
      {/* الحلقة */}
      {episodes.length > 0 && (
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-2 shadow-sm">
          <div className="flex items-center justify-center w-8 shrink-0 text-muted-foreground" title="الحلقة">
            <Tv size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            {scene.episode_id ? (
              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5">
                <span className="text-xs font-bold text-primary truncate">
                  حلقة {episodes.find(e => e.id === scene.episode_id)?.episode_number} — {episodes.find(e => e.id === scene.episode_id)?.title || 'بدون عنوان'}
                </span>
                <button
                  type="button"
                  onClick={() => onSceneChange('episode_id', null)}
                  className="text-[10px] font-bold text-muted-foreground hover:text-red-500 transition-colors"
                  title="إلغاء التعيين"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <select
                value={scene.episode_id || ''}
                onChange={e => onSceneChange('episode_id', e.target.value ? parseInt(e.target.value, 10) : null)}
                className="w-full px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans"
              >
                <option value="">-- اختر حلقة لإدراج المشهد فيها --</option>
                {episodes.map(ep => (
                  <option key={ep.id} value={ep.id}>
                    حلقة {ep.episode_number}{ep.title ? ` — ${ep.title}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* المكان */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-2 shadow-sm">
        <div className="flex items-center justify-center w-8 shrink-0 text-muted-foreground" title="المكان">
          <MapPin size={16} className="text-primary" />
        </div>
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <select
            value={scene.location_type || 'INT'}
            onChange={e => onSceneChange('location_type', e.target.value)}
            className="w-[80px] shrink-0 px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans"
          >
            <option value="INT">داخلي</option>
            <option value="EXT">خارجي</option>
            <option value="INT/EXT">مختلط</option>
          </select>
          <select
            value={scene.location_id || ''}
            onChange={e => {
              const val = e.target.value;
              onSceneChange('location_id', val ? parseInt(val, 10) : null);
              if (val) {
                const loc = locations.find(l => l.id === parseInt(val, 10));
                if (loc) onSceneChange('location_name', loc.name);
              } else {
                onSceneChange('location_name', '');
              }
            }}
            className="flex-1 min-w-0 px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans truncate"
          >
            <option value="">-- اختر موقعاً --</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
          {scene.location_id && onEditLocation && (
            <button
              type="button"
              onClick={() => onEditLocation(String(scene.location_id))}
              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all shrink-0"
              title="تعديل بيانات الموقع"
            >
              <Edit3 size={14} />
            </button>
          )}
          {onAddLocation && (
            <button
              type="button"
              onClick={onAddLocation}
              className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 transition-all shrink-0"
              title="إضافة موقع جديد"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      {/* الزمان */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-2 shadow-sm">
        <div className="flex items-center justify-center w-8 shrink-0 text-muted-foreground" title="الزمان">
          <Clock size={16} className="text-primary" />
        </div>
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          {!showCustomTime ? (
            <select
              value={scene.time_of_day || 'DAY'}
              onChange={e => {
                if (e.target.value === 'CUSTOM') {
                  setShowCustomTime(true);
                  onSceneChange('time_of_day', '');
                } else {
                  onSceneChange('time_of_day', e.target.value);
                }
              }}
              className="w-[100px] shrink-0 px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans"
            >
              <option value="DAWN">فجر</option>
              <option value="MORNING">صباح</option>
              <option value="DAY">نهار</option>
              <option value="AFTERNOON">بعد الظهر</option>
              <option value="EVENING">مساء</option>
              <option value="DUSK">غروب</option>
              <option value="NIGHT">ليل</option>
              <option value="LATE_NIGHT">منتصف الليل</option>
              <option value="CUSTOM">مخصص...</option>
            </select>
          ) : (
            <div className="w-[100px] shrink-0 flex items-center gap-1 min-w-0">
              <input
                type="text"
                value={scene.time_of_day || ''}
                onChange={e => onSceneChange('time_of_day', e.target.value)}
                placeholder="مخصص..."
                className="flex-1 min-w-0 px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans"
                autoFocus
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustomTime(false);
                  onSceneChange('time_of_day', 'DAY');
                }}
                className="p-1.5 bg-secondary text-muted-foreground rounded-md hover:text-red-500 transition-colors"
                title="إلغاء المخصص"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <input
            type="time"
            value={scene.exact_time || ''}
            onChange={e => onSceneChange('exact_time', e.target.value)}
            className="w-[100px] shrink-0 px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans uppercase"
          />
          <input
            type="date"
            value={scene.planned_shoot_date || ''}
            onChange={e => onSceneChange('planned_shoot_date', e.target.value)}
            className="flex-1 min-w-0 px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans"
            title="تاريخ التصوير"
          />
        </div>
      </div>

      {/* الطقس */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-2 shadow-sm">
        <div className="flex items-center justify-center w-8 shrink-0 text-muted-foreground" title="الطقس">
          <CloudRain size={16} className="text-primary" />
        </div>
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <input
            type="text"
            list="weather-suggestions"
            value={scene.weather || ''}
            onChange={e => onSceneChange('weather', e.target.value)}
            placeholder="الطقس (ممطر...)"
            className="flex-1 min-w-0 px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans"
          />
          <datalist id="weather-suggestions">
            <option value="مشمس" />
            <option value="غائم" />
            <option value="ممطر" />
            <option value="عاصف" />
            <option value="ضباب" />
            <option value="ثلج" />
            <option value="حار" />
            <option value="بارد" />
          </datalist>
        </div>
      </div>

      {/* الاستمرارية وطبيعة الزمن */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-2 shadow-sm">
        <div className="flex items-center justify-center w-8 shrink-0 text-muted-foreground" title="الاستمرارية وطبيعة الزمن">
          <Layers size={16} className="text-primary" />
        </div>
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <select
            value={scene.continuity || ''}
            onChange={e => onSceneChange('continuity', e.target.value)}
            className="flex-1 min-w-0 px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans truncate"
          >
            <option value="">استمرارية (غير محدد)</option>
            <option value="CONTINUOUS">مستمر (Continuous)</option>
            <option value="SAME_TIME">متزامن (Same Time)</option>
            <option value="LATER">لاحقاً (Later)</option>
          </select>
          <select
            value={scene.time_shift || ''}
            onChange={e => onSceneChange('time_shift', e.target.value)}
            className="flex-1 min-w-0 px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans truncate"
          >
            <option value="">زمن طبيعي</option>
            <option value="FLASHBACK">Flashback</option>
            <option value="FLASHFORWARD">Flashforward</option>
            <option value="DREAM">Dream (حلم)</option>
          </select>
          <select
            value={scene.revision_color || 'WHITE'}
            onChange={e => onSceneChange('revision_color', e.target.value)}
            className="flex-1 min-w-0 px-2 py-1.5 bg-background border border-input rounded-lg text-foreground text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-sans truncate"
          >
            <option value="WHITE">أبيض (مسودة)</option>
            <option value="BLUE">أزرق (مراجعة 1)</option>
            <option value="PINK">وردي (مراجعة 2)</option>
            <option value="YELLOW">أصفر (مراجعة 3)</option>
            <option value="GREEN">أخضر (مراجعة 4)</option>
          </select>
        </div>
      </div>

      {/* الوصف الدرامي */}
      <div className="bg-card border border-border rounded-xl p-2 shadow-sm mb-4 mt-2">
        <textarea
          value={scene.description || ''}
          onChange={e => onSceneChange('description', e.target.value)}
          placeholder="الوصف الدرامي (تبدأ الكاميرا بتتبع...)"
          rows={2}
          className="w-full px-2 py-1 bg-transparent text-foreground text-xs focus:outline-none placeholder:text-muted-foreground/50 resize-none"
        />
      </div>

      {/* ملاحظات إخراجية */}
      <div className="relative bg-card border border-border rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-primary/20 transition-all overflow-hidden group mb-4">
        <div className="absolute right-3 top-3.5 text-primary/70 group-focus-within:text-primary transition-colors pointer-events-none">
          <BookOpen size={18} />
        </div>
        {(!scene.director_notes || scene.director_notes.trim() === '') && (
          <div className="absolute right-10 top-3.5 pointer-events-none flex flex-col gap-0.5">
            <span className="font-black text-foreground text-xs uppercase tracking-widest">ملاحظات إخراجية</span>
            <span className="text-[10px] text-muted-foreground font-bold">تعليمات خاصة للممثلين أو المصورين...</span>
          </div>
        )}
        <textarea
          value={scene.director_notes || ''}
          onChange={e => onSceneChange('director_notes', e.target.value)}
          rows={3}
          className="w-full pr-10 pl-3 py-3.5 bg-transparent text-foreground text-sm focus:outline-none transition-all font-sans resize-none relative z-10"
        />
      </div>

      {/* رادار الشخصيات الحاضرة */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
          <Users size={18} className="text-emerald-500" />
          <span className="font-black text-xs uppercase tracking-widest text-emerald-600">رادار الشخصيات الحاضرة</span>
          <span className="text-[9px] text-muted-foreground mr-auto bg-emerald-500/10 px-2 py-0.5 rounded-full">لجدولة الإنتاج</span>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3 font-bold">حدد الشخصيات الموجودة في المشهد (حتى لو كانت صامتة ولا تملك حواراً).</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {characters.map(char => {
            const isPresent = presentCharsIds.includes(parseInt(String(char.id), 10));
            return (
              <button
                type="button"
                key={char.id}
                onClick={() => toggleCharacterPresence(char.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  isPresent
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-background text-muted-foreground border-input hover:border-emerald-300 hover:text-emerald-600'
                }`}
              >
                {char.name}
              </button>
            );
          })}
          {characters.length === 0 && (
            <div className="text-xs text-muted-foreground italic w-full text-center py-2">لا توجد شخصيات مسجلة في المشروع بعد.</div>
          )}
        </div>

        <div className="border-t border-border pt-3">
          <label className="block text-[10px] font-black text-muted-foreground mb-1.5 uppercase tracking-widest">الكومبارس والإضافات (Extras)</label>
          <input
            type="text"
            value={scene.extras_note || ''}
            onChange={e => onSceneChange('extras_note', e.target.value)}
            placeholder="مثال: حراس، مارة، زبائن المقهى..."
            className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all font-sans"
          />
        </div>
      </div>
    </div>
  );
}
