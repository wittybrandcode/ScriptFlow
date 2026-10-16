import fs from 'fs';

const p = 'd:/SCRIPTFLOW Pro/SCRIPTFLOW ENREPRISE/apps/desktop/src/pages/SceneEditor.jsx';
let content = fs.readFileSync(p, 'utf-8');

// The broken part starts at <WorkspaceCanvas>
const brokenRegex = /<WorkspaceCanvas>[\s\S]*?<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*<\/div>/m;

// Wait, let's just replace from <WorkspaceCanvas> to the end of that block, we know what it looks like now:
// Currently the broken code has:
/*
        <WorkspaceCanvas>
          {editorType === 'paper' ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground p-8 text-center mt-12">
                  // ...
                  </div>
                ) : (
                  <SmartEditor ... />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
*/

// I'll just write a script that takes the first half (before <WorkspaceCanvas>) and the last half (from {showCharModal && ...)
// and injects the perfect center part.

const part1 = content.split('<WorkspaceCanvas>')[0];
const part2 = content.split('{showCharModal && (')[1];

const perfectCenter = `<WorkspaceCanvas>
          {editorType === 'paper' ? (
             <div className="flex justify-center w-full">
               <PaperEditor 
                  scene={scene}
                  initialBlocks={blocks}
                  characters={characters}
                  onUpdateBlocks={(newBlocks) => {
                    setBlocks(newBlocks);
                    setSaveStatus('unsaved');
                  }}
               />
             </div>
          ) : (
             <ScenePaperRenderer 
               scene={scene}
               blocks={blocks}
               characters={characters}
               isReference={false}
             />
          )}

          {pinnedSceneData && (
            <ScenePaperRenderer 
              scene={pinnedSceneData}
              blocks={pinnedSceneData.blocks || []}
              characters={characters}
              isReference={true}
              onCloseReference={() => setPinnedSceneId(null)}
            />
          )}
        </WorkspaceCanvas>

        {/* Professional Editing Sidebar (Form) - Right Side */}
        <div className="w-[420px] shrink-0 border-l border-border bg-card flex flex-col h-full shadow-2xl relative z-10">
          
          {/* Header Fixed Area (Extremely Compact, No Borders, Sticky) */}
          <div className="shrink-0 bg-card flex flex-col z-20 pt-2 px-2 pb-1 shadow-[0_4px_10px_-4px_rgba(0,0,0,0.05)]">
            
            {/* رأس المشهد (العنوان والحالة) - ثابت دائمًا */}
            <div className="mb-1.5">
              <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border border-border shadow-sm">
                <div className={\`px-2 py-1.5 rounded-md shrink-0 flex items-center justify-center min-w-[35px] \${scene.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}\`}>
                  <span className="text-xs font-black whitespace-nowrap">مشهد {scene.scene_number}</span>
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

                <select
                  value={scene.status}
                  onChange={e => handleSceneChange('status', e.target.value)}
                  className={\`shrink-0 px-2 py-1 rounded-md text-[10px] font-black border transition-all \${
                    scene.status === 'COMPLETED' ? 'bg-emerald-500 text-white border-emerald-600 shadow-md' : 'bg-secondary text-muted-foreground border-border'
                  }\`}
                >
                  <option value="DRAFT">مسودة</option>
                  <option value="IN_PROGRESS">قيد العمل</option>
                  <option value="COMPLETED">مكتمل</option>
                </select>
              </div>
            </div>

            {/* Tabs Header */}
            <div className="flex items-center gap-1.5">
               <div className="flex flex-1 bg-secondary/50 rounded-lg p-1 gap-1">
                  <button
                     onClick={() => setActiveTab('editor')}
                     className={\`flex-1 py-1 text-xs font-bold uppercase tracking-widest rounded-md transition-all \${activeTab === 'editor' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}\`}
                  >
                     المحرر
                  </button>
                  <button
                     onClick={() => setActiveTab('metadata')}
                     className={\`flex-1 py-1 text-xs font-bold uppercase tracking-widest rounded-md transition-all \${activeTab === 'metadata' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}\`}
                  >
                     الإعدادات
                  </button>
                  <button
                     onClick={() => setActiveTab('tasks')}
                     className={\`flex-1 py-1 text-xs font-bold uppercase tracking-widest rounded-md transition-all \${activeTab === 'tasks' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}\`}
                  >
                     المهام
                  </button>
               </div>
               
               <div className="flex items-center gap-1.5 rounded-md px-3 py-1.5 bg-primary/5 border border-primary/20 shrink-0" title={\`المدة الإجمالية: \${scene.estimated_duration || 0} دقيقة\`}>
                 <span className="text-xs font-black text-primary font-sans">{scene.estimated_duration || 0}</span>
                 <Timer size={14} className="shrink-0 text-primary" />
               </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pt-1.5 pb-16 relative">
            {activeTab === 'metadata' ? (
              <SceneMetadataForm 
                scene={scene} 
                onSceneChange={handleSceneChange} 
                locations={locations}
                characters={characters}
                episodes={episodes}
                onEditLocation={(id) => {
                  setEditingLocationId(id);
                  setShowLocationModal(true);
                }}
                onAddLocation={() => {
                  setEditingLocationId(null);
                  setShowLocationModal(true);
                }}
              />
            ) : activeTab === 'tasks' ? (
              <SceneTasksBoard sceneId={id} />
            ) : (
              <div className="flex flex-col h-full relative">
                {/* Editor Type Toggle - Visible at Top Center */}
                <div className="bg-background border border-border p-1 rounded-lg flex gap-1 shrink-0 w-max mx-auto mt-2 mb-4 shadow-sm z-10">
                  <button
                    onClick={async () => {
                      setEditorType('classic');
                    }}
                    className={\`px-6 py-1.5 text-xs font-bold rounded-md transition-all \${editorType === 'classic' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}\`}
                  >
                    📝 المحرر الكلاسيكي
                  </button>
                  <button
                    onClick={async () => {
                      setEditorType('paper');
                    }}
                    className={\`px-6 py-1.5 text-xs font-bold rounded-md transition-all \${editorType === 'paper' ? 'bg-indigo-600 text-white shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}\`}
                  >
                    📄 محرر الورقة
                  </button>
                </div>

                {editorType === 'paper' ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground p-8 text-center mt-12">
                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-4 mx-auto">
                      <Sparkles size={32} />
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-2">وضع التحرير الورقي نشط</h3>
                    <p className="text-sm leading-relaxed">
                      انتقل إلى الورقة في منتصف الشاشة للكتابة مباشرة.<br/><br/>
                      استخدم زر <b>Tab</b> لإظهار القائمة<br/>
                      وزر <b>Enter</b> للقفز السريع.
                    </p>
                  </div>
                ) : (
                  <SmartEditor 
                    blocks={blocks}
                    setBlocks={setBlocks}
                    onAddBlock={addBlock}
                    onUpdateBlock={debouncedUpdateBlock}
                    onDeleteBlock={deleteBlock}
                    onReorderBlocks={handleReorderBlocks}
                    characters={characters}
                    onShowCharModal={() => setShowCharModal(true)}
                    onOpenReminders={() => setShowRemindersModal(true)}
                    onQuickAddCharacter={quickAddCharacter}
                    scene={scene}
                    onSceneChange={handleSceneChange}
                  />
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {showCharModal && (`;

fs.writeFileSync(p, part1 + perfectCenter + part2);
console.log('Restored correctly');
