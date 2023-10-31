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

        return h("p", { class: () => (count.value % 2 === 0 ? "even" : "") }, [
          ["button", { onClick: () => count.value++ }, "+"],
          ["span", {}, () => ` ${name.value} ${count.value} `],
          ["button", { onClick: () => count.value-- }, "-"],
          children,
        ]);
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
        return h('', {}, [
          [
            "h2",
            {},
            [
              ["b", {}, () => "Hello " + name.value],
              [
                "span",
                {},
                () => (name.value === "Barbara" ? ["b", {}, "!! 🥳"] : "🥴"),
              ],
            ],
          ],
          children,
        ]);
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
        return h("h2", {}, [
          ["b", {}, () => "Hello " + name.value],
          [
            '',
            {},
            () => (name.value === "Barbara" ? ["b", {}, "!! 🥳"] : "🥴"),
          ],
          children,
        ]);
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
        "<h2><b>Hello Aral</b>🥴<slot></slot></h2>",
      );

      conditionalRender.setAttribute("name", "Barbara");

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Barbara</b><b>!! 🥳</b><slot></slot></h2>",
      );
    });

    it("should work with conditional rendering inside text node and fragment", () => {
      type Props = { name: { value: string }; children: Node };
      function ConditionalRender({ name, children }: Props, { h }: any) {
        return h('', {}, [
          [
            "h2",
            {},
            [
              ["b", {}, () => "Hello " + name.value],
              [
                '',
                {},
                () => (name.value === "Barbara" ? ["b", {}, "!! 🥳"] : "🥴"),
              ],
            ],
          ],
          children,
        ]);
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
        "<h2><b>Hello Barbara</b><b>!! 🥳</b></h2><slot></slot>",
      );
    });

    it("should work with conditional rendering with multiple nodes", () => {
      type Props = { name: { value: string }; children: Node };
      function ConditionalRender({ name, children }: Props, { h }: any) {
        return h("h2", {}, [
          ["b", {}, () => "Hello " + name.value],
          [
            '',
            {},
            () =>
              name.value === "Barbara"
                ? [["b", {}, "!! 🥳"], ["i", {}, " this is a "], " test"]
                : "🥴",
          ],
          children,
        ]);
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
        "<h2><b>Hello Aral</b>🥴<slot></slot></h2>",
      );

      conditionalRender.setAttribute("name", "Barbara");

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Barbara</b><b>!! 🥳</b><i> this is a </i> test<slot></slot></h2>",
      );
    });

    it("should work with empty nodes", () => {
      function EmptyNodes({ }, { h }: any) {
        return h("div", {}, ["span", {}, ""]);
      }

      customElements.define("empty-nodes", brisaElement(EmptyNodes as any));

      document.body.innerHTML = `
        <empty-nodes></empty-nodes>
      `;

      const emptyNodes = document.querySelector("empty-nodes") as HTMLElement;

      expect(emptyNodes?.shadowRoot?.innerHTML).toBe(
        "<div><span></span></div>",
      );
    });
  });
});
