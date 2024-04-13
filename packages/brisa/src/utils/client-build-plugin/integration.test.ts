import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { join } from "node:path";

import clientBuildPlugin from ".";
import { normalizeQuotes, toInline } from "@/helpers";
import createPortal from "@/utils/create-portal";
import dangerHTML from "@/utils/danger-html";
import { serialize } from "@/utils/serialization";
import createContext from "@/utils/create-context";
import type { WebContextPlugin } from "@/types";

declare global {
  interface Window {
    [key: string]: any;
  }
}

function defineBrisaWebComponent(code: string, path: string) {
  const componentName = path.split("/").pop()?.split(".")[0] as string;

  const webComponent = `(() => {${normalizeQuotes(
    clientBuildPlugin(code, path).code,
  )
    .replace('import {brisaElement, _on, _off} from "brisa/client";', "")
    .replace("export default", "const _Test =")}return _Test;})()`;

  customElements.define(componentName, eval(webComponent));

  return webComponent;
}

async function getContextProviderCode() {
  const code = await Bun.file(
    join(import.meta.dir, "..", "context-provider", "client.tsx"),
  ).text();
  return code.replace(/import.*\n/g, "");
}

describe("integration", () => {
  describe("web-components", () => {
    beforeEach(async () => {
      GlobalRegistrator.register();
      const module = await import("../brisa-element");
      window.__WEB_CONTEXT_PLUGINS__ = false;
      window.__BASE_PATH__ = "";
      window.brisaElement = module.default;
      window._on = module._on;
      window._off = module._off;
      window.dangerHTML = dangerHTML;
      window.createPortal = createPortal;
      window.createContext = createContext;
    });
    afterEach(async () => {
      if (typeof window !== "undefined") GlobalRegistrator.unregister();
    });
    it("should work returning a text node", () => {
      const code = `export default function Test() {
        return 'Hello World';
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("Hello World");
    });

    it("should work returining a text node in an async component exported in a different line", async () => {
      const code = `async function Component() {
        return 'Hello world'
      };
      
      export default Component`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";

      await Bun.sleep(0);

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("Hello world");
    });

    it("should work returning an array of text nodes", () => {
      const code = `export default function Test() {
        return ['Hello', ' ', 'World'];
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("Hello World");
    });

    it("should work interactivity returning an array from signal", () => {
      const code = `export default function Test({ count }) {
        return Array.from({ length: count }, (_, i) => (
          <span>{i}</span>
        ));
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component count='3' />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<span>0</span><span>1</span><span>2</span>",
      );

      testComponent.setAttribute("count", "5");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>",
      );
    });

    it("should work interactivity returning a fragment with an mapped array from signal", () => {
      const code = `export default function Test({ items }) {
        return (
          <>
            {items?.map((v) => (
              <span>{v}</span>
            ))}
          </>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = `<test-component items="['1','2','3']"" />`;

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<span>1</span><span>2</span><span>3</span>",
      );

      testComponent.setAttribute("items", "['1','2','3','4','5']");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>",
      );
    });

    it("should work interactivity returning a fragment with an array from signal", () => {
      const code = `export default function Test({ count }) {
        return (
          <>
            {Array.from({ length: count }, (_, i) => (
              <span>{i}</span>
            ))}
          </>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component count='3' />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<span>0</span><span>1</span><span>2</span>",
      );

      testComponent.setAttribute("count", "5");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>",
      );
    });

    it('should work an event from a executed function with "on" prefix', () => {
      const code = `export default function Test() {
        const handleClick = name => e => window.onClick(name+e.type);
        return <button onClick={handleClick('test')}>Click me</button>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      const onClickMock = mock((v: string) => v);

      window.onClick = onClickMock;

      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      const button = testComponent?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      button.click();

      expect(onClickMock).toHaveBeenCalledTimes(1);
      expect(onClickMock.mock.calls[0][0]).toBe("testclick");
    });

    it("should work reactivity in an event executed from a function", () => {
      const code = `export default function Test({test}) {
        const handleClick = v => () => window.onClick(v);
        return <button onClick={handleClick(test)}>Click me</button>;
      }`;

      document.body.innerHTML = "<test-component test='works' />";

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      const onClickMock = mock((v: string) => v);

      window.onClick = onClickMock;

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      const button = testComponent?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      button.click();

      expect(onClickMock).toHaveBeenCalledTimes(1);
      expect(onClickMock.mock.calls[0][0]).toBe("works");

      testComponent.setAttribute("test", "works2");

      button.click();

      expect(onClickMock).toHaveBeenCalledTimes(2);
      expect(onClickMock.mock.calls[1][0]).toBe("works2");
    });

    it("should work interactivity using a markup generator that returns an array from signal", () => {
      const code = `export default function Test({}, { state }) {
        const count = state(3);
        return <div onClick={() => count.value+=1}>{generateMarkup(count)}</div>;
      }
      
      function generateMarkup(count) {
        return Array.from({ length: count.value }, (_, i) => (
          <span>{i}</span>
        ));
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><span>0</span><span>1</span><span>2</span></div>",
      );

      const div = testComponent?.shadowRoot?.querySelector(
        "div",
      ) as HTMLDivElement;

      div.click();

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><span>0</span><span>1</span><span>2</span><span>3</span></div>",
      );
    });

    it("should call markup generator once unless the signal value change", () => {
      const code = `export default function Test({}, { state }) {
        const count = state(3);
        return <div onClick={() => count.value+=1}>{generateMarkup(count)}</div>;
      }
      
      function generateMarkup(count) {
        window.insideGenerateMarkup();
        return<span>{count.value}</span>
      }`;

      window.insideGenerateMarkup = mock(() => {});

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(window.insideGenerateMarkup).toHaveBeenCalledTimes(1);

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><span>3</span></div>",
      );

      const div = testComponent?.shadowRoot?.querySelector(
        "div",
      ) as HTMLDivElement;

      div.click();

      expect(window.insideGenerateMarkup).toHaveBeenCalledTimes(1);

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><span>4</span></div>",
      );
    });

    it("should call markup generator twice when using signal value as attribute", () => {
      const code = `export default function Test({}, { state }) {
        const count = state(3);
        return <div onClick={() => count.value+=1}>{generateMarkup(count.value)}</div>;
      }
      
      function generateMarkup(count) {
        window.insideGenerateMarkup();
        return<span>{count}</span>
      }`;

      window.insideGenerateMarkup = mock(() => {});

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(window.insideGenerateMarkup).toHaveBeenCalledTimes(1);

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><span>3</span></div>",
      );

      const div = testComponent?.shadowRoot?.querySelector(
        "div",
      ) as HTMLDivElement;

      div.click();

      expect(window.insideGenerateMarkup).toHaveBeenCalledTimes(2);

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><span>4</span></div>",
      );
    });

    it("should work interactivity using a markup generator that returns a signal", () => {
      const code = `export default function Test({}, { state }) {
        const count = state(3);
        return <div onClick={() => count.value+=1}>{generateMarkup(count)}</div>;
      }
      
      function generateMarkup(count) {
        return count.value;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>3</div>");

      const div = testComponent?.shadowRoot?.querySelector(
        "div",
      ) as HTMLDivElement;

      div.click();

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>4</div>");
    });

    it("should work returning directly the children", () => {
      const code = `export default function Test({ children }) {
        return children;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component>Hello World</test-component>";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<slot></slot>");

      expect(testComponent?.innerHTML).toBe("Hello World");
    });

    it("should work props and state with a counter", () => {
      const path = "src/web-components/test-counter.tsx";
      const code = `
        export default function Counter({ name, children }: any, { state }: any) {
          const count = state(0);
          
          return (
            <p class={count.value % 2 === 0 ? "even" : ""}>
              <button onClick={() => count.value++}>+</button>
              <span> {name} {count.value} </span>
              <button onClick={() => count.value--}>-</button>
              {children}
            </p>
          )
        }`;

      defineBrisaWebComponent(code, path);

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
      const code = `export default function ConditionalRender({ name, children }: any) {
        return (
          <>
            <h2>
              <b>Hello {name}</b>
              <span>{name === 'Barbara' ? <b>!! 🥳</b> : '🥴'}</span>
            </h2>
            {children}
          </>
        );
      }`;

      defineBrisaWebComponent(
        code,
        "src/web-components/conditional-render.tsx",
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

    it('should work different children using slot with "name" attribute', () => {
      const componentWithSlotsCode = `
      const MyComponentUsingSlots = () => {
        return (
          <div>
            <p>This is my component with slots</p>
            <div>
              <slot name="header"></slot>
            </div>
            <div>
              <slot name="content"></slot>
            </div>
          </div>
        );
      };

      export default MyComponentUsingSlots;
    `;
      const parentComponentUsingSlotsCode = `
      const ParentComponentUsingSlots = () => {
        return (
          <my-component-using-slots>
            <div slot="header">Header Content</div>
            <p slot="content">These are the child components!</p>
          </my-component-using-slots>
        );
      };

      export default ParentComponentUsingSlots;
      `;

      defineBrisaWebComponent(
        componentWithSlotsCode,
        "src/web-components/my-component-using-slots.tsx",
      );

      defineBrisaWebComponent(
        parentComponentUsingSlotsCode,
        "src/web-components/parent-component-using-slots.tsx",
      );

      document.body.innerHTML = `
        <parent-component-using-slots></parent-component-using-slots>
      `;

      const parentComponentUsingSlots = document.querySelector(
        "parent-component-using-slots",
      ) as HTMLElement;

      expect(parentComponentUsingSlots?.shadowRoot?.innerHTML).toBe(
        '<my-component-using-slots><div slot="header">Header Content</div><p slot="content">These are the child components!</p></my-component-using-slots>',
      );

      const myComponentUsingSlots =
        parentComponentUsingSlots?.shadowRoot?.querySelector(
          "my-component-using-slots",
        ) as HTMLElement;

      expect(myComponentUsingSlots?.shadowRoot?.innerHTML).toBe(
        '<div><p>This is my component with slots</p><div><slot name="header"></slot></div><div><slot name="content"></slot></div></div>',
      );

      const headerSlot = myComponentUsingSlots?.shadowRoot?.querySelector(
        'slot[name="header"]',
      ) as HTMLSlotElement;

      expect(headerSlot?.assignedElements()[0].innerHTML).toBe(
        "Header Content",
      );

      const contentSlot = myComponentUsingSlots?.shadowRoot?.querySelector(
        'slot[name="content"]',
      ) as HTMLSlotElement;

      expect(contentSlot?.assignedElements()[0].innerHTML).toBe(
        "These are the child components!",
      );
    });

    it("should work with conditional rendering inside text node", () => {
      const code = `
      export default function ConditionalRender({ name, children }: any) {
        return (
          <h2>
            <b>Hello {name}</b>
            {name === 'Barbara' ? <b>!! 🥳</b> : '🥴'}
            {children}
          </h2>
        );
      }
      `;

      defineBrisaWebComponent(
        code,
        "src/web-components/conditional-render.tsx",
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
      const code = `
      export default function ConditionalRender({ name, children }: any) {
        return (
          <>
            <h2>
              <b>Hello {name}</b>
              {name === 'Barbara' ? <b>!! 🥳</b> : '🥴'}
            </h2>
            {children}
          </>
        );
      }`;

      defineBrisaWebComponent(
        code,
        "src/web-components/conditional-render.tsx",
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
      const code = `
      export default function ConditionalRender({ name, children }: any, { h }: any) {
        return (
          <h2>
            <b>Hello {name}</b>
            {name === 'Barbara' ? <><b>!! 🥳</b><i> this is a </i> test</> : '🥴'}
            {children}
          </h2>
        );
      }`;

      defineBrisaWebComponent(
        code,
        "src/web-components/conditional-render.tsx",
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
      const code = `export default function EmptyNodes() {
        return <div><span /></div>
      }`;

      defineBrisaWebComponent(code, "src/web-components/empty-nodes.tsx");

      document.body.innerHTML = `
        <empty-nodes></empty-nodes>
      `;

      const emptyNodes = document.querySelector("empty-nodes") as HTMLElement;

      expect(emptyNodes?.shadowRoot?.innerHTML).toBe(
        "<div><span></span></div>",
      );
    });

    it("should display a component to display a series of images in a sliding carousel", () => {
      const code = `export default function Carousel({ images }: any, { state }: any) {
        const index = state(0);

        const next = () => {
          index.value = (index.value + 1) % images.length;
        };

        const prev = () => {
          index.value =
            (index.value - 1 + images.length) % images.length;
        };

        return (
          <div>
            <button onClick={prev}>prev</button>
            <img src={images[index.value]} />
            <button onClick={next}>next</button>
          </div>
        );
      }`;

      document.body.innerHTML = `
        <sliding-carousel images="['https://picsum.photos/200/300', 'https://picsum.photos/200/300?grayscale']" />
      `;

      defineBrisaWebComponent(code, "src/web-components/sliding-carousel.tsx");

      const carousel = document.querySelector(
        "sliding-carousel",
      ) as HTMLElement;
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
      const code = `export default function Carousel({ images }: Props, { state }: any) {
        const index = state(0);
        const next = () => {
          index.value = (index.value + 1) % images.length;
        };
        const prev = () => {
          index.value =
            (index.value - 1 + images.length) % images.length;
        };

        return (
          <div>
            <button onClick={prev}>prev</button>
            <img src={images[index.value].url} />
            <button onClick={next}>next</button>
          </div>
        );
      }`;

      document.body.innerHTML = `
        <carousel-images images="[{'url':'https://picsum.photos/200/300'},{'url':'https://picsum.photos/200/300?grayscale'}]" />
      `;

      defineBrisaWebComponent(code, "src/web-components/carousel-images.tsx");

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

    it("should render a timer component", async () => {
      const code = `export default function Timer({ }, { state }: any) {
        const time = state(0);
        const interval = setInterval(() => {
          time.value++;
        }, 1);

        return (
          <div>
            <span>Time: {time.value}</span>
            <button onClick={() => clearInterval(interval)}>stop</button>
          </div>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/timer-component.tsx");

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

      await Bun.sleep(1);
      expect(timer?.shadowRoot?.innerHTML).toBe(
        "<div><span>Time: 1</span><button>stop</button></div>",
      );

      button.click();

      await Bun.sleep(1);
      expect(timer?.shadowRoot?.innerHTML).toBe(
        "<div><span>Time: 1</span><button>stop</button></div>",
      );
    });

    it("should trigger an event when clicking on a button and can be handled via props", () => {
      const code = `export default function Button({ onAfterClick }: any) {
        return <button onClick={onAfterClick}>click me</button>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-button.tsx");

      const onAfterClickMock = mock(() => {});

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
      window.mock = mock(() => {});

      const parentCode = `export default function Parent() {
        return <first-component onClickMe={window.mock}>click me</first-component>
      }`;

      const firstCode = `export default function FirstComponent({ onClickMe, children }) {
        return <second-component onClickMe={onClickMe}>{children}</second-component>
      }`;

      const secondCode = `export default function SecondComponent({ onClickMe, children }) {
        return <button onClick={() => onClickMe("TEST")}>{children}</button>
      }`;

      defineBrisaWebComponent(
        secondCode,
        "src/web-components/second-component.tsx",
      );
      defineBrisaWebComponent(
        firstCode,
        "src/web-components/first-component.tsx",
      );
      defineBrisaWebComponent(
        parentCode,
        "src/web-components/parent-component.tsx",
      );

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

      expect(window.mock).toHaveBeenCalled();
      expect(window.mock.mock.calls[0].at(0)).toBe("TEST");
    });

    it("should display a color selector component", () => {
      // It's just a test that is working, we don't recommend to mutate the prop (please not)
      const code = `export default function ColorSelector({ color }) {
        return (
          <div>
            <input type="color" value={color} onInput={(e: any) => color = e.target.value} />
            <span style={{ color }}>{color}</span>
          </div>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/color-selector.tsx");

      document.body.innerHTML = `
        <color-selector color="#000000" />
      `;

      const colorSelector = document.querySelector(
        "color-selector",
      ) as HTMLElement;

      const input = colorSelector?.shadowRoot?.querySelector(
        "input",
      ) as HTMLInputElement;

      expect(colorSelector?.shadowRoot?.innerHTML).toBe(
        '<div><input type="color" value="#000000"><span style="color:#000000;">#000000</span></div>',
      );

      input.value = "#ffffff";

      input.dispatchEvent(new Event("input"));

      expect(colorSelector?.shadowRoot?.innerHTML).toBe(
        '<div><input type="color" value="#ffffff"><span style="color:#ffffff;">#ffffff</span></div>',
      );
    });

    it("should render a TodoList component from props", () => {
      const code = `export default function TodoList({ todos }) {
        return <ul>{todos.map((todo: string) => <li>{todo}</li>)}</ul>
      }`;

      document.body.innerHTML = `
        <todo-list todos="['todo 1', 'todo 2', 'todo 3']" />
      `;

      defineBrisaWebComponent(code, "src/web-components/todo-list.tsx");

      const todoList = document.querySelector("todo-list") as HTMLElement;

      expect(todoList?.shadowRoot?.innerHTML).toBe(
        "<ul><li>todo 1</li><li>todo 2</li><li>todo 3</li></ul>",
      );

      todoList.setAttribute("todos", '["todo 4", "todo 5"]');

      expect(todoList?.shadowRoot?.innerHTML).toBe(
        "<ul><li>todo 4</li><li>todo 5</li></ul>",
      );
    });

    it("should work an interactive TodoList with state", () => {
      const code = `export default function TodoList({ }, { state }) {
        const todos = state(["todo 1", "todo 2", "todo 3"]);
        const newTodo = state("");
        const addTodo = () => {
          todos.value = [...todos.value, newTodo.value];
          newTodo.value = "";
        };

        return (
          <div>
            <input value={newTodo.value} onInput={e => newTodo.value = e.target.value} />
            <button onClick={addTodo}>Add</button>
            <ul>{todos.value.map((todo: string) => <li>{todo}</li>)}</ul>
          </div>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/todo-list.tsx");
      document.body.innerHTML = "<todo-list />";

      const todoList = document.querySelector("todo-list") as HTMLElement;

      const input = todoList?.shadowRoot?.querySelector(
        "input",
      ) as HTMLInputElement;

      const button = todoList?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      expect(todoList?.shadowRoot?.innerHTML).toBe(
        '<div><input value=""><button>Add</button><ul><li>todo 1</li><li>todo 2</li><li>todo 3</li></ul></div>',
      );

      input.value = "todo 4";

      input.dispatchEvent(new Event("input"));

      expect(todoList?.shadowRoot?.innerHTML).toBe(
        '<div><input value="todo 4"><button>Add</button><ul><li>todo 1</li><li>todo 2</li><li>todo 3</li></ul></div>',
      );

      button.click();

      expect(todoList?.shadowRoot?.innerHTML).toBe(
        '<div><input value=""><button>Add</button><ul><li>todo 1</li><li>todo 2</li><li>todo 3</li><li>todo 4</li></ul></div>',
      );
    });

    it("should be possible to change an static src attribute using the onerror event from img", () => {
      const code = `export default function Image() {
        return <img src="https://test.com/image.png" onError={e => e.target.src = "https://test.com/error.png"} />;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-image.tsx");
      document.body.innerHTML = "<test-image />";

      const testImage = document.querySelector("test-image") as HTMLElement;
      const img = testImage?.shadowRoot?.querySelector(
        "img",
      ) as HTMLImageElement;

      expect(testImage?.shadowRoot?.innerHTML).toBe(
        '<img src="https://test.com/image.png">',
      );
      img.dispatchEvent(new Event("error"));
      expect(testImage?.shadowRoot?.innerHTML).toBe(
        '<img src="https://test.com/error.png">',
      );
    });

    it("should be possible to change a dynamic src attribute using the onerror event from img", () => {
      const code = `export default function Image({ }, { state }: any) {
        const src = state("https://test.com/image.png");

        return <img src={src.value} onError={e => e.target.src = "https://test.com/error.png"} />
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-image.tsx");
      document.body.innerHTML = "<test-image />";

      const testImage = document.querySelector("test-image") as HTMLElement;
      const img = testImage?.shadowRoot?.querySelector(
        "img",
      ) as HTMLImageElement;

      expect(testImage?.shadowRoot?.innerHTML).toBe(
        '<img src="https://test.com/image.png">',
      );
      img.dispatchEvent(new Event("error"));
      expect(testImage?.shadowRoot?.innerHTML).toBe(
        '<img src="https://test.com/error.png">',
      );
    });

    it("should unregister effects when the component is disconnected", async () => {
      window.mock = mock((n: number) => {});
      const code = `export default function Test({ }, { state, effect }: any) {
          const count = state(0);

          window.interval = setInterval(() => {
            count.value++;
          }, 1);

          effect(() => {
            window.mock(count.value);
          });

          return <div>{count.value}</div>;
        }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";
      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>0</div>");
      expect(window.mock).toHaveBeenCalledTimes(1);

      await Bun.sleep(1);
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>1</div>");
      expect(window.mock).toHaveBeenCalledTimes(2);
      testComponent.remove();

      await Bun.sleep(1);
      expect(window.mock).toHaveBeenCalledTimes(2);
      clearInterval(window.interval);
    });

    it("should reset the state when some props change via effect", () => {
      const code = `export default function Test({ count }: any, { state, effect }: any) {
        const lastCount = state(0);
        const countState = state(count);

        effect(() => {
          if (lastCount.value !== count) {
            countState.value = count;
            lastCount.value = count;
          }
        });

        return (
          <>
            <div>{countState.value}</div>
            <button onClick={() => countState.value++}>increment</button>
          </>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component count='1' />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      const button = testComponent?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div>1</div><button>increment</button>",
      );

      button.click();

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div>2</div><button>increment</button>",
      );

      testComponent.setAttribute("count", "3");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div>3</div><button>increment</button>",
      );
    });

    it("should work an async web-component", async () => {
      const code = `export default async function AsyncComponent({ }, { state }: any) {
        const count = state(await Promise.resolve(42));

        return <div>{count.value}</div>
      }`;

      defineBrisaWebComponent(code, "src/web-components/async-component.tsx");
      document.body.innerHTML = "<async-component />";

      const asyncComponent = document.querySelector(
        "async-component",
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(asyncComponent?.shadowRoot?.innerHTML).toBe("<div>42</div>");
    });

    it("should work an async effect inside a web-component", async () => {
      const code = `export default async function AsyncComponent({ }, { state, effect }: any) {
        const count = state(0);
        const sleep = () => new Promise(r => setTimeout(() => r(true), 0))

        effect(async () => {
          await sleep();
          count.value = 42;
        });

        return <div>{count.value}</div>
      }`;

      defineBrisaWebComponent(code, "src/web-components/async-component.tsx");
      document.body.innerHTML = "<async-component />";

      const asyncComponent = document.querySelector(
        "async-component",
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(asyncComponent?.shadowRoot?.innerHTML).toBe("<div>42</div>");
    });

    it("should render an empty text node", () => {
      const code = `export default function EmptyTextNode() {
        return <div>{''}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/empty-text-node.tsx");
      document.body.innerHTML = "<empty-text-node />";

      const emptyTextNode = document.querySelector(
        "empty-text-node",
      ) as HTMLElement;

      expect(emptyTextNode?.shadowRoot?.innerHTML).toBe("<div></div>");
    });

    it("should cleanup everytime an effect is re-called", () => {
      window.mockEffect = mock((num: number) => {});
      window.mockCleanup = mock(() => {});

      const code = `export default function Test({ }, { state, effect, cleanup }: any) {
        const count = state(0);

        effect((r) => {
          window.mockEffect(count.value);
          cleanup(() => {
            window.mockCleanup();
          }, r.id);
        });

        return <button onClick={() => count.value++}>click</button>
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";
      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      const button = testComponent?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      expect(window.mockEffect).toHaveBeenCalledTimes(1);
      expect(window.mockCleanup).toHaveBeenCalledTimes(0);

      button.click();

      expect(window.mockEffect).toHaveBeenCalledTimes(2);
      expect(window.mockCleanup).toHaveBeenCalledTimes(1);

      button.click();

      expect(window.mockEffect).toHaveBeenCalledTimes(3);
      expect(window.mockCleanup).toHaveBeenCalledTimes(2);
      delete window.mockEffect;
      delete window.mockCleanup;
    });

    it("should cleanup everytime the web-component is unmount", () => {
      window.mockEffect = mock(() => {});
      window.mockCleanup = mock(() => {});

      const code = `export default function Test({ }, { effect, cleanup }: any) {
        effect(() => {
          window.mockEffect();
          cleanup(() => window.mockCleanup());
        });

        return <div />;
      }`;

      defineBrisaWebComponent(code, "src/web-components/cleanup-component.tsx");
      document.body.innerHTML = "<cleanup-component />";

      const testComponent = document.querySelector(
        "cleanup-component",
      ) as HTMLElement;

      expect(window.mockEffect).toHaveBeenCalledTimes(1);
      expect(window.mockCleanup).toHaveBeenCalledTimes(0);

      testComponent.remove();

      expect(window.mockEffect).toHaveBeenCalledTimes(1);
      expect(window.mockCleanup).toHaveBeenCalledTimes(1);
    });

    it("should cleanup async cleanups when the web-component is unmount", async () => {
      window.mockEffect = mock(() => {});
      window.mockCleanup = mock(() => {});

      const code = `export default function Test({ }, { effect, cleanup }: any) {
        effect(async () => {
          mockEffect();
          cleanup(async () => window.mockCleanup());
        });

        return <div />;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(window.mockEffect).toHaveBeenCalledTimes(1);
      expect(window.mockCleanup).toHaveBeenCalledTimes(0);

      testComponent.remove();

      expect(window.mockEffect).toHaveBeenCalledTimes(1);
      expect(window.mockCleanup).toHaveBeenCalledTimes(1);
    });

    it("should cleanup multi cleanups inside an effect when the web-component is unmount", async () => {
      window.mockEffect = mock(() => {});
      window.mockCleanup = mock(() => {});

      const code = `export default function Test({ }, { effect, cleanup }: any) {
        effect(async () => {
          mockEffect();
          cleanup(async () => window.mockCleanup());
          cleanup(async () => window.mockCleanup());
        });

        return <div />
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(window.mockEffect).toHaveBeenCalledTimes(1);
      expect(window.mockCleanup).toHaveBeenCalledTimes(0);

      testComponent.remove();

      expect(window.mockEffect).toHaveBeenCalledTimes(1);
      expect(window.mockCleanup).toHaveBeenCalledTimes(2);
    });

    it("should work with reactivity props in a SVG component", () => {
      const code = `export default function ColorSVG({ color1, color2, color3 }: any) {
        return (
          <svg width="12cm" height="12cm">
            <g style={{ fillOpacity: 0.7, stroke: "black", strokeWidth: "0.1cm" }}>
              <circle cx="6cm" cy="2cm" r="100" fill={color1} transform="translate(0,50)" />
              <circle cx="6cm" cy="2cm" r="100" fill={color2} transform="translate(70,150)" />
              <circle cx="6cm" cy="2cm" r="100" fill={color3} transform="translate(-70,150)" />
            </g>
          </svg>
        );
      }`;

      document.body.innerHTML = `
        <color-svg color1="#ff0000" color2="#00ff00" color3="#0000ff" />
      `;

      defineBrisaWebComponent(code, "src/web-components/color-svg.tsx");

      const colorSVG = document.querySelector("color-svg") as HTMLElement;

      colorSVG?.shadowRoot?.querySelectorAll("*").forEach((node) => {
        expect(node.namespaceURI).toBe("http://www.w3.org/2000/svg");
      });

      expect(colorSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7;stroke:black;stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" fill="#ff0000" transform="translate(0,50)"></circle><circle cx="6cm" cy="2cm" r="100" fill="#00ff00" transform="translate(70,150)"></circle><circle cx="6cm" cy="2cm" r="100" fill="#0000ff" transform="translate(-70,150)"></circle></g></svg>',
      );

      colorSVG.setAttribute("color1", "#0000ff");
      colorSVG.setAttribute("color2", "#ff0000");
      colorSVG.setAttribute("color3", "#00ff00");

      expect(colorSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7;stroke:black;stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" transform="translate(0,50)" fill="#0000ff"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(70,150)" fill="#ff0000"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(-70,150)" fill="#00ff00"></circle></g></svg>',
      );
    });

    it("should work reactivity if props that are written in camelCase", () => {
      const code = `export default function ColorSVG({ firstColor, secondColor, thirdColor }) {
        return (
          <svg width="12cm" height="12cm">
            <g style={{ fillOpacity: 0.7, stroke: "black", strokeWidth: "0.1cm" }}>
              <circle cx="6cm" cy="2cm" r="100" fill={firstColor} transform="translate(0,50)" />
              <circle cx="6cm" cy="2cm" r="100" fill={secondColor} transform="translate(70,150)" />
              <circle cx="6cm" cy="2cm" r="100" fill={thirdColor} transform="translate(-70,150)" />
            </g>
          </svg>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/color-svg.tsx");

      document.body.innerHTML = `<color-svg firstColor="#ff0000" secondColor="#00ff00" thirdColor="#0000ff" />`;

      const colorSVG = document.querySelector("color-svg") as HTMLElement;

      expect(colorSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7;stroke:black;stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" transform="translate(0,50)" fill="#ff0000"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(70,150)" fill="#00ff00"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(-70,150)" fill="#0000ff"></circle></g></svg>',
      );

      colorSVG.setAttribute("firstColor", "#0000ff");
      colorSVG.setAttribute("secondColor", "#ff0000");
      colorSVG.setAttribute("thirdColor", "#00ff00");

      expect(colorSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7;stroke:black;stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" transform="translate(0,50)" fill="#0000ff"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(70,150)" fill="#ff0000"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(-70,150)" fill="#00ff00"></circle></g></svg>',
      );
    });

    it("should SVG work with foreingObject setting correctly the namespace outside the foreingObject node", () => {
      const code = `export default function SVG() {
        return (
          <svg width="12cm" height="12cm">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml">test</div>
            </foreignObject>
          </svg>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-svg.tsx");
      document.body.innerHTML = "<test-svg />";

      const testSVG = document.querySelector("test-svg") as HTMLElement;
      const svg = testSVG?.shadowRoot?.querySelector("svg") as SVGElement;
      const foreignObject = testSVG?.shadowRoot?.querySelector(
        "foreignObject",
      ) as SVGElement;
      const div = testSVG?.shadowRoot?.querySelector("div") as HTMLElement;

      expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
      expect(foreignObject.namespaceURI).toBe("http://www.w3.org/2000/svg");
      expect(div.namespaceURI).toBe("http://www.w3.org/1999/xhtml");

      expect(testSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">test</div></foreignObject></svg>',
      );
    });

    it("should work a web-component that enables the addition, removal, and repositioning of items in a list", () => {
      const code = `export default function MagicList({ }, { state }) {
        const list = state(["some", "another"]);

        const addItem = (e: any) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          list.value = [...list.value, formData.get("item")];
        };

        const deleteItem = (index: number) => {
          list.value = list.value.filter((_: string, i: number) => i !== index);
        };

        const moveItemUp = (index: number) => {
          if (index === 0) return;
          const item = list.value[index];
          list.value = list.value.filter((_: string, i: number) => i !== index);
          list.value = [
            ...list.value.slice(0, index - 1),
            item,
            ...list.value.slice(index - 1),
          ];
        };

        return (
          <div>
            <form onSubmit={addItem}>
              <input name="item" id="item" placeholder="Add item" />
              <button>add</button>
            </form>
            <ul>
              {list.value.map((item: string, index: number) => (
                <li>
                  <button onClick={() => deleteItem(index)}>delete</button>
                  <button onClick={() => moveItemUp(index)}>move up</button>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/magic-list.tsx");
      document.body.innerHTML = "<magic-list />";

      const magicList = document.querySelector("magic-list") as HTMLElement;
      const form = magicList?.shadowRoot?.querySelector(
        "form",
      ) as HTMLFormElement;
      const input = magicList?.shadowRoot?.querySelector(
        "input",
      ) as HTMLInputElement;

      expect(magicList?.shadowRoot?.innerHTML).toBe(
        '<div><form><input name="item" id="item" placeholder="Add item"><button>add</button></form><ul><li><button>delete</button><button>move up</button>some</li><li><button>delete</button><button>move up</button>another</li></ul></div>',
      );

      // Adding a new item
      input.value = "test";
      form.dispatchEvent(new Event("submit"));
      expect(magicList?.shadowRoot?.innerHTML).toBe(
        '<div><form><input name="item" id="item" placeholder="Add item"><button>add</button></form><ul><li><button>delete</button><button>move up</button>some</li><li><button>delete</button><button>move up</button>another</li><li><button>delete</button><button>move up</button>test</li></ul></div>',
      );

      // Moving up the last item
      const moveUpButton = [
        ...(magicList?.shadowRoot?.querySelectorAll(
          "button",
        ) as NodeListOf<HTMLButtonElement>),
      ].at(-1) as HTMLButtonElement;
      moveUpButton.click();
      expect(magicList?.shadowRoot?.innerHTML).toBe(
        '<div><form><input name="item" id="item" placeholder="Add item"><button>add</button></form><ul><li><button>delete</button><button>move up</button>some</li><li><button>delete</button><button>move up</button>test</li><li><button>delete</button><button>move up</button>another</li></ul></div>',
      );

      // Deleting the last item
      const deleteLast = () =>
        (
          [
            ...(magicList?.shadowRoot?.querySelectorAll(
              "button",
            ) as NodeListOf<HTMLButtonElement>),
          ].at(-2) as HTMLButtonElement
        ).click();
      deleteLast();
      expect(magicList?.shadowRoot?.innerHTML).toBe(
        '<div><form><input name="item" id="item" placeholder="Add item"><button>add</button></form><ul><li><button>delete</button><button>move up</button>some</li><li><button>delete</button><button>move up</button>test</li></ul></div>',
      );

      // Deleting all items
      deleteLast();
      deleteLast();

      expect(magicList?.shadowRoot?.innerHTML).toBe(
        '<div><form><input name="item" id="item" placeholder="Add item"><button>add</button></form><ul></ul></div>',
      );
    });

    it("should reactively update the DOM after adding a new property to the web-component", () => {
      const code = `export default function Test({ count = 1 }: any) {
        return <div>{count}</div>
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>1</div>");

      testComponent.setAttribute("count", "2");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>2</div>");
    });

    it("should work multi conditionals renders", () => {
      const code = `export default function Test({ count }: any) {
        return (
          <div>
            {count === 1 ? <span>one</span> : count === 2 ? <span>two</span> : <span>three</span>}
          </div>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component count='1' />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><span>one</span></div>",
      );

      testComponent.setAttribute("count", "2");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><span>two</span></div>",
      );

      testComponent.setAttribute("count", "3");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><span>three</span></div>",
      );
    });

    it("should work nested conditionals renders", () => {
      const code = `export default function Test({ first, second, third }: any) {
        return (
          <div>
            {first === 1 ? (
              <div>
                {second === 2 ? (
                  <span>{third === 3 ? "test work" : "no-third"}</span>
                ) : (
                  "no-second"
                )}
              </div>
            ) : (
              "no-first"
            )}
          </div>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML =
        "<test-component first='1' second='2' third='3' />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><div><span>test work</span></div></div>",
      );

      testComponent.setAttribute("first", "2");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>no-first</div>");

      testComponent.setAttribute("first", "1");
      testComponent.setAttribute("second", "3");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><div>no-second</div></div>",
      );

      testComponent.setAttribute("second", "2");
      testComponent.setAttribute("third", "4");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><div><span>no-third</span></div></div>",
      );

      testComponent.setAttribute("third", "3");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><div><span>test work</span></div></div>",
      );
    });

    it("should allow async/await conditional renders from state", async () => {
      const code = `export default function Test({ }: any, { state }: any) {
        const first = state(1);
        const second = state(2);
        const third = state(3);

        return (
          <div onClick={() => second.value = 42}>
            {first.value === 1 ? (
              second.value === 2 ? (
                third.value === 3 ? (
                  "test work"
                ) : (
                  "no-third"
                )
              ) : (
                \`no-second \${second.value}\`
              )
              ): (
                "no-first"
              )
            }
          </div>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>test work</div>");

      (testComponent.shadowRoot?.firstChild as HTMLElement).click();

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div>no-second 42</div>",
      );
    });

    it("should allow async/await conditional renders from props", async () => {
      const code = `export default function Test({ first, second, third }: any) {
        return (
          <div>
          {(async () => {
            if (first === 1) {
              if (second === 2) {
                if (third === 3) {
                  return "test work";
                } else {
                  return "no-third";
                }
              } else {
                return "no-second";
              }
            } else {
              return "no-first";
            }
          })()}
          </div>
        );
      }`;

      document.body.innerHTML = "<test-async first='1' second='2' third='3' />";

      defineBrisaWebComponent(code, "src/web-components/test-async.tsx");

      const testComponent = document.querySelector("test-async") as HTMLElement;

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>test work</div>");

      testComponent.setAttribute("first", "2");

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>no-first</div>");

      testComponent.setAttribute("first", "1");
      testComponent.setAttribute("second", "3");

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>no-second</div>");

      testComponent.setAttribute("second", "2");
      testComponent.setAttribute("third", "4");

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>no-third</div>");

      await Bun.sleep(0);

      testComponent.setAttribute("third", "3");

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>test work</div>");
    });

    it("should be possible to create a collapsible content section with an accordion", () => {
      const code = `export default function Accordion({ }: any, { state }: any) {
        const active = state(0);

        return (
          <div>
            <button onClick={() => active.value = active.value === 0 ? 1 : 0}>toggle</button>
            <div style={{display: active.value === 0 ? "none" : "block"}} >content</div>
          </div>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/accordion-element.tsx");

      document.body.innerHTML = "<accordion-element />";

      const accordion = document.querySelector(
        "accordion-element",
      ) as HTMLElement;
      const button = accordion?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      expect(accordion?.shadowRoot?.innerHTML).toBe(
        '<div><button>toggle</button><div style="display:none;">content</div></div>',
      );

      button.click();

      expect(accordion?.shadowRoot?.innerHTML).toBe(
        '<div><button>toggle</button><div style="display:block;">content</div></div>',
      );

      button.click();

      expect(accordion?.shadowRoot?.innerHTML).toBe(
        '<div><button>toggle</button><div style="display:none;">content</div></div>',
      );
    });

    it("should display additional information on hover with a tooltip", () => {
      const code = `export default function Tooltip({ }, { state }: any) {
        const visible = state(false);

        return (
          <div>
            <span onMouseOver={() => visible.value = true} onMouseOut={() => visible.value = false} style={{position: "relative"}}>
              <span style={{position: "absolute", visibility: visible.value ? "visible" : "hidden"}} >Tooltip text</span>
              Hover over me
            </span>
          </div>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/tooltip-element.tsx");

      document.body.innerHTML = "<tooltip-element />";

      const tooltip = document.querySelector("tooltip-element") as HTMLElement;
      const span = tooltip?.shadowRoot?.querySelector(
        "span",
      ) as HTMLSpanElement;

      expect(tooltip?.shadowRoot?.innerHTML).toBe(
        '<div><span style="position:relative;"><span style="position:absolute;visibility:hidden;">Tooltip text</span>Hover over me</span></div>',
      );

      span.dispatchEvent(new Event("mouseover"));

      expect(tooltip?.shadowRoot?.innerHTML).toBe(
        '<div><span style="position:relative;"><span style="position:absolute;visibility:visible;">Tooltip text</span>Hover over me</span></div>',
      );

      span.dispatchEvent(new Event("mouseout"));

      expect(tooltip?.shadowRoot?.innerHTML).toBe(
        '<div><span style="position:relative;"><span style="position:absolute;visibility:hidden;">Tooltip text</span>Hover over me</span></div>',
      );
    });

    it("should work a conditional render with different web-components", () => {
      const wc1 = `export default function WebComponent1({ }, { state }: any) {
        const name = state("WebComponent1");

        return (
          <div onClick={() => name.value = "WebComponent1 updated"}>
            {name.value}
          </div>
        );
      }`;

      const wc2 = `export default function WebComponent2({ }, { state }: any) {
        const name = state("WebComponent2");

        return (
          <div onClick={() => name.value = "WebComponent2 updated"}>
            {name.value}
          </div>
        );
      }`;

      const parent = `export default function ParentWebComponent({ name }: any, { state }: any) {
        return (
          <>
            {name === "WebComponent1" ? <web-component-1 /> : <web-component-2 />}
          </>
        );
      }`;

      defineBrisaWebComponent(wc1, "src/web-components/web-component-1.tsx");
      defineBrisaWebComponent(wc2, "src/web-components/web-component-2.tsx");
      defineBrisaWebComponent(
        parent,
        "src/web-components/parent-web-component.tsx",
      );
      document.body.innerHTML = '<parent-web-component name="WebComponent1" />';

      const parentWebComponent = document.querySelector(
        "parent-web-component",
      ) as HTMLElement;
      const firstWebComponent = parentWebComponent?.shadowRoot?.querySelector(
        "web-component-1",
      ) as HTMLElement;
      const firstDiv = firstWebComponent?.shadowRoot?.querySelector(
        "div",
      ) as HTMLElement;

      // The first component should be mounted
      expect(parentWebComponent?.shadowRoot?.innerHTML).toBe(
        "<web-component-1></web-component-1>",
      );
      expect(firstWebComponent?.shadowRoot?.innerHTML).toBe(
        "<div>WebComponent1</div>",
      );

      // The first component should be updated
      firstDiv.click();
      expect(firstWebComponent?.shadowRoot?.innerHTML).toBe(
        "<div>WebComponent1 updated</div>",
      );

      // Changing the conditional render on the parent component
      parentWebComponent.setAttribute("name", "WebComponent2");
      const secondWebComponent = parentWebComponent?.shadowRoot?.querySelector(
        "web-component-2",
      ) as HTMLElement;
      const secondDiv = secondWebComponent?.shadowRoot?.querySelector(
        "div",
      ) as HTMLElement;

      // The second component should be mounted
      expect(parentWebComponent?.shadowRoot?.innerHTML).toBe(
        "<web-component-2></web-component-2>",
      );
      expect(secondWebComponent?.shadowRoot?.innerHTML).toBe(
        "<div>WebComponent2</div>",
      );

      // The second component should be updated
      secondDiv.click();
      expect(secondWebComponent?.shadowRoot?.innerHTML).toBe(
        "<div>WebComponent2 updated</div>",
      );

      // Changing the conditional render on the parent component again to the first component
      parentWebComponent.setAttribute("name", "WebComponent1");
      const firstComponent = parentWebComponent?.shadowRoot?.querySelector(
        "web-component-1",
      ) as HTMLElement;

      // The first component should be unmounted and the state should be reset
      expect(parentWebComponent?.shadowRoot?.innerHTML).toBe(
        "<web-component-1></web-component-1>",
      );
      expect(firstComponent?.shadowRoot?.innerHTML).toBe(
        "<div>WebComponent1</div>",
      );
    });

    it('should open/close a dialog with the "open" attribute', () => {
      const code = `export default function Dialog({ }, { state }: any) {
        const open = state(false);

        return (
          <div>
            <button onClick={() => open.value = true}>open</button>
            <dialog open={open.value} onClick={() => open.value = false}>dialog</dialog>
          </div>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/dialog-element.tsx");
      document.body.innerHTML = "<dialog-element />";

      const dialog = document.querySelector("dialog-element") as HTMLElement;
      const button = dialog?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;
      const dialogElement = dialog?.shadowRoot?.querySelector(
        "dialog",
      ) as HTMLDialogElement;

      expect(dialog?.shadowRoot?.innerHTML).toBe(
        "<div><button>open</button><dialog>dialog</dialog></div>",
      );

      button.click();

      expect(dialog?.shadowRoot?.innerHTML).toBe(
        '<div><button>open</button><dialog open="">dialog</dialog></div>',
      );

      dialogElement.click();

      expect(dialog?.shadowRoot?.innerHTML).toBe(
        "<div><button>open</button><dialog>dialog</dialog></div>",
      );
    });

    it("should work an open attribute in a dialog composed with and expression", () => {
      const code = `
      type RuntimeLogProps = {
        error: { stack: string, message: string };
        warning: string;
      }
      
      export default function RuntimeLog({ error, warning }: RuntimeLogProps) {
        return (
          <dialog open={error || warning}>
            {error && <>{\`Error: \${error.message}\`}<pre>{error.stack}</pre></>}
            {warning && \`Warning: \${warning}\`}
          </dialog>
        )
      }      
      `;

      defineBrisaWebComponent(code, "src/web-components/runtime-log.tsx");

      document.body.innerHTML = "<runtime-log />";

      const runtimeLog = document.querySelector("runtime-log") as HTMLElement;

      expect(runtimeLog?.shadowRoot?.innerHTML).toBe("<dialog></dialog>");

      runtimeLog.setAttribute(
        "error",
        "{ 'stack': 'stack', 'message': 'message' }",
      );

      expect(runtimeLog?.shadowRoot?.innerHTML).toBe(
        '<dialog open="">Error: message<pre>stack</pre></dialog>',
      );

      runtimeLog.removeAttribute("error");

      expect(runtimeLog?.shadowRoot?.innerHTML).toBe("<dialog></dialog>");

      runtimeLog.setAttribute("warning", "warning");

      expect(runtimeLog?.shadowRoot?.innerHTML).toBe(
        '<dialog open="">Warning: warning</dialog>',
      );

      runtimeLog.removeAttribute("warning");

      expect(runtimeLog?.shadowRoot?.innerHTML).toBe("<dialog></dialog>");
    });

    it("should work an open attribute in a dialog composed with and expression", () => {
      const code = `
      type RuntimeLogProps = {
        error: { stack: string, message: string };
        warning: string;
      }
      
      export default function RuntimeLog({ error, warning }: RuntimeLogProps) {
        return (
          <dialog open={error || warning}>
            {error ? <>{\`Error: \${error.message}\`}<pre>{error.stack}</pre></> : ''}
            {warning ? \`Warning: \${warning}\` : ''}
          </dialog>
        )
      }      
      `;
      defineBrisaWebComponent(code, "src/web-components/runtime-log.tsx");

      document.body.innerHTML = "<runtime-log />";
      const runtimeLog = document.querySelector("runtime-log") as HTMLElement;

      expect(runtimeLog?.shadowRoot?.innerHTML).toBe("<dialog></dialog>");

      runtimeLog.setAttribute(
        "error",
        '{ "stack": "stack", "message": "message" }',
      );

      expect(runtimeLog?.shadowRoot?.innerHTML).toBe(
        '<dialog open="">Error: message<pre>stack</pre></dialog>',
      );

      runtimeLog.removeAttribute("error");

      expect(runtimeLog?.shadowRoot?.innerHTML).toBe("<dialog></dialog>");

      runtimeLog.setAttribute("warning", "warning");

      expect(runtimeLog?.shadowRoot?.innerHTML).toBe(
        '<dialog open="">Warning: warning</dialog>',
      );

      runtimeLog.removeAttribute("warning");

      expect(runtimeLog?.shadowRoot?.innerHTML).toBe("<dialog></dialog>");
    });

    it("should props be reactive returning the prop", () => {
      const code = `
        function Component({ name }) {
          return name
        }

        export default Component;
      `;

      defineBrisaWebComponent(code, "src/web-components/my-component.tsx");

      document.body.innerHTML = "<my-component name='Aral' />";

      const component = document.querySelector("my-component") as HTMLElement;

      expect(component?.shadowRoot?.innerHTML).toBe("Aral");

      component.setAttribute("name", "Barbara");

      expect(component?.shadowRoot?.innerHTML).toBe("Barbara");
    });

    it("should props be reactive returning the prop in async component", async () => {
      const code = `
        async function Component({ name }) {
          return name
        }

        export default Component;
      `;

      defineBrisaWebComponent(code, "src/web-components/my-component.tsx");

      document.body.innerHTML = "<my-component name='Aral' />";

      await Bun.sleep(0);

      const component = document.querySelector("my-component") as HTMLElement;

      expect(component?.shadowRoot?.innerHTML).toBe("Aral");

      component.setAttribute("name", "Barbara");

      expect(component?.shadowRoot?.innerHTML).toBe("Barbara");
    });

    it("should props be reactive returning an string", () => {
      const code = `
        function Component({ name }) {
          return 'Hello world ' + name
        }

        export default Component;
      `;

      defineBrisaWebComponent(code, "src/web-components/my-component.tsx");

      document.body.innerHTML = "<my-component name='Aral' />";

      const component = document.querySelector("my-component") as HTMLElement;

      expect(component?.shadowRoot?.innerHTML).toBe("Hello world Aral");

      component.setAttribute("name", "Barbara");

      expect(component?.shadowRoot?.innerHTML).toBe("Hello world Barbara");
    });

    it("should props be reactive returning an string in async component", async () => {
      const code = `
        async function Component({ name }) {
          return 'Hello world ' + name
        }

        export default Component;
      `;

      defineBrisaWebComponent(code, "src/web-components/my-component.tsx");

      document.body.innerHTML = "<my-component name='Aral' />";

      const component = document.querySelector("my-component") as HTMLElement;

      await Bun.sleep(0);

      expect(component?.shadowRoot?.innerHTML).toBe("Hello world Aral");

      component.setAttribute("name", "Barbara");

      expect(component?.shadowRoot?.innerHTML).toBe("Hello world Barbara");
    });

    it("should serialize the props consuming another web-component", () => {
      const testComp = `export default function Test({ }) {
        return <web-component user={{ name: "Aral" }} />;
      }`;

      const wc = `export default function WebComponent({ user }) {
        return <div>{user.name}</div>;
      }`;

      defineBrisaWebComponent(
        testComp,
        "src/web-components/test-component.tsx",
      );
      defineBrisaWebComponent(wc, "src/web-components/web-component.tsx");

      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;
      const webComponent = testComponent?.shadowRoot?.querySelector(
        "web-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        `<web-component user="{'name':'Aral'}"></web-component>`,
      );
      expect(webComponent?.shadowRoot?.innerHTML).toBe(`<div>Aral</div>`);

      webComponent.setAttribute("user", serialize({ name: "Barbara" }));

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        `<web-component user="{'name':'Barbara'}"></web-component>`,
      );
      expect(webComponent?.shadowRoot?.innerHTML).toBe(`<div>Barbara</div>`);
    });

    it("should work with booleans and numbers in the same way than React", () => {
      const code = `export default ({ }, { h }: any) => (
        <>
          {true && <div>TRUE</div>}
          {false && <div>FALSE</div>}
          {1 && <div>TRUE</div>}
          {0 && <div>FALSE</div>}
        </>
      )`;

      defineBrisaWebComponent(code, "src/web-components/bool-component.tsx");

      document.body.innerHTML = "<bool-component />";
      const boolComponent = document.querySelector(
        "bool-component",
      ) as HTMLElement;

      expect(boolComponent?.shadowRoot?.innerHTML).toBe(
        "<div>TRUE</div><div>TRUE</div>0",
      );
    });

    it("should work with booleans and numbers from props in the same way than React", () => {
      const code = `const Component = ({ first, second, third, fourth }) => (
        <>
          {first && <div>TRUE</div>}
          {second && <div>FALSE</div>}
          {third && <div>TRUE</div>}
          {fourth && <div>FALSE</div>}
        </>
      );

      export default Component;`;

      defineBrisaWebComponent(code, "src/web-components/bool-component.tsx");

      document.body.innerHTML =
        "<bool-component first='true' second='false' third='1' fourth='0' />";
      const boolComponent = document.querySelector(
        "bool-component",
      ) as HTMLElement;

      expect(boolComponent?.shadowRoot?.innerHTML).toBe(
        "<div>TRUE</div><div>TRUE</div>0",
      );
    });

    it("should be possible to render undefined and null", () => {
      const code = `export default () => (
        <> 
          <div class="empty">{undefined}</div>
          <div class="empty">{null}</div>
        </>
      );`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";
      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div class="empty"></div><div class="empty"></div>',
      );
    });

    it("should not be possible to inject HTML as string directly", () => {
      const code = `export default () => (
        <>
          {'<script>alert("test")</script>'}
        </>
      );`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<script>alert("test")</script>',
      );

      const script = document.querySelector("script");

      expect(script).toBeNull();
      expect(
        testComponent?.shadowRoot?.firstChild?.nodeType === Node.TEXT_NODE,
      ).toBeTruthy();
    });

    it("should handle keyboard events", () => {
      window.mockAlert = mock((s: string) => {});
      const code = `export default () => <input onKeyDown={() => window.mockAlert("Enter to onKeyDown")} />;`;

      defineBrisaWebComponent(code, "src/web-components/keyboard-events.tsx");
      document.body.innerHTML = "<keyboard-events />";

      const keyboardEventEl = document.querySelector(
        "keyboard-events",
      ) as HTMLElement;

      expect(keyboardEventEl?.shadowRoot?.innerHTML).toBe("<input>");

      const input = keyboardEventEl?.shadowRoot?.querySelector(
        "input",
      ) as HTMLInputElement;

      input.dispatchEvent(new KeyboardEvent("keydown"));

      expect(keyboardEventEl?.shadowRoot?.innerHTML).toBe("<input>");
      expect(window.mockAlert).toHaveBeenCalledTimes(1);
      expect(window.mockAlert.mock.calls[0][0]).toBe("Enter to onKeyDown");
    });

    it("should handle asynchronous updates", async () => {
      const code = `
      const fetchData = () =>
        Promise.resolve({ json: () => Promise.resolve({ name: "Barbara" }) });

      const Component = ({ }, { state }: any) => {
        const user = state({ name: "Aral" });

        return (
          <>
            <button onClick={async () => {
              const response = await fetchData();
              user.value = await response.json();
            }}>fetch</button>
            <div>{user.value.name}</div>
          </>
        );
      };

      export default Component;
      `;

      defineBrisaWebComponent(code, "src/web-components/async-updates.tsx");
      document.body.innerHTML = "<async-updates />";

      const asyncUpdatesComp = document.querySelector(
        "async-updates",
      ) as HTMLElement;

      expect(asyncUpdatesComp?.shadowRoot?.innerHTML).toBe(
        "<button>fetch</button><div>Aral</div>",
      );

      const button = asyncUpdatesComp?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      button.click();

      expect(asyncUpdatesComp?.shadowRoot?.innerHTML).toBe(
        "<button>fetch</button><div>Aral</div>",
      );

      await Bun.sleep(0);

      expect(asyncUpdatesComp?.shadowRoot?.innerHTML).toBe(
        "<button>fetch</button><div>Barbara</div>",
      );
    });

    it("should update all items from a list consuming the same state signal at the same time", () => {
      const code = `const Component = ({ }, { state }: any) => {
        const list = state(["one", "two", "three"]);

        return (
          <>
            <button onClick={() => {
              list.value = list.value.map((item: string) => item.toUpperCase());
            }}>uppercase</button>
            <ul>{list.value.map((item: string) => <li>{item}</li>)}</ul>
          </>
        );
      };

      export default Component;`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<button>uppercase</button><ul><li>one</li><li>two</li><li>three</li></ul>",
      );

      const button = testComponent?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      button.click();

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<button>uppercase</button><ul><li>ONE</li><li>TWO</li><li>THREE</li></ul>",
      );
    });

    it("should be possible to update a rendered DOM element after mount via ref", async () => {
      // Is not a good practice but is just for testing
      const code = `export default ({ }, { onMount, state }: any) => {
        const ref = state(null);

        onMount(() => {
          ref.value.innerHTML = "test";
        });

        return <div ref={ref}>original</div>;
      };`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>original</div>");

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>test</div>");
    });

    it("should be possible to execute different onMount callbacks", async () => {
      window.mockFirstCallback = mock((s: string) => {});
      window.mockSecondCallback = mock((s: string) => {});

      const code = `export default ({ }, { onMount }: any) => {
        onMount(() => {
          window.mockFirstCallback("first");
        });
        onMount(() => {
          window.mockSecondCallback("second");
        });

        return null
      };`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      await Bun.sleep(0);

      expect(window.mockFirstCallback).toHaveBeenCalledTimes(1);
      expect(window.mockFirstCallback.mock.calls[0][0]).toBe("first");
      expect(window.mockSecondCallback).toHaveBeenCalledTimes(1);
      expect(window.mockSecondCallback.mock.calls[0][0]).toBe("second");
    });

    it("should cleanup an event registered on onMount when the component is unmounted", async () => {
      window.mockCallback = mock((s: string) => {});

      const code = `export default ({}, { onMount, cleanup,  }: any) => {
        onMount(() => {
          const onClick = () => window.mockCallback("click");
          document.addEventListener("click", onClick);

          cleanup(() => {
            document.removeEventListener("click", onClick);
          });
        });

        return null
      };`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";

      await Bun.sleep(0);

      expect(window.mockCallback).toHaveBeenCalledTimes(0);

      document.dispatchEvent(new Event("click"));

      expect(window.mockCallback).toHaveBeenCalledTimes(1);

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      testComponent.remove();

      document.dispatchEvent(new Event("click"));

      expect(window.mockCallback).toHaveBeenCalledTimes(1);
    });

    it("should cleanup on unmount if a cleanup callback is registered in the root of the component", () => {
      window.mockCallback = mock((s: string) => {});

      const code = `export default ({ }, { cleanup }: any) => {
        cleanup(() => {
          window.mockCallback("cleanup");
        });

        return null;
      };`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      testComponent.remove();

      expect(window.mockCallback).toHaveBeenCalledTimes(1);
      expect(window.mockCallback.mock.calls[0][0]).toBe("cleanup");
    });

    it("should cleanup on unmount if a cleanup callback is registered in a nested component", () => {
      window.mockCallback = mock((s: string) => {});
      const testComp = `export default ({ }, { cleanup }: any) => {
        cleanup(() => window.mockCallback("cleanup"));
        return null;
      };`;

      const parentComp = `export default () => <test-component />;`;

      defineBrisaWebComponent(
        testComp,
        "src/web-components/test-component.tsx",
      );
      defineBrisaWebComponent(
        parentComp,
        "src/web-components/parent-component.tsx",
      );
      document.body.innerHTML = "<parent-component />";

      const parentComponent = document.querySelector(
        "parent-component",
      ) as HTMLElement;

      parentComponent.remove();

      expect(window.mockCallback).toHaveBeenCalledTimes(1);
      expect(window.mockCallback.mock.calls[0][0]).toBe("cleanup");
    });

    it("should keep reactivity when a prop has default value", () => {
      const code = `export default ({ name = "Aral" }) => <div>{name}</div>;`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "Barbara");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Barbara</div>");

      testComponent.removeAttribute("name");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");
    });

    it("should be possible to use derived to default props with || operator", () => {
      const code = `export default ({ name }, { derived }) => {
        const superName = derived(() => name || "Aral");
        return <div>{superName.value}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "Barbara");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Barbara</div>");

      testComponent.setAttribute("name", "");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");
    });

    it("should be possible to use derived to default props with || operator and props object", () => {
      const code = `export default (props, { derived }) => {
        const superName = derived(() => props.name || "Aral");
        return <div>{superName.value}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "Barbara");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Barbara</div>");

      testComponent.setAttribute("name", "");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");
    });

    it("should be possible to use derived to default props with ?? operator", () => {
      const code = `export default ({ name }, { derived }) => {
        const superName = derived(() => name ?? "Aral");
        return <div>{superName.value}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "Barbara");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Barbara</div>");

      testComponent.setAttribute("name", "");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div></div>");

      testComponent.removeAttribute("name");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");
    });

    it("should be possible to use derived to default props with ?? operator and props object", () => {
      const code = `export default (props, { derived }) => {
        const superName = derived(() => props.name ?? "Aral");
        return <div>{superName.value}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "Barbara");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Barbara</div>");

      testComponent.setAttribute("name", "");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div></div>");

      testComponent.removeAttribute("name");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");
    });

    it("should LOSE REACTIVITY trying a default prop in a variable without derived and || operator", () => {
      const code = `export default ({ name }) => {
        const superName = name || "Aral";
        return <div>{superName}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "Barbara");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");
    });

    it("should LOSE REACTIVITY trying a default prop in a variable without derived and || operator and props object", () => {
      const code = `export default (props) => {
        const superName = props.name || "Aral";
        return <div>{superName}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "Barbara");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");
    });

    it("should LOSE REACTIVITY trying a default prop in a variable without derived and ?? operator", () => {
      const code = `export default ({ name }) => {
        const superName = name ?? "Aral";
        return <div>{superName}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "Barbara");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.removeAttribute("name");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");
    });

    it("should LOSE REACTIVITY trying a default prop in a variable without derived and ?? operator and props object", () => {
      const code = `export default (props) => {
        const superName = props.name ?? "Aral";
        return <div>{superName}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "Barbara");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.removeAttribute("name");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");
    });

    it("should be possible to use dangerHTML to render HTML as string directly", () => {
      const code = `
      export default () => {
        return <div>{dangerHTML('<script>alert("test")</script>')}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div><script>alert("test")</script></div>',
      );

      const script = testComponent?.shadowRoot?.querySelector("script");

      expect(script).toBeDefined();
    });

    it("should be reactive returning a conditional early return", () => {
      const code = `export default ({ name }) => {
        if (name === "Aral") {
          return <b>Aral</b>;
        }

        return <b>Barbara</b>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component name='Aral' />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<b>Aral</b>");

      testComponent.setAttribute("name", "Barbara");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<b>Barbara</b>");
    });

    it("should be reactive returning a conditional expression", () => {
      const code = `export default ({ name }) => {
        return name === "Aral" ? <b>Aral</b> : <b>Barbara</b>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component name='Aral' />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<b>Aral</b>");

      testComponent.setAttribute("name", "Barbara");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<b>Barbara</b>");
    });

    it("should be reactive with a switch statement", () => {
      const code = `export default ({ name }) => {
        switch (name) {
          case "Aral":
            return <b>Aral</b>;
          case "Barbara":
            return <b>Barbara</b>;
          default:
            return <b>Default</b>;
        }
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component name='Aral' />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<b>Aral</b>");

      testComponent.setAttribute("name", "Barbara");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<b>Barbara</b>");

      testComponent.setAttribute("name", "Default");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<b>Default</b>");
    });

    it("should work reactivity returning a variable", () => {
      const code = `
        const example = ['a', 'b', 'c'];

        export default function Component({ propName }, { derived }) {
          const element = derived(
            () => propName === 'a' ? example.map(item => <b>{item}</b>) : example
          );
        
          return element.value;
        }
      `;
      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component propName='a' />";
      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<b>a</b><b>b</b><b>c</b>",
      );

      testComponent.setAttribute("propName", "b");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("abc");

      testComponent.setAttribute("propName", "a");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<b>a</b><b>b</b><b>c</b>",
      );
    });

    it("should be possible to set default props from ...rest inside code", () => {
      const code = `
      export default function MyComponent({ foo, ...rest }, {derived}) {
        const user = derived(() => rest.user ?? { name: 'No user'});
        return <div>{user.name}</div>
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component foo='bar' />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>No user</div>");

      testComponent.setAttribute("user", "{ 'name': 'Aral' }");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");
    });

    it("should work reactivity with a portal (createPortal) and a prop", () => {
      const code = `
      export default function Component({ name }) {
        return createPortal(
          <div>{name}</div>,
          document.body
        );
      }
      `;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component name='Aral' />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("");
      expect(document.body.innerHTML).toBe(
        '<test-component name="Aral"></test-component><div>Aral</div>',
      );

      testComponent.setAttribute("name", "Barbara");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("");
      expect(document.body.innerHTML).toBe(
        '<test-component name="Barbara"></test-component><div>Barbara</div>',
      );
    });

    it('should work reactivity with a mix between "createPortal" and "dangerHTML"', () => {
      const code = `
      export default function Component({ name }) {
        return createPortal(
          dangerHTML(\`<div>\${name}</div>\`),
          document.body
        );
      }
      `;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component name='Aral' />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("");
      expect(document.body.innerHTML).toBe(
        '<test-component name="Aral"></test-component><div>Aral</div>',
      );

      testComponent.setAttribute("name", "Barbara");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("");
      expect(document.body.innerHTML).toBe(
        '<test-component name="Barbara"></test-component><div>Barbara</div>',
      );
    });

    it('should open/close a modal with "createPortal", creating/removing the DOM element', () => {
      const code = `
      export default function Component({ }, { state }) {
        const open = state(false);

        return (
          <>
            <button onClick={() => open.value = !open.value}>{open.value ? 'close' : 'open' }</button>
            {open.value && createPortal(<div>modal</div>, document.body)}
          </>
        );
      }
      `;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";
      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<button>open</button>",
      );
      expect(document.body.innerHTML).toBe("<test-component></test-component>");

      const button = testComponent?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      button.click();

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<button>close</button>",
      );
      expect(document.body.innerHTML).toBe(
        "<test-component></test-component><div>modal</div>",
      );

      button.click();

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<button>open</button>",
      );

      expect(document.body.innerHTML).toBe("<test-component></test-component>");
    });

    it("should open/close text content creating/removing the DOM element", () => {
      const code = `
      export default function Component({ }, { state }) {
        const open = state(false);

        return (
          <>
            <button onClick={() => open.value = !open.value}>{open.value ? 'close' : 'open' }</button>
            {open.value && <div>content</div>}
          </>
        );
      }
      `;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";
      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<button>open</button>",
      );

      const button = testComponent?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      button.click();

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<button>close</button><div>content</div>",
      );

      button.click();

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<button>open</button>",
      );
    });

    it("should call the inner signal only when the signal exists", async () => {
      window.mockSignalParent = mock((s: string) => true);
      window.mockSignalChild = mock((s: string) => "");

      const code = `
        export default function Component({ user }) {
          return (
            <>
             {window.mockSignalParent() && user ? <b>{window.mockSignalChild() || user.name}</b> : 'EMPTY'}
            </>
          )
        }
      `;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";

      expect(window.mockSignalParent).toHaveBeenCalledTimes(1);
      expect(window.mockSignalChild).toHaveBeenCalledTimes(0);

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("EMPTY");

      testComponent.setAttribute("user", "{ 'name': 'Aral' }");

      expect(window.mockSignalParent).toHaveBeenCalledTimes(2);
      expect(window.mockSignalChild).toHaveBeenCalledTimes(1);

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<b>Aral</b>");

      testComponent.removeAttribute("user");

      expect(window.mockSignalParent).toHaveBeenCalledTimes(3);
      expect(window.mockSignalChild).toHaveBeenCalledTimes(1);

      expect(testComponent?.shadowRoot?.innerHTML).toBe("EMPTY");
    });

    it("should call the inner signal only when the signal exists with two && nested operators", async () => {
      window.mockSignalParent = mock((s: string) => true);
      window.mockSignalChild = mock((s: string) => true);
      window.mockSignalGrandChild = mock((s: string) => true);

      const code = `
        export default function Component({ user }) {
          return (
            <>
             {window.mockSignalParent() && user 
              ? <div>
                {
                window.mockSignalChild() && user.emails
                 ? <b>{window.mockSignalGrandChild() && user.emails[0]}</b>
                 : 'NO EMAIL'
                }</div>
              : 'EMPTY'
            }
            </>
          )
        }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component />";

      expect(window.mockSignalParent).toHaveBeenCalledTimes(1);
      expect(window.mockSignalChild).toHaveBeenCalledTimes(0);
      expect(window.mockSignalGrandChild).toHaveBeenCalledTimes(0);

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("EMPTY");

      testComponent.setAttribute(
        "user",
        "{ 'emails': ['contact@aralroca.com'] }",
      );

      expect(window.mockSignalParent).toHaveBeenCalledTimes(2);
      expect(window.mockSignalChild).toHaveBeenCalledTimes(1);
      expect(window.mockSignalGrandChild).toHaveBeenCalledTimes(1);
      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><b>contact@aralroca.com</b></div>",
      );

      testComponent.removeAttribute("user");

      expect(window.mockSignalParent).toHaveBeenCalledTimes(3);
      expect(window.mockSignalChild).toHaveBeenCalledTimes(1);
      expect(window.mockSignalGrandChild).toHaveBeenCalledTimes(1);
      expect(testComponent?.shadowRoot?.innerHTML).toBe("EMPTY");

      testComponent.setAttribute("user", "{ 'name': 'Aral' }");

      expect(window.mockSignalParent).toHaveBeenCalledTimes(4);
      expect(window.mockSignalChild).toHaveBeenCalledTimes(2);
      expect(window.mockSignalGrandChild).toHaveBeenCalledTimes(1);
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>NO EMAIL</div>");
    });

    it("should unregister cleanup when is inside an effect with a condition, starting as true", () => {
      window.mockCallback = mock((s: string) => {});
      window.mockCallbackCleanup = mock((s: string) => {});

      const code = `
        export default function Component({ foo }, { effect, cleanup }) {
          effect(() => {
            if(foo) {
              const onClick = () => window.mockCallback("click");
              document.addEventListener("click", onClick);

              cleanup(() => {
                window.mockCallbackCleanup("cleanup");
                document.removeEventListener("click", onClick);
              });
            }
          });

          return <div>{foo ?? 'no value'}</div>;
        };
      `;

      defineBrisaWebComponent(
        code,
        "src/web-components/unregister-cleanup.tsx",
      );

      document.body.innerHTML =
        '<unregister-cleanup foo="some"></unregister-cleanup>';

      const testComponent = document.querySelector(
        "unregister-cleanup",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>some</div>");

      expect(window.mockCallback).toHaveBeenCalledTimes(0);

      document.dispatchEvent(new Event("click"));

      expect(window.mockCallback).toHaveBeenCalledTimes(1);

      testComponent.removeAttribute("foo");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>no value</div>");
      expect(window.mockCallbackCleanup).toHaveBeenCalledTimes(1);

      document.dispatchEvent(new Event("click"));

      expect(window.mockCallback).toHaveBeenCalledTimes(1);
    });

    it("should unregister cleanup when is inside an effect with a condition, starting as false", () => {
      window.mockCallback = mock((s: string) => {});
      window.mockCallbackCleanup = mock((s: string) => {});

      const code = `
        export default function Component({ foo }, { effect, cleanup }) {
          effect(() => {
            if(foo) {
              const onClick = () => window.mockCallback("click");
              document.addEventListener("click", onClick);

              cleanup(() => {
                window.mockCallbackCleanup("cleanup");
                document.removeEventListener("click", onClick);
              });
            }
          });

          return <div>{foo ?? 'no value'}</div>;
        };
      `;

      defineBrisaWebComponent(
        code,
        "src/web-components/unregister-cleanup.tsx",
      );

      document.body.innerHTML = "<unregister-cleanup></unregister-cleanup>";

      const testComponent = document.querySelector(
        "unregister-cleanup",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>no value</div>");

      expect(window.mockCallback).toHaveBeenCalledTimes(0);

      document.dispatchEvent(new Event("click"));

      expect(window.mockCallback).toHaveBeenCalledTimes(0);

      testComponent.setAttribute("foo", "some");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>some</div>");

      document.dispatchEvent(new Event("click"));

      expect(window.mockCallback).toHaveBeenCalledTimes(1);

      testComponent.removeAttribute("foo");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>no value</div>");
      expect(window.mockCallbackCleanup).toHaveBeenCalledTimes(1);

      document.dispatchEvent(new Event("click"));

      expect(window.mockCallback).toHaveBeenCalledTimes(1);
    });

    it("should execute again the effect if is updated during effect registration", () => {
      window.mockEffect = mock((s: string) => {});

      const code = `
        export default function Component({}, { state, effect }) {
          const a = state<number>(0);
          const b = state<string>("x");

          effect(() => {
            if (a.value === 1) {
              effect(() => mockEffect("B", b.value));
            }
            mockEffect("A", a.value);
            a.value = 1;
          });
  
          return null;
        };
      `;

      document.body.innerHTML = "<unregister-subeffect></unregister-subeffect>";

      defineBrisaWebComponent(
        code,
        "src/web-components/unregister-subeffect.tsx",
      );

      expect(window.mockEffect).toHaveBeenCalledTimes(3);
      expect(window.mockEffect.mock.calls[0]).toEqual(["A", 0]);
      expect(window.mockEffect.mock.calls[1]).toEqual(["B", "x"]);
      expect(window.mockEffect.mock.calls[2]).toEqual(["A", 1]);
    });

    it("should unregister sub-effects", () => {
      window.mockEffect = mock((s: string) => {});

      const code = `
        export default function Component({}, { state, effect }) {
          const a = state<number>(0);
          const b = state<string>("x");

          effect(() => {
            if (a.value !== 1) return

            effect(() => {
              mockEffect("B", b.value)
              if(b.value === 'z') effect(() => mockEffect("C", b.value));
            });
          });

          a.value = 1;
          b.value = 'y';
          b.value = 'z';
          b.value = 'y';
          a.value = 2;
          b.value = 'z';
  
          return null;
        };
      `;

      document.body.innerHTML = "<unregister-subeffect></unregister-subeffect>";

      defineBrisaWebComponent(
        code,
        "src/web-components/unregister-subeffect.tsx",
      );

      expect(window.mockEffect).toHaveBeenCalledTimes(5);
      expect(window.mockEffect.mock.calls[0]).toEqual(["B", "x"]);
      expect(window.mockEffect.mock.calls[1]).toEqual(["B", "y"]);
      expect(window.mockEffect.mock.calls[2]).toEqual(["B", "z"]);
      expect(window.mockEffect.mock.calls[3]).toEqual(["C", "z"]);
      expect(window.mockEffect.mock.calls[4]).toEqual(["B", "y"]);
    });

    it("should be possible to return an array and keep the reactivity", () => {
      const userInfoCode = `
          export default function UserInfo() {
            return (
              <user-images
                urls={["some-image.jpg", "another-url.jpg"]}
                width={300}
                height={300}
              />
            );
          }
        `;
      const userImagesCode = `
          export default function UserImages({ urls, width, height }) {
            return urls.map((imageUrl) => (
              <img
                class="avatar"
                src={imageUrl}
                width={width}
                height={height}
              />
            ));
          }
        `;

      defineBrisaWebComponent(userInfoCode, "src/web-components/user-info.tsx");

      defineBrisaWebComponent(
        userImagesCode,
        "src/web-components/user-images.tsx",
      );

      document.body.innerHTML = "<user-info />";

      const userInfo = document.querySelector("user-info") as HTMLElement;

      const userImages = userInfo?.shadowRoot?.querySelector(
        "user-images",
      ) as HTMLElement;

      expect(userImages?.shadowRoot?.innerHTML).toBe(
        '<img class="avatar" src="some-image.jpg" width="300" height="300"><img class="avatar" src="another-url.jpg" width="300" height="300">',
      );

      userImages.setAttribute("urls", "['foo.jpg', 'bar.jpg', 'baz.jpg']");

      expect(userImages?.shadowRoot?.innerHTML).toBe(
        '<img class="avatar" src="foo.jpg" width="300" height="300"><img class="avatar" src="bar.jpg" width="300" height="300"><img class="avatar" src="baz.jpg" width="300" height="300">',
      );
    });

    it('should unmount and mount again when the attribute "key" changes', async () => {
      window.mockMount = mock((s: string) => {});
      const code = `
        export default function Component({ key }, { onMount }) {
          onMount(() => window.mockMount(key));
          return <div>{key}</div>;
        }
      `;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component key='1' />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>1</div>");

      await Bun.sleep(0);
      expect(window.mockMount).toHaveBeenCalledTimes(1);
      expect(window.mockMount.mock.calls[0][0]).toBe(1);

      testComponent.setAttribute("key", "2");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>2</div>");

      await Bun.sleep(0);
      expect(window.mockMount).toHaveBeenCalledTimes(2);
      expect(window.mockMount.mock.calls[1][0]).toBe(2);
    });

    it('should reset the state when the attribute "key" changes', () => {
      window.mockMount = mock((s: string) => {});
      const code = `
        export default function Component({}, {state }) {
          const count = state(0);
          return <div onClick={() => count.value++}>{count.value}</div>;
        }
      `;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      document.body.innerHTML = "<test-component key='1' />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      const div = testComponent?.shadowRoot?.querySelector("div");

      expect(div?.innerHTML).toBe("0");

      div?.click();

      expect(div?.innerHTML).toBe("1");

      testComponent.setAttribute("key", "2");

      const newDiv = testComponent?.shadowRoot?.querySelector("div");

      expect(newDiv?.innerHTML).toBe("0");
    });

    it('should render over a template with shadowrootmode="open"', () => {
      const Component = `
        export default function MyComponent() {
          return <div>foo</div>
        }
      `;

      document.body.innerHTML = normalizeQuotes(`
        <my-component>
          <template shadowrootmode="open">
            <div>bar</div>
          </template>
        </my-component>
      `);

      defineBrisaWebComponent(Component, "src/web-components/my-component.tsx");

      const myComponent = document.querySelector("my-component") as HTMLElement;

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>foo</div>");
    });

    it("should throw an error if the component throws an error and there is not the error component", () => {
      const Component = `
        export default function MyComponent() {
          return throw new Error('test')
        }
      `;

      document.body.innerHTML = normalizeQuotes(`
        <my-component></my-component>
      `);

      expect(() =>
        defineBrisaWebComponent(
          Component,
          "src/web-components/my-component.tsx",
        ),
      ).toThrow();
    });

    it("should render the error component if there is an error", () => {
      const Component = `
        export default function MyComponent() {
          throw new Error('test')
          return
        }

        MyComponent.error = () => <div>Ops!</div>
      `;

      document.body.innerHTML = normalizeQuotes(`
        <my-component></my-component>
      `);

      defineBrisaWebComponent(Component, "src/web-components/my-component.tsx");

      const myComponent = document.querySelector("my-component") as HTMLElement;

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>Ops!</div>");
    });

    it("should be possible to have access to the error inside the error component", async () => {
      window.mockError = mock((s: string) => {});

      const code = `
        let Component

        Component = function ({ foo }) {
          throw new Error('test')
        }
        
        Component.error = ({ foo, error }) => {
          window.mockError(error.message)
          if(foo === 'foo') return <div>foo</div> 
          return <div>bar</div>
        };

        export default Component
      `;

      document.body.innerHTML = "<test-component foo='foo' />";

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      await Bun.sleep(0);

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>foo</div>");

      testComponent.setAttribute("foo", "bar");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>bar</div>");

      expect(window.mockError).toHaveBeenCalledTimes(1);
      expect(window.mockError.mock.calls[0][0]).toBe("test");
    });

    it('should work error component if component is declared with "let" and function', () => {
      const code = `
        let Component

        Component = function ({ foo }) {
          throw new Error('test')
        }
        
        Component.error = ({ foo }) => {
          if(foo === 'foo') return <div>foo</div> 
          return <div>bar</div>
        };

        export default Component
      `;

      document.body.innerHTML = "<test-component foo='foo' />";

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>foo</div>");

      testComponent.setAttribute("foo", "bar");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>bar</div>");
    });

    it('should work error component if component is declared with "let" and arrow function', () => {
      const code = `
        let Component

        Component = ({ foo }) => {
          throw new Error('test')
        }
        
        Component.error = ({ foo }) => {
          if(foo === 'foo') return <div>foo</div> 
          return <div>bar</div>
        };

        export default Component
      `;

      document.body.innerHTML = "<test-component foo='foo' />";

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>foo</div>");

      testComponent.setAttribute("foo", "bar");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>bar</div>");
    });

    it("should display the suspense component meanwhile the component is not mounted", async () => {
      const Component = `
        export default async function MyComponent() {
          return <div>hello world</div>
        }

        MyComponent.suspense = () => <div>loading...</div>
      `;

      document.body.innerHTML = normalizeQuotes(`
        <my-component></my-component>
      `);

      defineBrisaWebComponent(Component, "src/web-components/my-component.tsx");

      const myComponent = document.querySelector("my-component") as HTMLElement;

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>loading...</div>");

      await Bun.sleep(0);

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>hello world</div>");
    });

    it("should not lose the reactivity after showing the suspense", async () => {
      const Component = `
        export default async function MyComponent({}, {state}) {
          const count = state(0);
          return <div onClick={() => count.value++}>{count.value}</div>
        }

        MyComponent.suspense = () => <div>loading...</div>
      `;

      document.body.innerHTML = normalizeQuotes(`
        <my-component></my-component>
      `);

      defineBrisaWebComponent(Component, "src/web-components/my-component.tsx");

      const myComponent = document.querySelector("my-component") as HTMLElement;

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>loading...</div>");

      await Bun.sleep(0);

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>0</div>");

      const button = myComponent?.shadowRoot?.querySelector(
        "div",
      ) as HTMLElement;

      button.click();

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>1</div>");
    });

    it("should not lose reactivity inside the suspense component", async () => {
      const Component = `
        export default async function MyComponent({}, {state}) {
          const count = state(0);

          await new Promise(resolve => setTimeout(resolve, 0))

          return <div onClick={() => count.value++}>REAL: {count.value}</div>
        }

        MyComponent.suspense = ({}, {state}) => {
          const count = state(0);
          return <div onClick={() => count.value++}>SUSPENSE: {count.value}</div>
        }
      `;

      document.body.innerHTML = normalizeQuotes(`
        <my-component></my-component>
      `);

      defineBrisaWebComponent(Component, "src/web-components/my-component.tsx");

      const myComponent = document.querySelector("my-component") as HTMLElement;

      await Bun.sleep(0);

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>SUSPENSE: 0</div>");

      myComponent?.shadowRoot?.querySelector("div")!.click();

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>SUSPENSE: 1</div>");

      await Bun.sleep(0);

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>REAL: 0</div>");

      myComponent?.shadowRoot?.querySelector("div")!.click();

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>REAL: 1</div>");
    });

    it("should not lose reactivity store inside the suspense component", async () => {
      const Component = `
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

        export default async function MyWebComponent({}, { store }) {
          await sleep(0);
          store.set('suspense-message', 'Loading step 1 ...')
          await sleep(0);
          store.set('suspense-message', 'Loading step 2 ...')
          await sleep(0);

          return <div>Loaded</div>
        }

        MyWebComponent.suspense = ({}, { store }) => {
          return store.get('suspense-message') ?? 'Loading ...'
        }
      `;

      document.body.innerHTML = normalizeQuotes(`
        <my-component></my-component>
      `);

      defineBrisaWebComponent(Component, "src/web-components/my-component.tsx");

      const myComponent = document.querySelector("my-component") as HTMLElement;

      await Bun.sleep(0);

      expect(myComponent?.shadowRoot?.innerHTML).toBe("Loading ...");

      await Bun.sleep(0);

      expect(myComponent?.shadowRoot?.innerHTML).toBe("Loading step 1 ...");

      await Bun.sleep(0);

      expect(myComponent?.shadowRoot?.innerHTML).toBe("Loading step 2 ...");

      await Bun.sleep(0);

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>Loaded</div>");
    });

    it("should not lose reactivity inside error component", () => {
      const Component = `
        export default function MyComponent() {
          throw new Error('test')
          return
        }

        MyComponent.error = ({}, {state}) => {
          const count = state(0);
          return <div onClick={() => count.value++}>ERROR: {count.value}</div>
        }
      `;

      document.body.innerHTML = normalizeQuotes(`
        <my-component></my-component>
      `);

      defineBrisaWebComponent(Component, "src/web-components/my-component.tsx");

      const myComponent = document.querySelector("my-component") as HTMLElement;

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>ERROR: 0</div>");

      myComponent?.shadowRoot?.querySelector("div")!.click();

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>ERROR: 1</div>");
    });

    it("should call cleanup after every phase: suspense -> real -> error", async () => {
      window.mockCleanup = mock((s: string) => {});

      const Component = `
        export default async function MyComponent({}, {cleanup}) {
          await new Promise(resolve => setTimeout(resolve, 0))
          cleanup(() => window.mockCleanup('real'))
          throw new Error('test')
          return
        }

        MyComponent.error = ({}, {cleanup}) => {
          cleanup(() => window.mockCleanup('error'))
          return <div>ERROR</div>
        }

        MyComponent.suspense = ({}, {cleanup}) => {
          cleanup(() => window.mockCleanup('suspense'))
          return <div>SUSPENSE</div>
        }
      `;

      document.body.innerHTML = normalizeQuotes(`
        <my-component></my-component>
      `);

      defineBrisaWebComponent(Component, "src/web-components/my-component.tsx");

      const myComponent = document.querySelector("my-component") as HTMLElement;

      await Bun.sleep(0);

      expect(window.mockCleanup).toHaveBeenCalledTimes(0);
      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>SUSPENSE</div>");

      await Bun.sleep(0);

      expect(window.mockCleanup).toHaveBeenCalledTimes(2);
      expect(window.mockCleanup.mock.calls[0][0]).toBe("suspense");
      expect(window.mockCleanup.mock.calls[1][0]).toBe("real");
      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>ERROR</div>");

      // Unmount the component
      document.body.innerHTML = "";

      expect(window.mockCleanup).toHaveBeenCalledTimes(3);
      expect(window.mockCleanup.mock.calls[2][0]).toBe("error");
    });

    it('should be possible to use reactive props without the .value inside the "error" component', () => {
      const Component = `
        export default function MyComponent() {
          throw new Error('test')
          return
        }

        MyComponent.error = ({ name }) => <div>{name}</div>
      `;

      document.body.innerHTML = normalizeQuotes(`
        <my-component name="Aral"></my-component>
      `);

      defineBrisaWebComponent(Component, "src/web-components/my-component.tsx");

      const myComponent = document.querySelector("my-component") as HTMLElement;

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      myComponent.setAttribute("name", "Barbara");

      expect(myComponent?.shadowRoot?.innerHTML).toBe("<div>Barbara</div>");
    });

    it('should be possible to use reactive props without the .value inside the "suspense" component', async () => {
      const Component = `
        export default async function MyComponent() {
          await new Promise(resolve => setTimeout(resolve, 0))
          await new Promise(resolve => setTimeout(resolve, 0))
          return <div>real component</div>
        }

        MyComponent.suspense = ({ name }) => <div>{name}</div>
      `;

      document.body.innerHTML = normalizeQuotes(`
        <my-suspense name="Aral"></my-suspense>
      `);

      defineBrisaWebComponent(Component, "src/web-components/my-suspense.tsx");

      const mySuspense = document.querySelector("my-suspense") as HTMLElement;

      expect(mySuspense?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      mySuspense.setAttribute("name", "Barbara");

      expect(mySuspense?.shadowRoot?.innerHTML).toBe("<div>Barbara</div>");

      await Bun.sleep(0);

      mySuspense.setAttribute(
        "name",
        "Change during rendering the real component",
      );

      expect(mySuspense?.shadowRoot?.innerHTML).toBe(
        "<div>Change during rendering the real component</div>",
      );
    });

    it("should unregister sub-effects inside 'error' component", () => {
      window.mockEffect = mock((s: string) => {});

      const code = `
        export default function Component({}, { state, effect }) {
          throw new Error('test')
        }
        
        Component.error = ({}, { state, effect }) => {
          const a = state<number>(0);
          const b = state<string>("x");

          effect(() => {
            if (a.value !== 1) return

            effect(() => {
              mockEffect("B", b.value)
              if(b.value === 'z') effect(() => mockEffect("C", b.value));
            });
          });

          a.value = 1;
          b.value = 'y';
          b.value = 'z';
          b.value = 'y';
          a.value = 2;
          b.value = 'z';
  
          return null;
        };
      `;

      document.body.innerHTML = "<unregister-subeffect></unregister-subeffect>";

      defineBrisaWebComponent(
        code,
        "src/web-components/unregister-subeffect.tsx",
      );

      expect(window.mockEffect).toHaveBeenCalledTimes(5);
      expect(window.mockEffect.mock.calls[0]).toEqual(["B", "x"]);
      expect(window.mockEffect.mock.calls[1]).toEqual(["B", "y"]);
      expect(window.mockEffect.mock.calls[2]).toEqual(["B", "z"]);
      expect(window.mockEffect.mock.calls[3]).toEqual(["C", "z"]);
      expect(window.mockEffect.mock.calls[4]).toEqual(["B", "y"]);
    });

    it("should unregister sub-effects inside 'suspense' component", () => {
      window.mockEffect = mock((s: string) => {});

      const code = `
        export default async function Component({}, { state, effect }) {
          await new Promise(resolve => setTimeout(resolve, 0))
          return <div>hello world</div>
        }
        
        Component.suspense = ({}, { state, effect }) => {
          const a = state<number>(0);
          const b = state<string>("x");

          effect(() => {
            if (a.value !== 1) return

            effect(() => {
              mockEffect("B", b.value)
              if(b.value === 'z') effect(() => mockEffect("C", b.value));
            });
          });

          a.value = 1;
          b.value = 'y';
          b.value = 'z';
          b.value = 'y';
          a.value = 2;
          b.value = 'z';
  
          return null;
        };
      `;

      document.body.innerHTML = "<unregister-subeffect></unregister-subeffect>";

      defineBrisaWebComponent(
        code,
        "src/web-components/unregister-subeffect.tsx",
      );

      expect(window.mockEffect).toHaveBeenCalledTimes(5);
      expect(window.mockEffect.mock.calls[0]).toEqual(["B", "x"]);
      expect(window.mockEffect.mock.calls[1]).toEqual(["B", "y"]);
      expect(window.mockEffect.mock.calls[2]).toEqual(["B", "z"]);
      expect(window.mockEffect.mock.calls[3]).toEqual(["C", "z"]);
      expect(window.mockEffect.mock.calls[4]).toEqual(["B", "y"]);
    });

    it('should work reactivity conditional if-else inside "error" component', () => {
      const code = `
        export default function Component({ foo }) {
          throw new Error('test')
        }
        
        Component.error = ({ foo }) => {
          if(foo === 'foo') return <div>foo</div> 
          return <div>bar</div>
        };
      `;

      document.body.innerHTML = "<test-component foo='foo' />";

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>foo</div>");

      testComponent.setAttribute("foo", "bar");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>bar</div>");
    });

    it('should work reactivity conditional switch-case inside "error" component', () => {
      const code = `
        export default function Component({ foo }) {
          throw new Error('test')
        }
        
        Component.error = ({ foo }) => {
          switch(foo) {
            case 'foo':
              return <div>foo</div>
            default:
              return <div>bar</div>
          }
        };
      `;

      document.body.innerHTML = "<test-component foo='foo' />";

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>foo</div>");

      testComponent.setAttribute("foo", "bar");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>bar</div>");
    });

    it('should work reactivity conditional if-else inside "suspense" component', () => {
      const code = `
        export default async function Component({ foo }) {
          await new Promise(resolve => setTimeout(resolve, 0))
          return <div>hello world</div>
        }
        
        Component.suspense = ({ foo }) => {
          if(foo === 'foo') return <div>foo</div> 
          return <div>bar</div>
        };
      `;

      document.body.innerHTML = "<test-component foo='foo' />";

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>foo</div>");

      testComponent.setAttribute("foo", "bar");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>bar</div>");
    });

    it('should work reactivity conditional switch-case inside "suspense" component', () => {
      const code = `
        export default async function Component({ foo }) {
          await new Promise(resolve => setTimeout(resolve, 0))
          return <div>hello world</div>
        }
        
        Component.suspense = ({ foo }) => {
          switch(foo) {
            case 'foo':
              return <div>foo</div>
            default:
              return <div>bar</div>
          }
        };
      `;

      document.body.innerHTML = "<test-component foo='foo' />";

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>foo</div>");

      testComponent.setAttribute("foo", "bar");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>bar</div>");
    });

    it("should work store between two components", async () => {
      const code = `
        export default function First({}, { store }) {
          return <div onClick={() => store.set('count', (store.get('count') ?? 0) + 1)}>{store.get('count') ?? 0}</div>
        }
      `;
      const code2 = `
        export default function Second({}, { store }) {
          return <div>{store.get('count') ?? 0}</div>
        }
      `;

      defineBrisaWebComponent(code, "src/web-components/first-component.tsx");
      defineBrisaWebComponent(code2, "src/web-components/second-component.tsx");
      document.body.innerHTML = "<first-component /><second-component />";

      const firstComponent = document.querySelector(
        "first-component",
      ) as HTMLElement;

      const secondComponent = document.querySelector(
        "second-component",
      ) as HTMLElement;

      expect(firstComponent?.shadowRoot?.innerHTML).toBe("<div>0</div>");
      expect(secondComponent?.shadowRoot?.innerHTML).toBe("<div>0</div>");

      firstComponent?.shadowRoot?.querySelector("div")?.click();

      expect(firstComponent?.shadowRoot?.innerHTML).toBe("<div>1</div>");
      expect(secondComponent?.shadowRoot?.innerHTML).toBe("<div>1</div>");
    });

    it('should work "useContext" method', () => {
      const code = `
        const Context = createContext({ foo: 'foo' }, '0:0')

        export default function Component({}, { useContext }) {
          const context = useContext(Context)
          return <div>{context.value.foo}</div>
        }
      `;

      document.body.innerHTML = "<test-component />";

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>foo</div>");
    });

    it('should work "useContext" method with context-provider web component', async () => {
      const parentCode = `
        const Context = createContext({ foo: 'foo' }, '0:0')

        export default function ParentComponent() {
          return (
            <context-provider context={Context} value={{ foo: 'bar' }}>
              <child-component />
            </context-provider>
          )
        }
      `;

      const childCode = `
        const Context = createContext({ foo: 'foo' }, '0:0')

        export default function ChildComponent({}, { useContext }) {
          const context = useContext(Context)
          return <div>{context.value.foo}</div>
        }
      `;

      defineBrisaWebComponent(
        await getContextProviderCode(),
        "src/web-components/context-provider.tsx",
      );
      defineBrisaWebComponent(
        parentCode,
        "src/web-components/parent-component.tsx",
      );
      defineBrisaWebComponent(
        childCode,
        "src/web-components/child-component.tsx",
      );
      document.body.innerHTML = "<parent-component />";

      const parent = document.querySelector("parent-component") as HTMLElement;
      const child = parent?.shadowRoot?.querySelector(
        "child-component",
      ) as HTMLElement;

      expect(parent.shadowRoot?.innerHTML).toBe(
        "<context-provider context=\"{'id':'0:0','defaultValue':{'foo':'foo'}}\" value=\"{'foo':'bar'}\" cid=\"0:0\" pid=\"0\"><child-component></child-component></context-provider>",
      );
      expect(child.shadowRoot?.innerHTML).toBe("<div>bar</div>");
    });

    it("should work reactivity an array with different context providers", async () => {
      const child = `
        const Context = createContext({ foo: 'foo' }, '0:0')

        export default function ChildComponent({}, { useContext }) {
          const context = useContext(Context)
          return <div>{context.value.foo}</div>
        }
      `;
      const parentCode = `
        const Context = createContext({ foo: 'foo' }, '0:0')

        export default function ParentComponent({ first = "first", second = "second", third = "third" }) {
          return (
            <>
              <context-provider context={Context} value={{ foo: first }}>
                <child-component />
              </context-provider>
              <context-provider context={Context} value={{ foo: second }}>
                <child-component />
              </context-provider>
              <context-provider context={Context} value={{ foo: third }}>
                <child-component />
              </context-provider>
            </>
          )
        }
      `;

      defineBrisaWebComponent(
        await getContextProviderCode(),
        "src/web-components/context-provider.tsx",
      );
      defineBrisaWebComponent(
        parentCode,
        "src/web-components/parent-component.tsx",
      );
      defineBrisaWebComponent(child, "src/web-components/child-component.tsx");
      document.body.innerHTML = "<parent-component />";

      const parent = document.querySelector("parent-component") as HTMLElement;
      const children = parent?.shadowRoot?.querySelectorAll(
        "child-component",
      ) as NodeListOf<HTMLElement>;

      expect(children[0].shadowRoot?.innerHTML).toBe("<div>first</div>");
      expect(children[1].shadowRoot?.innerHTML).toBe("<div>second</div>");
      expect(children[2].shadowRoot?.innerHTML).toBe("<div>third</div>");

      parent.setAttribute("first", "first-changed");
      parent.setAttribute("second", "second-changed");
      parent.setAttribute("third", "third-changed");

      expect(children[0].shadowRoot?.innerHTML).toBe(
        "<div>first-changed</div>",
      );
      expect(children[1].shadowRoot?.innerHTML).toBe(
        "<div>second-changed</div>",
      );
      expect(children[2].shadowRoot?.innerHTML).toBe(
        "<div>third-changed</div>",
      );
    });

    it("should work with multiple context providers", async () => {
      const childCode = `
        const Context = createContext({}, '0:0')
        const Context2 = createContext({}, '0:1')

        export default function ChildComponent({}, { useContext }) {
          const context = useContext(Context)
          const context2 = useContext(Context2)
          return <div>{context.value.foo || context2.value.bar} </div>
        }
      `;
      const parentCode = `
        const Context = createContext({}, '0:0')
        const Context2 = createContext({}, '0:1')

        export default function ParentComponent({ foo = 'bar', bar = 'baz' }) {
          return (
            <>
              <context-provider context={Context} value={{ foo }}>
                <child-component />
              </context-provider>
              <context-provider context={Context2} value={{ bar }}>
                <child-component />
              </context-provider>
            </>
          )
        }
      `;

      window._pid = 0;
      defineBrisaWebComponent(
        await getContextProviderCode(),
        "src/web-components/context-provider.tsx",
      );
      defineBrisaWebComponent(
        parentCode,
        "src/web-components/parent-component.tsx",
      );
      defineBrisaWebComponent(
        childCode,
        "src/web-components/child-component.tsx",
      );
      document.body.innerHTML = "<parent-component />";

      const parent = document.querySelector("parent-component") as HTMLElement;

      expect(parent.shadowRoot?.innerHTML).toBe(
        toInline(`
        <context-provider context="{'id':'0:0','defaultValue':{}}" value="{'foo':'bar'}" cid="0:0" pid="1">
          <child-component></child-component>
        </context-provider>
        <context-provider context="{'id':'0:1','defaultValue':{}}" value="{'bar':'baz'}" cid="0:1" pid="2">
          <child-component></child-component>
        </context-provider>
      `),
      );

      const children = parent?.shadowRoot?.querySelectorAll(
        "child-component",
      ) as NodeListOf<HTMLElement>;

      expect(children[0].shadowRoot?.innerHTML).toBe("<div>bar </div>");
      expect(children[1].shadowRoot?.innerHTML).toBe("<div>baz </div>");

      parent.setAttribute("foo", "foo");
      parent.setAttribute("bar", "bar");

      expect(children[0].shadowRoot?.innerHTML).toBe("<div>foo </div>");
      expect(children[1].shadowRoot?.innerHTML).toBe("<div>bar </div>");
    });

    it("should work with multiple nested context providers", async () => {
      const childCode = `
        const Context = createContext({ foo: 'foo' }, '0:0')
        const Context2 = createContext({ foo: 'foo' }, '0:1')

        export default function ChildComponent({}, { useContext }) {
          const context = useContext(Context)
          const context2 = useContext(Context2)
          return <div>{context.value.foo} - {context2.value.bar} </div>
        }
      `;
      const parentCode = `
        const Context = createContext({ foo: 'foo' }, '0:0')
        const Context2 = createContext({ foo: 'foo' }, '0:1')

        export default function ParentComponent({ foo = 'bar', bar = 'baz' }) {
          return (
            <>
              <context-provider context={Context} value={{ foo }}>
                <context-provider context={Context2} value={{ bar }}>
                  <child-component />
                </context-provider>
              </context-provider>
            </>
          )
        }
      `;

      window._pid = 0;
      defineBrisaWebComponent(
        await getContextProviderCode(),
        "src/web-components/context-provider.tsx",
      );
      defineBrisaWebComponent(
        parentCode,
        "src/web-components/parent-component.tsx",
      );
      defineBrisaWebComponent(
        childCode,
        "src/web-components/child-component.tsx",
      );
      document.body.innerHTML = "<parent-component />";

      const parent = document.querySelector("parent-component") as HTMLElement;
      const child = parent?.shadowRoot?.querySelector(
        "child-component",
      ) as HTMLElement;

      expect(parent.shadowRoot?.innerHTML).toBe(
        toInline(`
        <context-provider context="{'id':'0:0','defaultValue':{'foo':'foo'}}" value="{'foo':'bar'}" cid="0:0" pid="1">
          <context-provider context="{'id':'0:1','defaultValue':{'foo':'foo'}}" value="{'bar':'baz'}" cid="0:1" pid="2">
            <child-component></child-component>
          </context-provider>
        </context-provider>
      `),
      );

      expect(child.shadowRoot?.innerHTML).toBe("<div>bar - baz </div>");

      parent.setAttribute("foo", "foo");
      parent.setAttribute("bar", "bar");

      expect(child.shadowRoot?.innerHTML).toBe("<div>foo - bar </div>");
    });

    it("should work context rendering a list of items and each item with a provider", async () => {
      const listItemCode = `
        const Context = createContext({}, '0:0')

        export default function ListItem({}, { useContext }) {
          const context = useContext(Context)
          return <li>{context.value}</li>
        }
      `;
      const itemListProviderCode = `
        const Ctx = createContext({}, '0:0');

        export default function ItemListProvider({ items = [] }) {
          return (
            <ul>
              {items.map((item, index) => (
                <context-provider context={Ctx} key={index} value={item}>
                  {/* Avoid prop-drilling to the list-item component */}
                  <list-item />
                </context-provider>
              ))}
            </ul>
          );
        }
      `;

      document.body.innerHTML = "<item-list-provider />";

      window._pid = 0;
      defineBrisaWebComponent(
        await getContextProviderCode(),
        "src/web-components/context-provider.tsx",
      );
      defineBrisaWebComponent(
        itemListProviderCode,
        "src/web-components/item-list-provider.tsx",
      );
      defineBrisaWebComponent(listItemCode, "src/web-components/list-item.tsx");

      const itemListProvider = document.querySelector(
        "item-list-provider",
      ) as HTMLElement;

      itemListProvider.setAttribute(
        "items",
        JSON.stringify(["first", "second", "third"]),
      );

      const list = itemListProvider?.shadowRoot?.querySelector("ul");

      const children = list?.querySelectorAll(
        "list-item",
      ) as NodeListOf<HTMLElement>;

      expect(children).toHaveLength(3);
      expect(children[0].shadowRoot?.innerHTML).toBe("<li>first</li>");
      expect(children[1].shadowRoot?.innerHTML).toBe("<li>second</li>");
      expect(children[2].shadowRoot?.innerHTML).toBe("<li>third</li>");

      itemListProvider.setAttribute(
        "items",
        JSON.stringify(["1", "2", "3", "4"]),
      );

      const item = list?.querySelectorAll(
        "list-item",
      ) as NodeListOf<HTMLElement>;

      expect(item).toHaveLength(4);
      expect(item[0].shadowRoot?.innerHTML).toBe("<li>1</li>");
      expect(item[1].shadowRoot?.innerHTML).toBe("<li>2</li>");
      expect(item[2].shadowRoot?.innerHTML).toBe("<li>3</li>");
      expect(item[3].shadowRoot?.innerHTML).toBe("<li>4</li>");
    });

    it("should work css template with variables that are not signals", () => {
      const code = `
        export default function Counter({}, { state, css, effect }) {
          const count = state<number>(0);
          const defaultColor = 'red';
        
          css\`
            p {
              color: \${defaultColor};
            }
            .even {
              color: blue;
            }
          \`;
        
          return (
            <p class={count.value % 2 === 0 ? "even" : ""}>
              <button onClick={() => count.value++}>+</button>
              <span>
                {" "}{count.value}{" "}
              </span>
              <button onClick={() => count.value--}>-</button>
            </p>
          );
        }`;

      document.body.innerHTML = normalizeQuotes("<web-counter />");
      defineBrisaWebComponent(code, "src/web-components/web-counter.tsx");

      const webCounter = document.querySelector("web-counter") as HTMLElement;

      expect(webCounter?.shadowRoot?.querySelector("style")?.innerHTML).toBe(
        toInline(`
        p {
          color: red;
        }
        .even {
          color: blue;
        }
      `),
      );
    });

    it("should work css template with state signal", () => {
      const code = `
        export default function Counter({}, { state, css, effect }) {
          const count = state<number>(0);
          const defaultColor = state<string>("red");
        
          effect(() => {
            if (count.value >= 1) {
              defaultColor.value = "yellow"
            }
          })
        
          css\`
            p {
              color: \${defaultColor.value};
            }
            .even {
              color: blue;
            }
          \`;
        
          return (
            <p class={count.value % 2 === 0 ? "even" : ""}>
              <button onClick={() => count.value++}>+</button>
              <span>
                {" "}{count.value}{" "}
              </span>
              <button onClick={() => count.value--}>-</button>
            </p>
          );
        }`;

      document.body.innerHTML = normalizeQuotes("<web-counter />");
      defineBrisaWebComponent(code, "src/web-components/web-counter.tsx");

      const webCounter = document.querySelector("web-counter") as HTMLElement;

      const button = webCounter?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      const style = webCounter?.shadowRoot?.querySelector("style");

      expect(style?.innerHTML).toBe(
        toInline(`
        p {
          color: red;
        }
        .even {
          color: blue;
        }
      `),
      );

      button.click();

      expect(style?.innerHTML).toBe(
        toInline(`
        p {
          color: yellow;
        }
        .even {
          color: blue;
        }
      `),
      );
    });

    it("should work css template with prop signal", () => {
      const code = `
        export default function Counter({color}, {css}) {
          css\`
            p {
              color: \${color};
            }
            .even {
              color: blue;
            }
          \`;
        
          return (
            <div>{color}</div>
          );
        }`;

      document.body.innerHTML = normalizeQuotes("<web-counter color='red' />");
      defineBrisaWebComponent(code, "src/web-components/web-counter.tsx");

      const webCounter = document.querySelector("web-counter") as HTMLElement;
      const style = webCounter?.shadowRoot?.querySelector("style");

      expect(style?.innerHTML).toBe(
        toInline(`
        p {
          color: red;
        }
        .even {
          color: blue;
        }
      `),
      );

      webCounter.setAttribute("color", "yellow");

      expect(style?.innerHTML).toBe(
        toInline(`
        p {
          color: yellow;
        }
        .even {
          color: blue;
        }
      `),
      );
    });

    it("should work css template with store signal", () => {
      const code = `
        export default function Counter({foo}, {css, store, effect}) {
          store.set('color', 'red');

          effect(() => {
            if(foo === 'foo') store.set('color', 'yellow')
          })

          css\`
            p {
              color: \${store.get('color')};
            }
            .even {
              color: blue;
            }
          \`;

          return (
            <div>{store.get('color')}</div>
          );
        }`;

      document.body.innerHTML = normalizeQuotes("<web-counter />");
      defineBrisaWebComponent(code, "src/web-components/web-counter.tsx");

      const webCounter = document.querySelector("web-counter") as HTMLElement;

      const style = webCounter?.shadowRoot?.querySelector("style");

      expect(style?.innerHTML).toBe(
        toInline(`
        p {
          color: red;
        }
        .even {
          color: blue;
        }
      `),
      );

      webCounter.setAttribute("foo", "foo");

      expect(style?.innerHTML).toBe(
        toInline(`
        p {
          color: yellow;
        }
        .even {
          color: blue;
        }
      `),
      );
    });

    it("should work with 2 css methods in the same component", () => {
      const code = `
        export default function Counter({}, { state, css, effect }) {
          const count = state<number>(0);
          const defaultColor = state<string>("red");
        
          effect(() => {
            if (count.value >= 1) {
              defaultColor.value = "yellow"
            }
          })
        
          css\`
            p {
              color: \${defaultColor.value};
            }
          \`;
        
          css\`
            .even {
              color: blue;
            }
          \`;
        
          return (
            <p class={count.value % 2 === 0 ? "even" : ""}>
              <button onClick={() => count.value++}>+</button>
              <span>
                {" "}{count.value}{" "}
              </span>
              <button onClick={() => count.value--}>-</button>
            </p>
          );
        }`;

      document.body.innerHTML = normalizeQuotes("<web-counter />");
      defineBrisaWebComponent(code, "src/web-components/web-counter.tsx");

      const webCounter = document.querySelector("web-counter") as HTMLElement;

      const button = webCounter?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      const style = webCounter?.shadowRoot?.querySelector("style");

      expect(style?.innerHTML).toBe(
        toInline(`
        p {
          color: red;
        }
        .even {
          color: blue;
        }
      `),
      );

      button.click();

      expect(style?.innerHTML).toBe(
        toInline(`
        p {
          color: yellow;
        }
        .even {
          color: blue;
        }
      `),
      );
    });

    it("should work an state signal wrapped an object", () => {
      const code = `
        export default function Counter({}, { state }) {
          const count = state(0);
          const wrappedSignal = { count };

          return (
            <div>
              <button onClick={() => wrappedSignal.count.value++}>+</button>
              <span>
                {wrappedSignal.count.value}
              </span>
              <button onClick={() => wrappedSignal.count.value--}>-</button>
            </div>
          );
        }
      `;

      document.body.innerHTML = normalizeQuotes("<web-counter />");
      defineBrisaWebComponent(code, "src/web-components/web-counter.tsx");

      const webCounter = document.querySelector("web-counter") as HTMLElement;

      const button = webCounter?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      const span = webCounter?.shadowRoot?.querySelector("span");

      button.click();

      expect(span?.innerHTML).toBe("1");

      button.click();

      expect(span?.innerHTML).toBe("2");
    });

    // TODO: This test should work after this happydom issue about assignedSlot
    // https://github.com/capricorn86/happy-dom/issues/583
    it.todo(
      'shoud work "useContext" method with context-provider children prop',
      async () => {
        window.mockEffect = mock((s: string) => {});

        const themeProviderCode = `
        const ctx = createContext({}, '0:0');
        
        export default function ThemeProvider({ color, children }) {
          return (
            <context-provider context={ctx} value={{ color }}>
              {children}
            </context-provider>
          );
        }
      `;

        const childCode = `
        const ctx = createContext({}, '0:0');
        
        export default function ChildComponent({}, {effect,useContext}) {
          const context = useContext(ctx);
          effect(() => window.mockEffect(context.value));
          return <div>child</div>;
        }
      `;

        document.body.innerHTML =
          "<theme-provider color='red'><child-component /></theme-provider>";

        window._pid = 0;
        defineBrisaWebComponent(
          await getContextProviderCode(),
          "src/web-components/context-provider.tsx",
        );

        defineBrisaWebComponent(
          themeProviderCode,
          "src/web-components/theme-provider.tsx",
        );

        defineBrisaWebComponent(
          childCode,
          "src/web-components/child-component.tsx",
        );

        expect(window.mockEffect).toHaveBeenCalledTimes(1);
        expect(window.mockEffect.mock.calls[0][0]).toBe("red");
      },
    );

    it.todo(
      "should be possible to move web-components from a list without unmounting + keeping inner state",
      () => {
        const innerWebComponentCode = `
        export default function InnerWebComponent({ }, { state }) {
          const name = state('Aral');
          return <button onClick={() => name.value += 'a'}>{name.value}</button>
        }
      `;
        const code = `
        export default function MagicList({ }, { state }) {
          const list = state<string[]>(['some', 'another']);

          const addItem = (e: any) => {
            e.preventDefault();
            const formData = new FormData(e.target)
            list.value = [...list.value, formData.get('item') as string]
          }

          const deleteItem = (index: number) => {
            list.value = list.value.filter((_, i) => i !== index)
          }

          const moveItemUp = (index: number) => {
            if (index === 0) return
            const item = list.value[index]
            const filtered = list.value.filter((_, i) => i !== index)
            list.value = [...filtered.slice(0, index - 1), item, ...filtered.slice(index - 1)]
          }

          return (
            <div>
              <form onSubmit={addItem}>
                <input name="item" id="item" placeholder="Add item" />
                <button>add</button>
              </form>
              <ul>
                {list.value.map((item: string, index: number) => (
                  <li key={item}>
                    <button onClick={() => deleteItem(index)}>delete</button>
                    <button onClick={() => moveItemUp(index)}>move up</button>
                    {item}
                    <inner-web-component />
                  </li>
                ))}
              </ul>
            </div>
          )
        }
      `;

        defineBrisaWebComponent(
          innerWebComponentCode,
          "src/web-components/inner-web-component.tsx",
        );

        defineBrisaWebComponent(code, "src/web-components/magic-list.tsx");

        document.body.innerHTML = "<magic-list />";

        const magicList = document.querySelector("magic-list") as HTMLElement;

        const input = magicList?.shadowRoot?.querySelector(
          "input",
        ) as HTMLInputElement;

        const button = magicList?.shadowRoot?.querySelector(
          "button",
        ) as HTMLButtonElement;

        input.value = "test";
        button.click();

        const list = magicList?.shadowRoot?.querySelector("ul");

        expect(list?.innerHTML).toBe(
          "<li><button>delete</button><button>move up</button>some<inner-web-component></inner-web-component></li><li><button>delete</button><button>move up</button>another<inner-web-component></inner-web-component></li><li><button>delete</button><button>move up</button>test<inner-web-component></inner-web-component></li>",
        );

        const innerComponents = magicList?.shadowRoot?.querySelectorAll(
          "inner-web-component",
        ) as NodeListOf<HTMLElement>;

        expect(innerComponents.length).toBe(3);

        const secondInnerComponentButton =
          innerComponents[1]?.shadowRoot?.querySelector(
            "button",
          ) as HTMLButtonElement;

        secondInnerComponentButton.click();

        expect(innerComponents[0]?.shadowRoot?.innerHTML).toBe(
          "<button>Aral</button>",
        );
        expect(innerComponents[1]?.shadowRoot?.innerHTML).toBe(
          "<button>Arala</button>",
        );
        expect(innerComponents[2]?.shadowRoot?.innerHTML).toBe(
          "<button>Aral</button>",
        );

        // Move second item up
        const secondItemMoveUpButton = list?.querySelectorAll("button")[3];
        secondItemMoveUpButton?.click();

        expect(list?.innerHTML).toBe(
          "<li><button>delete</button><button>move up</button>another<inner-web-component></inner-web-component></li><li><button>delete</button><button>move up</button>some<inner-web-component></inner-web-component></li><li><button>delete</button><button>move up</button>test<inner-web-component></inner-web-component></li>",
        );

        const newInnerComponents = magicList?.shadowRoot?.querySelectorAll(
          "inner-web-component",
        ) as NodeListOf<HTMLElement>;

        expect(newInnerComponents[0]?.shadowRoot?.innerHTML).toBe(
          "<button>Arala</button>",
        );
        expect(newInnerComponents[1]?.shadowRoot?.innerHTML).toBe(
          "<button>Aral</button>",
        );
        expect(newInnerComponents[2]?.shadowRoot?.innerHTML).toBe(
          "<button>Aral</button>",
        );
      },
    );

    it.todo(
      "should work an async-await effect changing state and with a conditional render",
      async () => {
        const code = `
        export default ({ foo }: { foo: string }, { state, effect }: WebContext) => {
          const bar = state<any>()
        
          effect(async () => {
            if (foo === 'bar') {
              bar.value = await Promise.resolve({ someField: 'someValue' })
            } else {
              bar.value = null
            }
          })
        
          return bar.value && <div>{bar.value.someField}</div>;
        };
      `;

        document.body.innerHTML = "<test-component foo='bar' />";

        defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

        const testComponent = document.querySelector(
          "test-component",
        ) as HTMLElement;

        expect(testComponent?.shadowRoot?.innerHTML).toBe("");

        await Bun.sleep(0);

        expect(testComponent?.shadowRoot?.innerHTML).toBe(
          "<div>someValue</div>",
        );

        testComponent.setAttribute("foo", "baz");

        await Bun.sleep(0);

        expect(testComponent?.shadowRoot?.innerHTML).toBe("");

        testComponent.setAttribute("foo", "bar");

        await Bun.sleep(0);

        expect(testComponent?.shadowRoot?.innerHTML).toBe(
          "<div>someValue</div>",
        );

        await Bun.sleep(0);
      },
    );

    it("should sync with localStorage using a Web Context Plugin", async () => {
      window.__WEB_CONTEXT_PLUGINS__ = true;
      window._P = [
        (ctx) => {
          // @ts-ignore
          ctx.store.sync = (
            key: string,
            storage: "localStorage" | "sessionStorage" = "localStorage",
          ) => {
            if (typeof window === "undefined") return;

            const sync = (event?: StorageEvent) => {
              if (event && event.key !== key) return;
              const storageValue = window[storage].getItem(key);
              if (storageValue != null)
                ctx.store.set(key, JSON.parse(storageValue));
            };

            ctx.effect(() => {
              window.addEventListener("storage", sync);
              ctx.cleanup(() => window.removeEventListener("storage", sync));
            });

            ctx.effect(() => {
              const val = ctx.store.get(key);
              if (val != null)
                window[storage].setItem(key, JSON.stringify(val));
            });

            sync();
          };

          return ctx;
        },
      ] satisfies WebContextPlugin[];

      window.localStorage.setItem("foo", JSON.stringify("bar"));

      const code = `
      export default function Component({}, { store }) {
        store.sync('foo', 'localStorage')
        return <div>{store.get('foo')}</div>
      }
    `;

      document.body.innerHTML = "<test-component />";

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>bar</div>");
    });
  });
});
