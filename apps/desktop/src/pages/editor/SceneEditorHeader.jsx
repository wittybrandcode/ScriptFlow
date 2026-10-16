import React from 'react';
import { ChevronDown, Search, Plus, UserPlus, Camera, Volume2, MonitorPlay, AlertCircle, StickyNote, Scissors, Edit3, Settings, CheckSquare, AlignLeft, Users2, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSceneSnapshotsQuery } from '../../hooks/queries/useSnapshots';
import { History } from 'lucide-react';

const SceneEditorHeader = ({
  scene,
  id,
  isNew,
  allScenes,
  characters,
  handleSceneChange,
  saveScene,
  
  // Tabs & Menus
  activeTab,
  setActiveTab,
  showSceneMenu,
  setShowSceneMenu,
  showCharMenu,
  setShowCharMenu,
  charSearch,
  setCharSearch,
  setShowCharModal,
  setShowRemindersModal,
  
  // Actions
  addBlock,
  getInsertIndex,
  quickAddCharacter,
  onRestoreSnapshot
}) => {
  const navigate = useNavigate();
  const [showSnapshots, setShowSnapshots] = React.useState(false);
  const { data: snapshots = [] } = useSceneSnapshotsQuery(id ? String(id) : null);

  return (
    <div className="shrink-0 bg-card flex flex-col z-20 pt-2 px-2 pb-1.5 border-b border-border shadow-[0_4px_10px_-4px_rgba(0,0,0,0.05)] gap-1.5">
      {/* السطر الأول: رقم المشهد وعنوان المشهد */}
      <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border border-border shadow-sm">
        <div className="relative shrink-0">
          <button
            onClick={() => setShowSceneMenu(!showSceneMenu)}
            className="px-2 py-1.5 rounded-md flex items-center gap-1 min-w-[35px] bg-secondary hover:bg-secondary/80 text-foreground border border-border/80 text-xs font-black whitespace-nowrap transition-all"
            title="عرض قائمة المشاهد للتنقل"
          >
            <span>مشهد {scene.scene_number}</span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${showSceneMenu ? 'rotate-180' : ''}`} />
          </button>

          {showSceneMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSceneMenu(false)} />
              <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border shadow-xl rounded-lg z-50 flex flex-col max-h-72 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                  <div className="p-2 border-b border-border bg-secondary/20 shrink-0 text-[10px] font-bold text-muted-foreground text-right">
                    اختر مشهداً للانتقال إليه:
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
                    {allScenes.map(s => (
                        <button 
                          key={s.id} 
                          onClick={async () => {
                              setShowSceneMenu(false);
                              await saveScene();
                              navigate(`/scene/${s.id}`);
                          }}
                          className={`w-full text-right px-3 py-2 text-xs font-bold transition-colors flex items-center justify-between ${String(s.id) === String(id) ? 'bg-secondary text-primary' : 'hover:bg-secondary text-foreground'}`}
                        >
                          <span>مشهد {s.scene_number}</span>
                          <span className="text-muted-foreground font-normal truncate max-w-[150px]">{s.title || '(بدون عنوان)'}</span>
                        </button>
                    ))}
                    {allScenes.length === 0 && (
                        <div className="px-3 py-3 text-[10px] text-muted-foreground text-center">لا توجد مشاهد</div>
                    )}
                  </div>
              </div>
            </>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={scene.title || ''}
            onChange={e => handleSceneChange('title', e.target.value)}
            placeholder="عنوان المشهد (اختياري)..."
            className="w-full bg-transparent text-foreground text-sm font-bold focus:outline-none placeholder:text-muted-foreground/50 truncate"
          />
        </div>
      </div>

      {/* السطر الثاني: التبويبات (أيقونات)، قائمة الحالة وخانة التوقيت */}
      <div className="flex items-center justify-between gap-1.5">
          <div className="flex bg-secondary/50 rounded-lg p-0.5 gap-0.5 shrink-0">
            <button
                onClick={() => setActiveTab('editor')}
                className={`p-1.5 rounded-md transition-all ${activeTab === 'editor' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                title="المحرر"
            >
                <Edit3 size={15} />
            </button>
            <button
                onClick={() => setActiveTab('metadata')}
                className={`p-1.5 rounded-md transition-all ${activeTab === 'metadata' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                title="الإعدادات"
            >
                <Settings size={15} />
            </button>
            <button
                onClick={() => setActiveTab('tasks')}
                className={`p-1.5 rounded-md transition-all ${activeTab === 'tasks' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                title="المهام"
            >
                <CheckSquare size={15} />
            </button>
          </div>
          
          <div className="flex items-center gap-1.5 flex-1 justify-end">
            <select
              value={scene.status}
              onChange={e => handleSceneChange('status', e.target.value)}
              className="px-2 py-1 rounded-md text-[10px] font-black border transition-all bg-secondary text-foreground border-border shadow-sm"
            >
              <option value="DRAFT">مسودة</option>
              <option value="IN_PROGRESS">قيد العمل</option>
              <option value="COMPLETED">مكتمل</option>
            </select>

            <div className="flex items-center gap-1 rounded-md px-2 py-1 bg-secondary text-muted-foreground border border-border/80 shrink-0" title={`المدة الإجمالية: ${scene.estimated_duration || 0} دقيقة`}>
              <span className="text-[11px] font-sans font-black text-muted-foreground">{scene.estimated_duration || 0}</span>
              <Timer size={12} className="shrink-0 text-muted-foreground" />
            </div>
            
            {!isNew && snapshots.length > 0 && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowSnapshots(!showSnapshots)}
                  className="px-2 py-1 rounded-md flex items-center gap-1 bg-secondary hover:bg-secondary/80 text-foreground border border-border/80 text-[10px] font-bold transition-all"
                  title="استعادة نسخة سابقة"
                >
                  <History size={12} />
                  <span>استعادة</span>
                </button>

                {showSnapshots && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSnapshots(false)} />
                    <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border shadow-xl rounded-lg z-50 flex flex-col max-h-72 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                      <div className="p-2 border-b border-border bg-secondary/20 shrink-0 text-[10px] font-bold text-muted-foreground text-right">
                        استعادة نقطة حفظ سابقة:
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
                        {snapshots.map(snap => (
                          <button
                            key={snap.id}
                            onClick={() => {
                              setShowSnapshots(false);
                              if (window.confirm('هل أنت متأكد من استعادة هذه النسخة؟ ستفقد التعديلات الحالية غير المحفوظة.')) {
                                try {
                                  const parsedBlocks = JSON.parse(snap.snapshot_json);
                                  if (onRestoreSnapshot) {
                                    onRestoreSnapshot(parsedBlocks);
                                  }
                                } catch(e) {
                                  console.error("Failed to parse snapshot", e);
                                }
                              }
                            }}
                            className="w-full text-right px-3 py-2 text-xs font-bold transition-colors hover:bg-secondary text-foreground flex flex-col gap-1"
                          >
                            <span dir="ltr" className="text-right">{new Date(snap.created_at + 'Z').toLocaleString('ar-EG')}</span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                              {snap.trigger === 'auto_5min' ? 'حفظ تلقائي' : 
                               snap.trigger === 'scene_switch' ? 'تبديل المشهد' : 
                               snap.trigger === 'scene_load' ? 'بداية الجلسة' : snap.trigger}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
      </div>

      {/* السطر الثالث: أيقونات التحرير */}
      {activeTab === 'editor' && (
        <div className="flex items-center justify-between bg-card p-1 rounded-lg border border-border/60 shadow-sm shrink-0 w-full">
          <div className="flex items-center gap-1 w-full">
            <button onClick={() => addBlock(getInsertIndex(), 'ACTION')} className="p-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md flex items-center justify-center transition-all flex-1" title="حدث (Action)">
                <AlignLeft size={16} strokeWidth={2.5} />
            </button>
            
            <div className="relative flex-1 flex items-center justify-center">
              <button 
                  onClick={() => { setShowCharMenu(!showCharMenu); setCharSearch(''); }} 
                  className={`p-2 rounded-md transition-all w-full flex items-center justify-center ${showCharMenu ? 'bg-secondary text-foreground ring-2 ring-primary/20' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`} 
                  title="إضافة حوار (Dialogue)"
              >
                  <Users2 size={16} strokeWidth={2.5} />
              </button>
              
              {showCharMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCharMenu(false)} />
                  <div className="absolute top-full right-0 mt-2 w-52 bg-card border border-border shadow-xl rounded-lg z-50 flex flex-col max-h-72 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                      <div className="p-2 border-b border-border bg-secondary/20 shrink-0">
                        <div className="flex items-center gap-1.5 bg-background border border-input rounded-md px-2 py-1">
                            <Search size={12} className="text-muted-foreground shrink-0" />
                            <input 
                              type="text"
                              autoFocus
                              value={charSearch}
                              onChange={e => setCharSearch(e.target.value)}
                              placeholder="بحث..."
                              className="w-full bg-transparent border-none text-xs font-medium focus:outline-none placeholder:text-muted-foreground/50"
                              dir="rtl"
                            />
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
                        {characters.filter(c => c.name.includes(charSearch)).map(c => (
                            <button 
                              key={c.id} 
                              onClick={() => {
                                  addBlock(getInsertIndex(), 'DIALOGUE', c.id);
                                  setShowCharMenu(false);
                              }}
                              className="w-full text-right px-3 py-2 hover:bg-secondary text-xs font-bold text-foreground transition-colors"
                            >
                              {c.name}
                            </button>
                        ))}
                        {charSearch.trim() && characters.filter(c => c.name.includes(charSearch)).length === 0 && (
                            <button 
                              onClick={async () => {
                                  const newChar = await quickAddCharacter(charSearch.trim());
                                  if (newChar) {
                                    addBlock(getInsertIndex(), 'DIALOGUE', newChar.id);
                                  }
                                  setShowCharMenu(false);
                                  setCharSearch('');
                              }}
                              className="w-full text-right px-3 py-2 hover:bg-secondary text-xs font-bold text-foreground flex items-center gap-2 transition-colors"
                            >
                              <Plus size={12} strokeWidth={3} /> إنشاء "{charSearch.trim()}" وإضافة حوار
                            </button>
                        )}
                        {!charSearch.trim() && characters.length === 0 && (
                            <div className="px-3 py-3 text-[10px] text-muted-foreground text-center">لا توجد شخصيات</div>
                        )}
                      </div>
                      <div className="border-t border-border shrink-0">
                        <button 
                            onClick={() => {
                              setShowCharMenu(false);
                              setShowCharModal(true);
                            }}
                            className="w-full text-right px-3 py-2 hover:bg-secondary text-xs font-bold text-foreground flex items-center gap-2 transition-colors"
                        >
                            <UserPlus size={12} /> إضافة شخصية مفصلة...
                        </button>
                      </div>
                  </div>
                </>
              )}
            </div>
            
            <button onClick={() => addBlock(getInsertIndex(), 'SHOT')} className="p-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-all flex-1 flex items-center justify-center" title="توجيه كاميرا">
                <Camera size={16} strokeWidth={2.5} />
            </button>
            <button onClick={() => addBlock(getInsertIndex(), 'AUDIO')} className="p-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-all flex-1 flex items-center justify-center" title="مؤثر صوتي">
                <Volume2 size={16} strokeWidth={2.5} />
            </button>
            <button onClick={() => addBlock(getInsertIndex(), 'TEXT')} className="p-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-all flex-1 flex items-center justify-center" title="نص على الشاشة">
                <MonitorPlay size={16} strokeWidth={2.5} />
            </button>
            <button onClick={() => addBlock(getInsertIndex(), 'DIRECTOR_NOTE')} className="p-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-all flex-1 flex items-center justify-center" title="ملاحظة إخراجية">
                <AlertCircle size={16} strokeWidth={2.5} />
            </button>
            <button onClick={() => setShowRemindersModal(true)} className="p-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-all flex-1 flex items-center justify-center border border-border/60" title="ملاحظات وتذكيرات الكاتب">
                <StickyNote size={16} strokeWidth={2.5} />
            </button>
            <button onClick={() => addBlock(getInsertIndex(), 'TRANSITION')} className="p-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-md transition-all flex-1 flex items-center justify-center" title="انتقال (Cut To)">
                <Scissors size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(SceneEditorHeader);
