export default function dangerHTML(html: string) {
  return { toString: () => html };
}
