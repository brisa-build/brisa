import { describe, expect, it, afterEach, spyOn, jest } from 'bun:test';
import { join } from 'path';

import serverComponentPlugin, { workaroundText } from '.';
import { normalizeQuotes } from '@/helpers';
import AST from '@/utils/ast';
import { getConstants } from '@/constants';

const { parseCodeToAST, generateCodeFromAST } = AST('tsx');

const FIXTURES = join(import.meta.dir, '..', '..', '__fixtures__');
const webComponentPath = join(FIXTURES, 'web-components', 'web-component.tsx');
const serverComponentPath = join(FIXTURES, 'pages', 'index.tsx');

const toExpected = (s: string) =>
  normalizeQuotes(generateCodeFromAST(parseCodeToAST(s)) + workaroundText);

describe('utils', () => {
  afterEach(() => {
    globalThis.mockConstants = undefined;
    jest.restoreAllMocks();
  });
  describe('serverComponentPlugin', () => {
    it('should not register action ids if the attribute event does not start with "on"', () => {
      const code = `
        export default function ServerComponent({ onFoo }) {
          return <Component style={some({ onFoo })} />;
        }
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });
      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toBeEmpty();
    });

    it('should not add the action if is a web-component"', () => {
      const code = `
        export default function WebComponent() {
          return <button onClick={() => console.log('clicked')}>click</button>;
        }
      `;
      const allWebComponents = {
        'web-component': webComponentPath,
      };

      const out = serverComponentPlugin(code, {
        allWebComponents,
        fileID: 'a1',
        path: webComponentPath,
      });
      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toBeEmpty();
    });

    it('should add the attribute "data-action-onclick" when a server-component has an event defined', () => {
      const code = `
        export default function ServerComponent() {
          return <Component onClick={() => console.log('clicked')} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(outputCode).toBe(
        toExpected(`
        export default function ServerComponent() {
          return <Component onClick={() => console.log('clicked')} data-action-onclick="a1_1" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should add the attribute "data-action-onclick" when a server-component with export named and arrow function has an event', () => {
      const code = `
        export const Some = () => <Component onClick={() => console.log('clicked')} />;
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(outputCode).toBe(
        toExpected(`
        export const Some = () => <Component onClick={() => console.log('clicked')} data-action-onclick="a1_1" data-action />;
      `),
      );
    });

    it('should add the attribute "data-action-onclick" when a server-component with export default and arrow function has an event and generate name', () => {
      const code = `
        import Component from './Component.tsx';
        export default () => <Component onClick={() => console.log('clicked')} />;
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies.size).toBe(1);
      expect(outputCode).toBe(
        toExpected(`
        import Component from './Component.tsx';
        const Component1 = () => <Component onClick={() => console.log('clicked')} data-action-onclick="a1_1" data-action />;
        Component1._hasActions = true;
        export default Component1;
      `),
      );
    });

    it('should generate "export default" name when is not an arrow function', () => {
      const code = `
        export default {
          foo: () => <Component onClick={() => console.log('clicked')} />,
        }
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(outputCode).toBe(
        toExpected(`
        export default {
          foo: () => <Component onClick={() => console.log('clicked')} data-action-onclick="a1_1" data-action />,
        }
      `),
      );
    });

    it('should generate "export default" name if already exist var name', () => {
      const code = `
        import Component from './Component.tsx';

        const Component1 = () => <div />;

        export default () => <Component onClick={() => console.log('clicked')} />;
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies.size).toBe(1);
      expect(outputCode).toBe(
        toExpected(`
        import Component from './Component.tsx';
        
        const Component1 = () => <div />;

        const Component2 = () => <Component onClick={() => console.log('clicked')} data-action-onclick="a1_1" data-action />;
        
        Component2._hasActions = true;
        
        export default Component2;
      `),
      );
    });

    it('should NOT generate "export default" name if already exist var name but it has not server actions inside', () => {
      const code = `
        import Component from './Component.tsx';

        const Component1 = () => <div />;

        export default () => <Component />;
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies.size).toBe(1);
      expect(outputCode).toBe(toExpected(code));
    });

    it('should add the attribute "data-action-onclick" to web-components inside server-components', () => {
      const code = `
        export default function ServerComponent() {
          return <web-component onClick={() => console.log('clicked')} />;
        }
      `;
      const allWebComponents = {
        'web-component': webComponentPath,
      };
      const out = serverComponentPlugin(code, {
        allWebComponents,
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toEqual(new Set([webComponentPath]));
      expect(outputCode).toBe(
        toExpected(`
        import {SSRWebComponent as _Brisa_SSRWebComponent} from "brisa/server";
        import _Brisa_WC1 from "${webComponentPath}";

        export default function ServerComponent() {
          return <_Brisa_SSRWebComponent Component={_Brisa_WC1} selector="web-component" onClick={() => console.log('clicked')} data-action-onclick="a1_1" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should register different action ids for each event of a server-component', () => {
      const code = `
        export default function ServerComponent() {
          return <Component onClick={() => console.log('clicked')} onMouseEnter={() => console.log('mouse-enter')} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(outputCode).toBe(
        toExpected(`
        export default function ServerComponent() {
          return <Component onClick={() => console.log('clicked')} onMouseEnter={() => console.log('mouse-enter')} data-action-onclick="a1_1" data-action-onmouseenter="a1_2" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should register different action ids of different inner server-components', () => {
      const code = `
        export default function ServerComponent() {
          return (
            <>
              <Component onClick={() => console.log('clicked')} />
              <Component onClick={() => console.log('clicked')} />
            </>
          );
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(outputCode).toBe(
        toExpected(`
        export default function ServerComponent() {
          return (
            <>
              <Component onClick={() => console.log('clicked')} data-action-onclick="a1_1" data-action />
              <Component onClick={() => console.log('clicked')} data-action-onclick="a1_2" data-action />
            </>
          );
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should register different action ids of different outer server-components', () => {
      const code = `
        export default function ServerComponent1() {
          return <div onClick={() => console.log('foo')} />;
        }

        export function ServerComponent2({ onFoo }) {
          return <div onClick={onFoo} />;
        }
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent1() {
          return <div onClick={() => console.log('foo')} data-action-onclick="a1_1" data-action />;
        }

        export function ServerComponent2({ onFoo }) {
          return <div onClick={(...args) => onFoo(...args)} data-action-onclick="a1_2" data-action />;
        }

        ServerComponent1._hasActions = true;
        ServerComponent2._hasActions = true;
      `),
      );
    });

    it('should return hasActions false and NOT do the transformation if the config.output is "static"', () => {
      const code = `
        export default function ServerComponent1() {
          return <div onClick={() => console.log('foo')} />;
        }

        export function ServerComponent2({ onFoo }) {
          return <div onClick={onFoo} />;
        }
      `;

      globalThis.mockConstants = {
        ...getConstants(),
        CONFIG: {
          output: 'static',
        },
      };
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent1() {
          return <div onClick={() => console.log('foo')} />;
        }

        export function ServerComponent2({ onFoo }) {
          return <div onClick={onFoo} />;
        }
      `),
      );
    });

    it('should warn in DEV when there are actions and the config.output is "static"', () => {
      const code = `
        export default function ServerComponent1() {
          return <div onClick={() => console.log('foo')} />;
        }

        export function ServerComponent2({ onFoo }) {
          return <div onClick={onFoo} />;
        }
      `;
      const mockConsoleLog = spyOn(console, 'log');
      globalThis.mockConstants = {
        ...getConstants(),
        CONFIG: {
          output: 'static',
        },
      };
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      const logs = mockConsoleLog.mock.calls.toString();

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toBeEmpty();
      expect(mockConsoleLog).toHaveBeenCalled();
      expect(logs).toContain(
        'Actions are not supported with the "output": "static" option.',
      );
      expect(logs).toContain(`The warn arises in: ${serverComponentPath}`);
    });

    it('should not warn in PROD when there are actions and the config.output is "static"', () => {
      const code = `
        export default function ServerComponent1() {
          return <div onClick={() => console.log('foo')} />;
        }

        export function ServerComponent2({ onFoo }) {
          return <div onClick={onFoo} />;
        }
      `;
      const mockConsoleLog = spyOn(console, 'log');
      globalThis.mockConstants = {
        ...getConstants(),
        IS_PRODUCTION: true,
        CONFIG: {
          output: 'static',
        },
      };
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toBeEmpty();
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should return hasActions false and NOT do the transformation if the config.output is "desktop"', () => {
      const code = `
      export default function ServerComponent1() {
        return <div onClick={() => console.log('foo')} />;
      }

      export function ServerComponent2({ onFoo }) {
        return <div onClick={onFoo} />;
      }
    `;

      globalThis.mockConstants = {
        ...getConstants(),
        CONFIG: {
          output: 'desktop',
        },
      };
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
      export default function ServerComponent1() {
        return <div onClick={() => console.log('foo')} />;
      }

      export function ServerComponent2({ onFoo }) {
        return <div onClick={onFoo} />;
      }
    `),
      );
    });

    it('should warn in DEV when there are actions and the config.output is "desktop"', () => {
      const code = `
        export default function ServerComponent1() {
          return <div onClick={() => console.log('foo')} />;
        }

        export function ServerComponent2({ onFoo }) {
          return <div onClick={onFoo} />;
        }
      `;
      const mockConsoleLog = spyOn(console, 'log');
      globalThis.mockConstants = {
        ...getConstants(),
        CONFIG: {
          output: 'desktop',
        },
      };
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      const logs = mockConsoleLog.mock.calls.toString();

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toBeEmpty();
      expect(mockConsoleLog).toHaveBeenCalled();
      expect(logs).toContain(
        'Actions are not supported with the "output": "desktop" option.',
      );
      expect(logs).toContain(`The warn arises in: ${serverComponentPath}`);
    });

    it('should not warn in PROD when there are actions and the config.output is "desktop"', () => {
      const code = `
        export default function ServerComponent1() {
          return <div onClick={() => console.log('foo')} />;
        }

        export function ServerComponent2({ onFoo }) {
          return <div onClick={onFoo} />;
        }
      `;
      const mockConsoleLog = spyOn(console, 'log');
      globalThis.mockConstants = {
        ...getConstants(),
        IS_PRODUCTION: true,
        CONFIG: {
          output: 'desktop',
        },
      };
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toBeEmpty();
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should convert a web-component to ServerComponent', () => {
      const code = `
        export default function ServerComponent() {
          return <web-component />;
        }
      `;
      const allWebComponents = {
        'web-component': webComponentPath,
      };
      const out = serverComponentPlugin(code, {
        allWebComponents,
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(`
        import {SSRWebComponent as _Brisa_SSRWebComponent} from "brisa/server";
        import _Brisa_WC1 from "${webComponentPath}";

        export default function ServerComponent() {
          return <_Brisa_SSRWebComponent Component={_Brisa_WC1} selector="web-component" />;
        }
      `);

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toEqual(new Set([webComponentPath]));
      expect(outputCode).toEqual(expected);
    });

    it('should convert a list of the same web-component to ServerComponent', () => {
      const code = `
        export default function ServerComponent() {
          return (
            <>
            {Array.from({ length: 3 }, (_, i) => (
              <web-component name={'Hello'+i}>
                <b> Child </b>
              </web-component>
            ))}
            </>
          );
        }
      `;
      const allWebComponents = {
        'web-component': webComponentPath,
      };
      const out = serverComponentPlugin(code, {
        allWebComponents,
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(`
        import {SSRWebComponent as _Brisa_SSRWebComponent} from "brisa/server";
        import _Brisa_WC1 from "${webComponentPath}";

        export default function ServerComponent() {
          return (
            <>
            {Array.from({ length: 3 }, (_, i) => (
              <_Brisa_SSRWebComponent Component={_Brisa_WC1} selector="web-component" name={'Hello'+i}>
                <b> Child </b>
              </_Brisa_SSRWebComponent>
            ))}
            </>
          );
        }
      `);

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toEqual(new Set([webComponentPath]));
      expect(outputCode).toEqual(expected);
    });

    it('should NOT SSR an integrated web-component with direct import and will be added as dependencies', () => {
      const code = `
        export default function ServerComponent() {
          return (
            <>
            {Array.from({ length: 3 }, (_, i) => (
              <web-component name={'Hello'+i}>
                <b> Child </b>
              </web-component>
            ))}
            </>
          );
        }
      `;
      const DIRECT_IMPORT_PREFIX = 'import:';
      const allWebComponents = {
        'web-component': DIRECT_IMPORT_PREFIX + webComponentPath,
      };
      const out = serverComponentPlugin(code, {
        allWebComponents,
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(code);

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toEqual(new Set([webComponentPath]));
      expect(outputCode).toEqual(expected);
    });

    it('should NOT SSR an integrated web-component with direct import and skipSSR attribute and will be added as dependencies', () => {
      const code = `
        export default function ServerComponent() {
          return (
            <>
            {Array.from({ length: 3 }, (_, i) => (
              <web-component skipSSR name={'Hello'+i}>
                <b> Child </b>
              </web-component>
            ))}
            </>
          );
        }
      `;
      const DIRECT_IMPORT_PREFIX = 'import:';
      const allWebComponents = {
        'web-component': DIRECT_IMPORT_PREFIX + webComponentPath,
      };
      const out = serverComponentPlugin(code, {
        allWebComponents,
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(code);

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toEqual(new Set([webComponentPath]));
      expect(outputCode).toEqual(expected);
    });

    it('should NOT SSR a web-component if has the attribute "skipSSR"', () => {
      const code = `
        export default function ServerComponent() {
          return <web-component skipSSR />;
        }
      `;
      const allWebComponents = {
        'web-component': webComponentPath,
      };
      const out = serverComponentPlugin(code, {
        allWebComponents,
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(`
        export default function ServerComponent() {
          return <web-component skipSSR />;
        }
      `);

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toEqual(new Set([webComponentPath]));
      expect(outputCode).toEqual(expected);
    });

    it('should not SSR a web-component that starts with native-', () => {
      const code = `
        export default function ServerComponent() {
          return <native-web-component />;
        }
      `;
      const allWebComponents = {
        'native-web-component': 'src/components/native-web-component.tsx',
      };
      const out = serverComponentPlugin(code, {
        allWebComponents,
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(`
        export default function ServerComponent() {
          return <native-web-component />;
        }
      `);

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toBeEmpty();
      expect(outputCode).toEqual(expected);
    });

    it('should NOT SSR a web-component if has the attribute "skipSSR" set to true', () => {
      const code = `
        export default function ServerComponent() {
          return <web-component skipSSR={true} />;
        }
      `;
      const allWebComponents = {
        'web-component': webComponentPath,
      };
      const out = serverComponentPlugin(code, {
        allWebComponents,
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(`
        export default function ServerComponent() {
          return <web-component skipSSR={true} />;
        }
      `);

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toEqual(new Set([webComponentPath]));
      expect(outputCode).toEqual(expected);
    });

    it('should use the same name if the web-component is used more than once', () => {
      const code = `
        export default function ServerComponent() {
          return (
            <>
              <web-component />
              <web-component />
            </>
          );
        }
      `;
      const allWebComponents = {
        'web-component': webComponentPath,
      };
      const out = serverComponentPlugin(code, {
        allWebComponents,
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(`
        import {SSRWebComponent as _Brisa_SSRWebComponent} from "brisa/server";
        import _Brisa_WC1 from "${webComponentPath}";

        export default function ServerComponent() {
          return (
            <>
              <_Brisa_SSRWebComponent Component={_Brisa_WC1} selector="web-component" />
              <_Brisa_SSRWebComponent Component={_Brisa_WC1} selector="web-component" />
            </>
          );
        }
      `);

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toEqual(new Set([webComponentPath]));
      expect(outputCode).toEqual(expected);
    });

    it('should add all the dependencies', () => {
      const code = `
        import { Foo } from "./foo.tsx";
        import { Bar } from "./bar.tsx";
        import { Baz } from "./baz.tsx";

        export default function ServerComponent() {
          return (
            <>
              <Foo />
              <Bar />
              <Baz />
              <web-component />
            </>
          );
        }
      `;

      const allWebComponents = {
        'web-component': webComponentPath,
      };

      const out = serverComponentPlugin(code, {
        allWebComponents,
        fileID: 'a1',
        path: serverComponentPath,
      });
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(`
        import {SSRWebComponent as _Brisa_SSRWebComponent} from "brisa/server";
        import _Brisa_WC1 from "${webComponentPath}";
        import { Foo } from "./foo.tsx";
        import { Bar } from "./bar.tsx";
        import { Baz } from "./baz.tsx";

        export default function ServerComponent() {
          return (
            <>
              <Foo />
              <Bar />
              <Baz />
              <_Brisa_SSRWebComponent Component={_Brisa_WC1} selector="web-component" />
            </>
          );
        }
      `);

      const pagesPath = join(FIXTURES, 'pages');

      expect(out.hasActions).toBeFalse();
      expect(outputCode).toEqual(expected);
      expect(out.dependencies).toEqual(
        new Set([
          join(pagesPath, 'foo.tsx'),
          join(pagesPath, 'bar.tsx'),
          join(pagesPath, 'baz.tsx'),
          webComponentPath,
        ]),
      );
    });

    it('should add the attribute "data-action-onclick" when a server-component has destructuring props', () => {
      const code = `
        export default function ServerComponent() {
          const props = { onClick: () => console.log('clicked') };
          return <Component {...props} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent() {
          const props = { onClick: () => console.log('clicked') };
          return <Component {...props} data-action-onclick="a1_1" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should add the attribute "data-action-onclick" when event comes from props', () => {
      const code = `
        export default function ServerComponent({onClick}) {
          return <div onClick={onClick} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent({onClick}) {
          return <div onClick={(...args) => onClick(...args)} data-action-onclick="a1_1" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    // On Components we want to propagate the action (without the need to create it),
    // meanwhile on elements we want to create the arrow function to allow the
    // rerenderInAction to re-render the target component
    it('should NOT create the arrow function when is a Component instead of element', () => {
      const code = `
        export default function ServerComponent({onClick}) {
          return <Component onClick={onClick} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent({onClick}) {
          return <Component onClick={onClick} data-action-onclick="a1_1" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should add the attribute "data-action-onclick" when a server-component has destructuring props comming from props', () => {
      const code = `
        export default function ServerComponent({onClick}) {
          const props = { onClick };
          return <div {...props} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent({onClick}) {
          const props = { onClick: (...args) => onClick(...args) };
          return <div {...props} data-action-onclick="a1_1" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    // On Components we want to propagate the action (without the need to create it),
    // meanwhile on elements we want to create the arrow function to allow the
    // rerenderInAction to re-render the target component
    it('should NOT create the arrow function using destructuring props comming from props in Component', () => {
      const code = `
        export default function ServerComponent({onClick}) {
          const props = { onClick };
          return <Component {...props} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent({onClick}) {
          const props = { onClick };
          return <Component {...props} data-action-onclick="a1_1" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should add the attribute "data-action-onclick" when a server-component has destructuring props comming from props with key:value', () => {
      const code = `
        export default function ServerComponent({onClick}) {
          const props = { onClick:onClick };
          return <div {...props} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent({onClick}) {
          const props = { onClick: (...args) => onClick(...args) };
          return <div {...props} data-action-onclick="a1_1" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should NOT create the arrow function when a server-component has destructuring props comming from props with key:value in a Component', () => {
      const code = `
        export default function ServerComponent({onClick}) {
          const props = { onClick:onClick };
          return <Component {...props} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent({onClick}) {
          const props = { onClick:onClick };
          return <Component {...props} data-action-onclick="a1_1" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should add the attribute "data-action-onclick" when a server-component has nested destructuring props', () => {
      const code = `
        export default function ServerComponent() {
          const bar = {}
          const props = { foo: { onClick: () => console.log('clicked') } };
          return <Component {...bar} {...props.foo} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent() {
          const bar = {}
          const props = { foo: { onClick: () => console.log('clicked') } };
          return <Component {...bar} {...props.foo} data-action-onclick="a1_1" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should add the attribute "data-action-onclick" when a server-component has destructuring props via function', () => {
      const code = `
        export default function ServerComponent() {
          const bar = {}
          const props = () => ({ onClick: () => console.log('clicked') });
          return <Component {...bar} {...props()} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent() {
          const bar = {}
          const props = () => ({ onClick: () => console.log('clicked') });
          return <Component {...bar} {...props()} data-action-onclick="a1_1" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should add the attribute "data-action-onclick" when a server-component has destructuring nested props via function', () => {
      const code = `
        export default function ServerComponent() {
          const bar = {}
          const props = { bar: () => ({ onClick: () => console.log('clicked') }) };
          return <Component {...bar} {...props.bar()} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent() {
          const bar = {}
          const props = { bar: () => ({ onClick: () => console.log('clicked') }) };
          return <Component {...bar} {...props.bar()} data-action-onclick="a1_1" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should add the attribute "data-action-onclick" when a server-component has destructuring nested props via curry function', () => {
      const code = `
        export default function ServerComponent() {
          const bar = {}
          const props = { bar: () => () => ({ onClick: () => console.log('clicked') }) };
          return <Component {...bar} {...props.bar()()} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent() {
          const bar = {}
          const props = { bar: () => () => ({ onClick: () => console.log('clicked') }) };
          return <Component {...bar} {...props.bar()()} data-action-onclick="a1_1" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should add the attribute "data-action-onclick" when a server-component has destructuring nested props via bind function', () => {
      const code = `
        export default function ServerComponent() {
          const bar = {}
          const onClick = ((foo) => console.log('clicked', foo)).bind(null, 'foo');
          const props = { bar: () => () => ({ onClick }) };
          return <Component {...bar} {...props.bar()()} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent() {
          const bar = {}
          const onClick = ((foo) => console.log('clicked', foo)).bind(null, 'foo');
          const props = { bar: () => () => ({ onClick }) };
          return <Component {...bar} {...props.bar()()} data-action-onclick="a1_1" data-action />;
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should NOT register destructuring properties that starts with "on" and are not events', () => {
      const code = `
        export default function ServerComponent() {
          const bar = {}
          const props = { onu: true };
          return <Component {...bar} {...props.bar()()} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(toExpected(code));
    });

    it('should NOT register destructuring events when config.output="static"', () => {
      const code = `
        export default function ServerComponent() {
          const bar = {}
          const props = { onClick: () => console.log('clicked') };
          return <Component {...bar} {...props.bar()()} />;
        }
      `;
      globalThis.mockConstants = {
        ...getConstants(),
        CONFIG: {
          output: 'static',
        },
      };
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeFalse();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(toExpected(code));
    });

    it('should add the attribute "data-action-onclick" for deeply nested event properties', () => {
      const code = `
        export default function ServerComponent() {
          const props = {
            level1: {
              level2: {
                level3: {
                  onClick: () => console.log('clicked')
                }
              }
            }
          };
          return <Component {...props.level1.level2.level3} />;
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent() {
          const props = {
            level1: {
              level2: {
                level3: {
                  onClick: () => console.log('clicked')
                }
              }
            }
          };
          return <Component {...props.level1.level2.level3} data-action-onclick="a1_1" data-action />;
        }
  
        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should register _hasActions only in the component that has events', () => {
      const code = `
        export function ServerComponent() {
          return <Component />;
        }
  
        export function ServerComponent2() {
          return <Component onClick={() => console.log('clicked')} />;
        }
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export function ServerComponent() {
          return <Component />;
        }
  
        export function ServerComponent2() {
          return <Component onClick={() => console.log('clicked')} data-action-onclick="a1_1" data-action />;
        }
  
        ServerComponent2._hasActions = true;
      `),
      );
    });

    it('should register _hasActions on a function component without export', () => {
      const code = `
        function ServerComponent() {
          return <Component onClick={() => console.log('clicked')} />;
        }
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        function ServerComponent() {
          return <Component onClick={() => console.log('clicked')} data-action-onclick="a1_1" data-action />;
        }
  
        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should register _hasActions on a variable with function component without export', () => {
      const code = `
        const Foo = function() {
          return <Component onClick={() => console.log('clicked')} />;
        }
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        const Foo = function() {
          return <Component onClick={() => console.log('clicked')} data-action-onclick="a1_1" data-action />;
        }
  
        Foo._hasActions = true;
      `),
      );
    });

    it('should register _hasActions on a arrow fn component without export', () => {
      const code = `
        const ServerComponent = () => <Component onClick={() => console.log('clicked')} />;
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        const ServerComponent = () => <Component onClick={() => console.log('clicked')}  data-action-onclick="a1_1" data-action />;
        ServerComponent._hasActions = true;
      `),
      );
    });

    it('should register _hasActions on multiple arrow fn component without export', () => {
      const code = `
        const ServerComponent = () => <Component onClick={() => console.log('clicked')} />,
        ServerComponent2 = () => <Component onClick={() => console.log('clicked')} />;
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        const ServerComponent = () => <Component onClick={() => console.log('clicked')}  data-action-onclick="a1_1" data-action />,
        ServerComponent2 = () => <Component onClick={() => console.log('clicked')}  data-action-onclick="a1_2" data-action />;
        
        ServerComponent._hasActions = true;
        ServerComponent2._hasActions = true;
      `),
      );
    });

    it('should register only _hasActions on arrow fn component that has actions', () => {
      const code = `
        const ServerComponent = () => <Component onClick={() => console.log('clicked')} />,
        ServerComponent2 = () => <Component onClick={() => console.log('clicked')} />,
        ServerComponent3 = () => <Component />,
        ServerComponent4 = () => <Component onClick={() => console.log('clicked')} />;
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        const ServerComponent = () => <Component onClick={() => console.log('clicked')}  data-action-onclick="a1_1" data-action />,
        ServerComponent2 = () => <Component onClick={() => console.log('clicked')}  data-action-onclick="a1_2" data-action />,
        ServerComponent3 = () => <Component />,
        ServerComponent4 = () => <Component onClick={() => console.log('clicked')}  data-action-onclick="a1_3" data-action />;
        
        ServerComponent._hasActions = true;
        ServerComponent2._hasActions = true;
        ServerComponent4._hasActions = true;
      `),
      );
    });

    it('should register only _hasActions on arrow fn component that has actions in different var declarations', () => {
      const code = `
        const ServerComponent = () => <Component onClick={() => console.log('clicked')} />;
        const ServerComponent2 = () => <Component onClick={() => console.log('clicked')} />;
        let ServerComponent3 = () => <Component />;
        let ServerComponent4 = () => <Component onClick={() => console.log('clicked')} />;
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        const ServerComponent = () => <Component onClick={() => console.log('clicked')}  data-action-onclick="a1_1" data-action />;
        const ServerComponent2 = () => <Component onClick={() => console.log('clicked')}  data-action-onclick="a1_2" data-action />;
        let ServerComponent3 = () => <Component />;
        let ServerComponent4 = () => <Component onClick={() => console.log('clicked')}  data-action-onclick="a1_3" data-action />;
        
        ServerComponent._hasActions = true;
        ServerComponent2._hasActions = true;
        ServerComponent4._hasActions = true;
      `),
      );
    });

    it('should register only _hasActions on function component that has actions in different var declarations', () => {
      const code = `
        function ServerComponent() { return <Component onClick={() => console.log('clicked')} /> };
        function ServerComponent2() { return <Component onClick={() => console.log('clicked')} /> };
        function ServerComponent3() { return <Component /> };
        function ServerComponent4() { return <Component onClick={() => console.log('clicked')} /> };
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        function ServerComponent() { return <Component onClick={() => console.log('clicked')}  data-action-onclick="a1_1" data-action /> };
        function ServerComponent2() { return <Component onClick={() => console.log('clicked')}  data-action-onclick="a1_2" data-action /> };
        function ServerComponent3() { return <Component /> };
        function ServerComponent4() { return <Component onClick={() => console.log('clicked')}  data-action-onclick="a1_3" data-action /> };

        ServerComponent._hasActions = true;
        ServerComponent2._hasActions = true;
        ServerComponent4._hasActions = true;
      `),
      );
    });

    it('should register _hasActions on multiple arrow fn component WITH export', () => {
      const code = `
        const ServerComponent = () => <Component onClick={() => console.log('clicked')} />,
        ServerComponent2 = () => <Component onClick={() => console.log('clicked')} />;

        export { ServerComponent, ServerComponent2 };
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        const ServerComponent = () => <Component onClick={() => console.log('clicked')}  data-action-onclick="a1_1" data-action />,
        ServerComponent2 = () => <Component onClick={() => console.log('clicked')}  data-action-onclick="a1_2" data-action />;
        
        export { ServerComponent, ServerComponent2 };

        ServerComponent._hasActions = true;
        ServerComponent2._hasActions = true;
      `),
      );
    });

    it('should register _hasActions only in the component that has events using outside elements', () => {
      const code = `
       const el = <Component />;
       const el2 = <Component onClick={() => console.log('clicked')} />;
  
        export function ServerComponent() {
          return el;
        }
  
        export function ServerComponent2() {
          return el2;
        }
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        const el = <Component />;
        const el2 = <Component onClick={() => console.log('clicked')} data-action-onclick="a1_1" data-action />;
  
         export function ServerComponent() {
           return el;
         }
   
         export function ServerComponent2() {
           return el2;
         }
  
        ServerComponent2._hasActions = true;
      `),
      );
    });

    it('should register _hasActions only in the component that has events using outside elements generators', () => {
      const code = `
       const el = () => <Component />;
       const el2 = () => <Component onClick={() => console.log('clicked')} />;
  
        export function ServerComponent() {
          return el();
        }
  
        export function ServerComponent2() {
          return el2();
        }
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        const el = () => <Component />;
        const el2 = () => <Component onClick={() => console.log('clicked')} data-action-onclick="a1_1" data-action />;
  
         export function ServerComponent() {
           return el();
         }
   
         export function ServerComponent2() {
           return el2();
         }
         
        el2._hasActions = true;
        ServerComponent2._hasActions = true;
      `),
      );
    });

    it('should NOT propagate _hasActions from one component to another one consuming with JSX', () => {
      const code = `
       const A = () => <Component />;
       const B = () => <Component onClick={() => console.log('clicked')} />;
  
        export function ServerComponent() {
          return <A />;
        }
  
        export function ServerComponent2() {
          return <B />;
        }
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        const A = () => <Component />;
        const B = () => <Component onClick={() => console.log('clicked')} data-action-onclick="a1_1" data-action />;
  
         export function ServerComponent() {
           return <A />;
         }
   
         export function ServerComponent2() {
           return <B />;
         }
         
        B._hasActions = true;
      `),
      );
    });

    it('should add the attribute "data-action-onclick" with destructuring and element generator', () => {
      const code = `
          const props = {
            onClick: () => console.log('hello world'),
            onInput: () => console.log('hello world'),
          };
          const getEl = (text) => <div {...props} children={text}></div>;
  
          export default function Component({text}) {
            return getEl(text);
          }
        `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
          const props = {
            onClick: () => console.log('hello world'),
            onInput: () => console.log('hello world'),
          };
          const getEl = (text) => <div {...props} children={text} data-action-onclick="a1_1" data-action-oninput="a1_2" data-action></div>;

          export default function Component({text}) {
            return getEl(text);
          }
          
          getEl._hasActions = true;
          Component._hasActions = true;
        `),
      );
    });

    it('should NOT solve identifiers from imports when already exists actions in the component', () => {
      const code = `
        import { getEl } from './el.ts';

        export default function Component({text}) {
          if (text === 'foo') {
            return <div onClick={() => console.log('foo')} />;
          }
          return getEl(text);
        }
      `;

      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toEqual(
        new Set([join(FIXTURES, 'pages', 'el.ts')]),
      );
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        import { getEl } from './el.ts';

        export default function Component({text}) {
          if (text === 'foo') {
            return <div onClick={() => console.log('foo')} data-action-onclick="a1_1" data-action />;
          }
          return getEl(text);
        }

        Component._hasActions = true;
      `),
      );
    });

    it('should not add _hasActions on arrow fn without name created inside the component', () => {
      const code = `
        export default function ServerComponent() {
          return [1,2,3].map(() => <Component onClick={() => console.log('clicked')} />);
        }
      `;
      const out = serverComponentPlugin(code, {
        allWebComponents: {},
        fileID: 'a1',
        path: serverComponentPath,
      });

      expect(out.hasActions).toBeTrue();
      expect(out.dependencies).toBeEmpty();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent() {
          return [1,2,3].map(() => <Component onClick={() => console.log('clicked')} data-action-onclick="a1_1" data-action />);
        }

        ServerComponent._hasActions = true;
      `),
      );
    });

    it.todo(
      'should solve identifiers from imports when no actions in the component',
      () => {
        const code = `
      import { getEl } from './el.ts';

      export default function Component({ text }) {
        return getEl(text);
      }
      `;

        const out = serverComponentPlugin(code, {
          allWebComponents: {},
          fileID: 'a1',
          path: serverComponentPath,
        });

        expect(out.dependencies).toEqual(
          new Set([join(FIXTURES, 'pages', 'el.ts')]),
        );
        expect(normalizeQuotes(out.code)).toBe(
          toExpected(`
      import { getEl } from './el.ts';

      export default function Component({ text }) {
        return getEl(text);
      }

      Component._hasActions = getEl?._hasActions;
      `),
        );
      },
    );

    it.todo(
      'should solve different identifiers from imports when no actions in the component',
      () => {
        const code = `
      import getEl from './el.ts';
      import { getEl2 } from './el2.ts';
      import { getEl3 } from './el3.ts';

      export default function Component({ text }) {
        return getEl(text) + getEl2(text) + getEl3(text);
      }
      `;

        const out = serverComponentPlugin(code, {
          allWebComponents: {},
          fileID: 'a1',
          path: serverComponentPath,
        });

        expect(out.dependencies).toEqual(
          new Set([
            join(FIXTURES, 'pages', 'el.ts'),
            join(FIXTURES, 'pages', 'el2.ts'),
            join(FIXTURES, 'pages', 'el3.ts'),
          ]),
        );
        expect(normalizeQuotes(out.code)).toBe(
          toExpected(`
      import getEl from './el.ts';
      import { getEl2 } from './el2.ts';
      import { getEl3 } from './el3.ts';

      export default function Component({ text }) {
        return getEl(text) + getEl2(text) + getEl3(text);
      }

      Component._hasActions = getEl?._hasActions ?? getEl2?._hasActions ?? getEl3?._hasActions;
      `),
        );
      },
    );

    it.todo(
      'should NOT solve identifiers from imports not used in the component',
      () => {
        const code = `
      import getEl from './el.ts';
      import { getEl2 } from './el2.ts';
      import { getEl3 } from './el3.ts';

      export default function Component({ text }) {
        return getEl(text) + getEl3(text);
      }

      console.log(getEl2);
      `;

        const out = serverComponentPlugin(code, {
          allWebComponents: {},
          fileID: 'a1',
          path: serverComponentPath,
        });

        expect(out.dependencies).toEqual(
          new Set([
            join(FIXTURES, 'pages', 'el.ts'),
            join(FIXTURES, 'pages', 'el2.ts'),
            join(FIXTURES, 'pages', 'el3.ts'),
          ]),
        );
        expect(normalizeQuotes(out.code)).toBe(
          toExpected(`
      import getEl from './el.ts';
      import { getEl2 } from './el2.ts';
      import { getEl3 } from './el3.ts';

      export default function Component({ text }) {
        return getEl(text) + getEl3(text);
      }

      console.log(getEl2);

      Component._hasActions = getEl?._hasActions ?? getEl3?._hasActions;
      `),
        );
      },
    );
  });
});
