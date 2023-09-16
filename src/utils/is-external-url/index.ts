export default function isExternalUrl(urlString: string): boolean {
  try {
    return Boolean(new URL(urlString));
  } catch (_) {
    return false;
  }
}