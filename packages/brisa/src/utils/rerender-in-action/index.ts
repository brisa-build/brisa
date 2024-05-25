import type { RerenderInActionProps } from "@/types/server";

export const PREFIX_MESSAGE = "Error rerendering within action: ";
export const SUFFIX_MESSAGE =
  "\nPlease use the 'rerenderInAction' function inside a server action.\nMore details: https://brisa.build/components-details/server-actions#rerenderinaction";

export default function rerenderInAction({
  type = "component",
  renderMode = "reactivity",
}: RerenderInActionProps = {}) {
  const throwable = new Error(
    `${PREFIX_MESSAGE}${JSON.stringify({ type, renderMode })}${SUFFIX_MESSAGE}`,
  );
  throwable.name = "rerender";
  throw throwable;
}
