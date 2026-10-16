import fs from 'fs';

const p = 'd:/SCRIPTFLOW Pro/SCRIPTFLOW ENREPRISE/apps/desktop/src/pages/SceneEditor.jsx';
let content = fs.readFileSync(p, 'utf-8');

// 1. Replace WorkspaceCanvas content
const workspaceCanvasRegex = /<WorkspaceCanvas>([\s\S]*?)<\/WorkspaceCanvas>/m;

const newWorkspaceCanvas = `<WorkspaceCanvas>
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
        </WorkspaceCanvas>`;

content = content.replace(workspaceCanvasRegex, newWorkspaceCanvas);

// 2. Replace Editor tab content
const editorTabRegex = /\{editorType === 'paper' \? \([\s\S]*?\) : \(\s*<SmartEditor[\s\S]*?\/>\s*\)\}/m;

const newEditorTab = `{editorType === 'paper' ? (
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
                )}`;

content = content.replace(editorTabRegex, newEditorTab);

fs.writeFileSync(p, content);
console.log('Patched layout successfully.');
