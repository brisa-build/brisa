export default function createPortal(element: JSX.Element, target: HTMLElement) {
  return {
    type: 'portal',
    props: {
      element,
      target,
    },
  };
}
