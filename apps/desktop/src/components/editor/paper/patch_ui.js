import fs from 'fs';

const p = 'd:/SCRIPTFLOW Pro/SCRIPTFLOW ENREPRISE/apps/desktop/src/pages/SceneEditor.jsx';
let content = fs.readFileSync(p, 'utf-8');

const regexRender = /\) :\s*\(\s*<SmartEditor\s+blocks=\{blocks\}\s+setBlocks=\{setBlocks\}\s+onAddBlock=\{addBlock\}\s+onUpdateBlock=\{debouncedUpdateBlock\}\s+onDeleteBlock=\{deleteBlock\}\s+onReorderBlocks=\{handleReorderBlocks\}\s+characters=\{characters\}\s+onShowCharModal=\{\(\) => setShowCharModal\(true\)\}\s+onOpenReminders=\{\(\) => setShowRemindersModal\(true\)\}\s+onQuickAddCharacter=\{quickAddCharacter\}\s+scene=\{scene\}\s+onSceneChange=\{handleSceneChange\}\s+\/>\s*\)\}/m;

const newRender = `) : (
              <div className="flex flex-col h-full relative">
                {/* Editor Type Toggle - Top Right in Editor View */}
                <div className="absolute top-2 left-2 z-50 bg-secondary/80 backdrop-blur-md p-1 rounded-lg flex gap-1 border border-border shadow-sm">
                  <button
                    onClick={async () => {
                      setEditorType('classic');
                    }}
                    className={\`px-3 py-1 text-[10px] font-black rounded-md transition-all \${editorType === 'classic' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}\`}
                  >
                    الكلاسيكي
                  </button>
                  <button
                    onClick={async () => {
                      setEditorType('paper');
                    }}
                    className={\`px-3 py-1 text-[10px] font-black rounded-md transition-all \${editorType === 'paper' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}\`}
                  >
                    الورقة
                  </button>
                </div>

                {editorType === 'paper' ? (
                  <PaperEditor 
                    scene={scene}
                    initialBlocks={blocks}
                    characters={characters}
                    onUpdateBlocks={(newBlocks) => {
                      setBlocks(newBlocks);
                      setSaveStatus('unsaved');
                    }}
                  />
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
            )}`;

if (regexRender.test(content)) {
    content = content.replace(regexRender, newRender);
    fs.writeFileSync(p, content);
    console.log('Patched UI render successfully.');
} else {
    console.log('Regex did not match.');
}
