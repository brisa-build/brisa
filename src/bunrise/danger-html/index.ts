export default function dangerHTML(html: string) {
  return {
    html,
    isDangerousHTML: true
  };
}