import { RequestContext } from "../../bunrise";
import { Props } from "../../types";
import translatePathname from "../translate-pathname";

export default function renderAttributes({
  props,
  request,
  type,
}: {
  props: Props;
  request: RequestContext;
  type: string;
}): string {
  let attributes = "";

  for (const prop in props) {
    const value = props[prop];

    if (prop === "children" || (type === "html" && prop === "lang")) continue;

    // i18n navigation
    if (
      type === "a" &&
      prop === "href" &&
      request.i18n?.locale &&
      typeof value === "string"
    ) {
      attributes += ` ${prop}="${translatePathname(value, request)}"`;
      continue;
    }

    attributes += ` ${prop}="${value}"`;
  }

  if (type === "html" && request.i18n?.locale) {
    attributes += ` lang="${request.i18n?.locale}"`;
  }

  return attributes;
}
