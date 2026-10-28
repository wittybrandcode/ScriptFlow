/**
 * Strips HTML tags from a string and returns plain text.
 * Used for PDF export (when react-pdf-html is not suitable) and word counting.
 * @param {string} html - The HTML string to strip
 * @returns {string} Plain text content
 */
export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}
