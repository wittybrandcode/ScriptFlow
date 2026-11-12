import { exportPackage, parsePackage as _parsePackage } from '@scriptflow/export';
import { getAbsoluteFilePath } from '../mediaStorage';
import { readFile, exists } from '@tauri-apps/plugin-fs';

function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'webm') return 'video/webm';
  return 'application/octet-stream';
}

function uint8ArrayToBase64(uint8: Uint8Array): string {
  const CHUNK_SIZE = 0x8000; // 32KB chunks to prevent call-stack overflow and main thread freezing
  let binary = '';
  for (let i = 0; i < uint8.length; i += CHUNK_SIZE) {
    const chunk = uint8.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Converts project-media:// URIs back to base64 data URIs so the export engine can package them.
 */
async function prepareDataForExport(data: any): Promise<any> {
  const cleanData = JSON.parse(JSON.stringify(data));
  const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;
  if (!isTauri) return cleanData;

  const MEDIA_FIELDS = [
    { entity: 'scenario',   field: 'cover_image' },
    { entity: 'scenario',   field: 'cover_video' },
    { entity: 'characters', field: 'actor_photo' },
    { entity: 'locations',  field: 'image' },
    { entity: 'crew',       field: 'image_url' },
  ];

  try {
    for (const { entity, field } of MEDIA_FIELDS) {
      if (entity === 'scenario' && cleanData.scenario) {
        const val = cleanData.scenario[field];
        if (val && typeof val === 'string' && val.startsWith('project-media://')) {
          const absPath = getAbsoluteFilePath(val);
          if (absPath && await exists(absPath)) {
            const bytes = await readFile(absPath);
            const base64 = uint8ArrayToBase64(bytes);
            const fileName = val.split('/').pop() || 'media.png';
            cleanData.scenario[field] = `data:${getMimeType(fileName)};base64,${base64}`;
          }
        }
      } else if (Array.isArray(cleanData[entity])) {
        for (const item of cleanData[entity]) {
          const val = item[field];
          if (val && typeof val === 'string' && val.startsWith('project-media://')) {
            const absPath = getAbsoluteFilePath(val);
            if (absPath && await exists(absPath)) {
              const bytes = await readFile(absPath);
              const base64 = uint8ArrayToBase64(bytes);
              const fileName = val.split('/').pop() || 'media.png';
              item[field] = `data:${getMimeType(fileName)};base64,${base64}`;
            }
          }

          // Handle character reference_images
          if (entity === 'characters' && item.reference_images) {
            try {
              const refImgs = typeof item.reference_images === 'string'
                ? JSON.parse(item.reference_images)
                : item.reference_images;
              if (Array.isArray(refImgs)) {
                const converted: string[] = [];
                for (const refUri of refImgs) {
                  if (typeof refUri === 'string' && refUri.startsWith('project-media://')) {
                    const absPath = getAbsoluteFilePath(refUri);
                    if (absPath && await exists(absPath)) {
                      const bytes = await readFile(absPath);
                      const base64 = uint8ArrayToBase64(bytes);
                      const fn = refUri.split('/').pop() || 'ref.png';
                      converted.push(`data:${getMimeType(fn)};base64,${base64}`);
                      continue;
                    }
                  }
                  converted.push(refUri);
                }
                item.reference_images = typeof item.reference_images === 'string' ? JSON.stringify(converted) : converted;
              }
            } catch (e) {
              console.warn('Failed to convert character reference_images for export', e);
            }
          }
        }
      }
    }

    // Handle standalone location_images table if present
    if (Array.isArray(cleanData.location_images)) {
      for (const locImg of cleanData.location_images) {
        const val = locImg.image_path || locImg.image_url;
        if (val && typeof val === 'string' && val.startsWith('project-media://')) {
          const absPath = getAbsoluteFilePath(val);
          if (absPath && await exists(absPath)) {
            const bytes = await readFile(absPath);
            const base64 = uint8ArrayToBase64(bytes);
            const fileName = val.split('/').pop() || 'loc.png';
            const dataUri = `data:${getMimeType(fileName)};base64,${base64}`;
            if (locImg.image_path) locImg.image_path = dataUri;
            if (locImg.image_url) locImg.image_url = dataUri;
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to prepare data for export:', err);
  }

  return cleanData;
}

export const packageService = {
  /**
   * Export scenario and its relations to a .zip (or .sflow) package
   * using the @scriptflow/export monorepo package.
   */
  async exportPackage(data: any, fileName: string = 'Project.sflow'): Promise<void> {
    const preparedData = await prepareDataForExport(data);
    const result: any = await exportPackage(preparedData, fileName);
    const blob = result?.blob || result;
    const outFileName = result?.fileName || fileName;
    
    // Download logic in the UI layer with safe deferred revocation
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 15000);
  },

  /**
   * Parses a .zip (or .sflow) package back into a full JSON object 
   * using the @scriptflow/export monorepo package.
   */
  async parsePackage(file: File): Promise<any> {
    return await _parsePackage(file);
  }
};
