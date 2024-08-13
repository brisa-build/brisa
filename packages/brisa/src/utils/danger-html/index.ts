/**
 * This transform the HTML string into a Brisa element.
 */
export default function dangerHTML(html: string) {
  return {
    type: 'HTML',
    props: {
      html,
    },
  };
}
