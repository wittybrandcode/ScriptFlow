import { copyFile, mkdir, readDir, stat, exists, remove } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';

class BackupService {
  /**
   * يحصل على مسار المجلد المخصص للنسخ الاحتياطية.
   * سيتم إنشاؤه إذا لم يكن موجوداً.
   */
  async getBackupsDir() {
    const appRoot = await invoke('get_app_root');
    const backupsDir = await join(appRoot, 'backups');
    
    const dirExists = await exists(backupsDir);
    if (!dirExists) {
      await mkdir(backupsDir, { recursive: true });
    }
    
    return backupsDir;
  }

  /**
   * ينشئ نسخة احتياطية جديدة من قاعدة البيانات الحالية
   * @param {string} suffix - لاحقة اختيارية لاسم الملف (مثلا: manual, auto)
   */
  async createBackup(suffix = 'manual') {
    try {
      const appRoot = await invoke('get_app_root');
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
      const timestamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19); // format: YYYY-MM-DDTHH-mm-ss
      const backupFilename = `scriptflow_${suffix}_${timestamp}.bak.db`;
      const backupPath = await join(backupsDir, backupFilename);

      // استخدم VACUUM INTO للنسخ الآمن والمستقر (Defragmented) دون قفل القاعدة
      try {
        const safeBackupPath = backupPath.replace(/\\/g, '/'); // SQLite string safety
        const { dbExecute } = await import('@scriptflow/database');
        await dbExecute(`VACUUM INTO '${safeBackupPath}'`);
      } catch (err) {
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
   * يجلب قائمة بالنسخ الاحتياطية المتوفرة
   */
  async getBackups() {
    try {
      const backupsDir = await this.getBackupsDir();
      const entries = await readDir(backupsDir);
      
      const backupPromises = entries
        .filter(entry => entry.name && entry.name.endsWith('.bak.db'))
        .map(async (entry) => {
          const filePath = await join(backupsDir, entry.name);
          const fileStat = await stat(filePath);
          return {
            name: entry.name,
            path: filePath,
            sizeBytes: fileStat.size,
            sizeMB: (fileStat.size / (1024 * 1024)).toFixed(2),
            createdAt: fileStat.mtime || fileStat.birthtime, // Usually mtime works
          };
        });
      
      const backups = await Promise.all(backupPromises);
      
      // ترتيب تنازلي (الأحدث أولاً)
      return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error('Failed to get backups list:', error);
      return [];
    }
  }

  /**
   * يحذف نسخة احتياطية محددة
   */
  async deleteBackup(filename) {
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
   * يحتفظ فقط بآخر 5 نسخ تلقائية
   */
  async _rotateAutoBackups() {
    try {
      const allBackups = await this.getBackups();
      const autoBackups = allBackups.filter(b => b.name.includes('_auto_'));
      
      if (autoBackups.length > 5) {
        // Since they are sorted descending, elements from index 5 onwards are older
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
