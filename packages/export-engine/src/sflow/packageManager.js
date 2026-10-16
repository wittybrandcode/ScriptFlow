import JSZip from 'jszip';
import { extractMedia, restoreMedia } from '../media/mediaProcessor.js';

/**
 * SFLOW Package Manager
 * Handles export and import of .sflow packages (ZIP archives with JSON + media).
 */

/** @type {Array<{ entity: string, field: string, prefix: string }>} */
const MEDIA_FIELDS = [
  { entity: 'scenario',   field: 'cover_image',     prefix: 'scenario_cover' },
  { entity: 'scenario',   field: 'cover_video',     prefix: 'scenario_video' },
  { entity: 'characters', field: 'actor_photo',      prefix: 'char' },
  { entity: 'locations',  field: 'image',            prefix: 'loc' },
  { entity: 'crew',       field: 'image_url',        prefix: 'crew' },
  { entity: 'location_images', field: 'image_url',   prefix: 'locimg' },
];

/**
 * Export project data to a .sflow ZIP package.
 * 
 * @param {object} data - Full project data
 * @param {string} [fileName='Project.sflow'] - Output filename
 * @returns {Blob} ZIP blob ready for download
 */
export async function exportPackage(data, fileName = 'Project.sflow') {
  // Deep clone to avoid mutating original
  const cleanData = JSON.parse(JSON.stringify(data));
  
  // Include schemaVersion: 5 flag
  cleanData.schemaVersion = 5;

  const zip = new JSZip();
  const mediaFolder = zip.folder('media');

  // Process all media fields
  for (const { entity, field, prefix } of MEDIA_FIELDS) {
    if (entity === 'scenario') {
      const result = extractMedia(cleanData.scenario, field, prefix);
      if (result) mediaFolder.file(result.filename, result.base64Data, { base64: true });
    } else if (Array.isArray(cleanData[entity])) {
      for (const item of cleanData[entity]) {
        const result = extractMedia(item, field, prefix);
        if (result) mediaFolder.file(result.filename, result.base64Data, { base64: true });
      }
    }
  }

  // Handle reference_images (JSON array of base64)
  if (cleanData.characters) {
    for (const c of cleanData.characters) {
      processReferenceImages(c, 'reference_images', 'char', mediaFolder);
    }
  }

  zip.file('project.json', JSON.stringify(cleanData, null, 2));

  // We use JSZip natively in the main thread. JSZip handles compression asynchronously.
  // This eliminates the OOM memory crash caused by duplicating data into a Web Worker,
  // and completely removes the dangerous offline CDN dependency.
  await new Promise(resolve => setTimeout(resolve, 10)); // Yield event loop
  
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  return { blob, fileName };
}

/**
 * Parse a .sflow ZIP package back into project data with restored media.
 * 
 * @param {File|Blob} file - The ZIP file
 * @returns {object} Full project data with Base64 media restored
 */
export async function parsePackage(file) {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  const projectFile = zipContent.file('project.json');
  if (!projectFile) {
    throw new Error('الملف لا يحتوي على project.json. قد لا يكون حزمة ScriptFlow صالحة.');
  }

  const jsonString = await projectFile.async('string');
  const data = JSON.parse(jsonString);

  // Structural Schema Validation
  if (!data || typeof data !== 'object') {
    throw new Error('محتوى project.json غير صالح: يجب أن يكون كائناً مجسماً.');
  }

  if (data.scenario && typeof data.scenario !== 'object') {
    throw new Error('بيانات السيناريو الرئيسية في project.json غير صالحة.');
  }

  // Schema version validation
  if (data.schemaVersion === undefined) {
    console.warn("تنبيه: ملف الاستيراد لا يحتوي على إصدار المخطط. سيتم افتراض الإصدار الأول.");
    data.schemaVersion = 1;
  } else if (data.schemaVersion > 5) {
    throw new Error(`إصدار غير متوافق: إصدار ملف الاستيراد هو ${data.schemaVersion}، بينما يدعم البرنامج الإصدارات حتى 5 فقط.`);
  }

  // Helper to read a file from the ZIP as base64
  const readFileAsBase64 = async (path) => {
    const f = zipContent.file(path);
    return f ? await f.async('base64') : null;
  };

  // Restore all media fields
  for (const { entity, field } of MEDIA_FIELDS) {
    if (entity === 'scenario') {
      await restoreMedia(data.scenario, field, readFileAsBase64);
    } else if (Array.isArray(data[entity])) {
      for (const item of data[entity]) {
        await restoreMedia(item, field, readFileAsBase64);
      }
    }
  }

  // Restore reference_images
  if (data.characters) {
    for (const c of data.characters) {
      await restoreReferenceImages(c, 'reference_images', readFileAsBase64);
    }
  }

  return data;
}

// ── Internal Helpers ──────────────────────────────────────

function processReferenceImages(obj, field, prefix, mediaFolder) {
  if (!obj[field]) return;
  try {
    let images = typeof obj[field] === 'string' ? JSON.parse(obj[field]) : obj[field];
    if (!Array.isArray(images)) return;

    const processed = images.map((img, idx) => {
      if (img && typeof img === 'string' && img.startsWith('data:')) {
        const mimeMatch = img.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-.+]+).*,/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        let ext = mime.split('/')[1] || 'png';
        if (ext === 'jpeg') ext = 'jpg';

        const base64Data = img.split(',')[1];
        const filename = `${prefix}_${obj.id}_ref${idx}.${ext}`;
        mediaFolder.file(filename, base64Data, { base64: true });
        return { path: `media/${filename}`, mime };
      }
      return img;
    });

    obj[field] = JSON.stringify(processed);
  } catch { /* skip invalid JSON */ }
}

async function restoreReferenceImages(obj, field, readFileAsBase64) {
  if (!obj[field]) return;
  try {
    let images = typeof obj[field] === 'string' ? JSON.parse(obj[field]) : obj[field];
    if (!Array.isArray(images)) return;

    const restored = await Promise.all(images.map(async (img) => {
      if (img && typeof img === 'object' && img.path && img.path.startsWith('media/')) {
        const base64Data = await readFileAsBase64(img.path);
        if (base64Data) {
          return `data:${img.mime || 'image/png'};base64,${base64Data}`;
        }
      }
      return img;
    }));

    obj[field] = JSON.stringify(restored);
  } catch { /* skip */ }
}
