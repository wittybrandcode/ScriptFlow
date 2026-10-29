import React, { useEffect, useRef } from 'react';
import { backupService } from '../../services/BackupService';

/**
 * هذا المكون يعمل في الخلفية كـ Provider غير مرئي 
 * يقوم بتشغيل دورة النسخ الاحتياطي التلقائي (Auto-Backup)
 * مع قفل ضد التداخل (Re-entrancy Lock)
 */
export default function AutoBackupProvider({ children, intervalMinutes = 30 }) {
  const intervalRef = useRef(null);
  const isBackingUpRef = useRef(false);

  useEffect(() => {
    const intervalMs = intervalMinutes * 60 * 1000;

    const performBackup = async (reason) => {
      if (isBackingUpRef.current) {
        console.warn(`[AutoBackup] Backup already in progress. Skipping trigger (${reason}).`);
        return;
      }
      isBackingUpRef.current = true;
      try {
        console.log(`[AutoBackup] Starting backup (Reason: ${reason})...`);
        await backupService.createBackup(reason);
        console.log('[AutoBackup] Backup completed and rotated successfully.');
      } catch (err) {
        console.error('[AutoBackup] Backup failed:', err);
      } finally {
        isBackingUpRef.current = false;
      }
    };
    
    intervalRef.current = setInterval(() => {
      performBackup('auto');
    }, intervalMs);

    // Event-driven manual backup trigger
    const handleManualTrigger = (e) => {
      const reason = e.detail?.reason || 'manual';
      performBackup(reason);
    };

    window.addEventListener('scriptflow:trigger-backup', handleManualTrigger);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('scriptflow:trigger-backup', handleManualTrigger);
    };
  }, [intervalMinutes]);

  return <>{children}</>;
}
