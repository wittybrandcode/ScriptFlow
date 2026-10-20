// Media Storage Service for local file management in Tauri.
// Stores project files (images, videos) in the user's Documents/ScriptFlowProjects folder.

let projectsBaseDir = (typeof window !== 'undefined' && window.localStorage?.getItem('sf_projects_dir')) || '';
let convertFileSrcFn: any = null;
let fsModule: any = null;
let pathModule: any = null;
let initStoragePromise: Promise<void> | null = null;
let isSanitizing = false;

const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__;

/**
 * Initialize paths and modules.
 */
export async function initMediaStorage() {
  if (!isTauri) {
    console.log('MediaStorage: Running outside Tauri, filesystem storage disabled.');
    return;
  }

  if (projectsBaseDir && fsModule && pathModule && convertFileSrcFn) {
    return;
  }

  if (initStoragePromise) {
    return initStoragePromise;
  }

  initStoragePromise = (async () => {
    try {
      // Dynamically import Tauri modules to prevent bundle issues in non-Tauri environments
      const core = await import('@tauri-apps/api/core');
      fsModule = await import('@tauri-apps/plugin-fs');
      pathModule = await import('@tauri-apps/api/path');

      convertFileSrcFn = core.convertFileSrc;

      const docDir = await pathModule.documentDir();
      projectsBaseDir = await pathModule.join(docDir, 'ScriptFlowProjects');
      
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('sf_projects_dir', projectsBaseDir);
      }

      // Ensure root projects folder exists
      const rootExists = await fsModule.exists(projectsBaseDir);
      if (!rootExists) {
        await fsModule.mkdir(projectsBaseDir, { recursive: true });
      }
      console.log('MediaStorage initialized. Base path:', projectsBaseDir);

      // Trigger background database media sanitization
      setTimeout(() => {
        sanitizeDatabaseMedia().catch(e => console.warn('[MediaStorage] Background sanitizer warning:', e));
      }, 1500);
    } catch (err) {
      console.error('Failed to initialize media storage:', err);
    } finally {
      initStoragePromise = null;
    }
  })();

  return initStoragePromise;
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
 * Supports strings (base64 DataURIs), Uint8Array, ArrayBuffer, Blob, or File.
 * 
 * @param {string} scenarioId - The ID of the scenario/project
 * @param {string} fileName - Destination filename (e.g. "cover.png")
 * @param {string|Uint8Array|ArrayBuffer|Blob|File} fileData - Media data
 * @returns {Promise<string>} The relative project URI "project-media://{scenarioId}/{fileName}"
 */
export async function saveMediaFile(
  scenarioId: string, 
  fileName: string, 
  fileData: string | Uint8Array | ArrayBuffer | Blob | File
): Promise<string> {
  if (!scenarioId || !fileName || !fileData) return '';

  // If already a project-media URI, nothing to save
  if (typeof fileData === 'string' && fileData.startsWith('project-media://')) {
    return fileData;
  }

  // Ensure storage is initialized
  if (!projectsBaseDir || !fsModule || !pathModule) {
    await initMediaStorage();
  }

  // Fallback if outside Tauri or initialization failed
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
    } else if (fileData instanceof Uint8Array) {
      bytes = fileData;
    } else if (fileData instanceof ArrayBuffer) {
      bytes = new Uint8Array(fileData);
    } else if (typeof (fileData as any).arrayBuffer === 'function') {
      const buf = await (fileData as any).arrayBuffer();
      bytes = new Uint8Array(buf);
    } else {
      console.warn('[MediaStorage] Unsupported fileData type, aborting save');
      return '';
    }

    await fsModule.writeFile(filePath, bytes);
    console.log(`[MediaStorage] Saved local file: ${filePath} (${bytes.length} bytes)`);

    return `project-media://${scenarioId}/${fileName}`;
  } catch (err) {
    console.error('[MediaStorage] Failed to save local file:', err);
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
    const activeBase = projectsBaseDir || (typeof window !== 'undefined' && window.localStorage?.getItem('sf_projects_dir')) || '';
    if (!isTauri || !activeBase) {
      return ''; // Can't resolve local path outside Tauri
    }

    const cleanUri = uri.replace('project-media://', '');
    const parts = cleanUri.split('/');
    const scenarioId = parts[0];
    const fileName = parts.slice(1).join('/');

    // Construct the absolute path
    let absolutePath = `${activeBase}/${scenarioId}/media/${fileName}`;
    
    // Normalize slashes for Windows if needed
    if (activeBase.includes('\\')) {
      absolutePath = absolutePath.replace(/\//g, '\\');
    }

    if (convertFileSrcFn) {
      return convertFileSrcFn(absolutePath);
    }
    // Fallback if convertFileSrcFn is not loaded yet
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
 */
export async function processAndSaveMedia(
  scenarioId: string, 
  target: any, 
  fieldsToProcess: Array<{ field: string, prefix: string }>
): Promise<any> {
  if (!scenarioId || !target) return target;

  const isArray = Array.isArray(target);
  const items = isArray ? target : [target];

  for (const item of items) {
    for (const { field, prefix } of fieldsToProcess) {
      const value = item[field];
      if (value && typeof value === 'string' && value.startsWith('data:')) {
        const mimeMatch = value.match(/^data:([^;]+);base64,/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        let ext = mime.split('/')[1] || 'png';
        if (ext === 'jpeg') ext = 'jpg';
        if (ext === 'quicktime') ext = 'mov';
        
        const itemId = item.id || 'main';
        const fileName = `${prefix}_${itemId}_${Date.now()}.${ext}`;
        
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
      console.log(`[MediaStorage] Deleted local file: ${filePath}`);
    }
  } catch (err) {
    console.error('[MediaStorage] Failed to delete local file:', err);
  }
}

/**
 * Background database sanitizer:
 * Identifies any lingering base64 image or video data stored directly in SQLite tables
 * (scenarios, locations, crew, characters), migrates them to local filesystem files,
 * updates the database to point to project-media:// URIs, and executes VACUUM to reclaim space.
 */
export async function sanitizeDatabaseMedia(): Promise<{ sanitizedCount: number }> {
  if (!isTauri || isSanitizing) return { sanitizedCount: 0 };
  isSanitizing = true;

  let sanitizedCount = 0;

  try {
    const { dbSelect, dbExecute, vacuumInPlace } = await import('@scriptflow/database');

    // 1. Scenarios: cover_image and cover_video
    const scenarios = await dbSelect<any>(
      `SELECT id, cover_image, cover_video FROM scenarios WHERE (cover_image LIKE 'data:%' OR cover_video LIKE 'data:%') AND deleted_at IS NULL`
    );

    for (const s of scenarios) {
      let updatedCoverImage = s.cover_image;
      let updatedCoverVideo = s.cover_video;
      let needsUpdate = false;

      if (s.cover_image && typeof s.cover_image === 'string' && s.cover_image.startsWith('data:')) {
        const extMatch = s.cover_image.match(/^data:([^;]+);/);
        const mime = extMatch ? extMatch[1] : 'image/png';
        const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : (mime.split('/')[1] || 'png');
        const fileName = `cover_${Date.now()}.${ext}`;
        updatedCoverImage = await saveMediaFile(s.id, fileName, s.cover_image);
        needsUpdate = true;
      }

      if (s.cover_video && typeof s.cover_video === 'string' && s.cover_video.startsWith('data:')) {
        const extMatch = s.cover_video.match(/^data:([^;]+);/);
        const mime = extMatch ? extMatch[1] : 'video/mp4';
        const ext = mime.split('/')[1] || 'mp4';
        const fileName = `video_${Date.now()}.${ext}`;
        updatedCoverVideo = await saveMediaFile(s.id, fileName, s.cover_video);
        needsUpdate = true;
      }

      if (needsUpdate) {
        await dbExecute(
          `UPDATE scenarios SET cover_image = $1, cover_video = $2 WHERE id = $3`,
          [updatedCoverImage, updatedCoverVideo, s.id]
        );
        sanitizedCount++;
      }
    }

    // 2. Locations: image and images (JSON)
    const locations = await dbSelect<any>(
      `SELECT id, scenario_id, image, images FROM locations WHERE (image LIKE 'data:%' OR images LIKE '%data:%') AND deleted_at IS NULL`
    );

    for (const loc of locations) {
      let updatedImage = loc.image;
      let updatedImagesJson = loc.images;
      let needsUpdate = false;

      const targetScenarioId = loc.scenario_id || 'shared';

      if (loc.image && typeof loc.image === 'string' && loc.image.startsWith('data:')) {
        const extMatch = loc.image.match(/^data:([^;]+);/);
        const mime = extMatch ? extMatch[1] : 'image/png';
        const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : (mime.split('/')[1] || 'png');
        const fileName = `loc_${loc.id}_${Date.now()}.${ext}`;
        updatedImage = await saveMediaFile(targetScenarioId, fileName, loc.image);
        needsUpdate = true;
      }

      if (loc.images && typeof loc.images === 'string' && loc.images.includes('data:')) {
        try {
          const parsed = JSON.parse(loc.images);
          if (Array.isArray(parsed)) {
            let imagesModified = false;
            for (let i = 0; i < parsed.length; i++) {
              const item = parsed[i];
              const rawUrl = item.url || item.image_url;
              if (rawUrl && typeof rawUrl === 'string' && rawUrl.startsWith('data:')) {
                const extMatch = rawUrl.match(/^data:([^;]+);/);
                const mime = extMatch ? extMatch[1] : 'image/png';
                const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : (mime.split('/')[1] || 'png');
                const fileName = `loc_${loc.id}_img_${i}_${Date.now()}.${ext}`;
                const savedUri = await saveMediaFile(targetScenarioId, fileName, rawUrl);
                item.url = savedUri;
                item.image_url = savedUri;
                imagesModified = true;
              }
            }
            if (imagesModified) {
              updatedImagesJson = JSON.stringify(parsed);
              needsUpdate = true;
            }
          }
        } catch (e) {
          console.warn('[MediaStorage] Failed to parse location images JSON:', e);
        }
      }

      if (needsUpdate) {
        await dbExecute(
          `UPDATE locations SET image = $1, images = $2 WHERE id = $3`,
          [updatedImage, updatedImagesJson, loc.id]
        );
        sanitizedCount++;
      }
    }

    // 3. Crew: image_url
    const crewMembers = await dbSelect<any>(
      `SELECT id, scenario_id, image_url FROM crew WHERE image_url LIKE 'data:%' AND deleted_at IS NULL`
    );

    for (const c of crewMembers) {
      if (c.image_url && typeof c.image_url === 'string' && c.image_url.startsWith('data:')) {
        const extMatch = c.image_url.match(/^data:([^;]+);/);
        const mime = extMatch ? extMatch[1] : 'image/png';
        const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : (mime.split('/')[1] || 'png');
        const fileName = `crew_${c.id}_${Date.now()}.${ext}`;
        const savedUri = await saveMediaFile(c.scenario_id || 'shared', fileName, c.image_url);
        await dbExecute(`UPDATE crew SET image_url = $1 WHERE id = $2`, [savedUri, c.id]);
        sanitizedCount++;
      }
    }

    // 4. Characters: actor_photo and reference_images
    const characters = await dbSelect<any>(
      `SELECT id, scenario_id, actor_photo, reference_images FROM characters WHERE (actor_photo LIKE 'data:%' OR reference_images LIKE '%data:%') AND deleted_at IS NULL`
    );

    for (const ch of characters) {
      let updatedPhoto = ch.actor_photo;
      let updatedRefJson = ch.reference_images;
      let needsUpdate = false;
      const targetScenarioId = ch.scenario_id || 'shared';

      if (ch.actor_photo && typeof ch.actor_photo === 'string' && ch.actor_photo.startsWith('data:')) {
        const extMatch = ch.actor_photo.match(/^data:([^;]+);/);
        const mime = extMatch ? extMatch[1] : 'image/png';
        const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : (mime.split('/')[1] || 'png');
        const fileName = `char_${ch.id}_photo_${Date.now()}.${ext}`;
        updatedPhoto = await saveMediaFile(targetScenarioId, fileName, ch.actor_photo);
        needsUpdate = true;
      }

      if (ch.reference_images && typeof ch.reference_images === 'string' && ch.reference_images.includes('data:')) {
        try {
          const parsed = JSON.parse(ch.reference_images);
          if (Array.isArray(parsed)) {
            let refsModified = false;
            for (let i = 0; i < parsed.length; i++) {
              const raw = parsed[i];
              if (raw && typeof raw === 'string' && raw.startsWith('data:')) {
                const extMatch = raw.match(/^data:([^;]+);/);
                const mime = extMatch ? extMatch[1] : 'image/png';
                const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : (mime.split('/')[1] || 'png');
                const fileName = `char_${ch.id}_ref_${i}_${Date.now()}.${ext}`;
                parsed[i] = await saveMediaFile(targetScenarioId, fileName, raw);
                refsModified = true;
              }
            }
            if (refsModified) {
              updatedRefJson = JSON.stringify(parsed);
              needsUpdate = true;
            }
          }
        } catch (e) {
          console.warn('[MediaStorage] Failed to parse character reference images:', e);
        }
      }

      if (needsUpdate) {
        await dbExecute(
          `UPDATE characters SET actor_photo = $1, reference_images = $2 WHERE id = $3`,
          [updatedPhoto, updatedRefJson, ch.id]
        );
        sanitizedCount++;
      }
    }

    if (sanitizedCount > 0) {
      console.log(`[MediaStorage] Purged ${sanitizedCount} base64 media records to filesystem. Running SQLite VACUUM...`);
      await vacuumInPlace();
      console.log('[MediaStorage] SQLite database vacuumed successfully.');
    }
  } catch (err) {
    console.error('[MediaStorage] Error during media sanitization:', err);
  } finally {
    isSanitizing = false;
  }

  return { sanitizedCount };
}
