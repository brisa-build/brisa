import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import createPortal from '@/utils/create-portal';
import dangerHTML from '@/utils/danger-html';
import { serialize } from '@/utils/serialization';
import createContext from '@/utils/create-context';
import type { BrisaContext, WebContext, WebContextPlugin } from '@/types';

let brisaElement: typeof import('.').default;
let _on: typeof import('.')._on;
let _off: typeof import('.')._off;

declare global {
  interface Window {
    onAfterClick: () => void;
  }
}

describe('utils', () => {
  describe('brisa-element', () => {
    beforeEach(async () => {
      GlobalRegistrator.register();
      window.__WEB_CONTEXT_PLUGINS__ = false;
      window.__BASE_PATH__ = '';
      window.__TRAILING_SLASH__ = false;
      window.__USE_LOCALE__ = false;
      window.__USE_PAGE_TRANSLATION__ = false;
      window.__ASSET_PREFIX__ = '';
      window.fPath = undefined;
      const module = await import('.');
      brisaElement = module.default;
      _on = module._on;
      _off = module._off;
    });
    afterEach(() => {
      window.__WEB_CONTEXT_PLUGINS__ = false;
      window.__BASE_PATH__ = '';
      window.__ASSET_PREFIX__ = '';
      window.__TRAILING_SLASH__ = false;
      window.__USE_LOCALE__ = false;
      window.__USE_PAGE_TRANSLATION__ = false;
      window.fPath = undefined;
      GlobalRegistrator.unregister();
    });
    it('should work props and state with a counter', () => {
      type Props = { name: { value: string }; children: Node };
      function Counter({ name, children }: Props, { state }: any) {
        const count = state(0);

        return [
          'p',
          { class: () => (count.value % 2 === 0 ? 'even' : '') },
          [
            ['button', { onClick: () => count.value++ }, '+'],
            ['span', {}, () => ` ${name.value} ${count.value} `],
            ['button', { onClick: () => count.value-- }, '-'],
            children,
          ],
        ];
      }

      customElements.define(
        'test-counter',
        brisaElement(Counter as any, ['name']),
      );

      document.body.innerHTML = `
        <test-counter name="Aral">
          <span>test</span>
        </test-counter>
      `;

      const counter = document.querySelector('test-counter') as HTMLElement;
      const [inc, dec] = counter?.shadowRoot?.querySelectorAll(
        'button',
      ) as NodeListOf<HTMLButtonElement>;

      expect(counter?.shadowRoot?.innerHTML).toBe(
        '<p class="even"><button>+</button><span> Aral 0 </span><button>-</button><slot></slot></p>',
      );
      inc.click();
      expect(counter?.shadowRoot?.innerHTML).toBe(
        '<p class=""><button>+</button><span> Aral 1 </span><button>-</button><slot></slot></p>',
      );
      counter.setAttribute('name', 'Another name');
      expect(counter?.shadowRoot?.innerHTML).toBe(
        '<p class=""><button>+</button><span> Another name 1 </span><button>-</button><slot></slot></p>',
      );
      dec.click();
      expect(counter?.shadowRoot?.innerHTML).toBe(
        '<p class="even"><button>+</button><span> Another name 0 </span><button>-</button><slot></slot></p>',
      );
    });

    it('should work with conditional rendering inside span node', () => {
      type Props = { name: { value: string }; children: Node };
      function ConditionalRender({ name, children }: Props) {
        return [
          null,
          {},
          [
            [
              'h2',
              {},
              [
                ['b', {}, () => 'Hello ' + name.value],
                [
                  'span',
                  {},
                  () => (name.value === 'Barbara' ? ['b', {}, '!! 🥳'] : '🥴'),
                ],
              ],
            ],
            children,
          ],
        ];
      }

      customElements.define(
        'conditional-render',
        brisaElement(ConditionalRender as any, ['name']),
      );

      document.body.innerHTML = `
        <conditional-render name="Aral">
          <span>test</span>
        </conditional-render>
      `;

      const conditionalRender = document.querySelector(
        'conditional-render',
      ) as HTMLElement;

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        '<h2><b>Hello Aral</b><span>🥴</span></h2><slot></slot>',
      );

      conditionalRender.setAttribute('name', 'Barbara');

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        '<h2><b>Hello Barbara</b><span><b>!! 🥳</b></span></h2><slot></slot>',
      );

      conditionalRender.setAttribute('name', 'Aral');

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        '<h2><b>Hello Aral</b><span>🥴</span></h2><slot></slot>',
      );
    });

    it('should work with conditional rendering inside text node', () => {
      type Props = { name: { value: string }; children: Node };
      function ConditionalRender({ name, children }: Props) {
        return [
          'h2',
          {},
          [
            ['b', {}, () => 'Hello ' + name.value],
            [
              '',
              {},
              () => (name.value === 'Barbara' ? ['b', {}, '!! 🥳'] : '🥴'),
            ],
            children,
          ],
        ];
      }

      customElements.define(
        'conditional-render',
        brisaElement(ConditionalRender as any, ['name']),
      );

      document.body.innerHTML = `
        <conditional-render name="Aral">
          <span>test</span>
        </conditional-render>
      `;

      const conditionalRender = document.querySelector(
        'conditional-render',
      ) as HTMLElement;

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        '<h2><b>Hello Aral</b>🥴<slot></slot></h2>',
      );

      conditionalRender.setAttribute('name', 'Barbara');

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        '<h2><b>Hello Barbara</b><b>!! 🥳</b><slot></slot></h2>',
      );
    });

    it('should work with conditional rendering inside text node and fragment', () => {
      type Props = { name: { value: string }; children: Node };
      function ConditionalRender({ name, children }: Props) {
        return [
          null,
          {},
          [
            [
              'h2',
              {},
              [
                ['b', {}, () => 'Hello ' + name.value],
                [
                  '',
                  {},
                  () => (name.value === 'Barbara' ? ['b', {}, '!! 🥳'] : '🥴'),
                ],
              ],
            ],
            children,
          ],
        ];
      }

      customElements.define(
        'conditional-render',
        brisaElement(ConditionalRender as any, ['name']),
      );

      document.body.innerHTML = `
        <conditional-render name="Aral">
          <span>test</span>
        </conditional-render>
      `;

      const conditionalRender = document.querySelector(
        'conditional-render',
      ) as HTMLElement;

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        '<h2><b>Hello Aral</b>🥴</h2><slot></slot>',
      );

      conditionalRender.setAttribute('name', 'Barbara');

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        '<h2><b>Hello Barbara</b><b>!! 🥳</b></h2><slot></slot>',
      );
    });

    it('should work with conditional rendering with multiple nodes', () => {
      type Props = { name: { value: string }; children: Node };
      function ConditionalRender({ name, children }: Props) {
        return [
          'h2',
          {},
          [
            ['b', {}, () => 'Hello ' + name.value],
            [
              '',
              {},
              () =>
                name.value === 'Barbara'
                  ? [['b', {}, '!! 🥳'], ['i', {}, ' this is a '], ' test']
                  : '🥴',
            ],
            children,
          ],
        ];
      }

      customElements.define(
        'conditional-render',
        brisaElement(ConditionalRender as any, ['name']),
      );

      document.body.innerHTML = `
          <conditional-render name="Aral">
            <span>test</span>
          </conditional-render>
        `;

      const conditionalRender = document.querySelector(
        'conditional-render',
      ) as HTMLElement;

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        '<h2><b>Hello Aral</b>🥴<slot></slot></h2>',
      );

      conditionalRender.setAttribute('name', 'Barbara');

      expect(conditionalRender?.shadowRoot?.innerHTML).toBe(
        '<h2><b>Hello Barbara</b><b>!! 🥳</b><i> this is a </i> test<slot></slot></h2>',
      );
    });

    it('should work with empty nodes', () => {
      function EmptyNodes() {
        return ['div', {}, ['span', {}, '']];
      }

      customElements.define('empty-nodes', brisaElement(EmptyNodes as any));

      document.body.innerHTML = `
        <empty-nodes></empty-nodes>
      `;

      const emptyNodes = document.querySelector('empty-nodes') as HTMLElement;

      expect(emptyNodes?.shadowRoot?.innerHTML).toBe(
        '<div><span></span></div>',
      );
    });

    it('should display a component to display a series of images in a sliding carousel', () => {
      type Props = { images: { value: string[] } };
      function Carousel({ images }: Props, { state }: any) {
        const index = state(0);
        const next = () => {
          index.value = (index.value + 1) % images.value.length;
        };
        const prev = () => {
          index.value =
            (index.value - 1 + images.value.length) % images.value.length;
        };
        return [
          'div',
          {},
          [
            ['button', { onClick: prev }, 'prev'],
            ['img', { src: () => images?.value?.[index.value] }, ''],
            ['button', { onClick: next }, 'next'],
          ],
        ];
      }

      document.body.innerHTML = `
        <sliding-carousel images='["https://picsum.photos/200/300", "https://picsum.photos/200/300?grayscale"]' />
      `;

      customElements.define(
        'sliding-carousel',
        brisaElement(Carousel as any, ['images']),
      );

      const carousel = document.querySelector(
        'sliding-carousel',
      ) as HTMLElement;
      const [prev, next] = carousel?.shadowRoot?.querySelectorAll(
        'button',
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

    it('should display a component to display a series of images in a sliding carousel receiving images inside an object', () => {
      type Props = { images: { value: { url: string }[] } };
      function Carousel({ images }: Props, { state }: any) {
        const index = state(0);
        const next = () => {
          index.value = (index.value + 1) % images.value.length;
        };
        const prev = () => {
          index.value =
            (index.value - 1 + images.value.length) % images.value.length;
        };
        return [
          'div',
          {},
          [
            ['button', { onClick: prev }, 'prev'],
            [
              'img',
              {
                src: () => images.value[index.value].url,
              },
              '',
            ],
            ['button', { onClick: next }, 'next'],
          ],
        ];
      }

      document.body.innerHTML = `
        <carousel-images images='[{"url":"https://picsum.photos/200/300"},{"url":"https://picsum.photos/200/300?grayscale"}]' />
      `;

      customElements.define(
        'carousel-images',
        brisaElement(Carousel as any, ['images']),
      );

      const carousel = document.querySelector('carousel-images') as HTMLElement;
      const [prev, next] = carousel?.shadowRoot?.querySelectorAll(
        'button',
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

    it('should render a timer component', async () => {
      function Timer({}, { state }: any) {
        const time = state(0);
        const interval = setInterval(() => {
          time.value++;
        }, 1);

        return [
          'div',
          {},
          [
            ['span', {}, () => `Time: ${time.value}`],
            ['button', { onClick: () => clearInterval(interval) }, 'stop'],
          ],
        ];
      }

      customElements.define('timer-component', brisaElement(Timer));

      document.body.innerHTML = `
        <timer-component></timer-component>
      `;

      const timer = document.querySelector('timer-component') as HTMLElement;
      const button = timer?.shadowRoot?.querySelector(
        'button',
      ) as HTMLButtonElement;

      expect(timer?.shadowRoot?.innerHTML).toBe(
        '<div><span>Time: 0</span><button>stop</button></div>',
      );

      await Bun.sleep(1);
      expect(timer?.shadowRoot?.innerHTML).toBe(
        '<div><span>Time: 1</span><button>stop</button></div>',
      );

      button.click();

      await Bun.sleep(1);
      expect(timer?.shadowRoot?.innerHTML).toBe(
        '<div><span>Time: 1</span><button>stop</button></div>',
      );
    });

    it('should trigger an event when clicking on a button and can be handled via props', () => {
      function Button({ onAfterClick }: any) {
        return ['button', { onClick: onAfterClick }, 'click me'];
      }

      customElements.define(
        'test-button',
        brisaElement(Button as any, ['onAfterClick']),
      );
      const onAfterClickMock = mock(() => {});

      window.onAfterClick = onAfterClickMock;
      document.body.innerHTML = `
        <test-button onAfterClick="window.onAfterClick()"></test-button>
      `;

      const testButton = document.querySelector('test-button') as HTMLElement;
      const button = testButton?.shadowRoot?.querySelector(
        'button',
      ) as HTMLButtonElement;

      button.click();

      expect(onAfterClickMock).toHaveBeenCalled();
    });

    it('should trigger events in different web-components', () => {
      const onClickMock = mock(() => {});

      function Parent() {
        return ['first-component', { onClickMe: onClickMock }, 'click me'];
      }

      function FirstComponent({ onClickMe, children }: any) {
        return ['second-component', { onClickMe }, children];
      }

      function SecondComponent({ onClickMe, children }: any) {
        return ['button', { onClick: () => onClickMe('TEST') }, children];
      }

      customElements.define(
        'second-component',
        brisaElement(SecondComponent, ['onClickMe']),
      );
      customElements.define(
        'first-component',
        brisaElement(FirstComponent, ['onClickMe']),
      );
      customElements.define('parent-component', brisaElement(Parent));
      document.body.innerHTML = '<parent-component />';

      const parentComponent = document.querySelector(
        'parent-component',
      ) as HTMLElement;

      const firstComponent = parentComponent?.shadowRoot?.querySelector(
        'first-component',
      ) as HTMLElement;

      const secondComponent = firstComponent?.shadowRoot?.querySelector(
        'second-component',
      ) as HTMLElement;

      expect(parentComponent?.shadowRoot?.innerHTML).toBe(
        '<first-component>click me</first-component>',
      );

      expect(firstComponent?.shadowRoot?.innerHTML).toBe(
        '<second-component><slot></slot></second-component>',
      );

      expect(secondComponent?.shadowRoot?.innerHTML).toBe(
        '<button><slot></slot></button>',
      );

      const button = secondComponent?.shadowRoot?.querySelector(
        'button',
      ) as HTMLButtonElement;

      button.click();

      expect(onClickMock).toHaveBeenCalled();
      expect(onClickMock.mock.calls[0].at(0) as unknown as string).toBe('TEST');
    });

    // https://github.com/brisa-build/brisa/issues/286
    it('should trigger events in different web-components with different params', () => {
      const onClickMock = mock(() => {});

      function Parent() {
        return ['first-component', { onClickMe: onClickMock }, 'click me'];
      }

      function FirstComponent({ onClickMe, children }: any) {
        return ['second-component', { onClickMe }, children];
      }

      function SecondComponent({ onClickMe, children }: any) {
        return [
          'button',
          { onClick: () => onClickMe('TEST', 'TEST2') },
          children,
        ];
      }

      customElements.define(
        'second-component',
        brisaElement(SecondComponent, ['onClickMe']),
      );

      customElements.define(
        'first-component',
        brisaElement(FirstComponent, ['onClickMe']),
      );

      customElements.define('parent-component', brisaElement(Parent));

      document.body.innerHTML = '<parent-component />';

      const parentComponent = document.querySelector(
        'parent-component',
      ) as HTMLElement;

      const firstComponent = parentComponent?.shadowRoot?.querySelector(
        'first-component',
      ) as HTMLElement;

      const secondComponent = firstComponent?.shadowRoot?.querySelector(
        'second-component',
      ) as HTMLElement;

      expect(parentComponent?.shadowRoot?.innerHTML).toBe(
        '<first-component>click me</first-component>',
      );

      expect(firstComponent?.shadowRoot?.innerHTML).toBe(
        '<second-component><slot></slot></second-component>',
      );

      expect(secondComponent?.shadowRoot?.innerHTML).toBe(
        '<button><slot></slot></button>',
      );

      const button = secondComponent?.shadowRoot?.querySelector(
        'button',
      ) as HTMLButtonElement;

      button.click();

      expect(onClickMock).toHaveBeenCalledWith('TEST', 'TEST2');
    });

    // https://github.com/brisa-build/brisa/issues/285
    it('should trigger dblClickEvent in different web-components with different params and different types', () => {
      const onDblClickMock = mock(() => {});

      function Parent() {
        return [
          'first-component',
          { onDblClickMe: onDblClickMock },
          'click me',
        ];
      }

      function FirstComponent({ onDblClickMe, children }: any) {
        return ['second-component', { onDblClickMe }, children];
      }

      function SecondComponent({ onDblClickMe, children }: any) {
        return [
          'button',
          { onDblClick: () => onDblClickMe('TEST', 'TEST2') },
          children,
        ];
      }

      customElements.define(
        'second-component',
        brisaElement(SecondComponent, ['onDblClickMe']),
      );

      customElements.define(
        'first-component',
        brisaElement(FirstComponent, ['onDblClickMe']),
      );

      customElements.define('parent-component', brisaElement(Parent));

      document.body.innerHTML = '<parent-component />';

      const parentComponent = document.querySelector(
        'parent-component',
      ) as HTMLElement;

      const firstComponent = parentComponent?.shadowRoot?.querySelector(
        'first-component',
      ) as HTMLElement;

      const secondComponent = firstComponent?.shadowRoot?.querySelector(
        'second-component',
      ) as HTMLElement;

      expect(parentComponent?.shadowRoot?.innerHTML).toBe(
        '<first-component>click me</first-component>',
      );

      expect(firstComponent?.shadowRoot?.innerHTML).toBe(
        '<second-component><slot></slot></second-component>',
      );

      expect(secondComponent?.shadowRoot?.innerHTML).toBe(
        '<button><slot></slot></button>',
      );

      const button = secondComponent?.shadowRoot?.querySelector(
        'button',
      ) as HTMLButtonElement;

      button.dispatchEvent(new Event('dblclick'));

      expect(onDblClickMock).toHaveBeenCalledWith('TEST', 'TEST2');
    });

    it('should display a color selector component', () => {
      type Props = { color: { value: string } };
      function ColorSelector({ color }: Props) {
        return [
          'div',
          {},
          [
            [
              'input',
              {
                type: 'color',
                value: () => color.value,
                onInput: (e: any) => (color.value = e.target.value),
              },
              '',
            ],
            [
              'span',
              {
                style: () => ({
                  color: color.value,
                }),
              },
              () => color.value,
            ],
          ],
        ];
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
        '<div><input type="color" value="#000000"><span style="color:#000000;">#000000</span></div>',
      );

      input.value = '#ffffff';

      input.dispatchEvent(new Event('input'));

      expect(colorSelector?.shadowRoot?.innerHTML).toBe(
        '<div><input type="color" value="#ffffff"><span style="color:#ffffff;">#ffffff</span></div>',
      );
    });

    it('should render a TodoList component from props', () => {
      type Props = { todos: { value: string[] } };
      function TodoList({ todos }: Props) {
        return [
          'ul',
          {},
          () => todos.value.map((todo: string) => ['li', {}, todo]),
        ];
      }

      document.body.innerHTML = `
        <todo-list todos='["todo 1", "todo 2", "todo 3"]' />
      `;

      customElements.define(
        'todo-list',
        brisaElement(TodoList as any, ['todos']),
      );

      const todoList = document.querySelector('todo-list') as HTMLElement;

      expect(todoList?.shadowRoot?.innerHTML).toBe(
        '<ul><li>todo 1</li><li>todo 2</li><li>todo 3</li></ul>',
      );

      todoList.setAttribute('todos', '["todo 4", "todo 5"]');

      expect(todoList?.shadowRoot?.innerHTML).toBe(
        '<ul><li>todo 4</li><li>todo 5</li></ul>',
      );
    });

    it('should work an interactive TodoList with state', () => {
      function TodoList({}, { state }: any) {
        const todos = state(['todo 1', 'todo 2', 'todo 3']);
        const newTodo = state('');
        const addTodo = () => {
          todos.value = [...todos.value, newTodo.value];
          newTodo.value = '';
        };

        return [
          'div',
          {},
          [
            [
              'input',
              {
                value: () => newTodo.value,
                onInput: (e: any) => (newTodo.value = e.target.value),
              },
              '',
            ],
            ['button', { onClick: addTodo }, 'Add'],
            [
              'ul',
              {},
              () => todos.value.map((todo: string) => ['li', {}, todo]),
            ],
          ],
        ];
      }

      customElements.define('todo-list', brisaElement(TodoList as any));
      document.body.innerHTML = '<todo-list />';

      const todoList = document.querySelector('todo-list') as HTMLElement;

      const input = todoList?.shadowRoot?.querySelector(
        'input',
      ) as HTMLInputElement;

      const button = todoList?.shadowRoot?.querySelector(
        'button',
      ) as HTMLButtonElement;

      expect(todoList?.shadowRoot?.innerHTML).toBe(
        '<div><input value=""><button>Add</button><ul><li>todo 1</li><li>todo 2</li><li>todo 3</li></ul></div>',
      );

      input.value = 'todo 4';

      input.dispatchEvent(new Event('input'));

      expect(todoList?.shadowRoot?.innerHTML).toBe(
        '<div><input value="todo 4"><button>Add</button><ul><li>todo 1</li><li>todo 2</li><li>todo 3</li></ul></div>',
      );

      button.click();

      expect(todoList?.shadowRoot?.innerHTML).toBe(
        '<div><input value=""><button>Add</button><ul><li>todo 1</li><li>todo 2</li><li>todo 3</li><li>todo 4</li></ul></div>',
      );
    });

    it('should be possible to change an static src attribute using the onerror event from img', () => {
      function Image() {
        return [
          'img',
          {
            src: 'https://test.com/image.png',
            onError: (e: any) => {
              e.target.src = 'https://test.com/error.png';
            },
          },
          '',
        ];
      }

      customElements.define('test-image', brisaElement(Image));
      document.body.innerHTML = '<test-image />';

      const testImage = document.querySelector('test-image') as HTMLElement;
      const img = testImage?.shadowRoot?.querySelector(
        'img',
      ) as HTMLImageElement;

      expect(testImage?.shadowRoot?.innerHTML).toBe(
        '<img src="https://test.com/image.png">',
      );
      img.dispatchEvent(new Event('error'));
      expect(testImage?.shadowRoot?.innerHTML).toBe(
        '<img src="https://test.com/error.png">',
      );
    });

    it('should be possible to change a dynamic src attribute using the onerror event from img', () => {
      function Image({}, { state }: any) {
        const src = state('https://test.com/image.png');

        return [
          'img',
          {
            src: () => src.value,
            onError: () => {
              src.value = 'https://test.com/error.png';
            },
          },
          '',
        ];
      }

      customElements.define('test-image', brisaElement(Image));
      document.body.innerHTML = '<test-image />';

      const testImage = document.querySelector('test-image') as HTMLElement;
      const img = testImage?.shadowRoot?.querySelector(
        'img',
      ) as HTMLImageElement;

      expect(testImage?.shadowRoot?.innerHTML).toBe(
        '<img src="https://test.com/image.png">',
      );
      img.dispatchEvent(new Event('error'));
      expect(testImage?.shadowRoot?.innerHTML).toBe(
        '<img src="https://test.com/error.png">',
      );
    });

    it('should unregister effects when the component is disconnected', async () => {
      const mockEffect = mock((n: number) => {});
      let interval: any;

      function Test({}, { state, effect }: any) {
        const count = state(0);

        interval = setInterval(() => {
          count.value++;
        }, 1);

        effect(() => {
          mockEffect(count.value);
        });

        return ['div', {}, () => count.value];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';
      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>0</div>');
      expect(mockEffect).toHaveBeenCalledTimes(1);

      await Bun.sleep(1);
      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>1</div>');
      expect(mockEffect).toHaveBeenCalledTimes(2);
      testComponent.remove();

      await Bun.sleep(1);
      expect(mockEffect).toHaveBeenCalledTimes(2);
      clearInterval(interval);
    });

    it('should reset the state when some props change via effect', () => {
      function Test({ count }: any, { state, effect, h }: any) {
        const lastCount = state(0);
        const countState = state(count);

        effect(() => {
          if (lastCount.value !== count.value) {
            countState.value = count.value;
            lastCount.value = count.value;
          }
        });

        return [
          null,
          {},
          [
            ['div', {}, () => countState.value],
            ['button', { onClick: () => countState.value++ }, 'increment'],
          ],
        ];
      }

      customElements.define('test-component', brisaElement(Test, ['count']));
      document.body.innerHTML = "<test-component count='1' />";

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      const button = testComponent?.shadowRoot?.querySelector(
        'button',
      ) as HTMLButtonElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div>1</div><button>increment</button>',
      );

      button.click();

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div>2</div><button>increment</button>',
      );

      testComponent.setAttribute('count', '3');

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div>3</div><button>increment</button>',
      );
    });

    it('should work an async web-component', async () => {
      async function AsyncComponent({}, { state }: any) {
        const count = state(await Promise.resolve(42));

        return ['div', {}, () => count.value];
      }

      customElements.define('async-component', brisaElement(AsyncComponent));
      document.body.innerHTML = '<async-component />';

      const asyncComponent = document.querySelector(
        'async-component',
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(asyncComponent?.shadowRoot?.innerHTML).toBe('<div>42</div>');
    });

    it('should work an async effect inside a web-component', async () => {
      async function AsyncComponent({}, { state, effect }: any) {
        const count = state(0);

        effect(async () => {
          await Bun.sleep(0);
          count.value = 42;
        });

        return ['div', {}, () => count.value];
      }

      customElements.define('async-component', brisaElement(AsyncComponent));
      document.body.innerHTML = '<async-component />';

      const asyncComponent = document.querySelector(
        'async-component',
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(asyncComponent?.shadowRoot?.innerHTML).toBe('<div>42</div>');
    });

    it('should cleanup everytime an effect is re-called', () => {
      const mockEffect = mock((num: number) => {});
      const mockCleanup = mock(() => {});

      function Test({}, { state, effect, cleanup }: any) {
        const count = state(0);

        effect((r: any) => {
          mockEffect(count.value);
          cleanup(() => {
            mockCleanup();
          }, r.id);
        });

        return ['button', { onClick: () => count.value++ }, 'click'];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';
      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      const button = testComponent?.shadowRoot?.querySelector(
        'button',
      ) as HTMLButtonElement;

      expect(mockCleanup).toHaveBeenCalledTimes(0);
      expect(mockEffect).toHaveBeenCalledTimes(1);

      button.click();

      expect(mockCleanup).toHaveBeenCalledTimes(1);
      expect(mockEffect).toHaveBeenCalledTimes(2);

      button.click();

      expect(mockCleanup).toHaveBeenCalledTimes(2);
      expect(mockEffect).toHaveBeenCalledTimes(3);
    });

    it('should cleanup everytime the web-component is unmount', () => {
      const mockEffect = mock(() => {});
      const mockCleanup = mock(() => {});

      function Test({}, { effect, cleanup }: any) {
        effect((r: any) => {
          mockEffect();
          cleanup(() => mockCleanup(), r.id);
        });

        return ['div', {}, ''];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(mockEffect).toHaveBeenCalledTimes(1);
      expect(mockCleanup).toHaveBeenCalledTimes(0);

      testComponent.remove();

      expect(mockEffect).toHaveBeenCalledTimes(1);
      expect(mockCleanup).toHaveBeenCalledTimes(1);
    });

    it('should cleanup async cleanups when the web-component is unmount', async () => {
      const mockEffect = mock(() => {});
      const mockCleanup = mock(() => {});

      function Test({}, { effect, cleanup }: any) {
        effect(async (r: any) => {
          mockEffect();
          cleanup(async () => mockCleanup(), r.id);
        });

        return ['div', {}, ''];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(mockEffect).toHaveBeenCalledTimes(1);
      expect(mockCleanup).toHaveBeenCalledTimes(0);

      testComponent.remove();

      expect(mockEffect).toHaveBeenCalledTimes(1);
      expect(mockCleanup).toHaveBeenCalledTimes(1);
    });

    it('should cleanup multi cleanups inside an effect when the web-component is unmount', async () => {
      const mockEffect = mock(() => {});
      const mockCleanup = mock(() => {});

      function Test({}, { effect, cleanup }: any) {
        effect(async (r: any) => {
          mockEffect();
          cleanup(async () => mockCleanup(), r.id);
          cleanup(async () => mockCleanup(), r.id);
        });

        return ['div', {}, ''];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(mockEffect).toHaveBeenCalledTimes(1);
      expect(mockCleanup).toHaveBeenCalledTimes(0);

      testComponent.remove();

      expect(mockEffect).toHaveBeenCalledTimes(1);
      expect(mockCleanup).toHaveBeenCalledTimes(2);
    });

    it('should work with reactivity props in a SVG component', () => {
      function ColorSVG({ color1, color2, color3 }: any) {
        return [
          'svg',
          { width: '12cm', height: '12cm' },
          [
            [
              'g',
              {
                style: {
                  fillOpacity: '0.7',
                  stroke: 'black',
                  strokeWidth: '0.1cm',
                },
              },
              [
                [
                  'circle',
                  {
                    cx: '6cm',
                    cy: '2cm',
                    r: '100',
                    fill: () => color1.value,
                    transform: 'translate(0,50)',
                  },
                  '',
                ],
                [
                  'circle',
                  {
                    cx: '6cm',
                    cy: '2cm',
                    r: '100',
                    fill: () => color2.value,
                    transform: 'translate(70,150)',
                  },
                  '',
                ],
                [
                  'circle',
                  {
                    cx: '6cm',
                    cy: '2cm',
                    r: '100',
                    fill: () => color3.value,
                    transform: 'translate(-70,150)',
                  },
                  '',
                ],
              ],
            ],
          ],
        ];
      }

      document.body.innerHTML = `
        <color-svg color1="#ff0000" color2="#00ff00" color3="#0000ff" />
      `;

      customElements.define(
        'color-svg',
        brisaElement(ColorSVG as any, ['color1', 'color2', 'color3']),
      );

      const colorSVG = document.querySelector('color-svg') as HTMLElement;

      colorSVG?.shadowRoot?.querySelectorAll('*').forEach((node) => {
        expect(node.namespaceURI).toBe('http://www.w3.org/2000/svg');
      });

      expect(colorSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7;stroke:black;stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" fill="#ff0000" transform="translate(0,50)"></circle><circle cx="6cm" cy="2cm" r="100" fill="#00ff00" transform="translate(70,150)"></circle><circle cx="6cm" cy="2cm" r="100" fill="#0000ff" transform="translate(-70,150)"></circle></g></svg>',
      );

      colorSVG.setAttribute('color1', '#0000ff');
      colorSVG.setAttribute('color2', '#ff0000');
      colorSVG.setAttribute('color3', '#00ff00');

      expect(colorSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7;stroke:black;stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" transform="translate(0,50)" fill="#0000ff"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(70,150)" fill="#ff0000"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(-70,150)" fill="#00ff00"></circle></g></svg>',
      );
    });

    it('should work reactivity if props that are written in camelCase', () => {
      function ColorSVG({ firstColor, secondColor, thirdColor }: any) {
        return [
          'svg',
          { width: '12cm', height: '12cm' },
          [
            [
              'g',
              {
                style: {
                  fillOpacity: '0.7',
                  stroke: 'black',
                  strokeWidth: '0.1cm',
                },
              },
              [
                [
                  'circle',
                  {
                    cx: '6cm',
                    cy: '2cm',
                    r: '100',
                    fill: () => firstColor.value,
                    transform: 'translate(0,50)',
                  },
                  '',
                ],
                [
                  'circle',
                  {
                    cx: '6cm',
                    cy: '2cm',
                    r: '100',
                    fill: () => secondColor.value,
                    transform: 'translate(70,150)',
                  },
                  '',
                ],
                [
                  'circle',
                  {
                    cx: '6cm',
                    cy: '2cm',
                    r: '100',
                    fill: () => thirdColor.value,
                    transform: 'translate(-70,150)',
                  },
                  '',
                ],
              ],
            ],
          ],
        ];
      }

      customElements.define(
        'color-svg',
        brisaElement(ColorSVG as any, [
          'firstColor',
          'secondColor',
          'thirdColor',
        ]),
      );

      document.body.innerHTML = `
          <color-svg firstColor="#ff0000" secondColor="#00ff00" thirdColor="#0000ff" />
        `;

      const colorSVG = document.querySelector('color-svg') as HTMLElement;

      expect(colorSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7;stroke:black;stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" transform="translate(0,50)" fill="#ff0000"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(70,150)" fill="#00ff00"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(-70,150)" fill="#0000ff"></circle></g></svg>',
      );

      colorSVG.setAttribute('firstColor', '#0000ff');
      colorSVG.setAttribute('secondColor', '#ff0000');
      colorSVG.setAttribute('thirdColor', '#00ff00');

      expect(colorSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><g style="fill-opacity:0.7;stroke:black;stroke-width:0.1cm;"><circle cx="6cm" cy="2cm" r="100" transform="translate(0,50)" fill="#0000ff"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(70,150)" fill="#ff0000"></circle><circle cx="6cm" cy="2cm" r="100" transform="translate(-70,150)" fill="#00ff00"></circle></g></svg>',
      );
    });

    it('should SVG work with foreingObject setting correctly the namespace outside the foreingObject node', () => {
      function SVG() {
        return [
          'svg',
          { width: '12cm', height: '12cm' },
          [
            'foreignObject',
            { width: '100%', height: '100%' },
            ['div', { xmlns: 'http://www.w3.org/1999/xhtml' }, 'test'],
          ],
        ];
      }

      customElements.define('test-svg', brisaElement(SVG));
      document.body.innerHTML = '<test-svg />';

      const testSVG = document.querySelector('test-svg') as HTMLElement;
      const svg = testSVG?.shadowRoot?.querySelector('svg') as SVGElement;
      const foreignObject = testSVG?.shadowRoot?.querySelector(
        'foreignObject',
      ) as SVGElement;
      const div = testSVG?.shadowRoot?.querySelector('div') as HTMLElement;

      expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(foreignObject.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(div.namespaceURI).toBe('http://www.w3.org/1999/xhtml');

      expect(testSVG?.shadowRoot?.innerHTML).toBe(
        '<svg width="12cm" height="12cm"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">test</div></foreignObject></svg>',
      );
    });

    it('should work a web-component that enables the addition, removal, and repositioning of items in a list', () => {
      function MagicList({}, { state }: any) {
        const list = state(['some', 'another']);

        const addItem = (e: any) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          list.value = [...list.value, formData.get('item')];
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

        return [
          'div',
          {},
          [
            [
              'form',
              { onSubmit: addItem },
              [
                [
                  'input',
                  { name: 'item', id: 'item', placeholder: 'Add item' },
                  '',
                ],
                ['button', {}, 'add'],
              ],
            ],
            [
              'ul',
              {},
              () =>
                list.value.map((item: string, index: number) => [
                  'li',
                  {},
                  [
                    ['button', { onClick: () => deleteItem(index) }, 'delete'],
                    ['button', { onClick: () => moveItemUp(index) }, 'move up'],
                    item,
                  ],
                ]),
            ],
          ],
        ];
      }

      customElements.define(
        'magic-list',
        brisaElement(MagicList as any, ['items']),
      );

      document.body.innerHTML = '<magic-list />';

      const magicList = document.querySelector('magic-list') as HTMLElement;
      const form = magicList?.shadowRoot?.querySelector(
        'form',
      ) as HTMLFormElement;
      const input = magicList?.shadowRoot?.querySelector(
        'input',
      ) as HTMLInputElement;

      expect(magicList?.shadowRoot?.innerHTML).toBe(
        '<div><form><input name="item" id="item" placeholder="Add item"><button>add</button></form><ul><li><button>delete</button><button>move up</button>some</li><li><button>delete</button><button>move up</button>another</li></ul></div>',
      );

      // Adding a new item
      input.value = 'test';
      form.dispatchEvent(new Event('submit'));
      expect(magicList?.shadowRoot?.innerHTML).toBe(
        '<div><form><input name="item" id="item" placeholder="Add item"><button>add</button></form><ul><li><button>delete</button><button>move up</button>some</li><li><button>delete</button><button>move up</button>another</li><li><button>delete</button><button>move up</button>test</li></ul></div>',
      );

      // Moving up the last item
      const moveUpButton = [
        ...(magicList?.shadowRoot?.querySelectorAll(
          'button',
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
              'button',
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

    it('should reactively update the DOM after adding a new property to the web-component', () => {
      type Props = { count: { value: number } };
      function Test({ count }: Props, { effect }: any) {
        // This is the code line after compiling: function Test({ count = 1 })
        effect(() => (count.value ??= 1));
        return ['div', {}, () => count?.value];
      }

      customElements.define(
        'test-component',
        brisaElement(Test as any, ['count']),
      );
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>1</div>');

      testComponent.setAttribute('count', '2');

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>2</div>');
    });

    it('should render the attribute href and src without the basePath when it not come', () => {
      function Test() {
        return [
          'div',
          {},
          [
            ['a', { href: '/test' }, 'link'],
            ['img', { src: '/image.png' }, ''],
          ],
        ];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;
      const a = testComponent?.shadowRoot?.querySelector(
        'a',
      ) as HTMLAnchorElement;
      const img = testComponent?.shadowRoot?.querySelector(
        'img',
      ) as HTMLImageElement;

      expect(a.getAttribute('href')).toBe('/test');
      expect(img.getAttribute('src')).toBe('/image.png');
    });

    it('should render the attribute href and src with the basePath when it comes', () => {
      window.__BASE_PATH__ = '/base-path';
      function Test() {
        return [
          'div',
          {},
          [
            ['a', { href: '/test' }, 'link'],
            ['img', { src: '/image.png' }, ''],
          ],
        ];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;
      const a = testComponent?.shadowRoot?.querySelector(
        'a',
      ) as HTMLAnchorElement;
      const img = testComponent?.shadowRoot?.querySelector(
        'img',
      ) as HTMLImageElement;

      expect(a.getAttribute('href')).toBe('/base-path/test');
      expect(img.getAttribute('src')).toBe('/base-path/image.png');
    });

    it('should render the attribute href and src without the basePath when the URL is full', () => {
      window.__BASE_PATH__ = '/base-path';
      function Test() {
        return [
          'div',
          {},
          [
            ['a', { href: 'https://example.com/test' }, 'link'],
            ['img', { src: 'https://example.com/image.png' }, ''],
          ],
        ];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;
      const a = testComponent?.shadowRoot?.querySelector(
        'a',
      ) as HTMLAnchorElement;
      const img = testComponent?.shadowRoot?.querySelector(
        'img',
      ) as HTMLImageElement;

      expect(a.getAttribute('href')).toBe('https://example.com/test');
      expect(img.getAttribute('src')).toBe('https://example.com/image.png');
    });

    it('should render the attribute href with the trailing slash when __TRAILING_SLASH__', () => {
      window.__TRAILING_SLASH__ = true;
      function Test() {
        return [
          'div',
          {},
          [
            ['a', { href: '/test' }, 'link'],
            ['img', { src: '/image.png' }, ''],
          ],
        ];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;
      const a = testComponent?.shadowRoot?.querySelector(
        'a',
      ) as HTMLAnchorElement;
      const img = testComponent?.shadowRoot?.querySelector(
        'img',
      ) as HTMLImageElement;

      expect(a.getAttribute('href')).toBe('/test/');
      expect(img.getAttribute('src')).toBe('/image.png');
    });

    it('should render the attribute href with the trailing slash when __TRAILING_SLASH__ and already have it the trailing slash', () => {
      window.__TRAILING_SLASH__ = true;
      function Test() {
        return [
          'div',
          {},
          [
            ['a', { href: '/test/' }, 'link'],
            ['img', { src: '/image.png' }, ''],
          ],
        ];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;
      const a = testComponent?.shadowRoot?.querySelector(
        'a',
      ) as HTMLAnchorElement;
      const img = testComponent?.shadowRoot?.querySelector(
        'img',
      ) as HTMLImageElement;

      expect(a.getAttribute('href')).toBe('/test/');
      expect(img.getAttribute('src')).toBe('/image.png');
    });

    it('should work with __TRAILING_SLASH__ and params', () => {
      window.__TRAILING_SLASH__ = true;
      function Test() {
        return [
          'div',
          {},
          [
            ['a', { href: '/test?param=1' }, 'link'],
            ['img', { src: '/image.png' }, ''],
          ],
        ];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;
      const a = testComponent?.shadowRoot?.querySelector(
        'a',
      ) as HTMLAnchorElement;
      const img = testComponent?.shadowRoot?.querySelector(
        'img',
      ) as HTMLImageElement;

      expect(a.getAttribute('href')).toBe('/test/?param=1');
      expect(img.getAttribute('src')).toBe('/image.png');
    });

    it('should work with __BASE_PATH__ and __TRAILING_SLASH__ together', () => {
      window.__BASE_PATH__ = '/base-path';
      window.__TRAILING_SLASH__ = true;
      function Test() {
        return [
          'div',
          {},
          [
            ['a', { href: '/test' }, 'link'],
            ['img', { src: '/image.png' }, ''],
          ],
        ];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;
      const a = testComponent?.shadowRoot?.querySelector(
        'a',
      ) as HTMLAnchorElement;
      const img = testComponent?.shadowRoot?.querySelector(
        'img',
      ) as HTMLImageElement;

      expect(a.getAttribute('href')).toBe('/base-path/test/');
      expect(img.getAttribute('src')).toBe('/base-path/image.png');
    });

    it('should NOT render the attribute href with the locale when __USE_LOCALE__ is false', () => {
      window.__USE_LOCALE__ = false;
      window.i18n = { locale: 'pt-BR', locales: ['pt-BR', 'en-US'] };

      function Test() {
        return ['a', { href: '/test' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/test">link</a>',
      );
    });

    it('should render the attribute href with the locale when __USE_LOCALE__', () => {
      window.__USE_LOCALE__ = true;
      window.i18n = { locale: 'pt-BR', locales: ['pt-BR', 'en-US'] };

      function Test() {
        return ['a', { href: '/test' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR/test">link</a>',
      );
    });

    it('should render the attribute href with the locale when __USE_LOCALE__ when the path is the home', () => {
      window.__USE_LOCALE__ = true;
      window.i18n = { locale: 'pt-BR', locales: ['pt-BR', 'en-US'] };

      function Test() {
        return ['a', { href: '/' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR">link</a>',
      );
    });

    it('should render the attribute href with the locale when __USE_LOCALE__ keeping the existing locale', () => {
      window.__USE_LOCALE__ = true;
      window.i18n = { locale: 'pt-BR', locales: ['pt-BR', 'en-US'] };

      function Test() {
        return ['a', { href: '/en-US/test' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/en-US/test">link</a>',
      );
    });

    it('should render the attribute href with the locale when __USE_LOCALE__ keeping the existing locale when the path is the home', () => {
      window.__USE_LOCALE__ = true;
      window.i18n = { locale: 'pt-BR', locales: ['pt-BR', 'en-US'] };

      function Test() {
        return ['a', { href: '/en-US' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/en-US">link</a>',
      );
    });

    it('should work with __USE_LOCALE__ and __TRAILING_SLASH__ together', () => {
      window.__USE_LOCALE__ = true;
      window.__TRAILING_SLASH__ = true;
      window.i18n = { locale: 'pt-BR', locales: ['pt-BR', 'en-US'] };

      function Test() {
        return ['a', { href: '/test' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR/test/">link</a>',
      );
    });

    it('should work with __USE_LOCALE__, __BASE_PATH__ and __TRAILING_SLASH__ together', () => {
      window.__USE_LOCALE__ = true;
      window.__BASE_PATH__ = '/base-path';
      window.__TRAILING_SLASH__ = true;
      window.i18n = { locale: 'pt-BR', locales: ['pt-BR', 'en-US'] };

      function Test() {
        return ['a', { href: '/test' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/base-path/pt-BR/test/">link</a>',
      );
    });

    it('should add assetPrefix to the src attribute', () => {
      window.__ASSET_PREFIX__ = 'https://example.com';
      function Test() {
        return ['img', { src: '/image.png' }, ''];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;
      const img = testComponent?.shadowRoot?.querySelector(
        'img',
      ) as HTMLImageElement;

      expect(img.getAttribute('src')).toBe('https://example.com/image.png');
    });

    it('should add only assetPrefix without basePath (it has more priority on src)', () => {
      window.__ASSET_PREFIX__ = 'https://example.com';
      window.__BASE_PATH__ = '/base-path';
      function Test() {
        return ['img', { src: '/image.png' }, ''];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;
      const img = testComponent?.shadowRoot?.querySelector(
        'img',
      ) as HTMLImageElement;

      expect(img.getAttribute('src')).toBe('https://example.com/image.png');
    });

    it('should not add assetPrefix to the src attribute when it is a full URL', () => {
      window.__ASSET_PREFIX__ = 'https://example.com';
      function Test() {
        return ['img', { src: 'https://example.com/image.png' }, ''];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;
      const img = testComponent?.shadowRoot?.querySelector(
        'img',
      ) as HTMLImageElement;

      expect(img.getAttribute('src')).toBe('https://example.com/image.png');
    });

    it('should not add assetPrefix to the href attribute', () => {
      window.__ASSET_PREFIX__ = 'https://example.com';
      function Test() {
        return ['a', { href: '/test' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;
      const a = testComponent?.shadowRoot?.querySelector(
        'a',
      ) as HTMLAnchorElement;

      expect(a.getAttribute('href')).toBe('/test');
    });

    it('should work with __USE_LOCALE__, __BASE_PATH__ and __TRAILING_SLASH__ together when the path is the home', () => {
      window.__USE_LOCALE__ = true;
      window.__BASE_PATH__ = '/base-path';
      window.__TRAILING_SLASH__ = true;
      window.i18n = { locale: 'pt-BR', locales: ['pt-BR', 'en-US'] };

      function Test() {
        return ['a', { href: '/' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/base-path/pt-BR/">link</a>',
      );
    });

    it('should translate pages when __USE_PAGE_TRANSLATION__ is true', () => {
      window.__USE_PAGE_TRANSLATION__ = true;
      window.__USE_LOCALE__ = true;
      window.i18n = {
        locale: 'pt-BR',
        locales: ['pt-BR', 'en-US'],
        pages: {
          '/about-us': {
            'pt-BR': '/sobre-nos',
          },
        },
      };

      function Test() {
        return ['a', { href: '/about-us' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR/sobre-nos">link</a>',
      );
    });

    it('should translate home page when __USE_PAGE_TRANSLATION__ is true', () => {
      window.__USE_PAGE_TRANSLATION__ = true;
      window.__USE_LOCALE__ = true;
      window.i18n = {
        locale: 'pt-BR',
        locales: ['pt-BR', 'en-US'],
        pages: {
          '/': {
            'pt-BR': '/inicio',
          },
        },
      };

      function Test() {
        return ['a', { href: '/' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR/inicio">link</a>',
      );
    });

    it('should keep pages with locale in the href and __USE_PAGE_TRANSLATION__ is true', () => {
      window.__USE_PAGE_TRANSLATION__ = true;
      window.__USE_LOCALE__ = true;
      window.i18n = {
        locale: 'pt-BR',
        locales: ['pt-BR', 'en-US'],
        pages: {
          '/about-us': {
            'pt-BR': '/sobre-nos',
          },
        },
      };

      function Test() {
        return ['a', { href: '/en-US/about-us' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/en-US/about-us">link</a>',
      );
    });

    it('should work with __USE_PAGE_TRANSLATION__ and params', () => {
      window.__USE_PAGE_TRANSLATION__ = true;
      window.__USE_LOCALE__ = true;
      window.i18n = {
        locale: 'pt-BR',
        locales: ['pt-BR', 'en-US'],
        pages: {
          '/user': {
            'pt-BR': '/usuario',
          },
        },
      };

      function Test() {
        return ['a', { href: '/user?foo=bar' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR/usuario?foo=bar">link</a>',
      );
    });

    it('should work with __USE_PAGE_TRANSLATION__ and hash', () => {
      window.__USE_PAGE_TRANSLATION__ = true;
      window.__USE_LOCALE__ = true;
      window.i18n = {
        locale: 'pt-BR',
        locales: ['pt-BR', 'en-US'],
        pages: {
          '/user': {
            'pt-BR': '/usuario',
          },
        },
      };

      function Test() {
        return ['a', { href: '/user#foo' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR/usuario#foo">link</a>',
      );
    });

    it('should work with __USE_PAGE_TRANSLATION__ with home +  hash', () => {
      window.__USE_PAGE_TRANSLATION__ = true;
      window.__USE_LOCALE__ = true;
      window.i18n = {
        locale: 'pt-BR',
        locales: ['pt-BR', 'en-US'],
        pages: {},
      };

      function Test() {
        return ['a', { href: '/#foo' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR#foo">link</a>',
      );
    });

    it('should work with __USE_PAGE_TRANSLATION__ with home +  params', () => {
      window.__USE_PAGE_TRANSLATION__ = true;
      window.__USE_LOCALE__ = true;
      window.i18n = {
        locale: 'pt-BR',
        locales: ['pt-BR', 'en-US'],
        pages: {},
      };

      function Test() {
        return ['a', { href: '/?foo=bar' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR?foo=bar">link</a>',
      );
    });

    it('should work with __USE_PAGE_TRANSLATION__ with home + existing locale and hash', () => {
      window.__USE_PAGE_TRANSLATION__ = true;
      window.__USE_LOCALE__ = true;
      window.i18n = {
        locale: 'pt-BR',
        locales: ['pt-BR', 'en-US'],
        pages: {},
      };

      function Test() {
        return ['a', { href: '/pt-BR#foo' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR#foo">link</a>',
      );
    });

    it('should work with __USE_PAGE_TRANSLATION__ with home + existing locale and params', () => {
      window.__USE_PAGE_TRANSLATION__ = true;
      window.__USE_LOCALE__ = true;
      window.i18n = {
        locale: 'pt-BR',
        locales: ['pt-BR', 'en-US'],
        pages: {},
      };

      function Test() {
        return ['a', { href: '/pt-BR?foo=bar' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR?foo=bar">link</a>',
      );
    });

    it('should work with __USE_PAGE_TRANSLATION__ params and hash', () => {
      window.__USE_PAGE_TRANSLATION__ = true;
      window.__USE_LOCALE__ = true;
      window.i18n = {
        locale: 'pt-BR',
        locales: ['pt-BR', 'en-US'],
        pages: {
          '/user': {
            'pt-BR': '/usuario',
          },
        },
      };

      function Test() {
        return ['a', { href: '/user?foo=bar#baz' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR/usuario?foo=bar#baz">link</a>',
      );
    });

    it('should work with __USE_PAGE_TRANSLATION__, dynamic routes and params', () => {
      window.__USE_PAGE_TRANSLATION__ = true;
      window.__USE_LOCALE__ = true;
      window.i18n = {
        locale: 'pt-BR',
        locales: ['pt-BR', 'en-US'],
        pages: {
          '/user/[username]': {
            'pt-BR': '/usuario/[username]',
          },
        },
      };

      function Test() {
        return ['a', { href: '/user/john-doe?foo=bar' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR/usuario/john-doe?foo=bar">link</a>',
      );
    });

    it('should work with __USE_PAGE_TRANSLATION__, dynamic routes and hash', () => {
      window.__USE_PAGE_TRANSLATION__ = true;
      window.__USE_LOCALE__ = true;
      window.i18n = {
        locale: 'pt-BR',
        locales: ['pt-BR', 'en-US'],
        pages: {
          '/user/[username]': {
            'pt-BR': '/usuario/[username]',
          },
        },
      };

      function Test() {
        return ['a', { href: '/user/john-doe#foo' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR/usuario/john-doe#foo">link</a>',
      );
    });

    it('should work with __USE_PAGE_TRANSLATION__,dynamic routes, params and hash', () => {
      window.__USE_PAGE_TRANSLATION__ = true;
      window.__USE_LOCALE__ = true;
      window.i18n = {
        locale: 'pt-BR',
        locales: ['pt-BR', 'en-US'],
        pages: {
          '/user/[username]': {
            'pt-BR': '/usuario/[username]',
          },
        },
      };

      function Test() {
        return ['a', { href: '/user/john-doe?foo=bar#baz' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR/usuario/john-doe?foo=bar#baz">link</a>',
      );
    });

    it('should translate pages with dynamic routes and __USE_PAGE_TRANSLATION__', () => {
      window.__USE_PAGE_TRANSLATION__ = true;
      window.__USE_LOCALE__ = true;
      window.i18n = {
        locale: 'pt-BR',
        locales: ['pt-BR', 'en-US'],
        pages: {
          '/user/[username]': {
            'pt-BR': '/usuario/[username]',
          },
        },
      };

      function Test() {
        return ['a', { href: '/user/john-doe' }, 'link'];
      }

      customElements.define('test-component', brisaElement(Test));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<a href="/pt-BR/usuario/john-doe">link</a>',
      );
    });

    it.todo(
      'should translate pages with multi dynamic routes and __USE_PAGE_TRANSLATION__',
    );

    it.todo(
      'should translate pages with catchAll and __USE_PAGE_TRANSLATION__',
    );

    it.todo('should translate pages with params and __USE_PAGE_TRANSLATION__');

    it.todo('should translate pages with hash and __USE_PAGE_TRANSLATION__');

    it.todo(
      'should translate pages with params + hash and __USE_PAGE_TRANSLATION__',
    );

    it.todo(
      'should translate pages with params + hash + dynamic route and __USE_PAGE_TRANSLATION__',
    );

    it.todo(
      'should translate pages with params + hash + catchAll route and __USE_PAGE_TRANSLATION__',
    );

    it('should work multi conditionals renders', () => {
      type Props = { count: { value: number } };
      function Test({ count }: Props) {
        return [
          'div',
          {},
          [
            [
              null,
              {},
              () =>
                count.value === 1
                  ? ['span', {}, 'one']
                  : count.value === 2
                    ? ['span', {}, 'two']
                    : ['span', {}, 'three'],
            ],
          ],
        ];
      }

      customElements.define(
        'test-component',
        brisaElement(Test as any, ['count']),
      );
      document.body.innerHTML = "<test-component count='1' />";

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div><span>one</span></div>',
      );

      testComponent.setAttribute('count', '2');

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div><span>two</span></div>',
      );

      testComponent.setAttribute('count', '3');

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div><span>three</span></div>',
      );
    });

    it('should work nested conditionals renders', () => {
      function Test({ first, second, third }: any, { h }: any) {
        return [
          'div',
          {},
          [
            null,
            {},
            () =>
              first.value === 1
                ? [
                    'div',
                    {},
                    () =>
                      second.value === 2
                        ? [
                            'span',
                            {},
                            () =>
                              third.value === 3 ? 'test work' : 'no-third',
                          ]
                        : 'no-second',
                  ]
                : 'no-first',
          ],
        ];
      }

      customElements.define(
        'test-component',
        brisaElement(Test as any, ['first', 'second', 'third']),
      );

      document.body.innerHTML =
        "<test-component first='1' second='2' third='3' />";

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div><div><span>test work</span></div></div>',
      );

      testComponent.setAttribute('first', '2');

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>no-first</div>');

      testComponent.setAttribute('first', '1');
      testComponent.setAttribute('second', '3');

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div><div>no-second</div></div>',
      );

      testComponent.setAttribute('second', '2');
      testComponent.setAttribute('third', '4');

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div><div><span>no-third</span></div></div>',
      );

      testComponent.setAttribute('third', '3');

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div><div><span>test work</span></div></div>',
      );
    });

    it('should allow async/await conditional renders from state', async () => {
      function Test({}: any, { state }: any) {
        const first = state(1);
        const second = state(2);
        const third = state(3);

        return [
          'div',
          { onClick: () => (second.value = 42) },
          async () => {
            if (first.value === 1) {
              if (second.value === 2) {
                if (third.value === 3) {
                  return 'test work';
                } else {
                  return 'no-third';
                }
              } else {
                return `no-second ${second.value}`;
              }
            } else {
              return 'no-first';
            }
          },
        ];
      }

      customElements.define('test-component', brisaElement(Test as any));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>test work</div>');

      (testComponent.shadowRoot?.firstChild as HTMLElement).click();

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div>no-second 42</div>',
      );
    });

    it('should allow async/await conditional renders from props', async () => {
      function Test({ first, second, third }: any) {
        return [
          'div',
          {},
          async () => {
            if (first.value === 1) {
              if (second.value === 2) {
                if (third.value === 3) {
                  return 'test work';
                } else {
                  return 'no-third';
                }
              } else {
                return 'no-second';
              }
            } else {
              return 'no-first';
            }
          },
        ];
      }

      document.body.innerHTML = "<test-async first='1' second='2' third='3' />";

      customElements.define(
        'test-async',
        brisaElement(Test as any, ['first', 'second', 'third']),
      );

      const testComponent = document.querySelector('test-async') as HTMLElement;

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>test work</div>');

      testComponent.setAttribute('first', '2');

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>no-first</div>');

      testComponent.setAttribute('first', '1');
      testComponent.setAttribute('second', '3');

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>no-second</div>');

      testComponent.setAttribute('second', '2');
      testComponent.setAttribute('third', '4');

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>no-third</div>');

      await Bun.sleep(0);

      testComponent.setAttribute('third', '3');

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>test work</div>');
    });

    it('should be possible to create a collapsible content section with an accordion', () => {
      function Accordion({}: any, { state }: any) {
        const active = state(0);

        return [
          'div',
          {},
          [
            [
              'button',
              {
                onClick: () => {
                  active.value = active.value === 0 ? 1 : 0;
                },
              },
              'toggle',
            ],
            [
              'div',
              {
                style: () => ({
                  display: active.value === 0 ? 'none' : 'block',
                }),
              },
              'content',
            ],
          ],
        ];
      }

      customElements.define('accordion-element', brisaElement(Accordion));

      document.body.innerHTML = '<accordion-element />';

      const accordion = document.querySelector(
        'accordion-element',
      ) as HTMLElement;
      const button = accordion?.shadowRoot?.querySelector(
        'button',
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

    it('should display additional information on hover with a tooltip', () => {
      function Tooltip({}, { state }: any) {
        const visible = state(false);

        return [
          'div',
          {},
          [
            [
              'span',
              {
                onMouseOver: () => {
                  visible.value = true;
                },
                onMouseOut: () => {
                  visible.value = false;
                },
                style: {
                  position: 'relative',
                },
              },
              [
                [
                  'span',
                  {
                    style: () => ({
                      position: 'absolute',
                      visibility: visible.value ? 'visible' : 'hidden',
                    }),
                  },
                  'Tooltip text',
                ],
                'Hover over me',
              ],
            ],
          ],
        ];
      }

      customElements.define('tooltip-element', brisaElement(Tooltip));

      document.body.innerHTML = '<tooltip-element />';

      const tooltip = document.querySelector('tooltip-element') as HTMLElement;
      const span = tooltip?.shadowRoot?.querySelector(
        'span',
      ) as HTMLSpanElement;

      expect(tooltip?.shadowRoot?.innerHTML).toBe(
        '<div><span style="position:relative;"><span style="position:absolute;visibility:hidden;">Tooltip text</span>Hover over me</span></div>',
      );

      span.dispatchEvent(new Event('mouseover'));

      expect(tooltip?.shadowRoot?.innerHTML).toBe(
        '<div><span style="position:relative;"><span style="position:absolute;visibility:visible;">Tooltip text</span>Hover over me</span></div>',
      );

      span.dispatchEvent(new Event('mouseout'));

      expect(tooltip?.shadowRoot?.innerHTML).toBe(
        '<div><span style="position:relative;"><span style="position:absolute;visibility:hidden;">Tooltip text</span>Hover over me</span></div>',
      );
    });

    it('should work a conditional render with different web-components', () => {
      function WebComponent1({}, { state }: any) {
        const name = state('WebComponent1');
        return [
          'div',
          {
            onClick: () => {
              name.value = 'WebComponent1 updated';
            },
          },
          () => name.value,
        ];
      }
      function WebComponent2({}, { state }: any) {
        const name = state('WebComponent2');
        return [
          'div',
          {
            onClick: () => {
              name.value = 'WebComponent2 updated';
            },
          },
          () => name.value,
        ];
      }
      function ParentWebComponent({ name }: any) {
        return [
          null,
          {},
          () =>
            name.value === 'WebComponent1'
              ? ['web-component-1', {}, '']
              : ['web-component-2', {}, ''],
        ];
      }

      customElements.define('web-component-1', brisaElement(WebComponent1));
      customElements.define('web-component-2', brisaElement(WebComponent2));
      customElements.define(
        'parent-web-component',
        brisaElement(ParentWebComponent, ['name']),
      );

      document.body.innerHTML = '<parent-web-component name="WebComponent1" />';

      const parentWebComponent = document.querySelector(
        'parent-web-component',
      ) as HTMLElement;
      const firstWebComponent = parentWebComponent?.shadowRoot?.querySelector(
        'web-component-1',
      ) as HTMLElement;
      const firstDiv = firstWebComponent?.shadowRoot?.querySelector(
        'div',
      ) as HTMLElement;

      // The first component should be mounted
      expect(parentWebComponent?.shadowRoot?.innerHTML).toBe(
        '<web-component-1></web-component-1>',
      );
      expect(firstWebComponent?.shadowRoot?.innerHTML).toBe(
        '<div>WebComponent1</div>',
      );

      // The first component should be updated
      firstDiv.click();
      expect(firstWebComponent?.shadowRoot?.innerHTML).toBe(
        '<div>WebComponent1 updated</div>',
      );

      // Changing the conditional render on the parent component
      parentWebComponent.setAttribute('name', 'WebComponent2');
      const secondWebComponent = parentWebComponent?.shadowRoot?.querySelector(
        'web-component-2',
      ) as HTMLElement;
      const secondDiv = secondWebComponent?.shadowRoot?.querySelector(
        'div',
      ) as HTMLElement;

      // The second component should be mounted
      expect(parentWebComponent?.shadowRoot?.innerHTML).toBe(
        '<web-component-2></web-component-2>',
      );
      expect(secondWebComponent?.shadowRoot?.innerHTML).toBe(
        '<div>WebComponent2</div>',
      );

      // The second component should be updated
      secondDiv.click();
      expect(secondWebComponent?.shadowRoot?.innerHTML).toBe(
        '<div>WebComponent2 updated</div>',
      );

      // Changing the conditional render on the parent component again to the first component
      parentWebComponent.setAttribute('name', 'WebComponent1');
      const firstComponent = parentWebComponent?.shadowRoot?.querySelector(
        'web-component-1',
      ) as HTMLElement;

      // The first component should be unmounted and the state should be reset
      expect(parentWebComponent?.shadowRoot?.innerHTML).toBe(
        '<web-component-1></web-component-1>',
      );
      expect(firstComponent?.shadowRoot?.innerHTML).toBe(
        '<div>WebComponent1</div>',
      );
    });

    it('should open/close a dialog with the "open" attribute', () => {
      function Dialog({}, { state }: any) {
        const open = state(false);

        return [
          'div',
          {},
          [
            [
              'button',
              {
                onClick: () => {
                  open.value = !open.value;
                },
              },
              'open',
            ],
            [
              'dialog',
              {
                open: () => (open.value ? _on : _off),
                onClick: () => {
                  open.value = false;
                },
              },
              'dialog',
            ],
          ],
        ];
      }

      customElements.define('dialog-element', brisaElement(Dialog));

      document.body.innerHTML = '<dialog-element />';

      const dialog = document.querySelector('dialog-element') as HTMLElement;
      const button = dialog?.shadowRoot?.querySelector(
        'button',
      ) as HTMLButtonElement;
      const dialogElement = dialog?.shadowRoot?.querySelector(
        'dialog',
      ) as HTMLDialogElement;

      expect(dialog?.shadowRoot?.innerHTML).toBe(
        '<div><button>open</button><dialog>dialog</dialog></div>',
      );

      button.click();

      expect(dialog?.shadowRoot?.innerHTML).toBe(
        '<div><button>open</button><dialog open="">dialog</dialog></div>',
      );

      dialogElement.click();

      expect(dialog?.shadowRoot?.innerHTML).toBe(
        '<div><button>open</button><dialog>dialog</dialog></div>',
      );
    });

    it('should serialize the props consuming another web-component', () => {
      function Test() {
        return ['web-component', { user: { name: 'Aral' } }, ''];
      }
      function WebComponent({ user }: any) {
        return ['div', {}, () => user.value.name];
      }

      customElements.define('test-component', brisaElement(Test));
      customElements.define(
        'web-component',
        brisaElement(WebComponent, ['user']),
      );

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;
      const webComponent = testComponent?.shadowRoot?.querySelector(
        'web-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        `<web-component user="{"name":"Aral"}"></web-component>`,
      );
      expect(webComponent?.shadowRoot?.innerHTML).toBe(`<div>Aral</div>`);

      webComponent.setAttribute('user', serialize({ name: 'Barbara' }));

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        `<web-component user="{"name":"Barbara"}"></web-component>`,
      );
      expect(webComponent?.shadowRoot?.innerHTML).toBe(`<div>Barbara</div>`);
    });

    it('should work with booleans and numbers in the same way than React', () => {
      const Component = ({}) => [
        null,
        {},
        [
          [null, {}, () => true && ['div', {}, 'TRUE']],
          [null, {}, () => false && ['div', {}, 'FALSE']],
          [null, {}, () => 1 && ['div', {}, 'TRUE']],
          [null, {}, () => 0 && ['div', {}, 'FALSE']],
        ],
      ];

      customElements.define('bool-component', brisaElement(Component));

      document.body.innerHTML = '<bool-component />';
      const boolComponent = document.querySelector(
        'bool-component',
      ) as HTMLElement;

      expect(boolComponent?.shadowRoot?.innerHTML).toBe(
        '<div>TRUE</div><div>TRUE</div>0',
      );
    });

    it('should work with booleans and numbers from props in the same way than React', () => {
      const Component = ({ first, second, third, fourth }: any) => [
        null,
        {},
        [
          [null, {}, () => first.value && ['div', {}, 'TRUE']],
          [null, {}, () => second.value && ['div', {}, 'FALSE']],
          [null, {}, () => third.value && ['div', {}, 'TRUE']],
          [null, {}, () => fourth.value && ['div', {}, 'FALSE']],
        ],
      ];

      customElements.define(
        'bool-component',
        brisaElement(Component, ['first', 'second', 'third', 'fourth']),
      );

      document.body.innerHTML =
        "<bool-component first='true' second='false' third='1' fourth='0' />";
      const boolComponent = document.querySelector(
        'bool-component',
      ) as HTMLElement;

      expect(boolComponent?.shadowRoot?.innerHTML).toBe(
        '<div>TRUE</div><div>TRUE</div>0',
      );
    });

    it('should be possible to render undefined and null', () => {
      const Component = () => [
        null,
        {},
        [
          ['div', { class: 'empty' }, undefined],
          ['div', { class: 'empty' }, null],
        ],
      ];

      customElements.define('test-component', brisaElement(Component));

      document.body.innerHTML = '<test-component />';
      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div class="empty"></div><div class="empty"></div>',
      );
    });

    it('should not be possible to inject HTML as string directly', () => {
      const Component = () => '<script>alert("test")</script>';

      customElements.define('test-component', brisaElement(Component));

      document.body.innerHTML = '<test-component />';
      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<script>alert("test")</script>',
      );

      const script = document.querySelector('script');

      expect(script).toBeNull();
      expect(
        testComponent?.shadowRoot?.firstChild?.nodeType === Node.TEXT_NODE,
      ).toBeTruthy();
    });

    it('should handle keyboard events', () => {
      const mockAlert = mock((s: string) => {});
      const Component = () => [
        'input',
        {
          onKeydown: () => {
            mockAlert('Enter to onKeydown');
          },
        },
        '',
      ];

      customElements.define('keyboard-events', brisaElement(Component));

      document.body.innerHTML = '<keyboard-events />';
      const keyboardEventEl = document.querySelector(
        'keyboard-events',
      ) as HTMLElement;

      expect(keyboardEventEl?.shadowRoot?.innerHTML).toBe('<input>');

      const input = keyboardEventEl?.shadowRoot?.querySelector(
        'input',
      ) as HTMLInputElement;

      input.dispatchEvent(new KeyboardEvent('keydown'));

      expect(keyboardEventEl?.shadowRoot?.innerHTML).toBe('<input>');
      expect(mockAlert).toHaveBeenCalledTimes(1);
      expect(mockAlert.mock.calls[0][0]).toBe('Enter to onKeydown');
    });

    it('should handle asynchronous updates', async () => {
      const fetchData = () =>
        Promise.resolve({ json: () => Promise.resolve({ name: 'Barbara' }) });
      const Component = ({}, { state }: any) => {
        const user = state({ name: 'Aral' });

        return [
          null,
          {},
          [
            [
              'button',
              {
                onClick: async () => {
                  const response = await fetchData();
                  user.value = await response.json();
                },
              },
              'fetch',
            ],
            ['div', {}, () => user.value.name],
          ],
        ];
      };

      customElements.define('async-updates', brisaElement(Component));

      document.body.innerHTML = '<async-updates />';
      const asyncUpdatesComp = document.querySelector(
        'async-updates',
      ) as HTMLElement;

      expect(asyncUpdatesComp?.shadowRoot?.innerHTML).toBe(
        '<button>fetch</button><div>Aral</div>',
      );

      const button = asyncUpdatesComp?.shadowRoot?.querySelector(
        'button',
      ) as HTMLButtonElement;

      button.click();

      expect(asyncUpdatesComp?.shadowRoot?.innerHTML).toBe(
        '<button>fetch</button><div>Aral</div>',
      );

      await Bun.sleep(0);

      expect(asyncUpdatesComp?.shadowRoot?.innerHTML).toBe(
        '<button>fetch</button><div>Barbara</div>',
      );
    });

    it('should update all items from a list consuming the same state signal at the same time', () => {
      const Component = ({}, { state }: any) => {
        const list = state(['one', 'two', 'three']);

        return [
          null,
          {},
          [
            [
              'button',
              {
                onClick: () => {
                  list.value = list.value.map((item: string) =>
                    item.toUpperCase(),
                  );
                },
              },
              'uppercase',
            ],
            [
              'ul',
              {},
              () => list.value.map((item: string) => ['li', {}, item]),
            ],
          ],
        ];
      };

      customElements.define('test-component', brisaElement(Component));

      document.body.innerHTML = '<test-component />';
      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<button>uppercase</button><ul><li>one</li><li>two</li><li>three</li></ul>',
      );

      const button = testComponent?.shadowRoot?.querySelector(
        'button',
      ) as HTMLButtonElement;

      button.click();

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<button>uppercase</button><ul><li>ONE</li><li>TWO</li><li>THREE</li></ul>',
      );
    });

    it('should be possible to update a rendered DOM element after mount via ref', async () => {
      const Component = ({}, { onMount, state }: any) => {
        const ref = state(null);

        onMount(() => {
          // Is not a good practice but is just for testing
          ref.value.innerHTML = 'test';
        });

        return [null, {}, [['div', { ref }, 'original']]];
      };

      customElements.define('test-component', brisaElement(Component));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>original</div>');

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>test</div>');
    });

    it('should be possible to execute different onMount callbacks', async () => {
      const mockFirstCallback = mock((s: string) => {});
      const mockSecondCallback = mock((s: string) => {});
      const Component = ({}, { onMount }: any) => {
        onMount(() => {
          mockFirstCallback('first');
        });
        onMount(() => {
          mockSecondCallback('second');
        });

        return null;
      };

      customElements.define('test-component', brisaElement(Component as any));
      document.body.innerHTML = '<test-component />';

      await Bun.sleep(0);

      expect(mockFirstCallback).toHaveBeenCalledTimes(1);
      expect(mockFirstCallback.mock.calls[0][0]).toBe('first');
      expect(mockSecondCallback).toHaveBeenCalledTimes(1);
      expect(mockSecondCallback.mock.calls[0][0]).toBe('second');
    });

    it('should cleanup an event registered on onMount when the component is unmounted', async () => {
      const mockCallback = mock((s: string) => {});
      const Component = ({}, { onMount, cleanup }: any) => {
        onMount(() => {
          const onClick = () => mockCallback('click');
          document.addEventListener('click', onClick);

          cleanup(() => {
            document.removeEventListener('click', onClick);
          });
        });

        return null;
      };

      customElements.define('test-component', brisaElement(Component as any));

      document.body.innerHTML = '<test-component />';

      await Bun.sleep(0);

      expect(mockCallback).toHaveBeenCalledTimes(0);

      document.dispatchEvent(new Event('click'));

      expect(mockCallback).toHaveBeenCalledTimes(1);

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      testComponent.remove();

      document.dispatchEvent(new Event('click'));

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should cleanup on unmount if a cleanup callback is registered in the root of the component', () => {
      const mockCallback = mock((s: string) => {});
      const Component = ({}, { cleanup }: any) => {
        cleanup(() => {
          mockCallback('cleanup');
        });

        return null;
      };

      customElements.define('test-component', brisaElement(Component as any));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      testComponent.remove();

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback.mock.calls[0][0]).toBe('cleanup');
    });

    it('should cleanup on unmount if a cleanup callback is registered in a nested component', () => {
      const mockCallback = mock((s: string) => {});
      const Component = ({}, { cleanup }: any) => {
        cleanup(() => {
          mockCallback('cleanup');
        });

        return null;
      };

      const ParentComponent = () => {
        return [['test-component', {}, null]];
      };

      customElements.define('test-component', brisaElement(Component as any));
      customElements.define('parent-component', brisaElement(ParentComponent));
      document.body.innerHTML = '<parent-component />';

      const parentComponent = document.querySelector(
        'parent-component',
      ) as HTMLElement;

      parentComponent.remove();

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback.mock.calls[0][0]).toBe('cleanup');
    });

    it('should have reactive props inside the suspense component', async () => {
      const Component = async () => {
        await Bun.sleep(0);
        return ['div', {}, 'final content'];
      };

      Component.suspense = ({ name }: any) => {
        return () => name.value;
      };

      customElements.define(
        'test-component',
        brisaElement(Component, ['name']),
      );

      document.body.innerHTML = '<test-component name="suspense" />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe('suspense');

      testComponent.setAttribute('name', 'more suspense');

      expect(testComponent?.shadowRoot?.innerHTML).toBe('more suspense');

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div>final content</div>',
      );
    });

    it('should have reactive props inside the error component', async () => {
      const Component = async () => {
        throw new Error('error');
      };

      Component.error = ({ name }: any) => {
        return () => name.value;
      };

      customElements.define(
        'test-component',
        brisaElement(Component, ['name']),
      );

      document.body.innerHTML = '<test-component name="some error" />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe('some error');

      testComponent.setAttribute('name', 'another error');

      expect(testComponent?.shadowRoot?.innerHTML).toBe('another error');
    });

    it('should cleanup suspense when the real content is displayed', async () => {
      const mockCallback = mock((s: string) => {});
      const Component = async ({ name = 'final content' }) => {
        await Bun.sleep(0);
        return ['div', {}, name];
      };

      Component.suspense = ({ name = 'suspense' }, { cleanup }: any) => {
        cleanup(() => {
          mockCallback('cleanup');
        });
        return ['div', {}, name];
      };

      customElements.define('test-component', brisaElement(Component));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>suspense</div>');
      expect(mockCallback).toHaveBeenCalledTimes(0);

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div>final content</div>',
      );

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should be reactive both suspense and "real" content', async () => {
      const mockUnmountSuspense = mock((s: string) => {});

      const Component = async ({}, { state }: any) => {
        const count = state(0);

        await Bun.sleep(0);

        return [
          'div',
          { onClick: () => count.value++ },
          () => 'REAL:' + count.value,
        ];
      };

      Component.suspense = ({}, { state, cleanup }: any) => {
        const count = state(0);

        cleanup(() => {
          mockUnmountSuspense('cleanup');
        });

        return [
          'div',
          { onClick: () => count.value++ },
          () => 'SUSPENSE:' + count.value,
        ];
      };

      customElements.define('test-component', brisaElement(Component));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div>SUSPENSE:0</div>',
      );

      testComponent?.shadowRoot?.querySelector('div')!.click();

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div>SUSPENSE:1</div>',
      );
      expect(mockUnmountSuspense).toHaveBeenCalledTimes(0);

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>REAL:0</div>');
      expect(mockUnmountSuspense).toHaveBeenCalledTimes(1);

      testComponent?.shadowRoot?.querySelector('div')!.click();

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>REAL:1</div>');
    });

    it('should cleanup when thrown an error with error component', async () => {
      const mockCallback = mock((s: string) => {});
      const Component = async ({}, { cleanup }: any) => {
        cleanup(() => {
          mockCallback('cleanup');
        });

        await Bun.sleep(0);

        throw new Error('error');
      };

      Component.error = ({ name = 'error' }) => {
        return ['div', {}, name];
      };

      customElements.define('test-component', brisaElement(Component));

      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe('');

      expect(mockCallback).not.toHaveBeenCalled();

      await Bun.sleep(0);

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>error</div>');
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should be possible to inject html using the dangerHTML helper', () => {
      const Component = ({}) => {
        return ['div', {}, () => dangerHTML("<script>alert('test')</script>")];
      };

      customElements.define('test-component', brisaElement(Component));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        "<div><script>alert('test')</script></div>",
      );

      const script = testComponent?.shadowRoot?.querySelector('script');

      expect(script).not.toBeNull();
    });

    it('should render an string when receive an array of strings', () => {
      const Component = () => {
        return ['div', {}, ['hello', ' ', 'world']];
      };

      customElements.define('test-component', brisaElement(Component));
      document.body.innerHTML = '<test-component />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div>hello world</div>',
      );
    });

    it('should work createPortal helper rendering in another HTML element', () => {
      const Component = () =>
        createPortal(
          ['div', {}, 'test'] as any,
          document.querySelector('#portal') as any,
        );

      customElements.define('portal-component', brisaElement(Component));
      document.body.innerHTML =
        '<div id="portal"></div><portal-component></portal-component>';

      const portalComponent = document.querySelector(
        'portal-component',
      ) as HTMLElement;

      expect(portalComponent?.shadowRoot?.innerHTML).toBe('');

      expect(document.body.innerHTML).toBe(
        '<div id="portal"><div>test</div></div><portal-component></portal-component>',
      );
    });

    it('should remove a text using && operator', () => {
      const Component = ({ foo }: any) => [
        'div',
        {},
        [
          [
            null,
            {},
            () =>
              foo.value && [
                ['b', {}, 'test'],
                ['span', {}, 'test2'],
              ],
          ],
          ['div', {}, 'test3'],
        ],
      ];

      customElements.define('test-component', brisaElement(Component, ['foo']));
      document.body.innerHTML = '<test-component foo="bar" />';

      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div><b>test</b><span>test2</span><div>test3</div></div>',
      );

      testComponent.removeAttribute('foo');

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        '<div><div>test3</div></div>',
      );
    });

    it('should work a ternary operator with several elements', () => {
      const Component = ({ error }: any) => {
        return [
          null,
          {},
          [
            [
              null,
              {},
              () =>
                error.value
                  ? [
                      null,
                      {},
                      [
                        [null, {}, () => `Error: ${error.value.message}`],
                        [null, {}, ' '],
                        ['pre', {}, () => error.value.stack],
                      ],
                    ]
                  : [null, {}, ''],
            ],
            ['div', {}, 'Test'],
          ],
        ];
      };

      customElements.define(
        'test-component',
        brisaElement(Component, ['error']),
      );
      document.body.innerHTML = '<test-component />';
      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>Test</div>');

      testComponent.setAttribute(
        'error',
        serialize({ message: 'message', stack: 'stack' }),
      );

      expect(testComponent?.shadowRoot?.innerHTML).toBe(
        'Error: message <pre>stack</pre><div>Test</div>',
      );

      testComponent.removeAttribute('error');

      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>Test</div>');
    });

    it('should add the "brisa-request" when the indicator is true', () => {
      const Component = () => {
        return [
          'button',
          { indicator: { id: '__ind:increment', value: true } },
          'Test',
        ];
      };

      customElements.define(
        'test-component',
        brisaElement(Component, ['error']),
      );
      document.body.innerHTML = '<test-component />';
      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      const button = testComponent?.shadowRoot?.firstChild as HTMLButtonElement;

      expect(button.classList.contains('brisa-request')).toBeTrue();
    });

    it('should not add the "brisa-request" when the indicator is false', () => {
      const Component = () => {
        return [
          'button',
          { indicator: { id: '__ind:increment', value: false } },
          'Test',
        ];
      };

      customElements.define(
        'test-component',
        brisaElement(Component, ['error']),
      );
      document.body.innerHTML = '<test-component />';
      const testComponent = document.querySelector(
        'test-component',
      ) as HTMLElement;

      const button = testComponent?.shadowRoot?.firstChild as HTMLButtonElement;

      expect(button.classList.contains('brisa-request')).toBeFalse();
    });

    it('should unmount/mount again a component when the "key" prop changes', async () => {
      const mockRender = mock((key: number) => {});
      const Component = ({ key }: any) => {
        mockRender(key.value);
        return ['div', {}, key.value];
      };

      document.body.innerHTML = '<key-component key="1" />';
      customElements.define('key-component', brisaElement(Component));

      const testComponent = document.querySelector(
        'key-component',
      ) as HTMLElement;

      expect(mockRender).toHaveBeenCalledTimes(1);
      expect(mockRender.mock.calls[0][0]).toBe(1);
      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>1</div>');

      testComponent.setAttribute('key', '2');

      expect(mockRender).toHaveBeenCalledTimes(2);
      expect(mockRender.mock.calls[1][0]).toBe(2);
      expect(testComponent?.shadowRoot?.innerHTML).toBe('<div>2</div>');
    });

    it('should work with useContext method', () => {
      const Context = createContext({ name: 'Aral' }, '0:0') as BrisaContext<{
        name: string;
      }>;
      const Component = ({}, { useContext }: WebContext) => {
        const context = useContext(Context);
        return ['div', {}, context.value.name];
      };

      customElements.define('context-component', brisaElement(Component));
      document.body.innerHTML = '<context-component />';

      const contextComponent = document.querySelector(
        'context-component',
      ) as HTMLElement;

      expect(contextComponent?.shadowRoot?.innerHTML).toBe('<div>Aral</div>');
    });

    it('should transform style props object to string', () => {
      const Component = () => {
        return ['div', { style: { color: 'red' } }, ''];
      };

      customElements.define('style-component', brisaElement(Component));
      document.body.innerHTML = '<style-component />';

      const styleComponent = document.querySelector(
        'style-component',
      ) as HTMLElement;

      expect(styleComponent?.shadowRoot?.innerHTML).toBe(
        '<div style="color:red;"></div>',
      );
    });

    it('should also work with "style" prop as string', () => {
      const Component = () => {
        return ['div', { style: 'color:red;' }, ''];
      };

      customElements.define('style-component', brisaElement(Component));
      document.body.innerHTML = '<style-component />';

      const styleComponent = document.querySelector(
        'style-component',
      ) as HTMLElement;

      expect(styleComponent?.shadowRoot?.innerHTML).toBe(
        '<div style="color:red;"></div>',
      );
    });

    it('i18n from webContext is always the window.i18n object', () => {
      window.i18n = { t: () => 'works' };
      const Component = ({}, { i18n }: WebContext) => {
        return ['div', {}, i18n.t('test')];
      };

      customElements.define('i18n-component', brisaElement(Component));
      document.body.innerHTML = '<i18n-component />';

      const i18nComponent = document.querySelector(
        'i18n-component',
      ) as HTMLElement;

      expect(i18nComponent?.shadowRoot?.innerHTML).toBe('<div>works</div>');
    });

    it('should web context plugin work', () => {
      window.__WEB_CONTEXT_PLUGINS__ = true;
      window._P = [
        (ctx) => ({ ...ctx, test: 'this is a test' }),
      ] satisfies WebContextPlugin[];

      // @ts-ignore
      const Component = ({}, { test }: WebContext) => {
        return ['div', {}, test];
      };

      customElements.define('store-component', brisaElement(Component));
      document.body.innerHTML = '<store-component />';

      const storeComponent = document.querySelector(
        'store-component',
      ) as HTMLElement;

      expect(storeComponent?.shadowRoot?.innerHTML).toBe(
        '<div>this is a test</div>',
      );
    });

    it('should automatic adopt the global style sheets from document.styleSheets', async () => {
      const style = document.createElement('style');

      style.textContent = 'div { color: red; }';
      document.head.appendChild(style);

      const Component = () => {
        return ['div', {}, ''];
      };

      customElements.define('style-sheet-component', brisaElement(Component));
      document.body.innerHTML = '<style-sheet-component />';

      const styleSheetComponent = document.querySelector(
        'style-sheet-component',
      ) as HTMLElement;

      const expectedSheet = new CSSStyleSheet();

      expectedSheet.insertRule('div { color: red; }');

      expect(styleSheetComponent?.shadowRoot?.innerHTML).toBe('<div></div>');
      expect(styleSheetComponent?.shadowRoot?.adoptedStyleSheets).toEqual([
        expectedSheet,
      ]);
    });

    it('should automatic adopt the global styles sheets with link with href from document.styleSheets', () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'styles.css';

      document.head.appendChild(link);

      const Component = () => {
        return ['div', {}, ''];
      };

      customElements.define('style-sheet-component', brisaElement(Component));
      document.body.innerHTML = '<style-sheet-component />';

      const styleSheetComponent = document.querySelector(
        'style-sheet-component',
      ) as HTMLElement;

      const expectedSheet = new CSSStyleSheet();

      expectedSheet.replaceSync('@import url(styles.css);');

      expect(styleSheetComponent?.shadowRoot?.adoptedStyleSheets).toEqual([
        expectedSheet,
      ]);
    });

    it('should formAssociated static property be defined as true by default', () => {
      const Component = () => ['input', {}, ''];
      const customElementInstance = brisaElement(Component);

      expect(customElementInstance.formAssociated).toBeTrue();
    });

    it('should adopt more than one style sheet from document.styleSheets', async () => {
      const style = document.createElement('style');
      const style2 = document.createElement('style');
      const css1 = `
        @import url('styles.css'); 
        
        body { background-color: blue; }
        
        @media (max-width: 600px) {
          body { background-color: red; }
        }
      `;

      const css2 = `
        span { color: blue; }
      `;

      style.textContent = css1;
      style2.textContent = css2;
      document.head.appendChild(style);
      document.head.appendChild(style2);

      const Component = () => {
        return ['div', {}, ''];
      };

      customElements.define('style-sheet-component', brisaElement(Component));
      document.body.innerHTML = '<style-sheet-component />';

      const styleSheetComponent = document.querySelector(
        'style-sheet-component',
      ) as HTMLElement;

      const expectedSheet = new CSSStyleSheet();
      expectedSheet.replaceSync(css1 + css2);

      expect(styleSheetComponent?.shadowRoot?.innerHTML).toBe('<div></div>');
      expect(styleSheetComponent?.shadowRoot?.adoptedStyleSheets).toEqual([
        expectedSheet,
      ]);
    });

    it('should be possible to access route via web context', () => {
      window.r = {
        name: '/user/[username]',
        pathname: '/user/aral',
        params: { username: 'aral' },
        query: {},
      };

      const Component = ({}, { route }: WebContext) => {
        return ['div', {}, route.pathname];
      };

      customElements.define('route-component', brisaElement(Component));

      document.body.innerHTML = '<route-component />';

      const routeComponent = document.querySelector(
        'route-component',
      ) as HTMLElement;

      expect(routeComponent?.shadowRoot?.innerHTML).toBe(
        '<div>/user/aral</div>',
      );
    });
  });
});
