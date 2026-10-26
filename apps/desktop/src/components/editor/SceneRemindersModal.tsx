import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle, Circle, StickyNote } from 'lucide-react';
import { useRemindersQuery, useAddReminderMutation, useUpdateReminderMutation, useDeleteReminderMutation } from '../../hooks/queries/useScenes';

export interface SceneRemindersModalProps {
  sceneId?: string | number;
  onClose: () => void;
}

export default function SceneRemindersModal({ sceneId, onClose }: SceneRemindersModalProps) {
  const [newContent, setNewContent] = useState('');
  
  const { data: reminders = [], isLoading } = useRemindersQuery(sceneId as any);
  const addReminderMutation = useAddReminderMutation();
  const updateReminderMutation = useUpdateReminderMutation();
  const deleteReminderMutation = useDeleteReminderMutation();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    try {
      await addReminderMutation.mutateAsync({ sceneId: sceneId as any, content: newContent.trim() });
      setNewContent('');
    } catch (err) {
      console.error('Failed to add reminder', err);
    }
  };

  const handleToggle = async (id: string, isCompleted: boolean, content: string) => {
    try {
      await updateReminderMutation.mutateAsync({ id, isCompleted: !isCompleted, content });
    } catch (err) {
      console.error('Failed to update reminder', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReminderMutation.mutateAsync(id);
    } catch (err) {
      console.error('Failed to delete reminder', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] font-sans" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <StickyNote size={18} />
            </div>
            <h3 className="font-bold text-lg text-foreground">ملاحظات وتذكيرات الكاتب للمشهد</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-border/50">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="أضف ملاحظة تذكيرية جديدة..."
              className="flex-1 bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <button
              type="submit"
              disabled={!newContent.trim()}
              className="px-4 py-2 bg-amber-600 text-white font-bold text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> إضافة
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm font-medium">جاري التحميل...</div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center gap-3">
              <StickyNote size={32} className="text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground font-medium">لا توجد ملاحظات تذكيرية لهذا المشهد.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {reminders.map((reminder: any) => (
                <div key={reminder.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${reminder.is_completed ? 'bg-secondary/30 border-transparent opacity-60' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <button onClick={() => handleToggle(reminder.id, reminder.is_completed, reminder.content)} className="mt-0.5 shrink-0">
                    {reminder.is_completed ? (
                      <CheckCircle size={18} className="text-emerald-500" />
                    ) : (
                      <Circle size={18} className="text-muted-foreground hover:text-amber-600 transition-colors" />
                    )}
                  </button>
                  <p className={`flex-1 text-sm font-medium leading-relaxed ${reminder.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {reminder.content}
                  </p>
                  <button onClick={() => handleDelete(reminder.id)} className="shrink-0 p-1.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
