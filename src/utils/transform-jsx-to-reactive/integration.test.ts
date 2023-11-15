import { describe, it, expect, beforeAll, afterAll, mock, beforeEach, afterEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { serialize } from "../serialization";
import transformJSXToReactive from ".";

declare global {
  interface Window {
    [key: string]: any
  }
}

const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');

function defineBrisaWebComponent(code: string, path: string) {
  const componentName = path.split("/").pop()?.split(".")[0] as string;

  const webComponent = toInline(transformJSXToReactive(code, path))
    .replace('import {brisaElement, _on, _off} from "brisa/client"', '')
    .replace('export default', '')

  customElements.define(componentName, eval(webComponent));
}

describe("integration", () => {
  describe("web-components", () => {
    beforeEach(async () => {
      GlobalRegistrator.register();
      const module = await import("../brisa-element");
      window.brisaElement = module.default;
      window._on = module._on;
      window._off = module._off;
    })
    afterEach(() => {
      if (typeof window !== 'undefined') GlobalRegistrator.unregister();
    })
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
        }`

      defineBrisaWebComponent(code, path)

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
      }`

      defineBrisaWebComponent(code, 'src/web-components/conditional-render.tsx')

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
      `

      defineBrisaWebComponent(code, 'src/web-components/conditional-render.tsx')

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
      }`

      defineBrisaWebComponent(code, 'src/web-components/conditional-render.tsx')

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
      }`

      defineBrisaWebComponent(code, 'src/web-components/conditional-render.tsx')

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
      }`

      defineBrisaWebComponent(code, 'src/web-components/empty-nodes.tsx')

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
      }`

      document.body.innerHTML = `
        <sliding-carousel images="['https://picsum.photos/200/300', 'https://picsum.photos/200/300?grayscale']" />
      `;

      defineBrisaWebComponent(code, 'src/web-components/sliding-carousel.tsx')

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
      }`

      document.body.innerHTML = `
        <carousel-images images="[{'url':'https://picsum.photos/200/300'},{'url':'https://picsum.photos/200/300?grayscale'}]" />
      `;

      defineBrisaWebComponent(code, 'src/web-components/carousel-images.tsx')

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
      }`

      defineBrisaWebComponent(code, 'src/web-components/timer-component.tsx')

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
      const code = `export default function Button({ onAfterClick }: any) {
        return <button onClick={onAfterClick}>click me</button>;
      }`

      defineBrisaWebComponent(code, 'src/web-components/test-button.tsx')

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
      window.mock = mock(() => { });

      const parentCode = `export default function Parent() {
        return <first-component onClickMe={window.mock}>click me</first-component>
      }`

      const firstCode = `export default function FirstComponent({ onClickMe, children }) {
        return <second-component onClickMe={onClickMe}>{children}</second-component>
      }`

      const secondCode = `export default function SecondComponent({ onClickMe, children }) {
        return <button onClick={() => onClickMe("TEST")}>{children}</button>
      }`

      defineBrisaWebComponent(secondCode, 'src/web-components/second-component.tsx')
      defineBrisaWebComponent(firstCode, 'src/web-components/first-component.tsx')
      defineBrisaWebComponent(parentCode, 'src/web-components/parent-component.tsx')

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
            <span style={\`color:\${color}\`}>{color}</span>
          </div>
        );
      }`

      defineBrisaWebComponent(code, 'src/web-components/color-selector.tsx')

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
        '<div><input type="color" value="#000000"><span style="color:#000000">#000000</span></div>',
      );

      input.value = "#ffffff";

      input.dispatchEvent(new Event("input"));

      expect(colorSelector?.shadowRoot?.innerHTML).toBe(
        '<div><input type="color" value="#ffffff"><span style="color:#ffffff">#ffffff</span></div>',
      );
    });

    it("should render a TodoList component from props", () => {
      const code = `export default function TodoList({ todos }) {
        return <ul>{todos.map((todo: string) => <li>{todo}</li>)}</ul>
      }`

      document.body.innerHTML = `
        <todo-list todos="['todo 1', 'todo 2', 'todo 3']" />
      `;

      defineBrisaWebComponent(code, 'src/web-components/todo-list.tsx')

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
      }`

      defineBrisaWebComponent(code, 'src/web-components/todo-list.tsx')
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
      }`

      defineBrisaWebComponent(code, 'src/web-components/test-image.tsx')
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
      }`

      defineBrisaWebComponent(code, 'src/web-components/test-image.tsx')
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

    it("should unregister effects when the component is disconnected", () => {
      window.mock = mock((n: number) => { });
      const code = `export default function Test({ }, { state, effect }: any) {
          const count = state(0);

          window.interval = setInterval(() => {
            count.value++;
          }, 1);

          effect(() => {
            window.mock(count.value);
          });

          return <div>{count.value}</div>;
        }`

      defineBrisaWebComponent(code, 'src/web-components/test-component.tsx')
      document.body.innerHTML = "<test-component />";
      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>0</div>");
      expect(window.mock).toHaveBeenCalledTimes(1);

      setTimeout(() => {
        expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>1</div>");
        expect(window.mock).toHaveBeenCalledTimes(2);
        testComponent.remove();
      }, 1);

      setTimeout(() => {
        expect(testComponent?.shadowRoot?.innerHTML).toBe("");
        expect(window.mock).toHaveBeenCalledTimes(2);
        clearInterval(window.interval);
      }, 2);
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
      }`

      defineBrisaWebComponent(code, 'src/web-components/test-component.tsx')
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
      }`

      defineBrisaWebComponent(code, 'src/web-components/async-component.tsx')
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
      }`

      defineBrisaWebComponent(code, 'src/web-components/async-component.tsx')
      document.body.innerHTML = "<async-component />";

      const asyncComponent = document.querySelector(
        "async-component",
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(asyncComponent?.shadowRoot?.innerHTML).toBe("<div>42</div>");
    });

    it("should cleanup everytime an effect is re-called", () => {
      window.mockEffect = mock((num: number) => { });
      window.mockCleanup = mock(() => { });

      const code = `export default function Test({ }, { state, effect, cleanup }: any) {
        const count = state(0);

        effect(() => {
          window.mockEffect(count.value);
          cleanup(() => {
            window.mockCleanup();
          });
        });

        return <button onClick={() => count.value++}>click</button>
      }`

      defineBrisaWebComponent(code, 'src/web-components/test-component.tsx')
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
      delete window.mockEffect
      delete window.mockCleanup
    });

    it("should cleanup everytime the web-component is unmount", () => {
      window.mockEffect = mock(() => { });
      window.mockCleanup = mock(() => { });

      const code = `export default function Test({ }, { effect, cleanup }: any) {
        effect(() => {
          window.mockEffect();
          cleanup(() => window.mockCleanup());
        });

        return <div />;
      }`

      defineBrisaWebComponent(code, 'src/web-components/cleanup-component.tsx')
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
      window.mockEffect = mock(() => { });
      window.mockCleanup = mock(() => { });

      const code = `export default function Test({ }, { effect, cleanup }: any) {
        effect(async () => {
          mockEffect();
          cleanup(async () => window.mockCleanup());
        });

        return <div />;
      }`

      defineBrisaWebComponent(code, 'src/web-components/test-component.tsx')
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
      window.mockEffect = mock(() => { });
      window.mockCleanup = mock(() => { });

      const code = `export default function Test({ }, { effect, cleanup }: any) {
        effect(async () => {
          mockEffect();
          cleanup(async () => window.mockCleanup());
          cleanup(async () => window.mockCleanup());
        });

        return <div />
      }`

      defineBrisaWebComponent(code, 'src/web-components/test-component.tsx')
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
            <g style="fill-opacity:0.7; stroke:black; stroke-width:0.1cm;">
              <circle cx="6cm" cy="2cm" r="100" fill={color1} transform="translate(0,50)" />
              <circle cx="6cm" cy="2cm" r="100" fill={color2} transform="translate(70,150)" />
              <circle cx="6cm" cy="2cm" r="100" fill={color3} transform="translate(-70,150)" />
            </g>
          </svg>
        );
      }`

      document.body.innerHTML = `
        <color-svg color1="#ff0000" color2="#00ff00" color3="#0000ff" />
      `;

      defineBrisaWebComponent(code, 'src/web-components/color-svg.tsx')

      const colorSVG = document.querySelector("color-svg") as HTMLElement;

      colorSVG?.shadowRoot?.querySelectorAll("*").forEach((node) => {
        expect(node.namespaceURI).toBe("http://www.w3.org/2000/svg");
      });

      expect(colorSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7; stroke:black; stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" fill="#ff0000" transform="translate(0,50)"></circle><circle cx="6cm" cy="2cm" r="100" fill="#00ff00" transform="translate(70,150)"></circle><circle cx="6cm" cy="2cm" r="100" fill="#0000ff" transform="translate(-70,150)"></circle></g></svg>',
      );

      colorSVG.setAttribute("color1", "#0000ff");
      colorSVG.setAttribute("color2", "#ff0000");
      colorSVG.setAttribute("color3", "#00ff00");

      expect(colorSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7; stroke:black; stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" transform="translate(0,50)" fill="#0000ff"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(70,150)" fill="#ff0000"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(-70,150)" fill="#00ff00"></circle></g></svg>',
      );
    });

    it.todo("should work reactivity if props that are written in camelCase", () => {
      function ColorSVG(
        { firstColor, secondColor, thirdColor }: any,
        { h }: any,
      ) {
        return h("svg", { width: "12cm", height: "12cm" }, [
          [
            "g",
            {
              style: "fill-opacity:0.7; stroke:black; stroke-width:0.1cm;",
            },
            [
              [
                "circle",
                {
                  cx: "6cm",
                  cy: "2cm",
                  r: "100",
                  fill: () => firstColor.value,
                  transform: "translate(0,50)",
                },
                "",
              ],
              [
                "circle",
                {
                  cx: "6cm",
                  cy: "2cm",
                  r: "100",
                  fill: () => secondColor.value,
                  transform: "translate(70,150)",
                },
                "",
              ],
              [
                "circle",
                {
                  cx: "6cm",
                  cy: "2cm",
                  r: "100",
                  fill: () => thirdColor.value,
                  transform: "translate(-70,150)",
                },
                "",
              ],
            ],
          ],
        ]);
      }

      customElements.define(
        "color-svg",
        brisaElement(ColorSVG as any, [
          "firstColor",
          "secondColor",
          "thirdColor",
        ]),
      );

      document.body.innerHTML = `
          < color - svg firstColor = "#ff0000" secondColor = "#00ff00" thirdColor = "#0000ff" />
            `;

      const colorSVG = document.querySelector("color-svg") as HTMLElement;

      expect(colorSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7; stroke:black; stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" transform="translate(0,50)" fill="#ff0000"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(70,150)" fill="#00ff00"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(-70,150)" fill="#0000ff"></circle></g></svg>',
      );

      colorSVG.setAttribute("firstColor", "#0000ff");
      colorSVG.setAttribute("secondColor", "#ff0000");
      colorSVG.setAttribute("thirdColor", "#00ff00");

      expect(colorSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7; stroke:black; stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" transform="translate(0,50)" fill="#0000ff"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(70,150)" fill="#ff0000"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(-70,150)" fill="#00ff00"></circle></g></svg>',
      );
    });

    it.todo("should SVG work with foreingObject setting correctly the namespace outside the foreingObject node", () => {
      function SVG({ }, { h }: any) {
        return h("svg", { width: "12cm", height: "12cm" }, [
          "foreignObject",
          { width: "100%", height: "100%" },
          ["div", { xmlns: "http://www.w3.org/1999/xhtml" }, "test"],
        ]);
      }

      customElements.define("test-svg", brisaElement(SVG));
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
        '<svg width="12cm" height="12cm"><foreignobject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">test</div></foreignobject></svg>',
      );
    });

    it.todo("should work a web-component that enables the addition, removal, and repositioning of items in a list", () => {
      function MagicList({ }, { state, h }: any) {
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

        return h("div", {}, [
          [
            "form",
            { onSubmit: addItem },
            [
              [
                "input",
                { name: "item", id: "item", placeholder: "Add item" },
                "",
              ],
              ["button", {}, "add"],
            ],
          ],
          [
            "ul",
            {},
            () =>
              list.value.map((item: string, index: number) => [
                "li",
                {},
                [
                  ["button", { onClick: () => deleteItem(index) }, "delete"],
                  ["button", { onClick: () => moveItemUp(index) }, "move up"],
                  item,
                ],
              ]),
          ],
        ]);
      }

      customElements.define(
        "magic-list",
        brisaElement(MagicList as any, ["items"]),
      );

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

    it.todo("should reactively update the DOM after adding a new property to the web-component", () => {
      type Props = { count: { value: number } };
      function Test({ count }: Props, { h }: any) {
        // This is the code line after compiling: function Test({ count = 1 })
        if (count.value == null) count.value = 1;
        return h("div", {}, () => count?.value);
      }

      customElements.define(
        "test-component",
        brisaElement(Test as any, ["count"]),
      );
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>1</div>");

      testComponent.setAttribute("count", "2");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>2</div>");
    });

    it.todo("should work multi conditionals renders", () => {
      type Props = { count: { value: number } };
      function Test({ count }: Props, { h }: any) {
        return h("div", {}, [
          [
            null,
            {},
            () =>
              count.value === 1
                ? ["span", {}, "one"]
                : count.value === 2
                  ? ["span", {}, "two"]
                  : ["span", {}, "three"],
          ],
        ]);
      }

      customElements.define(
        "test-component",
        brisaElement(Test as any, ["count"]),
      );
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

    it.todo("should work nested conditionals renders", () => {
      function Test({ first, second, third }: any, { h }: any) {
        return h("div", {}, [
          null,
          {},
          () =>
            first.value === 1
              ? [
                "div",
                {},
                () =>
                  second.value === 2
                    ? [
                      "span",
                      {},
                      () => (third.value === 3 ? "test work" : "no-third"),
                    ]
                    : "no-second",
              ]
              : "no-first",
        ]);
      }

      customElements.define(
        "test-component",
        brisaElement(Test as any, ["first", "second", "third"]),
      );

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

    it.todo("should allow async/await conditional renders from state", async () => {
      function Test({ }: any, { state, h }: any) {
        const first = state(1);
        const second = state(2);
        const third = state(3);

        return h("div", { onClick: () => (second.value = 42) }, async () => {
          if (first.value === 1) {
            if (second.value === 2) {
              if (third.value === 3) {
                return "test work";
              } else {
                return "no-third";
              }
            } else {
              return `no-second ${second.value} `;
            }
          } else {
            return "no-first";
          }
        });
      }

      customElements.define("test-component", brisaElement(Test as any));

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

    it.todo("should allow async/await conditional renders from props", async () => {
      function Test({ first, second, third }: any, { h }: any) {
        return h("div", {}, async () => {
          if (first.value === 1) {
            if (second.value === 2) {
              if (third.value === 3) {
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
        });
      }

      document.body.innerHTML = "<test-async first='1' second='2' third='3' />";

      customElements.define(
        "test-async",
        brisaElement(Test as any, ["first", "second", "third"]),
      );

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

    it.todo("should be possible to create a collapsible content section with an accordion", () => {
      function Accordion({ }: any, { state, h }: any) {
        const active = state(0);

        return h("div", {}, [
          [
            "button",
            {
              onClick: () => {
                active.value = active.value === 0 ? 1 : 0;
              },
            },
            "toggle",
          ],
          [
            "div",
            {
              style: () => `display:${active.value === 0 ? "none" : "block"} `,
            },
            "content",
          ],
        ]);
      }

      customElements.define("accordion-element", brisaElement(Accordion));

      document.body.innerHTML = "<accordion-element />";

      const accordion = document.querySelector(
        "accordion-element",
      ) as HTMLElement;
      const button = accordion?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      expect(accordion?.shadowRoot?.innerHTML).toBe(
        '<div><button>toggle</button><div style="display:none">content</div></div>',
      );

      button.click();

      expect(accordion?.shadowRoot?.innerHTML).toBe(
        '<div><button>toggle</button><div style="display:block">content</div></div>',
      );

      button.click();

      expect(accordion?.shadowRoot?.innerHTML).toBe(
        '<div><button>toggle</button><div style="display:none">content</div></div>',
      );
    });

    it.todo("should display additional information on hover with a tooltip", () => {
      function Tooltip({ }, { state, h }: any) {
        const visible = state(false);

        return h("div", {}, [
          [
            "span",
            {
              onMouseOver: () => {
                visible.value = true;
              },
              onMouseOut: () => {
                visible.value = false;
              },
              style: "position:relative;",
            },
            [
              [
                "span",
                {
                  style: () =>
                    `position: absolute; visibility:${visible.value ? "visible" : "hidden"
                    }; `,
                },
                "Tooltip text",
              ],
              "Hover over me",
            ],
          ],
        ]);
      }

      customElements.define("tooltip-element", brisaElement(Tooltip));

      document.body.innerHTML = "<tooltip-element />";

      const tooltip = document.querySelector("tooltip-element") as HTMLElement;
      const span = tooltip?.shadowRoot?.querySelector(
        "span",
      ) as HTMLSpanElement;

      expect(tooltip?.shadowRoot?.innerHTML).toBe(
        '<div><span style="position:relative;"><span style="position:absolute; visibility:hidden;">Tooltip text</span>Hover over me</span></div>',
      );

      span.dispatchEvent(new Event("mouseover"));

      expect(tooltip?.shadowRoot?.innerHTML).toBe(
        '<div><span style="position:relative;"><span style="position:absolute; visibility:visible;">Tooltip text</span>Hover over me</span></div>',
      );

      span.dispatchEvent(new Event("mouseout"));

      expect(tooltip?.shadowRoot?.innerHTML).toBe(
        '<div><span style="position:relative;"><span style="position:absolute; visibility:hidden;">Tooltip text</span>Hover over me</span></div>',
      );
    });

    it.todo("should work a conditional render with different web-components", () => {
      function WebComponent1({ }, { state, h }: any) {
        const name = state("WebComponent1");
        return h(
          "div",
          {
            onClick: () => {
              name.value = "WebComponent1 updated";
            },
          },
          () => name.value,
        );
      }
      function WebComponent2({ }, { state, h }: any) {
        const name = state("WebComponent2");
        return h(
          "div",
          {
            onClick: () => {
              name.value = "WebComponent2 updated";
            },
          },
          () => name.value,
        );
      }
      function ParentWebComponent({ name }: any, { state, h }: any) {
        return h(null, {}, () =>
          name.value === "WebComponent1"
            ? ["web-component-1", {}, ""]
            : ["web-component-2", {}, ""],
        );
      }

      customElements.define("web-component-1", brisaElement(WebComponent1));
      customElements.define("web-component-2", brisaElement(WebComponent2));
      customElements.define(
        "parent-web-component",
        brisaElement(ParentWebComponent, ["name"]),
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

    it.todo('should open/close a dialog with the "open" attribute', () => {
      function Dialog({ }, { state, h }: any) {
        const open = state(false);

        return h("div", {}, [
          [
            "button",
            {
              onClick: () => {
                open.value = !open.value;
              },
            },
            "open",
          ],
          [
            "dialog",
            {
              open: () => (open.value ? _on : _off),
              onClick: () => {
                open.value = false;
              },
            },
            "dialog",
          ],
        ]);
      }

      customElements.define("dialog-element", brisaElement(Dialog));

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

    it.todo("should serialize the props consuming another web-component", () => {
      function Test({ }, { h }: any) {
        return h("web-component", { user: { name: "Aral" } }, "");
      }
      function WebComponent({ user }: any, { h }: any) {
        return h("div", {}, () => user.value.name);
      }

      customElements.define("test-component", brisaElement(Test));
      customElements.define(
        "web-component",
        brisaElement(WebComponent, ["user"]),
      );

      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;
      const webComponent = testComponent?.shadowRoot?.querySelector(
        "web-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        `< web - component user = "{'name':'Aral'}" > </web-component>`,
      );
      expect(webComponent?.shadowRoot?.innerHTML).toBe(`<div>Aral</div>`);

      webComponent.setAttribute("user", serialize({ name: "Barbara" }));

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        `<web-component user="{'name':'Barbara'}"></web-component>`,
      );
      expect(webComponent?.shadowRoot?.innerHTML).toBe(`<div>Barbara</div>`);
    });

    it.todo("should work with booleans and numbers in the same way than React", () => {
      const Component = ({ }, { h }: any) =>
        h(null, {}, [
          [null, {}, () => true && ["div", {}, "TRUE"]],
          [null, {}, () => false && ["div", {}, "FALSE"]],
          [null, {}, () => 1 && ["div", {}, "TRUE"]],
          [null, {}, () => 0 && ["div", {}, "FALSE"]],
        ]);

      customElements.define("bool-component", brisaElement(Component));

      document.body.innerHTML = "<bool-component />";
      const boolComponent = document.querySelector(
        "bool-component",
      ) as HTMLElement;

      expect(boolComponent?.shadowRoot?.innerHTML).toBe(
        "<div>TRUE</div><div>TRUE</div>0",
      );
    });

    it.todo("should work with booleans and numbers from props in the same way than React", () => {
      const Component = ({ first, second, third, fourth }: any, { h }: any) =>
        h(null, {}, [
          [null, {}, () => first.value && ["div", {}, "TRUE"]],
          [null, {}, () => second.value && ["div", {}, "FALSE"]],
          [null, {}, () => third.value && ["div", {}, "TRUE"]],
          [null, {}, () => fourth.value && ["div", {}, "FALSE"]],
        ]);

      customElements.define(
        "bool-component",
        brisaElement(Component, ["first", "second", "third", "fourth"]),
      );

      document.body.innerHTML =
        "<bool-component first='true' second='false' third='1' fourth='0' />";
      const boolComponent = document.querySelector(
        "bool-component",
      ) as HTMLElement;

      expect(boolComponent?.shadowRoot?.innerHTML).toBe(
        "<div>TRUE</div><div>TRUE</div>0",
      );
    });

    it.todo("should be possible to render undefined and null", () => {
      const Component = ({ }, { h }: any) =>
        h(null, {}, [
          ["div", { class: "empty" }, undefined],
          ["div", { class: "empty" }, null],
        ]);

      customElements.define("test-component", brisaElement(Component));

      document.body.innerHTML = "<test-component />";
      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div class="empty"></div><div class="empty"></div>',
      );
    });

    it.todo("should not be possible to inject HTML as string directly", () => {
      const Component = ({ }, { h }: any) =>
        h(null, {}, '<script>alert("test")</script>');

      customElements.define("test-component", brisaElement(Component));

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

    it.todo("should handle keyboard events", () => {
      const mockAlert = mock((s: string) => { });
      const Component = ({ }, { h }: any) =>
        h("input", {
          onKeydown: () => {
            mockAlert("Enter to onKeydown");
          },
        });

      customElements.define("keyboard-events", brisaElement(Component));

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
      expect(mockAlert).toHaveBeenCalledTimes(1);
      expect(mockAlert.mock.calls[0][0]).toBe("Enter to onKeydown");
    });

    it.todo("should handle asynchronous updates", async () => {
      const fetchData = () =>
        Promise.resolve({ json: () => Promise.resolve({ name: "Barbara" }) });
      const Component = ({ }, { state, h }: any) => {
        const user = state({ name: "Aral" });

        h(null, {}, [
          [
            "button",
            {
              onClick: async () => {
                const response = await fetchData();
                user.value = await response.json();
              },
            },
            "fetch",
          ],
          ["div", {}, () => user.value.name],
        ]);
      };

      customElements.define("async-updates", brisaElement(Component));

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

    it.todo("should update all items from a list consuming the same state signal at the same time", () => {
      const Component = ({ }, { state, h }: any) => {
        const list = state(["one", "two", "three"]);

        return h(null, {}, [
          [
            "button",
            {
              onClick: () => {
                list.value = list.value.map((item: string) =>
                  item.toUpperCase(),
                );
              },
            },
            "uppercase",
          ],
          ["ul", {}, () => list.value.map((item: string) => ["li", {}, item])],
        ]);
      };

      customElements.define("test-component", brisaElement(Component));

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

    it.todo("should be possible to update a rendered DOM element after mount via ref", async () => {
      const Component = ({ }, { onMount, state, h }: any) => {
        const ref = state(null);

        onMount(() => {
          // Is not a good practice but is just for testing
          ref.value.innerHTML = "test";
        });

        return h(null, {}, [["div", { ref }, "original"]]);
      };

      customElements.define("test-component", brisaElement(Component));
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>original</div>");

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>test</div>");
    });

    it.todo("should be possible to execute different onMount callbacks", async () => {
      const mockFirstCallback = mock((s: string) => { });
      const mockSecondCallback = mock((s: string) => { });
      const Component = ({ }, { onMount, h }: any) => {
        onMount(() => {
          mockFirstCallback("first");
        });
        onMount(() => {
          mockSecondCallback("second");
        });

        return h(null, {}, null);
      };

      customElements.define("test-component", brisaElement(Component));
      document.body.innerHTML = "<test-component />";

      await Bun.sleep(0);

      expect(mockFirstCallback).toHaveBeenCalledTimes(1);
      expect(mockFirstCallback.mock.calls[0][0]).toBe("first");
      expect(mockSecondCallback).toHaveBeenCalledTimes(1);
      expect(mockSecondCallback.mock.calls[0][0]).toBe("second");
    });

    it.todo("should cleanup an event registered on onMount when the component is unmounted", async () => {
      const mockCallback = mock((s: string) => { });
      const Component = ({ }, { onMount, cleanup, h }: any) => {
        onMount(() => {
          const onClick = () => mockCallback("click");
          document.addEventListener("click", onClick);

          cleanup(() => {
            document.removeEventListener("click", onClick);
          });
        });

        return h(null, {}, null);
      };

      customElements.define("test-component", brisaElement(Component));

      document.body.innerHTML = "<test-component />";

      await Bun.sleep(0);

      expect(mockCallback).toHaveBeenCalledTimes(0);

      document.dispatchEvent(new Event("click"));

      expect(mockCallback).toHaveBeenCalledTimes(1);

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      testComponent.remove();

      document.dispatchEvent(new Event("click"));

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it.todo("should cleanup on unmount if a cleanup callback is registered in the root of the component", () => {
      const mockCallback = mock((s: string) => { });
      const Component = ({ }, { cleanup, h }: any) => {
        cleanup(() => {
          mockCallback("cleanup");
        });

        return h(null, {}, null);
      };

      customElements.define("test-component", brisaElement(Component));

      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      testComponent.remove();

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback.mock.calls[0][0]).toBe("cleanup");
    });

    it.todo("should cleanup on unmount if a cleanup callback is registered in a nested component", () => {
      const mockCallback = mock((s: string) => { });
      const Component = ({ }, { cleanup, h }: any) => {
        cleanup(() => {
          mockCallback("cleanup");
        });

        return h(null, {}, null);
      };

      const ParentComponent = ({ }, { h }: any) => {
        return h(null, {}, [["test-component", {}, null]]);
      };

      customElements.define("test-component", brisaElement(Component));
      customElements.define("parent-component", brisaElement(ParentComponent));

      document.body.innerHTML = "<parent-component />";

      const parentComponent = document.querySelector(
        "parent-component",
      ) as HTMLElement;

      parentComponent.remove();

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback.mock.calls[0][0]).toBe("cleanup");
    });
  });
});
