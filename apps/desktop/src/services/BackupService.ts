import { mkdir, readDir, stat, exists, remove } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';

export interface BackupInfo {
  name: string;
  path: string;
  sizeBytes: number;
  sizeMB: string;
  createdAt: Date | string | number;
}

export interface BackupResult {
  success: boolean;
  filename: string;
  path: string;
  timestamp: string;
}

class BackupService {
  /**
   * Retrieves the designated path for backups folder, creating it if needed.
   */
  async getBackupsDir(): Promise<string> {
    const appRoot = await invoke<string>('get_app_root');
    const backupsDir = await join(appRoot, 'backups');
    
    const dirExists = await exists(backupsDir);
    if (!dirExists) {
      await mkdir(backupsDir, { recursive: true });
    }
    
    return backupsDir;
  }

  /**
   * Creates a new defragmented backup using VACUUM INTO.
   */
  async createBackup(suffix: string = 'manual'): Promise<BackupResult> {
    try {
      const appRoot = await invoke<string>('get_app_root');
      const dbPath = await join(appRoot, 'scriptflow.db');
      
      let dbExists = true;
      try {
        dbExists = await exists(dbPath);
      } catch (err) {
        console.warn('Scope check fallback for exists:', err);
      }
      if (!dbExists) {
        const health = await invoke('check_db_health').catch(() => null);
        if (!health) {
          console.warn('[BackupService] db file not directly at appRoot, falling back to active database connection.');
        }
      }

      const backupsDir = await this.getBackupsDir();
      
      const date = new Date();
      const timestamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19); // YYYY-MM-DDTHH-mm-ss
      const backupFilename = `scriptflow_${suffix}_${timestamp}.bak.db`;
      const backupPath = await join(backupsDir, backupFilename);

      try {
        const { vacuumDatabase } = await import('@scriptflow/database');
        await vacuumDatabase(backupPath);
      } catch (err: any) {
        console.error('VACUUM INTO failed! Backup aborted to prevent corruption:', err);
        throw new Error('فشل النسخ الاحتياطي: ' + err.message);
      }
      
      // Auto-rotation: Keep only the 5 most recent 'auto' backups
      if (suffix === 'auto') {
        await this._rotateAutoBackups();
      }

      return {
        success: true,
        filename: backupFilename,
        path: backupPath,
        timestamp: date.toISOString()
      };
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Retrieves the list of available backups sorted newest first.
   */
  async getBackups(): Promise<BackupInfo[]> {
    try {
      const backupsDir = await this.getBackupsDir();
      const entries = await readDir(backupsDir);
      
      const backupPromises = entries
        .filter(entry => entry.name && entry.name.endsWith('.bak.db'))
        .map(async (entry): Promise<BackupInfo> => {
          const filePath = await join(backupsDir, entry.name);
          const fileStat = await stat(filePath);
          return {
            name: entry.name,
            path: filePath,
            sizeBytes: fileStat.size,
            sizeMB: (fileStat.size / (1024 * 1024)).toFixed(2),
            createdAt: fileStat.mtime || fileStat.birthtime || new Date(),
          };
        });
      
      const backups = await Promise.all(backupPromises);
      
      return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Failed to get backups list:', error);
      return [];
    }
  }

  /**
   * Deletes a specific backup by filename.
   */
  async deleteBackup(filename: string): Promise<boolean> {
    try {
      const backupsDir = await this.getBackupsDir();
      const filePath = await join(backupsDir, filename);
      await remove(filePath);
      return true;
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw error;
    }
  }

  /**
   * Auto-rotates backups, keeping only the 5 latest automatic ones.
   */
  async _rotateAutoBackups(): Promise<void> {
    try {
      const allBackups = await this.getBackups();
      const autoBackups = allBackups.filter(b => b.name.includes('_auto_'));
      
      if (autoBackups.length > 5) {
        const backupsToDelete = autoBackups.slice(5);
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.name);
        }
      }
    } catch (error) {
      console.error('Failed to rotate auto backups:', error);
    }
  }
}

export const backupService = new BackupService();
