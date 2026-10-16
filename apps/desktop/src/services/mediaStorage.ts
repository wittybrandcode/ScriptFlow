// Media Storage Service for local file management in Tauri.
// Stores project files (images, videos) in the user's Documents/ScriptFlowProjects folder.

let projectsBaseDir = '';
let convertFileSrcFn: any = null;
let fsModule: any = null;
let pathModule: any = null;

const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

/**
 * Initialize paths and modules.
 */
export async function initMediaStorage() {
  if (!isTauri) {
    console.log('MediaStorage: Running outside Tauri, filesystem storage disabled.');
    return;
  }

  try {
    // Dynamically import Tauri modules to prevent bundle issues in non-Tauri environments
    const core = await import('@tauri-apps/api/core');
    fsModule = await import('@tauri-apps/plugin-fs');
    pathModule = await import('@tauri-apps/api/path');

    convertFileSrcFn = core.convertFileSrc;

    const docDir = await pathModule.documentDir();
    projectsBaseDir = await pathModule.join(docDir, 'ScriptFlowProjects');
    
    // Ensure root projects folder exists
    const rootExists = await fsModule.exists(projectsBaseDir);
    if (!rootExists) {
      await fsModule.mkdir(projectsBaseDir, { recursive: true });
    }
    console.log('MediaStorage initialized. Base path:', projectsBaseDir);
  } catch (err) {
    console.error('Failed to initialize media storage:', err);
  }
}

/**
 * Convert a base64 data URI to a Uint8Array.
 * Uses atob which is completely synchronous and avoids URL length limits or CSP blocks that fetch() suffers from.
 */
function base64ToUint8Array(base64String: string): Uint8Array {
  const base64Data = base64String.split(',')[1] || base64String;
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Saves a media file locally to the project's folder.
 * 
 * @param {string} scenarioId - The ID of the scenario/project
 * @param {string} fileName - Destination filename (e.g. "cover.png")
 * @param {string|Uint8Array} fileData - Base64 Data URI or raw bytes
 * @returns {Promise<string>} The relative project URI "project-media://{scenarioId}/{fileName}"
 */
export async function saveMediaFile(scenarioId: string, fileName: string, fileData: string | Uint8Array): Promise<string> {
  if (!scenarioId || !fileName || !fileData) return '';

  // If we are outside Tauri or initialization failed, keep the base64 as fallback
  if (!isTauri || !fsModule || !pathModule || !projectsBaseDir) {
    return typeof fileData === 'string' ? fileData : '';
  }

  try {
    const projectDir = await pathModule.join(projectsBaseDir, scenarioId, 'media');
    
    // Create directory if not exists
    const dirExists = await fsModule.exists(projectDir);
    if (!dirExists) {
      await fsModule.mkdir(projectDir, { recursive: true });
    }

    const filePath = await pathModule.join(projectDir, fileName);

    let bytes: Uint8Array;
    if (typeof fileData === 'string') {
      if (fileData.startsWith('data:')) {
        bytes = base64ToUint8Array(fileData);
      } else {
        // Assume raw base64 string
        bytes = base64ToUint8Array('data:application/octet-stream;base64,' + fileData);
      }
    } else {
      bytes = fileData;
    }

    await fsModule.writeFile(filePath, bytes);
    console.log(`Saved local file: ${filePath}`);

    return `project-media://${scenarioId}/${fileName}`;
  } catch (err) {
    console.error('Failed to save local file:', err);
    // Return the original fileData as base64 fallback if write fails
    return typeof fileData === 'string' ? fileData : '';
  }
}

/**
 * Resolves a custom "project-media://" URI to a web-safe local file URL.
 * 
 * @param {string} uri - The project-media URI or direct base64 string
 * @returns {string} The web-safe asset URL, or original URI if not custom scheme
 */
export function resolveMediaUrl(uri: string): string {
  if (!uri || typeof uri !== 'string') return '';

  if (uri.startsWith('project-media://')) {
    if (!isTauri || !projectsBaseDir) {
      return ''; // Can't resolve local path outside Tauri
    }

    const cleanUri = uri.replace('project-media://', '');
    const parts = cleanUri.split('/');
    const scenarioId = parts[0];
    const fileName = parts.slice(1).join('/');

    // Construct the absolute path
    let absolutePath = `${projectsBaseDir}/${scenarioId}/media/${fileName}`;
    
    // Normalize slashes for Windows if needed
    if (projectsBaseDir.includes('\\')) {
      absolutePath = absolutePath.replace(/\//g, '\\');
    }

    if (convertFileSrcFn) {
      return convertFileSrcFn(absolutePath);
    }
    // Fallback if convertFileSrcFn is not loaded
    return `asset://localhost/${absolutePath}`;
  }

  return uri;
}

/**
 * Reverts resolved asset URLs (or absolute paths) back to project-media:// URIs
 * to prevent saving environment-specific URLs into the database.
 */
export function unresolveMediaUrl(uri: string, scenarioId: string): string {
  if (!uri || typeof uri !== 'string') return '';
  if (uri.startsWith('project-media://') || uri.startsWith('data:')) return uri;

  const searchMarker = `/ScriptFlowProjects/${scenarioId}/media/`;
  const backslashMarker = `\\ScriptFlowProjects\\${scenarioId}\\media\\`;

  let idx = uri.indexOf(searchMarker);
  if (idx !== -1) {
    const fileName = uri.substring(idx + searchMarker.length);
    return `project-media://${scenarioId}/${fileName}`;
  }

  idx = uri.indexOf(backslashMarker);
  if (idx !== -1) {
    const fileName = uri.substring(idx + backslashMarker.length).replace(/\\/g, '/');
    return `project-media://${scenarioId}/${fileName}`;
  }

  return uri;
}

/**
 * Returns the absolute path for a project-media:// URI.
 */
export function getAbsoluteFilePath(uri: string): string | null {
  if (!uri || typeof uri !== 'string' || !uri.startsWith('project-media://') || !projectsBaseDir) {
    return null;
  }
  const cleanUri = uri.replace('project-media://', '');
  const parts = cleanUri.split('/');
  const scenarioId = parts[0];
  const fileName = parts.slice(1).join('/');
  let absolutePath = `${projectsBaseDir}/${scenarioId}/media/${fileName}`;
  if (projectsBaseDir.includes('\\')) {
    absolutePath = absolutePath.replace(/\//g, '\\');
  }
  return absolutePath;
}

/**
 * Scans an object (or array of objects) for base64 media fields,
 * saves them to the local project folder, and replaces the base64 values with project-media:// URIs.
 * 
 * @param {string} scenarioId - The ID of the scenario
 * @param {object|object[]} target - The object or array of objects to scan
 * @param {Array<{ field: string, prefix: string }>} fieldsToProcess - Array of fields to look for
 * @returns {Promise<object|object[]>} The updated object or array of objects
 */
export async function processAndSaveMedia(scenarioId: string, target: any, fieldsToProcess: Array<{ field: string, prefix: string }>): Promise<any> {
  if (!scenarioId || !target) return target;

  const isArray = Array.isArray(target);
  const items = isArray ? target : [target];

  for (const item of items) {
    for (const { field, prefix } of fieldsToProcess) {
      const value = item[field];
      if (value && typeof value === 'string' && value.startsWith('data:')) {
        // [FIXED] Fast-Match Regex: يمنع اختناق التعبير المنتظم الجشع (ReDoS) مع الصور الضخمة
        const mimeMatch = value.match(/^data:([^;]+);base64,/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        let ext = mime.split('/')[1] || 'png';
        if (ext === 'jpeg') ext = 'jpg';
        
        // Generate a clean filename based on item id and prefix
        const itemId = item.id || 'main';
        const fileName = `${prefix}_${itemId}_${Date.now()}.${ext}`;
        
        // Save file
        const projectMediaUri = await saveMediaFile(scenarioId, fileName, value);
        item[field] = projectMediaUri || '';
      }
    }
  }

  return isArray ? items : items[0];
}

/**
 * Deletes a media file from the local filesystem.
 */
export async function deleteMediaFile(scenarioId: string, fileName: string): Promise<void> {
  if (!isTauri || !fsModule || !pathModule || !projectsBaseDir) return;

  try {
    const filePath = await pathModule.join(projectsBaseDir, scenarioId, 'media', fileName);
    const fileExists = await fsModule.exists(filePath);
    if (fileExists) {
      await fsModule.remove(filePath);
      console.log(`Deleted local file: ${filePath}`);
    }
  } catch (err) {
    console.error('Failed to delete local file:', err);
  }
}
