import { exportPackage, parsePackage as _parsePackage } from '@scriptflow/export';
import { getAbsoluteFilePath } from '../mediaStorage';
import { readFile, exists } from '@tauri-apps/plugin-fs';

function getMimeType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'webm') return 'video/webm';
  return 'application/octet-stream';
}

function uint8ArrayToBase64(uint8) {
  let binary = '';
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

/**
 * Converts project-media:// URIs back to base64 data URIs so the export engine can package them.
 */
async function prepareDataForExport(data) {
  const cleanData = JSON.parse(JSON.stringify(data));
  const isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;
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
        if (val && val.startsWith('project-media://')) {
          const absPath = getAbsoluteFilePath(val);
          if (absPath && await exists(absPath)) {
            const bytes = await readFile(absPath);
            const base64 = uint8ArrayToBase64(bytes);
            const fileName = val.split('/').pop();
            cleanData.scenario[field] = `data:${getMimeType(fileName)};base64,${base64}`;
          }
        }
      } else if (Array.isArray(cleanData[entity])) {
        for (const item of cleanData[entity]) {
          const val = item[field];
          if (val && val.startsWith('project-media://')) {
            const absPath = getAbsoluteFilePath(val);
            if (absPath && await exists(absPath)) {
              const bytes = await readFile(absPath);
              const base64 = uint8ArrayToBase64(bytes);
              const fileName = val.split('/').pop();
              item[field] = `data:${getMimeType(fileName)};base64,${base64}`;
            }
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
  async exportPackage(data, fileName = 'Project.sflow') {
    const preparedData = await prepareDataForExport(data);
    const { blob, fileName: outFileName } = await exportPackage(preparedData, fileName);
    
    // Download logic in the UI layer
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outFileName;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Parses a .zip (or .sflow) package back into a full JSON object 
   * using the @scriptflow/export monorepo package.
   */
  async parsePackage(file) {
    return await _parsePackage(file);
  }
};
