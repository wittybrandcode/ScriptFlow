import React, { useEffect, useRef } from 'react';
import { backupService } from '../../services/BackupService';

/**
 * هذا المكون يعمل في الخلفية كـ Provider غير مرئي 
 * يقوم بتشغيل دورة النسخ الاحتياطي التلقائي (Auto-Backup)
 */
export default function AutoBackupProvider({ children, intervalMinutes = 30 }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    // تشغيل الدورة
    const intervalMs = intervalMinutes * 60 * 1000;
    
    intervalRef.current = setInterval(async () => {
      try {
        console.log(`[AutoBackup] Starting automated backup (Every ${intervalMinutes}m)...`);
        await backupService.createBackup('auto');
        console.log('[AutoBackup] Backup completed and rotated successfully.');
      } catch (err) {
        console.error('[AutoBackup] Backup failed:', err);
      }
    }, intervalMs);

    // Event-driven manual backup trigger
    const handleManualTrigger = async (e) => {
      try {
        const reason = e.detail?.reason || 'manual';
        console.log(`[AutoBackup] Event triggered backup. Reason: ${reason}`);
        await backupService.createBackup(reason);
      } catch (err) {
        console.error('[AutoBackup] Event-driven backup failed:', err);
      }
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
