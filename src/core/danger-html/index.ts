export default function dangerHTML(html: string) {
  return {
    type: "danger-html",
    props: {
      html,
    },
  };
}
