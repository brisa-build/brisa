import { describe, it, expect, beforeAll, afterAll, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

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
      function EmptyNodes({}, { h }: any) {
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
      function Timer({}, { state, h }: any) {
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
      const onClickMock = mock(() => {});

      function Parent({}, { h }: any) {
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

    it("should display a color selector component", () => {
      type Props = { color: { value: string } };
      function ColorSelector({ color }: Props, { h }: any) {
        return h("div", {}, [
          [
            "input",
            {
              type: "color",
              value: () => color.value,
              onInput: (e: any) => (color.value = e.target.value),
            },
            "",
          ],
          ["span", { style: () => `color:${color.value}` }, () => color.value],
        ]);
      }

      customElements.define(
        "color-selector",
        brisaElement(ColorSelector as any, ["color"]),
      );

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
      type Props = { todos: { value: string[] } };
      function TodoList({ todos }: Props, { h }: any) {
        return h("ul", {}, () =>
          todos.value.map((todo: string) => ["li", {}, todo]),
        );
      }

      document.body.innerHTML = `
        <todo-list todos="['todo 1', 'todo 2', 'todo 3']" />
      `;

      customElements.define(
        "todo-list",
        brisaElement(TodoList as any, ["todos"]),
      );

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
      function TodoList({}, { state, h }: any) {
        const todos = state(["todo 1", "todo 2", "todo 3"]);
        const newTodo = state("");
        const addTodo = () => {
          todos.value = [...todos.value, newTodo.value];
          newTodo.value = "";
        };

        return h("div", {}, [
          [
            "input",
            {
              value: () => newTodo.value,
              onInput: (e: any) => (newTodo.value = e.target.value),
            },
            "",
          ],
          ["button", { onClick: addTodo }, "Add"],
          ["ul", {}, () => todos.value.map((todo: string) => ["li", {}, todo])],
        ]);
      }

      customElements.define("todo-list", brisaElement(TodoList as any));
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
      function Image({}, { h }: any) {
        return h(
          "img",
          {
            src: "https://test.com/image.png",
            onError: (e: any) => {
              e.target.src = "https://test.com/error.png";
            },
          },
          "",
        );
      }

      customElements.define("test-image", brisaElement(Image));
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
      function Image({}, { state, h }: any) {
        const src = state("https://test.com/image.png");

        return h(
          "img",
          {
            src: () => src.value,
            onError: () => {
              src.value = "https://test.com/error.png";
            },
          },
          "",
        );
      }

      customElements.define("test-image", brisaElement(Image));
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
      const mockEffect = mock((n: number) => {});
      let interval: any;

      function Test({}, { state, effect, h }: any) {
        const count = state(0);

        interval = setInterval(() => {
          count.value++;
        }, 1);

        effect(() => {
          mockEffect(count.value);
        });

        return h("div", {}, () => count.value);
      }

      customElements.define("test-component", brisaElement(Test));
      document.body.innerHTML = "<test-component />";
      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>0</div>");
      expect(mockEffect).toHaveBeenCalledTimes(1);

      setTimeout(() => {
        expect(testComponent?.shadowRoot?.innerHTML).toBe("<div>1</div>");
        expect(mockEffect).toHaveBeenCalledTimes(2);
        testComponent.remove();
      }, 1);

      setTimeout(() => {
        expect(testComponent?.shadowRoot?.innerHTML).toBe("");
        expect(mockEffect).toHaveBeenCalledTimes(2);
        clearInterval(interval);
      }, 2);
    });

    it("should reset the state when some props change via effect", () => {
      function Test({ count }: any, { state, effect, h }: any) {
        const lastCount = state(0);
        const countState = state(count);

        effect(() => {
          if (lastCount.value !== count.value) {
            countState.value = count.value;
            lastCount.value = count.value;
          }
        });

        return h("", {}, [
          ["div", {}, () => countState.value],
          ["button", { onClick: () => countState.value++ }, "increment"],
        ]);
      }

      customElements.define("test-component", brisaElement(Test, ["count"]));
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
      async function AsyncComponent({}, { state, h }: any) {
        const count = state(await Promise.resolve(42));

        return h("div", {}, () => count.value);
      }

      customElements.define("async-component", brisaElement(AsyncComponent));
      document.body.innerHTML = "<async-component />";

      const asyncComponent = document.querySelector(
        "async-component",
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(asyncComponent?.shadowRoot?.innerHTML).toBe("<div>42</div>");
    });

    it("should work an async effect inside a web-component", async () => {
      async function AsyncComponent({}, { state, effect, h }: any) {
        const count = state(0);

        effect(async () => {
          await Bun.sleep(0);
          count.value = 42;
        });

        return h("div", {}, () => count.value);
      }

      customElements.define("async-component", brisaElement(AsyncComponent));
      document.body.innerHTML = "<async-component />";

      const asyncComponent = document.querySelector(
        "async-component",
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(asyncComponent?.shadowRoot?.innerHTML).toBe("<div>42</div>");
    });

    it("should cleanup everytime an effect is re-called", () => {
      const mockEffect = mock((num: number) => {});
      const mockCleanup = mock(() => {});

      function Test({}, { state, effect, cleanup, h }: any) {
        const count = state(0);

        effect(() => {
          mockEffect(count.value);
          cleanup(() => {
            mockCleanup();
          });
        });

        return h("button", { onClick: () => count.value++ }, "click");
      }

      customElements.define("test-component", brisaElement(Test));
      document.body.innerHTML = "<test-component />";
      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      const button = testComponent?.shadowRoot?.querySelector(
        "button",
      ) as HTMLButtonElement;

      expect(mockEffect).toHaveBeenCalledTimes(1);
      expect(mockCleanup).toHaveBeenCalledTimes(0);

      button.click();

      expect(mockEffect).toHaveBeenCalledTimes(2);
      expect(mockCleanup).toHaveBeenCalledTimes(1);

      button.click();

      expect(mockEffect).toHaveBeenCalledTimes(3);
      expect(mockCleanup).toHaveBeenCalledTimes(2);
    });

    it("should cleanup everytime the web-component is unmount", () => {
      const mockEffect = mock(() => {});
      const mockCleanup = mock(() => {});

      function Test({}, { effect, cleanup, h }: any) {
        effect(() => {
          mockEffect();
          cleanup(() => mockCleanup());
        });

        return h("div", {}, "");
      }

      customElements.define("test-component", brisaElement(Test));
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(mockEffect).toHaveBeenCalledTimes(1);
      expect(mockCleanup).toHaveBeenCalledTimes(0);

      testComponent.remove();

      expect(mockEffect).toHaveBeenCalledTimes(1);
      expect(mockCleanup).toHaveBeenCalledTimes(1);
    });

    it("should cleanup async cleanups when the web-component is unmount", async () => {
      const mockEffect = mock(() => {});
      const mockCleanup = mock(() => {});

      function Test({}, { effect, cleanup, h }: any) {
        effect(async () => {
          mockEffect();
          cleanup(async () => mockCleanup());
        });

        return h("div", {}, "");
      }

      customElements.define("test-component", brisaElement(Test));
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(mockEffect).toHaveBeenCalledTimes(1);
      expect(mockCleanup).toHaveBeenCalledTimes(0);

      testComponent.remove();

      expect(mockEffect).toHaveBeenCalledTimes(1);
      expect(mockCleanup).toHaveBeenCalledTimes(1);
    });

    it("should cleanup multi cleanups inside an effect when the web-component is unmount", async () => {
      const mockEffect = mock(() => {});
      const mockCleanup = mock(() => {});

      function Test({}, { effect, cleanup, h }: any) {
        effect(async () => {
          mockEffect();
          cleanup(async () => mockCleanup());
          cleanup(async () => mockCleanup());
        });

        return h("div", {}, "");
      }

      customElements.define("test-component", brisaElement(Test));
      document.body.innerHTML = "<test-component />";

      const testComponent = document.querySelector(
        "test-component",
      ) as HTMLElement;

      expect(mockEffect).toHaveBeenCalledTimes(1);
      expect(mockCleanup).toHaveBeenCalledTimes(0);

      testComponent.remove();

      expect(mockEffect).toHaveBeenCalledTimes(1);
      expect(mockCleanup).toHaveBeenCalledTimes(2);
    });

    it("should work with reactivity props in a SVG component", () => {
      function ColorSVG({ color1, color2, color3 }: any, { h }: any) {
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
                  fill: () => color1.value,
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
                  fill: () => color2.value,
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
                  fill: () => color3.value,
                  transform: "translate(-70,150)",
                },
                "",
              ],
            ],
          ],
        ]);
      }

      document.body.innerHTML = `
        <color-svg color1="#ff0000" color2="#00ff00" color3="#0000ff" />
      `;

      customElements.define(
        "color-svg",
        brisaElement(ColorSVG as any, ["color1", "color2", "color3"]),
      );

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

    it("should work reactivity if props that are written in camelCase", () => {
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
          <color-svg firstColor="#ff0000" secondColor="#00ff00" thirdColor="#0000ff" />
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

    it.todo(
      "should SVG work with foreingObject setting correctly the namespace outside the foreingObject node",
      () => {},
    );

    it.todo(
      "should reactively update the DOM after adding a new property to the web-component",
      () => {},
    );

    it.todo(
      "should work reactivity with default props and then with a new prop value",
      () => {},
    );
  });
});
