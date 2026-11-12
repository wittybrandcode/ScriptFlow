import { BaseRepository } from './BaseRepository.js';
import { dbSelect, dbExecute, TransactionContext } from './client.js';
import { generateId } from '@scriptflow/core';

export interface ProductionTask {
  id: string;
  scenario_id: string;
  scene_id: string | null;
  crew_id: string | null;
  title: string;
  department: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  created_at: string;
  updated_at?: string;
}

export interface ProductionTaskWithCrew extends ProductionTask {
  crew_name?: string;
}

export class ProductionTaskRepository extends BaseRepository<ProductionTask> {
  protected readonly tableName = 'production_tasks';
  protected readonly allowedColumns = ['id', 'scenario_id', 'scene_id', 'crew_id', 'title', 'department', 'status', 'created_at'];

  async getByScenarioId(scenarioId: string, tx?: TransactionContext): Promise<ProductionTask[]> {
    return this.findAllBy('scenario_id', scenarioId, tx);
  }

  async getBySceneId(sceneId: string, tx?: TransactionContext): Promise<ProductionTask[]> {
    return this.findAllBy('scene_id', sceneId, tx);
  }

  async getBySceneIdWithCrew(scenarioId: string, sceneId: string, tx?: TransactionContext): Promise<ProductionTaskWithCrew[]> {
    const query = `
      SELECT pt.*, c.name as crew_name
      FROM production_tasks pt
      LEFT JOIN crew c ON pt.crew_id = c.id AND c.deleted_at IS NULL
      WHERE pt.scenario_id = $1 AND pt.scene_id = $2
      ORDER BY pt.created_at DESC
    `;
    return tx ? tx.select<ProductionTaskWithCrew>(query, [scenarioId, sceneId]) : dbSelect<ProductionTaskWithCrew>(query, [scenarioId, sceneId]);
  }

  async createForScene(data: { id?: string; scenario_id: string; scene_id: string; department: string; title: string; crew_id: string | null }, tx?: TransactionContext): Promise<ProductionTaskWithCrew | null> {
    const id = data.id || generateId('tsk');
    const insertQuery = `
      INSERT INTO production_tasks (id, scenario_id, scene_id, department, title, status, crew_id, created_at)
      VALUES ($1, $2, $3, $4, $5, 'TODO', $6, CURRENT_TIMESTAMP)
    `;
    const selectQuery = `
      SELECT pt.*, c.name as crew_name
      FROM production_tasks pt
      LEFT JOIN crew c ON pt.crew_id = c.id AND c.deleted_at IS NULL
      WHERE pt.id = $1
    `;

    if (tx) {
      await tx.execute(insertQuery, [id, data.scenario_id, data.scene_id, data.department, data.title, data.crew_id]);
      const rows = await tx.select<ProductionTaskWithCrew>(selectQuery, [id]);
      return rows.length > 0 ? rows[0] : null;
    } else {
      await dbExecute(insertQuery, [id, data.scenario_id, data.scene_id, data.department, data.title, data.crew_id]);
      const rows = await dbSelect<ProductionTaskWithCrew>(selectQuery, [id]);
      return rows.length > 0 ? rows[0] : null;
    }
  }

  async updateStatus(taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE', tx?: TransactionContext): Promise<void> {
    const query = 'UPDATE production_tasks SET status = $1 WHERE id = $2';
    if (tx) {
      await tx.execute(query, [status, taskId]);
    } else {
      await dbExecute(query, [status, taskId]);
    }
  }
}
