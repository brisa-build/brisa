export function serialize(value: unknown): string {
  if (typeof value !== 'object') return value as string;

  return JSON.stringify(value).replace(/"([^"]*)"/g, "'$1'");
}

export function deserialize(str: string | null) {
  if (!str) return str;

  try {
    return JSON.parse(str.replace(/'([^']*)'/g, '"$1"'));
  } catch (e) {
    return str;
  }
}
