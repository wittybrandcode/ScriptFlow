import { BaseRepository } from './BaseRepository.js';
import { dbSelect, dbExecute } from './client.js';

export interface ProductionTask {
  id: string;
  scenario_id: string;
  scene_id: string | null;
  crew_id: string | null;
  title: string;
  department: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  created_at: string;
  updated_at: string;
}

export interface ProductionTaskWithCrew extends ProductionTask {
  crew_name?: string;
}

export class ProductionTaskRepository extends BaseRepository<ProductionTask> {
  protected readonly tableName = 'production_tasks';

  async getByScenarioId(scenarioId: string, tx?: import('./client.js').TransactionContext): Promise<ProductionTask[]> {
    return this.findAllBy('scenario_id', scenarioId, tx);
  }

  async getBySceneId(sceneId: string): Promise<ProductionTask[]> {
    return this.findAllBy('scene_id', sceneId);
  }

  async getBySceneIdWithCrew(scenarioId: string, sceneId: string): Promise<ProductionTaskWithCrew[]> {
    return dbSelect<ProductionTaskWithCrew>(`
      SELECT pt.*, c.name as crew_name
      FROM production_tasks pt
      LEFT JOIN crew c ON pt.crew_id = c.id
      WHERE pt.scenario_id = $1 AND pt.scene_id = $2
      ORDER BY pt.created_at DESC
    `, [scenarioId, sceneId]);
  }

  async createForScene(data: { scenario_id: string; scene_id: string; department: string; title: string; crew_id: string | null }): Promise<ProductionTaskWithCrew | null> {
    const result = await dbExecute(`
      INSERT INTO production_tasks (scenario_id, scene_id, department, title, status, crew_id, created_at)
      VALUES ($1, $2, $3, $4, 'TODO', $5, CURRENT_TIMESTAMP)
    `, [data.scenario_id, data.scene_id, data.department, data.title, data.crew_id]);

    const rows = await dbSelect<ProductionTaskWithCrew>(`
      SELECT pt.*, c.name as crew_name
      FROM production_tasks pt
      LEFT JOIN crew c ON pt.crew_id = c.id
      WHERE pt.id = $1
    `, [result.lastInsertId]);

    return rows.length > 0 ? rows[0] : null;
  }

  async updateStatus(taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE'): Promise<void> {
    await dbExecute('UPDATE production_tasks SET status = $1 WHERE id = $2', [status, taskId]);
  }
}
