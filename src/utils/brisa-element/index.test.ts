import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import brisaElement from ".";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

describe("utils", () => {
  describe("brisa-element", () => {
    beforeAll(() => {
      GlobalRegistrator.register();
    });
    afterAll(() => {
      GlobalRegistrator.unregister();
    });
    it("should work a counter", () => {
      type Props = { name: { value: string }; children: Node };
      function Counter({ name, children }: Props, { state, h }: any) {
        const count = state(0);

        return [
          h("p", { class: () => (count.value % 2 === 0 ? "even" : "") }, [
            h("button", { onClick: () => count.value++ }, "+"),
            h("span", {}, () => ` ${name.value} ${count.value} `),
            h("button", { onClick: () => count.value-- }, "-"),
            children,
          ]),
        ];
      }

      customElements.define(
        "test-counter",
        brisaElement(Counter as any, ["name"]),
      );

      document.body.innerHTML = `
        <test-counter name="Aral">
          <span>test</span>
        </test-counter>
      `;

      const counter = document.querySelector("test-counter") as HTMLElement;
      const [inc, dec] = counter?.shadowRoot?.querySelectorAll(
        "button",
      ) as NodeListOf<HTMLButtonElement>;

      expect(counter?.shadowRoot?.innerHTML).toBe(
        '<p class="even"><button>+</button><span> Aral 0 </span><button>-</button><slot></slot></p>',
      );
      inc.click();
      expect(counter?.shadowRoot?.innerHTML).toBe(
        '<p class=""><button>+</button><span> Aral 1 </span><button>-</button><slot></slot></p>',
      );
      dec.click();
      expect(counter?.shadowRoot?.innerHTML).toBe(
        '<p class="even"><button>+</button><span> Aral 0 </span><button>-</button><slot></slot></p>',
      );
    });
  });
});
