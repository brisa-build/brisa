export default function removeLocaleFromUrl(
  urlString: string,
  locale: string,
): string {
  const url = new URL(urlString);
  const newUrlString = url.href.replace(`${url.origin}/${locale}`, url.origin);
  const newUrl = new URL(newUrlString);

  return newUrl.href;
}
