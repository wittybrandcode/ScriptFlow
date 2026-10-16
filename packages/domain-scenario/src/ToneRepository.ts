import { dbSelect, dbExecute } from '@scriptflow/database';

/**
 * ToneRepository is special: tones don't have a scenario_id
 * and don't use soft-delete. They also enforce UNIQUE(name).
 */
export interface ITone {
  id: string;
  name: string;
}

export class ToneRepository {
  private readonly tableName = 'tones';

  async findAll(): Promise<ITone[]> {
    return await dbSelect<ITone>(`SELECT * FROM ${this.tableName} ORDER BY name ASC`);
  }

  async findByName(name: string): Promise<ITone | null> {
    const rows = await dbSelect<ITone>(
      `SELECT * FROM ${this.tableName} WHERE name = $1 LIMIT 1`, [name]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async insert(tone: ITone): Promise<void> {
    await dbExecute(
      `INSERT INTO ${this.tableName} (id, name) VALUES ($1, $2)`,
      [tone.id, tone.name]
    );
  }

  async delete(id: string): Promise<void> {
    await dbExecute(`DELETE FROM ${this.tableName} WHERE id = $1`, [id]);
  }
}
