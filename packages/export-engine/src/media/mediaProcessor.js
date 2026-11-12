/**
 * Media processing utilities for SFLOW packages.
 * Extracts Base64 data URIs into separate entries for ZIP packing,
 * and restores them on import.
 */

const SAFE_MIME = /^[a-zA-Z0-9]+\/[a-zA-Z0-9\-.+]+$/;

/**
 * Extract a Base64 data URI from an object field, returning the binary data
 * and replacing the field with a relative media path.
 * 
 * @param {object} obj - The object containing the field
 * @param {string} field - Field name (e.g. 'cover_image')
 * @param {string} prefix - Filename prefix (e.g. 'scenario_cover')
 * @returns {{ filename: string, base64Data: string } | null} Extracted media or null
 */
export function extractMedia(obj, field, prefix) {
  if (!obj || !obj[field] || typeof obj[field] !== 'string' || !obj[field].startsWith('data:')) {
    return null;
  }

  const dataUri = obj[field];
  const commaIdx = dataUri.indexOf(',');
  if (commaIdx === -1) {
    return null;
  }

  const header = dataUri.slice(0, commaIdx);
  const base64Data = dataUri.slice(commaIdx + 1);

  const mimeMatch = header.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-.+]+)/);
  const mime = mimeMatch && SAFE_MIME.test(mimeMatch[1]) ? mimeMatch[1] : 'application/octet-stream';

  let ext = mime.split('/')[1] || 'bin';
  if (ext.includes('+')) ext = ext.split('+')[0];
  if (ext === 'jpeg') ext = 'jpg';

  const filename = `${prefix}_${obj.id || 'main'}.${ext}`;

  // Mutate the object: replace data URI with relative path
  obj[field] = `media/${filename}`;
  obj[`${field}_mime`] = mime;

  return { filename, base64Data };
}

/**
 * Restore a media field from a ZIP file entry back to a data URI.
 * 
 * @param {object} obj - Object with media path reference
 * @param {string} field - Field name
 * @param {Function} readFileAsBase64 - Async function(path) => base64 string
 */
export async function restoreMedia(obj, field, readFileAsBase64) {
  if (!obj) return;
  const mediaPath = obj[field];
  const mimeKey = `${field}_mime`;
  const mime = obj[mimeKey] || 'application/octet-stream';
  delete obj[mimeKey]; // Always delete temporary *_mime field to prevent SQL insertion failure

  if (!mediaPath || typeof mediaPath !== 'string' || !mediaPath.startsWith('media/') || mediaPath.includes('..')) {
    return;
  }

  const base64Data = await readFileAsBase64(mediaPath);
  if (base64Data) {
    const safeMime = SAFE_MIME.test(mime) ? mime : 'application/octet-stream';
    obj[field] = `data:${safeMime};base64,${base64Data}`;
  }
}
