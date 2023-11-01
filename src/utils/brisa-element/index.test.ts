import { describe, it, expect, beforeAll, afterAll, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { on } from "events";

let brisaElement: any;

declare global {
  interface Window {
    onAfterClick: () => void;
  }
}

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
        return h("", {}, [
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
            "",
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
        return h("", {}, [
          [
            "h2",
            {},
            [
              ["b", {}, () => "Hello " + name.value],
              [
                "",
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
            "",
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

    it("should display a component to display a series of images in a sliding carousel", () => {
      type Props = { images: { value: string[] } };
      function Carousel({ images }: Props, { state, h }: any) {
        const index = state(0);
        const next = () => {
          index.value = (index.value + 1) % images.value.length;
        };
        const prev = () => {
          index.value =
            (index.value - 1 + images.value.length) % images.value.length;
        };
        return h("div", {}, [
          ["button", { onClick: prev }, "prev"],
          ["img", { src: () => images.value[index.value] }, ""],
          ["button", { onClick: next }, "next"],
        ]);
      }

      customElements.define(
        "carousel-images",
        brisaElement(Carousel as any, ["images"]),
      );

      document.body.innerHTML = `
        <carousel-images images="['https://picsum.photos/200/300', 'https://picsum.photos/200/300?grayscale']" />
      `;

      const carousel = document.querySelector("carousel-images") as HTMLElement;
      const [prev, next] = carousel?.shadowRoot?.querySelectorAll(
        "button",
      ) as NodeListOf<HTMLButtonElement>;

      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300"><button>next</button></div>',
      );
      next.click();
      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300?grayscale"><button>next</button></div>',
      );
      next.click();
      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300"><button>next</button></div>',
      );
      prev.click();
      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300?grayscale"><button>next</button></div>',
      );
    });

    it("should display a component to display a series of images in a sliding carousel receiving images inside an object", () => {
      type Props = { images: { value: { url: string }[] } };
      function Carousel({ images }: Props, { state, h }: any) {
        const index = state(0);
        const next = () => {
          index.value = (index.value + 1) % images.value.length;
        };
        const prev = () => {
          index.value =
            (index.value - 1 + images.value.length) % images.value.length;
        };
        return h("div", {}, [
          ["button", { onClick: prev }, "prev"],
          [
            "img",
            {
              src: () => images.value[index.value]?.url,
            },
            "",
          ],
          ["button", { onClick: next }, "next"],
        ]);
      }

      customElements.define(
        "carousel-images",
        brisaElement(Carousel as any, ["images"]),
      );

      document.body.innerHTML = `
        <carousel-images images="[{'url':'https://picsum.photos/200/300'},{'url':'https://picsum.photos/200/300?grayscale'}]" />
      `;

      const carousel = document.querySelector("carousel-images") as HTMLElement;
      const [prev, next] = carousel?.shadowRoot?.querySelectorAll(
        "button",
      ) as NodeListOf<HTMLButtonElement>;

      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300"><button>next</button></div>',
      );
      next.click();
      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300?grayscale"><button>next</button></div>',
      );
      next.click();
      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300"><button>next</button></div>',
      );
      prev.click();
      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300?grayscale"><button>next</button></div>',
      );
    });

    it("should render a timer component", () => {
      function Timer({ }, { state, h }: any) {
        const time = state(0);
        const interval = setInterval(() => {
          time.value++;
        }, 1);

        return h("div", {}, [
          ["span", {}, () => `Time: ${time.value}`],
          ["button", { onClick: () => clearInterval(interval) }, "stop"],
        ]);
      }

      customElements.define("timer-component", brisaElement(Timer));

      document.body.innerHTML = `
        <timer-component></timer-component>
      `;

      const timer = document.querySelector("timer-component") as HTMLElement;
      const button = timer?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      expect(timer?.shadowRoot?.innerHTML).toBe(
        "<div><span>Time: 0</span><button>stop</button></div>",
      );

      setTimeout(() => {
        expect(timer?.shadowRoot?.innerHTML).toBe(
          "<div><span>Time: 1</span><button>stop</button></div>",
        );
      }, 1);

      button.click();

      setTimeout(() => {
        expect(timer?.shadowRoot?.innerHTML).toBe(
          "<div><span>Time: 1</span><button>stop</button></div>",
        );
      }, 1);
    });

    it("should trigger an event when clicking on a button and can be handled via props", () => {
      function Button({ onAfterClick }: any, { h }: any) {
        return h("button", { onClick: onAfterClick }, "click me");
      }

      customElements.define(
        "test-button",
        brisaElement(Button as any, ["onAfterClick"]),
      );
      const onAfterClickMock = mock(() => { });

      window.onAfterClick = onAfterClickMock;
      document.body.innerHTML = `
        <test-button onAfterClick="window.onAfterClick()"></test-button>
      `;

      const testButton = document.querySelector("test-button") as HTMLElement;
      const button = testButton?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      button.click();

      expect(onAfterClickMock).toHaveBeenCalled();
    });

    it("should trigger events in different web-components", () => {
      const onClickMock = mock(() => { });

      function Parent({ }, { h }: any) {
        return h("first-component", { onClickMe: onClickMock }, "click me");
      }

      function FirstComponent({ onClickMe, children }: any, { h }: any) {
        return h("second-component", { onClickMe }, children);
      }

      function SecondComponent({ onClickMe, children }: any, { h }: any) {
        return h("button", { onClick: () => onClickMe("TEST") }, children);
      }

      customElements.define(
        "second-component",
        brisaElement(SecondComponent, ["onClickMe"]),
      );
      customElements.define(
        "first-component",
        brisaElement(FirstComponent, ["onClickMe"]),
      );
      customElements.define("parent-component", brisaElement(Parent));
      document.body.innerHTML = "<parent-component />";

      const parentComponent = document.querySelector(
        "parent-component",
      ) as HTMLElement;

      const firstComponent = parentComponent?.shadowRoot?.querySelector(
        "first-component",
      ) as HTMLElement;

      const secondComponent = firstComponent?.shadowRoot?.querySelector(
        "second-component",
      ) as HTMLElement;

      expect(parentComponent?.shadowRoot?.innerHTML).toBe(
        "<first-component>click me</first-component>",
      );

      expect(firstComponent?.shadowRoot?.innerHTML).toBe(
        "<second-component><slot></slot></second-component>",
      );

      expect(secondComponent?.shadowRoot?.innerHTML).toBe(
        "<button><slot></slot></button>",
      );

      const button = secondComponent?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      button.click();

      expect(onClickMock).toHaveBeenCalled();
      expect(onClickMock.mock.calls[0].at(0)).toBe("TEST");
    });

    it('should display a color selector component', () => {
      type Props = { color: { value: string } };
      function ColorSelector({ color }: Props, { h }: any) {
        return h('div', {}, [
          ['input', { type: 'color', value: () => color.value, onInput: (e: any) => color.value = e.target.value }, ''],
          ['span', { style: () => `color:${color.value}` }, () => color.value],
        ]);
      }

      customElements.define(
        'color-selector',
        brisaElement(ColorSelector as any, ['color']),
      );

      document.body.innerHTML = `
        <color-selector color="#000000" />
      `;

      const colorSelector = document.querySelector(
        'color-selector',
      ) as HTMLElement;

      const input = colorSelector?.shadowRoot?.querySelector(
        'input',
      ) as HTMLInputElement;

      expect(colorSelector?.shadowRoot?.innerHTML).toBe(
        '<div><input type="color" value="#000000"><span style="color:#000000">#000000</span></div>',
      );

      input.value = '#ffffff';

      input.dispatchEvent(new Event('input'));

      expect(colorSelector?.shadowRoot?.innerHTML).toBe(
        '<div><input type="color" value="#ffffff"><span style="color:#ffffff">#ffffff</span></div>',
      );
    });
  });
});
