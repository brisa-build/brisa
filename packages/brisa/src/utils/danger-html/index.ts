export default function dangerHTML(html: string) {
  return {
    type: 'HTML',
    props: {
      html,
    },
  };
}
