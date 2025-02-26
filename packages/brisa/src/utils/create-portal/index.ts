export default function createPortal(
  element: JSX.Element,
  target: HTMLElement,
) {
  return ['portal', { element, target }];
}
