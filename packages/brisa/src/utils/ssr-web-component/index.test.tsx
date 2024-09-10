import { describe, expect, it, afterEach } from 'bun:test';
import { join } from 'node:path';
import SSRWebComponent, { AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL } from '.';
import type {
  I18nConfig,
  MatchedBrisaRoute,
  WebContext,
  WebContextPlugin,
} from '@/types';
import extendRequestContext from '@/utils/extend-request-context';
import createContext from '@/utils/create-context';
import translateCore from '@/utils/translate-core';
import { getConstants } from '@/constants';
import { Fragment } from '@/jsx-runtime';

const FIXTURES = join(import.meta.dir, '..', '..', '__fixtures__');
const JSX = Symbol.for('isJSX');
const webComponentPath = join(FIXTURES, 'web-components', 'web-component.tsx');
const requestContext = extendRequestContext({
  originalRequest: new Request('http://localhost'),
  route: {
    name: '/',
    pathname: '/',
    params: {},
    query: {},
    filePath: '/index.js',
    kind: 'page',
  } as unknown as MatchedBrisaRoute,
});

describe('utils', () => {
  describe('SSRWebComponent', () => {
    afterEach(() => {
      globalThis.mockConstants = undefined;
    });
    it('should render a web component', async () => {
      const Component = () => <div>hello world</div>;
      const selector = 'my-component';
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2]).toBe('hello world');
    });

    it('should render a web component with props', async () => {
      const Component = ({ name }: { name: string }) => <div>hello {name}</div>;
      const selector = 'my-component';
      const output = (await SSRWebComponent(
        {
          Component,
          selector,
          name: 'world',
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2].join('')).toBe('hello world');
    });

    it('should render a web component with css template literal', async () => {
      const Component = ({}, { css }: WebContext) => {
        css`
          div {
            color: red;
          }
        `;

        return <div>hello world</div>;
      };
      const selector = 'my-component';
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2]).toBe('hello world');
      expect(output[2][0][2][1][0]).toBe('style');
      expect(output[2][0][2][1][2]).toBe('div {color: red;}');
    });

    it('should render a web component with css template literal and signals', async () => {
      const Component = ({}, { state, css }: WebContext) => {
        const color = state<string>('red');
        css`
          div {
            color: ${color.value};
          }
        `;

        return <div>hello world</div>;
      };
      const selector = 'my-component';
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2]).toBe('hello world');
      expect(output[2][0][2][1][0]).toBe('style');
      expect(output[2][0][2][1][2]).toBe('div {color: red;}');
    });

    it('should render a web component with a initial state', async () => {
      const Component = ({}, { state }: WebContext) => {
        const foo = state({ name: 'world' });

        return <div>hello {foo.value.name}</div>;
      };
      const selector = 'my-component';
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2].join('')).toBe('hello world');
    });

    it('should render a web component with a derived state', async () => {
      const Component = ({}, { state, derived }: WebContext) => {
        const foo = state({ name: 'wor' });
        const bar = derived(() => foo.value.name + 'ld');

        return <div>hello {bar.value}</div>;
      };
      const selector = 'my-component';
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2].join('')).toBe('hello world');
    });

    it('should render a web component with a effect', async () => {
      const Component = ({}, { effect }: WebContext) => {
        effect(() => {
          document.title = 'hello world';
        });

        return <div>hello world</div>;
      };
      const selector = 'my-component';
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2]).toBe('hello world');
    });

    it('should render a web component with a cleanup', async () => {
      const Component = ({}, { cleanup }: WebContext) => {
        cleanup(() => {
          document.title = 'hello world';
        });

        return <div>hello world</div>;
      };
      const selector = 'my-component';
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2]).toBe('hello world');
    });

    it('should render a web component with a onMount', async () => {
      const Component = ({}, { onMount }: WebContext) => {
        onMount(() => {
          document.title = 'hello world';
        });

        return <div>hello world</div>;
      };
      const selector = 'my-component';
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2]).toBe('hello world');
    });

    it('should render a web component with a "reset" method', async () => {
      const Component = ({}, { reset }: WebContext) => {
        reset();
        return <div>hello world</div>;
      };

      const selector = 'my-component';
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2]).toBe('hello world');
    });

    it('should render a web component with a "store" property', async () => {
      const Component = ({}, { store }: WebContext) => {
        store.set('name', 'world');
        return <div>hello {store.get('name')}</div>;
      };

      const selector = 'my-component';
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2].join('')).toBe('hello world');
    });

    it('should render a web component with a children slot', async () => {
      const Component = ({ children }: any) => {
        return <div>hello {children}</div>;
      };

      const selector = 'my-component';

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
          children: 'world',
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2][0]).toBe('hello ');
      expect(output[2][0][2][0][2][1][0]).toBe('slot');
      expect(output[2][1][2]).toBe('world');
    });

    it('should work with async components', async () => {
      const Component = async ({ children }: any) => {
        return <div>hello {children}</div>;
      };

      const selector = 'my-component';

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
          children: 'world',
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2][0]).toBe('hello ');
      expect(output[2][0][2][0][2][1][0]).toBe('slot');
      expect(output[2][1][2]).toBe('world');
    });

    it('should work the suspense component in async components', async () => {
      const Component = async ({ children }: any) => {
        return <div>hello {children}</div>;
      };
      Component.suspense = () => <div>loading...</div>;

      const selector = 'my-component';

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
          children: 'world',
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2]).toBe('loading...');
    });

    it('should render the error component when there is an error rendering the component', async () => {
      const Component = () => {
        throw new Error('some error');
      };
      Component.error = ({ error, name }: any) => (
        <div>
          Ops! {error.message}, hello {name}
        </div>
      );

      const selector = 'my-component';

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
          name: 'world',
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2].join('')).toBe(
        'Ops! some error, hello world',
      );
    });

    it('should render the error component when there is an error rendering the suspense component', async () => {
      const Component = async () => {
        return <div>hello world</div>;
      };
      Component.suspense = () => {
        throw new Error('error');
      };
      Component.error = () => <div>Ops! error</div>;

      const selector = 'my-component';

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2]).toBe('Ops! error');
    });

    it('should throw the error if there is no an error component', async () => {
      const Component = () => {
        throw new Error('error');
      };

      const selector = 'my-component';

      try {
        (await SSRWebComponent(
          {
            Component,
            selector,
          },
          requestContext,
        )) as any;
        expect(false).toBe(true);
      } catch (error: any) {
        expect(error.message).toBe('error');
      }
    });

    it('should work with "useContext"', async () => {
      const Ctx = createContext<{ name: string }>(
        {
          name: 'world',
        },
        'name',
      );

      const Component = ({}, { useContext }: WebContext) => {
        const context = useContext<{ name: string }>(Ctx);

        return `hello ${context.value.name}`;
      };

      const selector = 'my-component';

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][2][0]).toBe('hello world');
    });

    it('should i18n work correctly', async () => {
      const I18N_CONFIG = {
        locales: ['en', 'ru'],
        defaultLocale: 'en',
        messages: {
          en: {
            key_1: 'hello {{name}}',
          },
        },
      } as I18nConfig;

      const request = extendRequestContext({
        originalRequest: new Request('http://localhost'),
        i18n: {
          t: translateCore('en', I18N_CONFIG),
          locale: 'en',
          locales: ['en', 'ru'],
          defaultLocale: 'en',
          pages: {},
          overrideMessages: async () => {},
        },
      });

      const Component = ({}, { i18n }: WebContext) => {
        return i18n.t('key_1', { name: 'world' });
      };

      const selector = 'my-component';

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        request,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][2][0]).toBe('hello world');
    });

    it('should an async event work correctly', async () => {
      async function ComponentWithAsyncEvent({}, { i18n }: WebContext) {
        async function onAsyncEvent() {
          console.log('foo');
          await i18n.overrideMessages(async (messages) => ({
            ...messages,
            modalDictionary: { someKey: 'Some key' },
          }));
        }

        return <button onClick={onAsyncEvent}>TEST</button>;
      }

      const selector = 'component-with-async-event';

      const output = (await SSRWebComponent(
        {
          Component: ComponentWithAsyncEvent,
          selector,
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);

      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');

      expect(output[2][0][2][0][0]).toBe('button');
      expect(output[2][0][2][0][2]).toBe('TEST');
      expect(output[2][0][2][0][1].onClick).toBeInstanceOf(Function);
    });

    it('should extend the "webContext" in SSR when plugins are defined', async () => {
      globalThis.mockConstants = {
        ...getConstants(),
        WEB_CONTEXT_PLUGINS: [
          (ctx) => ({ ...ctx, newOne: 'hello world' }),
        ] satisfies WebContextPlugin[],
      };

      const Component = ({}, { newOne }: any) => {
        return <div>{newOne}</div>;
      };

      const selector = 'my-component';

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][2][0]).toEqual(
        Object.assign(['div', { key: undefined }, 'hello world'], {
          [JSX]: true,
        }),
      );
    });

    it('should not render the declarative shadow DOM when AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL is defined in the store', async () => {
      const Component = ({ children }: any) => (
        <div>hello world {children}</div>
      );
      const selector = 'my-component';
      const req = extendRequestContext({
        originalRequest: {
          ...requestContext,
          // @ts-ignore
          store: undefined, // Re-generate an store
        },
      });

      req.store.set(AVOID_DECLARATIVE_SHADOW_DOM_SYMBOL, true);

      const output = (await SSRWebComponent(
        { Component, selector, children: <h1>CHILD</h1> },
        req,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[1]).toEqual({
        __isWebComponent: true,
      });
      expect(output[2]).toEqual(
        Object.assign(
          [
            false,
            Object.assign(
              [
                Fragment,
                {
                  slot: '',
                  key: undefined,
                },
                Object.assign(['h1', { key: undefined }, 'CHILD'], {
                  [JSX]: true,
                }),
              ],
              { [JSX]: true },
            ),
          ],
          { [JSX]: true },
        ),
      );
    });

    it('should work with "indicate" method', async () => {
      const Component = ({ onSaveAction }: any, { indicate }: WebContext) => {
        const actionPending = indicate('some-key');
        return (
          <button disabled={actionPending.value} onClick={onSaveAction}>
            Save
          </button>
        );
      };

      const selector = 'my-component';

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('button');
      expect(output[2][0][2][0][1].disabled).toBe(false);
    });

    it('should ignore store.setOptimistic in SSR', async () => {
      const Component = ({}, { store }: WebContext) => {
        store.setOptimistic('some-action', 'name', (value) => value + '!');
        return <div>hello world</div>;
      };

      const selector = 'my-component';

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][2][0][0]).toBe('div');
      expect(output[2][0][2][0][2]).toBe('hello world');
    });

    it('should work "self.shadowRoot.adoptedStyleSheets = []" in SSR', async () => {
      const Component = ({}, { self }: WebContext) => {
        self.shadowRoot!.adoptedStyleSheets = [];
        return <div>hello world</div>;
      };
      const selector = 'my-component';

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][1].__skipGlobalCSS).toBe(true);
    });

    it('should __skipGlobalCSS be false whithout "self.shadowRoot.adoptedStyleSheets = []"', async () => {
      const Component = ({}, { self }: WebContext) => {
        return <div>hello world</div>;
      };
      const selector = 'my-component';

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
      expect(output[2][0][1].__skipGlobalCSS).toBe(false);
    });

    it('should be possible to use self.attachInternals in SSR', async () => {
      const Component = ({}, { self }: WebContext) => {
        self.attachInternals();
        return <div>hello world</div>;
      };
      const selector = 'my-component';

      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][0]).toBe('template');
      expect(output[2][0][1].shadowrootmode).toBe('open');
    });

    it('should add props and key prop as attribute to the web component', async () => {
      const Component = () => <div>hello world</div>;
      const selector = 'my-component';
      const __key = 'some-key';

      const output = (await SSRWebComponent(
        { Component, selector, foo: 'bar', __key },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[1].foo).toBe('bar');
      expect(output[1].key).toBe(__key);
    });

    it('should be possible to access to route.name in SSR', async () => {
      const Component = ({}, { route }: WebContext) => {
        return <div>{route.name}</div>;
      };
      const selector = 'my-component';
      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][2][0][2]).toBe('/');
    });

    it('should be possible to access to route.pathname in SSR', async () => {
      const Component = ({}, { route }: WebContext) => {
        return <div>{route.pathname}</div>;
      };
      const selector = 'my-component';
      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][2][0][2]).toBe('/');
    });

    it('should be possible to access to route.params in SSR', async () => {
      const Component = ({}, { route }: WebContext) => {
        return <div>{JSON.stringify(route.params)}</div>;
      };
      const selector = 'my-component';
      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][2][0][2]).toBe('{}');
    });

    it('should be possible to access to route.query in SSR', async () => {
      const Component = ({}, { route }: WebContext) => {
        return <div>{JSON.stringify(route.query)}</div>;
      };
      const selector = 'my-component';
      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][2][0][2]).toBe('{}');
    });

    it('should NOT be possible to access to route.filePath in SSR', async () => {
      const Component = ({}, { route }: WebContext) => {
        // @ts-ignore
        return <div>{route.filePath}</div>;
      };
      const selector = 'my-component';
      const output = (await SSRWebComponent(
        {
          Component,
          selector,
        },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][2][0][2]).toBeUndefined();
    });

    it('should be possible to use Component as component path string to load the component inside (useful for renderOn="build")', async () => {
      const Component = webComponentPath;
      const selector = 'web-component';
      const output = (await SSRWebComponent(
        { Component, selector },
        requestContext,
      )) as any;

      expect(output[0]).toBe(selector);
      expect(output[2][0][2][0][2][0][0]).toBe('native-some-example');
    });
  });
});
