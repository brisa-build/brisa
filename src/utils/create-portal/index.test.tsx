import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import createPortal from ".";

describe("create-portal", () => {
  it('should be transformed to "portal" element', () => {
    const element = <div>Hello Portal</div>;
    const target = "div" as unknown as  HTMLElement;
    const portalElement = createPortal(element, target);

    expect(portalElement).toEqual({
      type: "portal",
      props: {
        element,
        target,
      },
    });
  });
});
