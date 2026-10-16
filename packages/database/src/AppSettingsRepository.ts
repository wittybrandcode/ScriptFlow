import { dbSelect, dbExecute } from './client.js';

export interface AppSetting {
  key: string;
  value: string;
  updated_at?: string;
}

export class AppSettingsRepository {
  async get(key: string): Promise<string | null> {
    const rows = await dbSelect<AppSetting>(
      'SELECT key, value, updated_at FROM app_settings WHERE key = $1 LIMIT 1',
      [key]
    );
    return rows.length > 0 ? rows[0].value : null;
  }

  async set(key: string, value: string): Promise<void> {
    await dbExecute(
      'INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ' +
      'ON CONFLICT(key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
      [key, value]
    );
  }

  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }
}

export const appSettingsRepository = new AppSettingsRepository();
