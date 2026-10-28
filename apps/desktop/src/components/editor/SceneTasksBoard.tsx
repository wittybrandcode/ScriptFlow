import React, { useState } from 'react';
import { Briefcase, CheckCircle2, Circle } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useCrewQuery } from '../../hooks/queries';
import { useSceneTasksQuery, useCreateSceneTaskMutation, useUpdateSceneTaskStatusMutation } from '../../hooks/queries/useProductionTasks';

export interface SceneTasksBoardProps {
  sceneId?: string | number;
}

export default function SceneTasksBoard({ sceneId }: SceneTasksBoardProps) {
  const { activeScenarioId } = useUIStore();
  const { data: crew = [] } = useCrewQuery(activeScenarioId || '');
  const { data: tasks = [], isLoading: loading } = useSceneTasksQuery(activeScenarioId || undefined, sceneId ? String(sceneId) : undefined);
  const createTaskMutation = useCreateSceneTaskMutation();
  const updateTaskStatusMutation = useUpdateSceneTaskStatusMutation();

  const [newTask, setNewTask] = useState({
    title: '',
    department: 'General',
    crew_id: ''
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title) return;

    try {
      const crewId = newTask.crew_id || null;
      await createTaskMutation.mutateAsync({
        scenario_id: activeScenarioId,
        scene_id: sceneId,
        department: newTask.department,
        title: newTask.title,
        crew_id: crewId
      } as any);
      setNewTask({ title: '', department: 'General', crew_id: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTaskStatus = async (task: any) => {
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      await updateTaskStatusMutation.mutateAsync({
        taskId: task.id,
        status: newStatus,
        scenarioId: activeScenarioId,
        sceneId: sceneId
      } as any);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Form */}
      <div className="bg-card border border-border rounded p-3 shadow-sm">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Briefcase size={14} className="text-primary" />
          <span>إضافة مهمة جديدة</span>
        </h3>
        <form onSubmit={handleAddTask} className="flex flex-col gap-2">
          <input 
            type="text" 
            placeholder="عنوان المهمة (مثال: تجهيز ألوان مائية)..." 
            value={newTask.title}
            onChange={e => setNewTask({...newTask, title: e.target.value})}
            className="w-full px-2 py-1.5 bg-background border border-input rounded text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none"
          />
          <div className="flex gap-2">
            <select 
              value={newTask.department}
              onChange={e => setNewTask({...newTask, department: e.target.value})}
              className="flex-1 px-2 py-1.5 bg-background border border-input rounded text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none"
            >
              <option value="General">عام</option>
              <option value="Camera">تصوير</option>
              <option value="Art">ديكور</option>
              <option value="Makeup">مكياج</option>
              <option value="Sound">صوت</option>
              <option value="VFX">مؤثرات بصرية</option>
            </select>
            <select 
              value={newTask.crew_id}
              onChange={e => setNewTask({...newTask, crew_id: e.target.value})}
              className="flex-1 px-2 py-1.5 bg-background border border-input rounded text-sm font-medium focus:ring-1 focus:ring-primary/20 outline-none"
            >
              <option value="">(بدون تعيين)</option>
              {crew.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={!newTask.title} className="w-full mt-1 bg-primary text-white p-1.5 rounded text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50">
            إنشاء المهمة
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded p-3 shadow-sm flex-1">
        <h3 className="text-[11px] font-bold text-foreground uppercase tracking-widest mb-3">مهام المشهد</h3>
        {loading ? (
          <div className="text-xs text-muted-foreground text-center py-4">جاري التحميل...</div>
        ) : tasks.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">لا توجد مهام إنتاجية مسجلة لهذا المشهد.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map((task: any) => (
              <div key={task.id} className={`flex items-start gap-2 p-2 rounded border transition-all ${task.status === 'DONE' ? 'bg-secondary/30 border-border/50 opacity-70' : 'bg-background border-border hover:border-primary/30'}`}>
                <button onClick={() => toggleTaskStatus(task)} className={`mt-0.5 shrink-0 ${task.status === 'DONE' ? 'text-emerald-500' : 'text-muted-foreground hover:text-primary'}`}>
                  {task.status === 'DONE' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-bold ${task.status === 'DONE' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="bg-secondary px-1 py-0.5 rounded text-primary">{task.department}</span>
                    {task.crew_name && <span>• {task.crew_name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
