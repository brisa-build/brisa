export const toInline = (s: string) => s.replace(/\s*\n\s*/g, '');
export const normalizeHTML = (s: string) =>
  toInline(s)
    .replaceAll("'", '"')
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('jsxDEV_7x81h0kn', 'jsxDEV')
    .replaceAll('Fragment_8vg9x3sq', 'Fragment');
