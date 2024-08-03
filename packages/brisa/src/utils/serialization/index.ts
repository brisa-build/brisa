const UNDEFINED = '_|U|_';

export function serialize(value: unknown): string {
  return typeof value !== 'object'
    ? (value as string)
    : JSON.stringify(value, (_, v) => (v === undefined ? UNDEFINED : v));
}

export function deserialize(str: string | null) {
  if (!str) return str;

  try {
    return JSON.parse(str, (_, v) => (v === UNDEFINED ? undefined : v));
  } catch (e) {
    return str;
  }
}
