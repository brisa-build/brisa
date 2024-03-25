export const toInline = (s: string) => s.replace(/\s*\n\s*/g, "");
export const normalizeQuotes = (s: string) => toInline(s).replaceAll("'", '"');
