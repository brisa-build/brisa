import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

let brisaElement: any;

describe("utils", () => {
  describe("brisa-element", () => {
    beforeAll(async () => {
      GlobalRegistrator.register();
      brisaElement = (await import(".")).default;
    });
    afterAll(() => {
      GlobalRegistrator.unregister();
    });
    it("should work props and state with a counter", () => {
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
      counter.setAttribute("name", "Another name");
      expect(counter?.shadowRoot?.innerHTML).toBe(
        '<p class=""><button>+</button><span> Another name 1 </span><button>-</button><slot></slot></p>',
      );
      dec.click();
      expect(counter?.shadowRoot?.innerHTML).toBe(
        '<p class="even"><button>+</button><span> Another name 0 </span><button>-</button><slot></slot></p>',
      );
    });

    it("should work with conditional rendering inside span node", () => {
      type Props = { name: { value: string }; children: Node };
      function ConditionalRender({ name, children }: Props, { h }: any) {
        return [
          h("h2", {}, [
            h("b", {}, () => "Hello " + name.value),
            h("span", {}, () =>
              name.value === "Barbara" ? [h("b", {}, "!! 🥳")] : "🥴",
            ),
          ]),
          children,
        ];
      }

      customElements.define(
        "conditional-render",
        brisaElement(ConditionalRender as any, ["name"]),
      );

      document.body.innerHTML = `
        <conditional-render name="Aral">
          <span>test</span>
        </conditional-render>
      `;

      const conditionalRender = document.querySelector(
        "conditional-render",
      ) as HTMLElement;

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Aral</b><span>🥴</span></h2><slot></slot>",
      );

      conditionalRender.setAttribute("name", "Barbara");

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Barbara</b><span><b>!! 🥳</b></span></h2><slot></slot>",
      );

      conditionalRender.setAttribute("name", "Aral");

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Aral</b><span>🥴</span></h2><slot></slot>",
      );
    });

    it("should work with conditional rendering inside text node", () => {
      type Props = { name: { value: string }; children: Node };
      function ConditionalRender({ name, children }: Props, { h }: any) {
        return [
          h("h2", {}, [
            h("b", {}, () => "Hello " + name.value),
            h(null, {}, () =>
              name.value === "Barbara" ? [h("b", {}, "!! 🥳")] : "🥴",
            ),
          ]),
          children,
        ];
      }

      customElements.define(
        "conditional-render",
        brisaElement(ConditionalRender as any, ["name"]),
      );

      document.body.innerHTML = `
        <conditional-render name="Aral">
          <span>test</span>
        </conditional-render>
      `;

      const conditionalRender = document.querySelector(
        "conditional-render",
      ) as HTMLElement;

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Aral</b>🥴</h2><slot></slot>",
      );

      conditionalRender.setAttribute("name", "Barbara");

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "",
        // '<h2><b>Hello Barbara</b><b>!! 🥳</b></h2><slot></slot>',
      );
    });
  });
});
