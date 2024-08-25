/**
 * This transform the HTML string into a Brisa element.
 */
export default function dangerHTML(html: string) {
  return Object.assign(['HTML', { html }, null], { [Symbol.for('isJSX')]: true });
}
