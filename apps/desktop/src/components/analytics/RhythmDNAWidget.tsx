import React from 'react';
import { Zap } from 'lucide-react';

export interface RhythmDNAScene {
  scene_number: number | string;
  title?: string;
  dialogues: number;
  characters: number;
  production: number;
  words: number;
  durationSeconds: number;
  pacingStyle: string;
  complexityLevel: string;
}

export interface RhythmDNAWidgetProps {
  dna: RhythmDNAScene[];
  maxDialogues: number;
  maxChars: number;
  maxProd: number;
  maxWords: number;
}

export const RhythmDNAWidget: React.FC<RhythmDNAWidgetProps> = ({
  dna,
  maxDialogues,
  maxChars,
  maxProd,
  maxWords,
}) => (
  <section className="bg-card border border-border rounded-2xl p-6 shadow-xs">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 text-violet-500">
          <Zap size={24} />
        </div>
        <div>
          <h2 className="font-black text-xl">بصمة الإيقاع (Rhythm DNA)</h2>
          <p className="text-xs text-muted-foreground font-medium">تحليل تلقائي لكثافة وتعقيد كل مشهد — يُحسب من محتوى الكتل مباشرة</p>
        </div>
      </div>
    </div>

    <div className="flex flex-wrap gap-5 mb-5 text-[10px] font-bold text-muted-foreground px-1 border-b border-border pb-4">
      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-indigo-400 inline-block"/> 💬 حوارات</span>
      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block"/> 🎭 شخصيات</span>
      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 inline-block"/> 🎬 إنتاج</span>
      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-rose-400 inline-block"/> 📝 كلمات</span>
    </div>

    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
      {dna.map((scene, idx) => {
        const dPct = (scene.dialogues / (maxDialogues || 1)) * 100;
        const cPct = (scene.characters / (maxChars || 1)) * 100;
        const pPct = (scene.production / (maxProd || 1)) * 100;
        const wPct = (scene.words / (maxWords || 1)) * 100;
        const intensity = (dPct + cPct + pPct + wPct) / 4;

        const mins = Math.floor(scene.durationSeconds / 60);
        const secs = scene.durationSeconds % 60;
        const durationStr = mins > 0 ? `${mins} د ${secs} ث` : `${secs} ث`;

        const pacingColors: Record<string, string> = {
          'حركي': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          'حواري': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
          'متوازن': 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        };
        const pacingClass = pacingColors[scene.pacingStyle] || 'bg-secondary text-muted-foreground';

        const complexityColors: Record<string, string> = {
          'بسيط': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          'متوسط': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
          'معقد': 'bg-rose-500/10 text-rose-500 border-rose-500/20'
        };
        const complexityClass = complexityColors[scene.complexityLevel] || 'bg-secondary text-muted-foreground';

        return (
          <div key={idx} className="group relative flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-transparent hover:border-border/50 transition-all duration-300 cursor-default">
            <div className="flex items-center gap-3 shrink-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all duration-500 ${
                intensity > 60 ? 'bg-primary text-white shadow-md shadow-primary/30' : 'bg-secondary text-muted-foreground'
              }`}>
                {scene.scene_number}
              </div>
              <div className="w-32 sm:w-40 shrink-0 flex flex-col gap-1 min-w-0">
                <span className="truncate text-xs font-bold text-foreground">
                  {scene.title || `مشهد ${scene.scene_number}`}
                </span>
                <div className="flex flex-wrap gap-1">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${pacingClass}`}>{scene.pacingStyle}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${complexityClass}`}>{scene.complexityLevel}</span>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-secondary/60 border border-border text-muted-foreground">⏱️ {durationStr}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 flex gap-1 h-2.5 min-w-0 px-2 sm:px-0">
              <div className="bg-indigo-400/15 rounded-full overflow-hidden flex-1" title={`حوار: ${dPct.toFixed(0)}%`}>
                <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.max(dPct, 3)}%` }} />
              </div>
              <div className="bg-amber-400/15 rounded-full overflow-hidden flex-1" title={`شخصيات: ${cPct.toFixed(0)}%`}>
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.max(cPct, 3)}%` }} />
              </div>
              <div className="bg-emerald-400/15 rounded-full overflow-hidden flex-1" title={`إنتاج: ${pPct.toFixed(0)}%`}>
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.max(pPct, 3)}%` }} />
              </div>
              <div className="bg-rose-400/15 rounded-full overflow-hidden flex-1" title={`كلمات: ${wPct.toFixed(0)}%`}>
                <div className="h-full bg-rose-400 rounded-full" style={{ width: `${Math.max(wPct, 3)}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

export default RhythmDNAWidget;
