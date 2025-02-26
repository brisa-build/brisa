const CHAR_REGEX = /["&'<>]/g;
const TRANSFORMATIONS: Record<string, string> = {
  '"': '&quot;',
  '&': '&amp;',
  "'": '&#x27;',
  '<': '&lt;',
  '>': '&gt;',
};

const escape = (char: string) => TRANSFORMATIONS[char];

/**
 * Similar than Bun.escapeHTML (same API), but runtime-agnostic.
 */
export default function escapeHTML(
  html: string | object | number | boolean | null | undefined,
) {
  return String(html).replace(CHAR_REGEX, escape);
}
