import React from 'react';
import {
  Clapperboard, MessageSquare, Users, Type, Camera, Clock, Zap, PieChart,
  Activity, MapPin, Mic, Target, Layers, Eye, Sun, Moon, Users2, Briefcase
} from 'lucide-react';

export { RhythmDNAWidget } from './RhythmDNAWidget';
export { ProductionDensityWidget } from './ProductionDensityWidget';

export const QuickStatsRow = ({ stats, totalWords, totalProduction }) => (
  <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
    {[
      { label: 'المشاهد', value: stats.totalScenes, icon: Clapperboard, color: 'text-blue-500 bg-blue-500/10' },
      { label: 'الحوارات', value: stats.totalDialogues, icon: MessageSquare, color: 'text-indigo-500 bg-indigo-500/10' },
      { label: 'الشخصيات', value: stats.totalCharacters, icon: Users, color: 'text-rose-500 bg-rose-500/10' },
      { label: 'الكلمات', value: totalWords.toLocaleString(), icon: Type, color: 'text-amber-500 bg-amber-500/10' },
      { label: 'كتل الإنتاج', value: totalProduction, icon: Camera, color: 'text-emerald-500 bg-emerald-500/10' },
      { label: 'الزمن (دقيقة)', value: `~${Math.max(1, Math.ceil(totalWords / 150))}`, icon: Clock, color: 'text-violet-500 bg-violet-500/10' },
    ].map((stat, i) => (
      <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
        <div className={`p-2 rounded-xl ${stat.color}`}>
          <stat.icon size={16} />
        </div>
        <div>
          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</div>
          <div className="text-lg font-black tabular-nums">{stat.value}</div>
        </div>
      </div>
    ))}
  </section>
);




export const DialogueActionBalanceWidget = ({ dialogueToActionRatio, totalDialogueWords, totalActionWords }) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-4 mb-5">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 text-indigo-500">
          <PieChart size={24} className="text-indigo-500 animate-pulse" />
        </div>
        <div>
          <h2 className="font-black text-xl">توازن الحوار والحركة (Dialogue vs. Action)</h2>
          <p className="text-xs text-muted-foreground font-medium">النسبة بين الكلمات الحوارية وكلمات الحركة والوصف البصري</p>
        </div>
      </div>

      <div className="space-y-4 my-6">
        <div className="flex justify-between text-xs font-black">
          <span className="text-indigo-400">💬 كلام الحوار: {dialogueToActionRatio.dialoguePercentage}% ({totalDialogueWords.toLocaleString()} كلمة)</span>
          <span className="text-emerald-400">🎬 حركة ووصف: {dialogueToActionRatio.actionPercentage}% ({totalActionWords.toLocaleString()} كلمة)</span>
        </div>
        <div className="h-4 w-full bg-secondary rounded-full overflow-hidden flex border border-border/40">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-r-full transition-all duration-1000" 
            style={{ width: `${dialogueToActionRatio.dialoguePercentage}%` }} 
          />
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-l-full transition-all duration-1000" 
            style={{ width: `${dialogueToActionRatio.actionPercentage}%` }} 
          />
        </div>
      </div>
    </div>

    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 text-xs font-bold text-muted-foreground leading-relaxed mt-4">
      <span className="text-foreground font-black">تحليل السيناريو:</span>{' '}
      {dialogueToActionRatio.dialoguePercentage > 65 ? (
        <span>النص يغلب عليه الحوار الكثيف (مماثل للمسرح أو الحوار الفلسفي). يُنصح بإضافة المزيد من كتل الوصف والحركة لتعزيز البصريات السينمائية.</span>
      ) : dialogueToActionRatio.dialoguePercentage < 30 ? (
        <span>النص يركز بشكل كبير على البصريات والحركة (سينما صامتة أو أكشن كثيف). تأكد من إعطاء الشخصيات فرصة لبناء العمق عبر حوارات مدروسة.</span>
      ) : (
        <span>توازن ممتاز ومثالي للسينما العالمية بين الكلام والحركة. النص يتيح للصورة أن تتنفس مع حوار ذكي يدفع بالحبكة للأمام.</span>
      )}
    </div>
  </div>
);

export const ProductionComplexityWidget = ({ complexitySummary, dnaLength }) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-4 mb-5">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-rose-500/10 text-rose-500">
          <Activity size={24} className="text-rose-500" />
        </div>
        <div>
          <h2 className="font-black text-xl">توزيع صعوبة الإنتاج (Complexity Index)</h2>
          <p className="text-xs text-muted-foreground font-medium">تصنيف المشاهد حسب تكلفة وصعوبة التصوير</p>
        </div>
      </div>

      <div className="space-y-4 my-6">
        <div className="flex justify-between text-xs font-black">
          <span className="text-blue-400">🟢 بسيط: {complexitySummary.simple}</span>
          <span className="text-orange-400">🟡 متوسط: {complexitySummary.moderate}</span>
          <span className="text-rose-400">🔴 معقد: {complexitySummary.complex}</span>
        </div>
        
        <div className="h-4 w-full bg-secondary rounded-full overflow-hidden flex border border-border/40">
          {dnaLength > 0 ? (
            <>
              <div 
                className="h-full bg-blue-500 transition-all duration-1000" 
                style={{ width: `${(complexitySummary.simple / dnaLength) * 100}%` }} 
                title={`بسيط: ${complexitySummary.simple} مشهد`}
              />
              <div 
                className="h-full bg-orange-500 transition-all duration-1000" 
                style={{ width: `${(complexitySummary.moderate / dnaLength) * 100}%` }} 
                title={`متوسط: ${complexitySummary.moderate} مشهد`}
              />
              <div 
                className="h-full bg-rose-500 transition-all duration-1000" 
                style={{ width: `${(complexitySummary.complex / dnaLength) * 100}%` }} 
                title={`معقد: ${complexitySummary.complex} مشهد`}
              />
            </>
          ) : (
            <div className="w-full bg-secondary" />
          )}
        </div>
      </div>
    </div>

    <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 text-xs font-bold text-muted-foreground leading-relaxed mt-4">
      <span className="text-foreground font-black">أثر التكلفة والإنتاج:</span>{' '}
      {complexitySummary.complex > (dnaLength * 0.3) ? (
        <span>يحتوي السيناريو على نسبة عالية من المشاهد المعقدة (تصوير خارجي ليلي أو تجمعات ممثلين). سيتطلب هذا المشروع ميزانية إنتاجية وإضاءة ضخمة.</span>
      ) : (
        <span>توزيع لوجستي ممتاز. المشاهد المعقدة محدودة ومركزة، مما يتيح تصوير المشاهد البسيطة بسرعة وتقليل الأيام والميزانية الإجمالية.</span>
      )}
    </div>
  </div>
);

export const CharacterDialogueShareWidget = ({ charStats }) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
    <div className="flex items-center gap-4 mb-8">
      <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
        <Users size={24} />
      </div>
      <div>
        <h2 className="font-black text-xl">نصيب الشخصيات من الحوار</h2>
        <p className="text-xs text-muted-foreground font-medium">عدد الكتل الحوارية لكل شخصية — مرتبة تنازلياً</p>
      </div>
    </div>

    <div className="space-y-3">
      {charStats.map((char, idx) => {
        const maxCount = charStats[0]?.dialogueCount || 1;
        const pct = (char.dialogueCount / maxCount) * 100;
        const totalDialogues = charStats.reduce((s, c) => s + c.dialogueCount, 0);
        const share = totalDialogues > 0 ? Math.round((char.dialogueCount / totalDialogues) * 100) : 0;
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

        return (
          <div key={idx} className="group bg-secondary/10 hover:bg-secondary/30 p-2.5 rounded-xl border border-transparent hover:border-border/30 transition-all duration-300">
            <div className="flex items-center justify-between text-xs mb-1 font-bold px-1">
              <div className="flex items-center gap-2">
                {medal && <span className="text-sm">{medal}</span>}
                <span className="font-black text-foreground">{char.name}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground text-[10px]">
                <span>{char.dialogueCount} سطر</span>
                <span>•</span>
                <span className="text-indigo-400">{char.wordCount?.toLocaleString() || 0} كلمة</span>
                <span>•</span>
                <span className="text-primary font-black text-xs">{share}%</span>
              </div>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-gradient-to-l from-primary via-rose-400 to-rose-500 rounded-full transition-all duration-1000 opacity-80 group-hover:opacity-100"
                style={{ width: `${Math.max(pct, 3)}%` }}
              />
            </div>
          </div>
        );
      })}
      {charStats.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground italic">لا توجد بيانات حوارية بعد</div>
      )}
    </div>
  </div>
);

export const LocationDistributionWidget = ({ locStats, totalScenes }) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
    <div className="flex items-center gap-4 mb-8">
      <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
        <MapPin size={24} />
      </div>
      <div>
        <h2 className="font-black text-xl">توزيع مواقع التصوير</h2>
        <p className="text-xs text-muted-foreground font-medium">نسبة المشاهد الداخلية مقابل الخارجية والمختلطة</p>
      </div>
    </div>

    <div className="flex-1 flex flex-col justify-center gap-6">
      {locStats.map((loc, idx) => {
        const pct = totalScenes > 0 ? Math.round((loc.count / totalScenes) * 100) : 0;
        const colorMap = {
          'INT': { bg: 'bg-indigo-500', light: 'bg-indigo-500/10', text: 'text-indigo-500', label: 'داخلي (INT)' },
          'EXT': { bg: 'bg-amber-500', light: 'bg-amber-500/10', text: 'text-amber-500', label: 'خارجي (EXT)' },
          'INT/EXT': { bg: 'bg-emerald-500', light: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'مختلط (INT/EXT)' },
        };
        const c = colorMap[loc.location_type] || { bg: 'bg-gray-500', light: 'bg-gray-500/10', text: 'text-gray-500', label: loc.location_type };
        
        return (
          <div key={idx} className="group">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-md ${c.bg}`} />
                <span className="text-sm font-black">{c.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black tabular-nums">{loc.count}</span>
                <span className={`text-xs font-black ${c.text} bg-secondary px-2.5 py-1 rounded-full`}>{pct}%</span>
              </div>
            </div>
            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full ${c.bg} rounded-full transition-all duration-1000 opacity-80 group-hover:opacity-100`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      {locStats.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground italic">لا توجد بيانات مواقع بعد</div>
      )}
    </div>
  </div>
);

export const ToneSpectrumWidget = ({ toneStats }) => (
  <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/10 to-orange-500/10 text-pink-500">
          <Mic size={24} />
        </div>
        <div>
          <h2 className="font-black text-xl">طيف المشاعر (Tone Spectrum)</h2>
          <p className="text-xs text-muted-foreground font-medium">توزيع النبرات المستعملة في الحوارات</p>
        </div>
      </div>
      {toneStats.length > 0 && (
        <div className="text-[10px] bg-secondary px-3 py-1 rounded-full font-bold">
          {toneStats.reduce((s, t) => s + t.count, 0)} حوار مُصنّف
        </div>
      )}
    </div>

    {toneStats.length > 0 ? (
      <div className="space-y-3">
        {toneStats.map((t, idx) => {
          const toneColors = [
            'from-pink-500 to-rose-400',
            'from-violet-500 to-purple-400',
            'from-blue-500 to-indigo-400',
            'from-cyan-500 to-teal-400',
            'from-emerald-500 to-green-400',
            'from-amber-500 to-yellow-400',
            'from-orange-500 to-red-400',
            'from-fuchsia-500 to-pink-400',
          ];
          const gradient = toneColors[idx % toneColors.length];

          return (
            <div key={idx} className="group">
              <div className="flex items-center justify-between text-xs mb-1.5 font-bold px-1">
                <div className="flex items-center gap-3">
                  <span className="text-lg">({t.tone})</span>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="tabular-nums">{t.count} مرة</span>
                  <span className="text-foreground font-black bg-secondary px-2.5 py-0.5 rounded-full text-[10px]">{t.percentage}%</span>
                </div>
              </div>
              <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-l ${gradient} rounded-full transition-all duration-1000 opacity-80 group-hover:opacity-100`}
                  style={{ width: `${Math.max(t.percentage, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
        {toneStats.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-secondary/40 border border-border/50">
            <p className="text-xs font-bold text-muted-foreground leading-relaxed">
              <span className="text-foreground font-black">تحليل سريع:</span>{' '}
              النبرة الأكثر استعمالاً هي <span className="text-primary font-black">"{toneStats[0].tone}"</span> بنسبة {toneStats[0].percentage}%
              {toneStats.length > 1 && (
                <>, تليها <span className="text-primary font-black">"{toneStats[1].tone}"</span> بنسبة {toneStats[1].percentage}%</>
              )}.
            </p>
          </div>
        )}
      </div>
    ) : (
      <div className="text-center py-12">
        <Mic size={32} className="mx-auto mb-3 text-muted-foreground/20" />
        <p className="text-sm text-muted-foreground italic mb-1">لم يتم تعيين نبرات للحوارات بعد</p>
      </div>
    )}
  </section>
);

export const DeepInsightsCards = ({ heaviestScene, mostDialogueScene, avgWordsPerScene }) => (
  <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <div className="bg-gradient-to-br from-rose-500/5 to-rose-500/0 border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
          <Target size={20} />
        </div>
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">أثقل مشهد (كلمات)</span>
      </div>
      {heaviestScene ? (
        <div>
          <div className="text-3xl font-black mb-1">مشهد {heaviestScene.scene_number}</div>
          <p className="text-xs text-muted-foreground font-bold">{heaviestScene.title || 'بدون عنوان'}</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-black text-rose-500 tabular-nums">{heaviestScene.words}</span>
            <span className="text-xs text-muted-foreground font-bold">كلمة</span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic">لا توجد بيانات</div>
      )}
    </div>

    <div className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/0 border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
          <MessageSquare size={20} />
        </div>
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">أكثر مشهد حواراً</span>
      </div>
      {mostDialogueScene ? (
        <div>
          <div className="text-3xl font-black mb-1">مشهد {mostDialogueScene.scene_number}</div>
          <p className="text-xs text-muted-foreground font-bold">{mostDialogueScene.title || 'بدون عنوان'}</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-black text-indigo-500 tabular-nums">{mostDialogueScene.dialogues}</span>
            <span className="text-xs text-muted-foreground font-bold">كتلة حوار</span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic">لا توجد بيانات</div>
      )}
    </div>

    <div className="bg-gradient-to-br from-violet-500/5 to-violet-500/0 border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
          <Layers size={20} />
        </div>
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">متوسط الكلمات / مشهد</span>
      </div>
      <div>
        <div className="text-4xl font-black text-violet-500 tabular-nums">{avgWordsPerScene}</div>
        <p className="text-xs text-muted-foreground font-bold mt-2">
          {avgWordsPerScene > 200 ? 'مشاهد ثقيلة — فكّر في تقسيمها' : avgWordsPerScene > 100 ? 'كثافة متوسطة — إيقاع جيد' : 'مشاهد خفيفة — سريعة الإيقاع'}
        </p>
      </div>
    </div>
  </section>
);

export const SceneHeatmapWidget = ({ dna, maxWords }) => {
  if (dna.length === 0) return null;
  return (
    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
          <Eye size={24} />
        </div>
        <div>
          <h2 className="font-black text-xl">خريطة الكثافة (Heatmap)</h2>
          <p className="text-xs text-muted-foreground font-medium">كلما كان اللون أغمق كلما كان المشهد أكثر كثافة حوارية</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {dna.map((scene, idx) => {
          const heat = maxWords > 0 ? scene.words / maxWords : 0;
          const opacity = 0.1 + heat * 0.9;
          const bgClass = heat > 0.7 ? 'bg-primary' : heat > 0.4 ? 'bg-indigo-500' : 'bg-indigo-300';

          return (
            <div
              key={idx}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex flex-col items-center justify-center text-[10px] font-black cursor-default group relative transition-transform hover:scale-110 ${bgClass}`}
              style={{ opacity }}
            >
              <span className="text-white drop-shadow-sm">{scene.scene_number}</span>
              <span className="text-white/70 text-[8px]">{scene.words}</span>

              <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 bg-foreground text-background px-3 py-2 rounded-xl shadow-2xl text-[10px] font-bold whitespace-nowrap">
                مشهد {scene.scene_number} — {scene.words} كلمة، {scene.dialogues} حوار
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const DayNightWidget = ({ totalDayNight, dayNightRatio }) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
        <Sun size={20} />
      </div>
      <div>
        <h2 className="font-black text-lg">إيقاع التصوير (النهار/الليل)</h2>
        <p className="text-[10px] text-muted-foreground font-bold">توازن المشاهد الداخلية والخارجية المضاءة</p>
      </div>
    </div>
    <div className="flex-1 flex flex-col justify-center gap-4">
      {totalDayNight > 0 ? (
        <>
          <div className="flex items-center justify-between text-sm font-black px-2">
            <span className="flex items-center gap-2 text-amber-500"><Sun size={16}/> نهار: {dayNightRatio.day}</span>
            <span className="flex items-center gap-2 text-indigo-500"><Moon size={16}/> ليل: {dayNightRatio.night}</span>
          </div>
          <div className="h-4 w-full bg-secondary rounded-full overflow-hidden flex">
            <div className="h-full bg-amber-500" style={{ width: `${(dayNightRatio.day / totalDayNight) * 100}%` }} />
            <div className="h-full bg-indigo-500" style={{ width: `${(dayNightRatio.night / totalDayNight) * 100}%` }} />
          </div>
          <div className="text-center text-xs text-muted-foreground font-bold mt-2">
            {dayNightRatio.night > dayNightRatio.day ? '⚠️ إنتاج يغلب عليه الطابع الليلي (تكلفة إضاءة أعلى)' : '✅ توازن جيد للإضاءة الطبيعية'}
          </div>
        </>
      ) : (
        <div className="text-center text-sm text-muted-foreground italic">لا توجد بيانات</div>
      )}
    </div>
  </div>
);

export const InteractionMatrixWidget = ({ interactionMatrix }) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl bg-pink-500/10 text-pink-500">
        <Users2 size={20} />
      </div>
      <div>
        <h2 className="font-black text-lg">أقوى الثنائيات (Interaction Matrix)</h2>
        <p className="text-[10px] text-muted-foreground font-bold">الشخصيات التي تشترك في مشاهد معاً</p>
      </div>
    </div>
    <div className="flex-1 space-y-3 mt-2 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
      {interactionMatrix.length > 0 ? interactionMatrix.map((pair, idx) => (
        <div key={idx} className="flex items-center justify-between bg-secondary/30 p-2.5 rounded-xl border border-border/50">
          <div className="flex items-center gap-2 text-xs font-black">
            <span>{pair.char1_name}</span>
            <span className="text-muted-foreground/50">×</span>
            <span>{pair.char2_name}</span>
          </div>
          <div className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-md">
            {pair.shared_scenes} مشاهد
          </div>
        </div>
      )) : (
        <div className="text-center text-sm text-muted-foreground italic py-8">لا توجد تفاعلات متبادلة</div>
      )}
    </div>
  </div>
);

export const DepartmentWorkloadWidget = ({ departmentWorkload }) => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
        <Briefcase size={20} />
      </div>
      <div>
        <h2 className="font-black text-lg">عبء المهام (Department Load)</h2>
        <p className="text-[10px] text-muted-foreground font-bold">توزيع المهام الإنتاجية حسب القسم</p>
      </div>
    </div>
    <div className="flex-1 space-y-3 mt-2 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
      {departmentWorkload.length > 0 ? departmentWorkload.map((dep, idx) => (
        <div key={idx} className="group">
          <div className="flex justify-between text-xs font-black mb-1 px-1">
            <span>{dep.department}</span>
            <span className="text-muted-foreground">{dep.taskCount} مهمة</span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (dep.taskCount / Math.max(...departmentWorkload.map(d=>d.taskCount))) * 100)}%` }} />
          </div>
        </div>
      )) : (
        <div className="text-center text-sm text-muted-foreground italic py-8">لا توجد مهام إنتاجية مسجلة</div>
      )}
    </div>
  </div>
);
