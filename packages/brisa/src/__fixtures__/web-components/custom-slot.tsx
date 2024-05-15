import type { WebContext } from "brisa";

export default function Counter({ children }: { children: JSX.Element }) {
  return <div id="children-container">{children}</div>;
}
