import { useEffect, useRef, ReactNode } from 'react';
import { backupService } from '../../services/BackupService';

export interface AutoBackupProviderProps {
  children: ReactNode;
  intervalMinutes?: number;
}

/**
 * هذا المكون يعمل في الخلفية كـ Provider غير مرئي 
 * يقوم بتشغيل دورة النسخ الاحتياطي التلقائي (Auto-Backup)
 * مع قفل ضد التداخل (Re-entrancy Lock)
 */
export default function AutoBackupProvider({ children, intervalMinutes = 30 }: AutoBackupProviderProps) {
  const intervalRef = useRef<NodeJS.Timeout | number | null>(null);
  const isBackingUpRef = useRef<boolean>(false);

  useEffect(() => {
    const intervalMs = intervalMinutes * 60 * 1000;

    const performBackup = async (reason: string) => {
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
    const handleManualTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ reason?: string }>;
      const reason = customEvent.detail?.reason || 'manual';
      performBackup(reason);
    };

    window.addEventListener('scriptflow:trigger-backup', handleManualTrigger);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current as any);
      }
      window.removeEventListener('scriptflow:trigger-backup', handleManualTrigger);
    };
  }, [intervalMinutes]);

  return <>{children}</>;
}
