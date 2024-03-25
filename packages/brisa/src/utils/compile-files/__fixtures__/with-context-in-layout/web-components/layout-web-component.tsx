import type { WebContext } from "../../../../../types";
import { Ctx } from "../context";

export default function LayoutWebComponent({}, { useContext }: WebContext) {
  const foo = useContext(Ctx);
  return <h1>{foo.value}</h1>;
}
