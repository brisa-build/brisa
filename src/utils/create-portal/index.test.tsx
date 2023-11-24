import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import createPortal from ".";

describe("create-portal", () => {
  beforeEach(() => {
    GlobalRegistrator.register();
  });

  afterEach(() => {
    GlobalRegistrator.unregister();
  });

  it('should be transformed to "portal" element', () => {
    const element = <div>Hello Portal</div>;
    const target = document.createElement("div");
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
