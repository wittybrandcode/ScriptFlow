/**
 * JSON Export/Import utilities.
 * Pure data serialization — no DOM or browser dependencies.
 */

/**
 * Serialize project data to a JSON string.
 * @param {object} data - Full project data { scenario, scenes, characters, locations, episodes, ... }
 * @returns {string} Pretty-printed JSON
 */
export function exportToJSON(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Parse a JSON string back into project data.
 * Validates the basic structure.
 * 
 * @param {string} jsonString - Raw JSON string
 * @returns {object} Parsed project data
 * @throws {Error} If JSON is invalid or missing required fields
 */
export function parseJSON(jsonString) {
  let data;
  try {
    data = JSON.parse(jsonString);
  } catch (e) {
    throw new Error('ملف JSON غير صالح: ' + e.message);
  }

  if (!data.scenario) {
    throw new Error('ملف JSON لا يحتوي على بيانات سيناريو (scenario).');
  }

  return data;
}
