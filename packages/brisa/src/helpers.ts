export const toInline = (s: string) => s.replace(/\s*\n\s*/g, '');
export const normalizeHTML = (s: string) =>
  toInline(s)
    .replaceAll("'", '"')
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
