import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { serialize } from "../serialization";
import transformJSXToReactive from ".";
import dangerHTML from "../danger-html";

declare global {
  interface Window {
    [key: string]: any;
  }
}

const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');

function defineBrisaWebComponent(code: string, path: string) {
  const componentName = path.split("/").pop()?.split(".")[0] as string;

  const webComponent = toInline(transformJSXToReactive(code, path))
    .replace('import {brisaElement, _on, _off} from "brisa/client"', "")
    .replace("export default", "");

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
      window.dangerHTML = dangerHTML;
    });
    afterEach(async () => {
      if (typeof window !== "undefined") GlobalRegistrator.unregister();
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
        "button"
      ) as NodeListOf<HTMLButtonElement>;

      expect(counter?.shadowRoot?.innerHTML).toBe(
        '<p class="even"><button>+</button><span> Aral 0 </span><button>-</button><slot></slot></p>'
      );
      inc.click();
      expect(counter?.shadowRoot?.innerHTML).toBe(
        '<p class=""><button>+</button><span> Aral 1 </span><button>-</button><slot></slot></p>'
      );
      counter.setAttribute("name", "Another name");
      expect(counter?.shadowRoot?.innerHTML).toBe(
        '<p class=""><button>+</button><span> Another name 1 </span><button>-</button><slot></slot></p>'
      );
      dec.click();
      expect(counter?.shadowRoot?.innerHTML).toBe(
        '<p class="even"><button>+</button><span> Another name 0 </span><button>-</button><slot></slot></p>'
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
        "src/web-components/conditional-render.tsx"
      );

      document.body.innerHTML = `
        <conditional-render name="Aral">
          <span>test</span>
        </conditional-render>
      `;

      const conditionalRender = document.querySelector(
        "conditional-render"
      ) as HTMLElement;

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Aral</b><span>🥴</span></h2><slot></slot>"
      );

      conditionalRender.setAttribute("name", "Barbara");

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Barbara</b><span><b>!! 🥳</b></span></h2><slot></slot>"
      );

      conditionalRender.setAttribute("name", "Aral");

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Aral</b><span>🥴</span></h2><slot></slot>"
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
        "src/web-components/conditional-render.tsx"
      );

      document.body.innerHTML = `
        <conditional-render name="Aral">
          <span>test</span>
        </conditional-render>
      `;

      const conditionalRender = document.querySelector(
        "conditional-render"
      ) as HTMLElement;

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Aral</b>🥴<slot></slot></h2>"
      );

      conditionalRender.setAttribute("name", "Barbara");

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Barbara</b><b>!! 🥳</b><slot></slot></h2>"
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
        "src/web-components/conditional-render.tsx"
      );

      document.body.innerHTML = `
        <conditional-render name="Aral">
          <span>test</span>
        </conditional-render>
      `;

      const conditionalRender = document.querySelector(
        "conditional-render"
      ) as HTMLElement;

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Aral</b>🥴</h2><slot></slot>"
      );

      conditionalRender.setAttribute("name", "Barbara");

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Barbara</b><b>!! 🥳</b></h2><slot></slot>"
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
        "src/web-components/conditional-render.tsx"
      );

      document.body.innerHTML = `
          <conditional-render name="Aral">
            <span>test</span>
          </conditional-render>
        `;

      const conditionalRender = document.querySelector(
        "conditional-render"
      ) as HTMLElement;

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Aral</b>🥴<slot></slot></h2>"
      );

      conditionalRender.setAttribute("name", "Barbara");

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        "<h2><b>Hello Barbara</b><b>!! 🥳</b><i> this is a </i> test<slot></slot></h2>"
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
        "<div><span></span></div>"
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
        "sliding-carousel"
      ) as HTMLElement;
      const [prev, next] = carousel?.shadowRoot?.querySelectorAll(
        "button"
      ) as NodeListOf<HTMLButtonElement>;

      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300"><button>next</button></div>'
      );
      next.click();
      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300?grayscale"><button>next</button></div>'
      );
      next.click();
      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300"><button>next</button></div>'
      );
      prev.click();
      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300?grayscale"><button>next</button></div>'
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
        "button"
      ) as NodeListOf<HTMLButtonElement>;

      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300"><button>next</button></div>'
      );
      next.click();
      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300?grayscale"><button>next</button></div>'
      );
      next.click();
      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300"><button>next</button></div>'
      );
      prev.click();
      expect(carousel?.shadowRoot?.innerHTML).toBe(
        '<div><button>prev</button><img src="https://picsum.photos/200/300?grayscale"><button>next</button></div>'
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
      }`;

      defineBrisaWebComponent(code, "src/web-components/timer-component.tsx");

      document.body.innerHTML = `
        <timer-component></timer-component>
      `;

      const timer = document.querySelector("timer-component") as HTMLElement;
      const button = timer?.shadowRoot?.querySelector(
        "button"
      ) as HTMLButtonElement;

      expect(timer?.shadowRoot?.innerHTML).toBe(
        "<div><span>Time: 0</span><button>stop</button></div>"
      );

      setTimeout(() => {
        expect(timer?.shadowRoot?.innerHTML).toBe(
          "<div><span>Time: 1</span><button>stop</button></div>"
        );
      }, 1);

      button.click();

      setTimeout(() => {
        expect(timer?.shadowRoot?.innerHTML).toBe(
          "<div><span>Time: 1</span><button>stop</button></div>"
        );
      }, 1);
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
        "button"
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
        "src/web-components/second-component.tsx"
      );
      defineBrisaWebComponent(
        firstCode,
        "src/web-components/first-component.tsx"
      );
      defineBrisaWebComponent(
        parentCode,
        "src/web-components/parent-component.tsx"
      );

      document.body.innerHTML = "<parent-component />";

      const parentComponent = document.querySelector(
        "parent-component"
      ) as HTMLElement;

      const firstComponent = parentComponent?.shadowRoot?.querySelector(
        "first-component"
      ) as HTMLElement;

      const secondComponent = firstComponent?.shadowRoot?.querySelector(
        "second-component"
      ) as HTMLElement;

      expect(parentComponent?.shadowRoot?.innerHTML).toBe(
        "<first-component>click me</first-component>"
      );

      expect(firstComponent?.shadowRoot?.innerHTML).toBe(
        "<second-component><slot></slot></second-component>"
      );

      expect(secondComponent?.shadowRoot?.innerHTML).toBe(
        "<button><slot></slot></button>"
      );

      const button = secondComponent?.shadowRoot?.querySelector(
        "button"
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
      }`;

      defineBrisaWebComponent(code, "src/web-components/color-selector.tsx");

      document.body.innerHTML = `
        <color-selector color="#000000" />
      `;

      const colorSelector = document.querySelector(
        "color-selector"
      ) as HTMLElement;

      const input = colorSelector?.shadowRoot?.querySelector(
        "input"
      ) as HTMLInputElement;

      expect(colorSelector?.shadowRoot?.innerHTML).toBe(
        '<div><input type="color" value="#000000"><span style="color:#000000">#000000</span></div>'
      );

      input.value = "#ffffff";

      input.dispatchEvent(new Event("input"));

      expect(colorSelector?.shadowRoot?.innerHTML).toBe(
        '<div><input type="color" value="#ffffff"><span style="color:#ffffff">#ffffff</span></div>'
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
        "<ul><li>todo 1</li><li>todo 2</li><li>todo 3</li></ul>"
      );

      todoList.setAttribute("todos", '["todo 4", "todo 5"]');

      expect(todoList?.shadowRoot?.innerHTML).toBe(
        "<ul><li>todo 4</li><li>todo 5</li></ul>"
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
        "input"
      ) as HTMLInputElement;

      const button = todoList?.shadowRoot?.querySelector(
        "button"
      ) as HTMLButtonElement;

      expect(todoList?.shadowRoot?.innerHTML).toBe(
        '<div><input value=""><button>Add</button><ul><li>todo 1</li><li>todo 2</li><li>todo 3</li></ul></div>'
      );

      input.value = "todo 4";

      input.dispatchEvent(new Event("input"));

      expect(todoList?.shadowRoot?.innerHTML).toBe(
        '<div><input value="todo 4"><button>Add</button><ul><li>todo 1</li><li>todo 2</li><li>todo 3</li></ul></div>'
      );

      button.click();

      expect(todoList?.shadowRoot?.innerHTML).toBe(
        '<div><input value=""><button>Add</button><ul><li>todo 1</li><li>todo 2</li><li>todo 3</li><li>todo 4</li></ul></div>'
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
        "img"
      ) as HTMLImageElement;

      expect(testImage?.shadowRoot?.innerHTML).toBe(
        '<img src="https://test.com/image.png">'
      );
      img.dispatchEvent(new Event("error"));
      expect(testImage?.shadowRoot?.innerHTML).toBe(
        '<img src="https://test.com/error.png">'
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
        "img"
      ) as HTMLImageElement;

      expect(testImage?.shadowRoot?.innerHTML).toBe(
        '<img src="https://test.com/image.png">'
      );
      img.dispatchEvent(new Event("error"));
      expect(testImage?.shadowRoot?.innerHTML).toBe(
        '<img src="https://test.com/error.png">'
      );
    });

    it("should unregister effects when the component is disconnected", () => {
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
        "test-component"
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
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component count='1' />";

      const testComponent = document.querySelector(
        "test-component"
      ) as HTMLElement;

      const button = testComponent?.shadowRoot?.querySelector(
        "button"
      ) as HTMLButtonElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div>1</div><button>increment</button>"
      );

      button.click();

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div>2</div><button>increment</button>"
      );

      testComponent.setAttribute("count", "3");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div>3</div><button>increment</button>"
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
        "async-component"
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
        "async-component"
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(asyncComponent?.shadowRoot?.innerHTML).toBe("<div>42</div>");
    });

    it("should cleanup everytime an effect is re-called", () => {
      window.mockEffect = mock((num: number) => {});
      window.mockCleanup = mock(() => {});

      const code = `export default function Test({ }, { state, effect, cleanup }: any) {
        const count = state(0);

        effect(() => {
          window.mockEffect(count.value);
          cleanup(() => {
            window.mockCleanup();
          });
        });

        return <button onClick={() => count.value++}>click</button>
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";
      const testComponent = document.querySelector(
        "test-component"
      ) as HTMLElement;

      const button = testComponent?.shadowRoot?.querySelector(
        "button"
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
        "cleanup-component"
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
        "test-component"
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
        "test-component"
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
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7; stroke:black; stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" fill="#ff0000" transform="translate(0,50)"></circle><circle cx="6cm" cy="2cm" r="100" fill="#00ff00" transform="translate(70,150)"></circle><circle cx="6cm" cy="2cm" r="100" fill="#0000ff" transform="translate(-70,150)"></circle></g></svg>'
      );

      colorSVG.setAttribute("color1", "#0000ff");
      colorSVG.setAttribute("color2", "#ff0000");
      colorSVG.setAttribute("color3", "#00ff00");

      expect(colorSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7; stroke:black; stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" transform="translate(0,50)" fill="#0000ff"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(70,150)" fill="#ff0000"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(-70,150)" fill="#00ff00"></circle></g></svg>'
      );
    });

    it("should work reactivity if props that are written in camelCase", () => {
      const code = `export default function ColorSVG({ firstColor, secondColor, thirdColor }) {
        return (
          <svg width="12cm" height="12cm">
            <g style="fill-opacity:0.7; stroke:black; stroke-width:0.1cm;">
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
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7; stroke:black; stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" transform="translate(0,50)" fill="#ff0000"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(70,150)" fill="#00ff00"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(-70,150)" fill="#0000ff"></circle></g></svg>'
      );

      colorSVG.setAttribute("firstColor", "#0000ff");
      colorSVG.setAttribute("secondColor", "#ff0000");
      colorSVG.setAttribute("thirdColor", "#00ff00");

      expect(colorSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7; stroke:black; stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" transform="translate(0,50)" fill="#0000ff"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(70,150)" fill="#ff0000"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(-70,150)" fill="#00ff00"></circle></g></svg>'
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
        "foreignObject"
      ) as SVGElement;
      const div = testSVG?.shadowRoot?.querySelector("div") as HTMLElement;

      expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
      expect(foreignObject.namespaceURI).toBe("http://www.w3.org/2000/svg");
      expect(div.namespaceURI).toBe("http://www.w3.org/1999/xhtml");

      expect(testSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><foreignobject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">test</div></foreignobject></svg>'
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
        "form"
      ) as HTMLFormElement;
      const input = magicList?.shadowRoot?.querySelector(
        "input"
      ) as HTMLInputElement;

      expect(magicList?.shadowRoot?.innerHTML).toBe(
        '<div><form><input name="item" id="item" placeholder="Add item"><button>add</button></form><ul><li><button>delete</button><button>move up</button>some</li><li><button>delete</button><button>move up</button>another</li></ul></div>'
      );

      // Adding a new item
      input.value = "test";
      form.dispatchEvent(new Event("submit"));
      expect(magicList?.shadowRoot?.innerHTML).toBe(
        '<div><form><input name="item" id="item" placeholder="Add item"><button>add</button></form><ul><li><button>delete</button><button>move up</button>some</li><li><button>delete</button><button>move up</button>another</li><li><button>delete</button><button>move up</button>test</li></ul></div>'
      );

      // Moving up the last item
      const moveUpButton = [
        ...(magicList?.shadowRoot?.querySelectorAll(
          "button"
        ) as NodeListOf<HTMLButtonElement>),
      ].at(-1) as HTMLButtonElement;
      moveUpButton.click();
      expect(magicList?.shadowRoot?.innerHTML).toBe(
        '<div><form><input name="item" id="item" placeholder="Add item"><button>add</button></form><ul><li><button>delete</button><button>move up</button>some</li><li><button>delete</button><button>move up</button>test</li><li><button>delete</button><button>move up</button>another</li></ul></div>'
      );

      // Deleting the last item
      const deleteLast = () =>
        (
          [
            ...(magicList?.shadowRoot?.querySelectorAll(
              "button"
            ) as NodeListOf<HTMLButtonElement>),
          ].at(-2) as HTMLButtonElement
        ).click();
      deleteLast();
      expect(magicList?.shadowRoot?.innerHTML).toBe(
        '<div><form><input name="item" id="item" placeholder="Add item"><button>add</button></form><ul><li><button>delete</button><button>move up</button>some</li><li><button>delete</button><button>move up</button>test</li></ul></div>'
      );

      // Deleting all items
      deleteLast();
      deleteLast();

      expect(magicList?.shadowRoot?.innerHTML).toBe(
        '<div><form><input name="item" id="item" placeholder="Add item"><button>add</button></form><ul></ul></div>'
      );
    });

    it("should reactively update the DOM after adding a new property to the web-component", () => {
      const code = `export default function Test({ count = 1 }: any) {
        return <div>{count}</div>
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component"
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
        "test-component"
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><span>one</span></div>"
      );

      testComponent.setAttribute("count", "2");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><span>two</span></div>"
      );

      testComponent.setAttribute("count", "3");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><span>three</span></div>"
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
        "test-component"
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><div><span>test work</span></div></div>"
      );

      testComponent.setAttribute("first", "2");

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>no-first</div>");

      testComponent.setAttribute("first", "1");
      testComponent.setAttribute("second", "3");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><div>no-second</div></div>"
      );

      testComponent.setAttribute("second", "2");
      testComponent.setAttribute("third", "4");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><div><span>no-third</span></div></div>"
      );

      testComponent.setAttribute("third", "3");

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><div><span>test work</span></div></div>"
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
        "test-component"
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>test work</div>");

      (testComponent.shadowRoot?.firstChild as HTMLElement).click();

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div>no-second 42</div>"
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
            <div style={\`display:\${active.value === 0 ? "none" : "block"}\`} >content</div>
          </div>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/accordion-element.tsx");

      document.body.innerHTML = "<accordion-element />";

      const accordion = document.querySelector(
        "accordion-element"
      ) as HTMLElement;
      const button = accordion?.shadowRoot?.querySelector(
        "button"
      ) as HTMLButtonElement;

      expect(accordion?.shadowRoot?.innerHTML).toBe(
        '<div><button>toggle</button><div style="display:none">content</div></div>'
      );

      button.click();

      expect(accordion?.shadowRoot?.innerHTML).toBe(
        '<div><button>toggle</button><div style="display:block">content</div></div>'
      );

      button.click();

      expect(accordion?.shadowRoot?.innerHTML).toBe(
        '<div><button>toggle</button><div style="display:none">content</div></div>'
      );
    });

    it("should display additional information on hover with a tooltip", () => {
      const code = `export default function Tooltip({ }, { state }: any) {
        const visible = state(false);

        return (
          <div>
            <span onMouseOver={() => visible.value = true} onMouseOut={() => visible.value = false} style="position:relative;">
              <span style={\`position:absolute; visibility:\${visible.value ? "visible" : "hidden"};\`} >Tooltip text</span>
              Hover over me
            </span>
          </div>
        );
      }`;

      defineBrisaWebComponent(code, "src/web-components/tooltip-element.tsx");

      document.body.innerHTML = "<tooltip-element />";

      const tooltip = document.querySelector("tooltip-element") as HTMLElement;
      const span = tooltip?.shadowRoot?.querySelector(
        "span"
      ) as HTMLSpanElement;

      expect(tooltip?.shadowRoot?.innerHTML).toBe(
        '<div><span style="position:relative;"><span style="position:absolute; visibility:hidden;">Tooltip text</span>Hover over me</span></div>'
      );

      span.dispatchEvent(new Event("mouseover"));

      expect(tooltip?.shadowRoot?.innerHTML).toBe(
        '<div><span style="position:relative;"><span style="position:absolute; visibility:visible;">Tooltip text</span>Hover over me</span></div>'
      );

      span.dispatchEvent(new Event("mouseout"));

      expect(tooltip?.shadowRoot?.innerHTML).toBe(
        '<div><span style="position:relative;"><span style="position:absolute; visibility:hidden;">Tooltip text</span>Hover over me</span></div>'
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
        "src/web-components/parent-web-component.tsx"
      );
      document.body.innerHTML = '<parent-web-component name="WebComponent1" />';

      const parentWebComponent = document.querySelector(
        "parent-web-component"
      ) as HTMLElement;
      const firstWebComponent = parentWebComponent?.shadowRoot?.querySelector(
        "web-component-1"
      ) as HTMLElement;
      const firstDiv = firstWebComponent?.shadowRoot?.querySelector(
        "div"
      ) as HTMLElement;

      // The first component should be mounted
      expect(parentWebComponent?.shadowRoot?.innerHTML).toBe(
        "<web-component-1></web-component-1>"
      );
      expect(firstWebComponent?.shadowRoot?.innerHTML).toBe(
        "<div>WebComponent1</div>"
      );

      // The first component should be updated
      firstDiv.click();
      expect(firstWebComponent?.shadowRoot?.innerHTML).toBe(
        "<div>WebComponent1 updated</div>"
      );

      // Changing the conditional render on the parent component
      parentWebComponent.setAttribute("name", "WebComponent2");
      const secondWebComponent = parentWebComponent?.shadowRoot?.querySelector(
        "web-component-2"
      ) as HTMLElement;
      const secondDiv = secondWebComponent?.shadowRoot?.querySelector(
        "div"
      ) as HTMLElement;

      // The second component should be mounted
      expect(parentWebComponent?.shadowRoot?.innerHTML).toBe(
        "<web-component-2></web-component-2>"
      );
      expect(secondWebComponent?.shadowRoot?.innerHTML).toBe(
        "<div>WebComponent2</div>"
      );

      // The second component should be updated
      secondDiv.click();
      expect(secondWebComponent?.shadowRoot?.innerHTML).toBe(
        "<div>WebComponent2 updated</div>"
      );

      // Changing the conditional render on the parent component again to the first component
      parentWebComponent.setAttribute("name", "WebComponent1");
      const firstComponent = parentWebComponent?.shadowRoot?.querySelector(
        "web-component-1"
      ) as HTMLElement;

      // The first component should be unmounted and the state should be reset
      expect(parentWebComponent?.shadowRoot?.innerHTML).toBe(
        "<web-component-1></web-component-1>"
      );
      expect(firstComponent?.shadowRoot?.innerHTML).toBe(
        "<div>WebComponent1</div>"
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
        "button"
      ) as HTMLButtonElement;
      const dialogElement = dialog?.shadowRoot?.querySelector(
        "dialog"
      ) as HTMLDialogElement;

      expect(dialog?.shadowRoot?.innerHTML).toBe(
        "<div><button>open</button><dialog>dialog</dialog></div>"
      );

      button.click();

      expect(dialog?.shadowRoot?.innerHTML).toBe(
        '<div><button>open</button><dialog open="">dialog</dialog></div>'
      );

      dialogElement.click();

      expect(dialog?.shadowRoot?.innerHTML).toBe(
        "<div><button>open</button><dialog>dialog</dialog></div>"
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
        "{ 'stack': 'stack', 'message': 'message' }"
      );

      expect(runtimeLog?.shadowRoot?.innerHTML).toBe(
        '<dialog open="">Error: message<pre>stack</pre></dialog>'
      );

      runtimeLog.removeAttribute("error");

      expect(runtimeLog?.shadowRoot?.innerHTML).toBe("<dialog></dialog>");

      runtimeLog.setAttribute("warning", "warning");

      expect(runtimeLog?.shadowRoot?.innerHTML).toBe(
        '<dialog open="">Warning: warning</dialog>'
      );

      runtimeLog.removeAttribute("warning");

      expect(runtimeLog?.shadowRoot?.innerHTML).toBe("<dialog></dialog>");
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
        "src/web-components/test-component.tsx"
      );
      defineBrisaWebComponent(wc, "src/web-components/web-component.tsx");

      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component"
      ) as HTMLElement;
      const webComponent = testComponent?.shadowRoot?.querySelector(
        "web-component"
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        `<web-component user="{'name':'Aral'}"></web-component>`
      );
      expect(webComponent?.shadowRoot?.innerHTML).toBe(`<div>Aral</div>`);

      webComponent.setAttribute("user", serialize({ name: "Barbara" }));

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        `<web-component user="{'name':'Barbara'}"></web-component>`
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
        "bool-component"
      ) as HTMLElement;

      expect(boolComponent?.shadowRoot?.innerHTML).toBe(
        "<div>TRUE</div><div>TRUE</div>0"
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
        "bool-component"
      ) as HTMLElement;

      expect(boolComponent?.shadowRoot?.innerHTML).toBe(
        "<div>TRUE</div><div>TRUE</div>0"
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
        "test-component"
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div class="empty"></div><div class="empty"></div>'
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
        "test-component"
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<script>alert("test")</script>'
      );

      const script = document.querySelector("script");

      expect(script).toBeNull();
      expect(
        testComponent?.shadowRoot?.firstChild?.nodeType === Node.TEXT_NODE
      ).toBeTruthy();
    });

    it("should handle keyboard events", () => {
      window.mockAlert = mock((s: string) => {});
      const code = `export default () => <input onKeyDown={() => window.mockAlert("Enter to onKeyDown")} />;`;

      defineBrisaWebComponent(code, "src/web-components/keyboard-events.tsx");
      document.body.innerHTML = "<keyboard-events />";

      const keyboardEventEl = document.querySelector(
        "keyboard-events"
      ) as HTMLElement;

      expect(keyboardEventEl?.shadowRoot?.innerHTML).toBe("<input>");

      const input = keyboardEventEl?.shadowRoot?.querySelector(
        "input"
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
        "async-updates"
      ) as HTMLElement;

      expect(asyncUpdatesComp?.shadowRoot?.innerHTML).toBe(
        "<button>fetch</button><div>Aral</div>"
      );

      const button = asyncUpdatesComp?.shadowRoot?.querySelector(
        "button"
      ) as HTMLButtonElement;

      button.click();

      expect(asyncUpdatesComp?.shadowRoot?.innerHTML).toBe(
        "<button>fetch</button><div>Aral</div>"
      );

      await Bun.sleep(0);

      expect(asyncUpdatesComp?.shadowRoot?.innerHTML).toBe(
        "<button>fetch</button><div>Barbara</div>"
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
        "test-component"
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<button>uppercase</button><ul><li>one</li><li>two</li><li>three</li></ul>"
      );

      const button = testComponent?.shadowRoot?.querySelector(
        "button"
      ) as HTMLButtonElement;

      button.click();

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<button>uppercase</button><ul><li>ONE</li><li>TWO</li><li>THREE</li></ul>"
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
        "test-component"
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
        "test-component"
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
        "test-component"
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
        "src/web-components/test-component.tsx"
      );
      defineBrisaWebComponent(
        parentComp,
        "src/web-components/parent-component.tsx"
      );
      document.body.innerHTML = "<parent-component />";

      const parentComponent = document.querySelector(
        "parent-component"
      ) as HTMLElement;

      parentComponent.remove();

      expect(window.mockCallback).toHaveBeenCalledTimes(1);
      expect(window.mockCallback.mock.calls[0][0]).toBe("cleanup");
    });

    it("should add a default value defined inside the body with || operator", () => {
      const code = `export default ({ name }: any) => {
        const superName = name || "Aral";
        return <div>{superName}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component"
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "Barbara");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Barbara</div>");

      testComponent.setAttribute("name", "");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");
    });

    it("should add a default value defined inside the body with props identifier and || operator", () => {
      const code = `export default (props: any) => {
        const superName = props.name || "Aral";
        return <div>{superName}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component"
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "Barbara");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Barbara</div>");

      testComponent.setAttribute("name", "");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");
    });

    it("should add a default value defined inside the body with ?? operator", () => {
      const code = `export default ({ name }: any) => {
        const superName = name ?? "Aral";
        return <div>{superName}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component"
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "Barbara");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Barbara</div>");

      testComponent.setAttribute("name", "");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div></div>");

      testComponent.removeAttribute("name");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");
    });

    it("should add a default value defined inside the body with props identifier and ?? operator", () => {
      const code = `export default (props: any) => {
        const superName = props.name ?? "Aral";
        return <div>{superName}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component"
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");

      testComponent.setAttribute("name", "Barbara");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Barbara</div>");

      testComponent.setAttribute("name", "");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div></div>");

      testComponent.removeAttribute("name");
      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>Aral</div>");
    });

    it("should NOT add a default value overwritting empty string using ?? operator", () => {
      const code = `export default ({ name }: any) => {
        const superName = name ?? "Aral";
        return <div>{superName}</div>;
      }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = '<test-component name="" />';

      const testComponent = document.querySelector(
        "test-component"
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div></div>");
    });

    it("should add a default value overwritting empty string using || operator", () => {
      const code = `export default ({ name }: any) => {
          const superName = name || "Aral";
          return <div>{superName}</div>;
        }`;

      defineBrisaWebComponent(code, "src/web-components/test-component.tsx");
      document.body.innerHTML = '<test-component name="" />';

      const testComponent = document.querySelector(
        "test-component"
      ) as HTMLElement;

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
        "test-component"
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div><script>alert("test")</script></div>'
      );

      const script = testComponent?.shadowRoot?.querySelector("script");

      expect(script).toBeDefined();
    });
  });
});
