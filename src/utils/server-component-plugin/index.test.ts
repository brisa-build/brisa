import { describe, expect, it } from "bun:test";

import serverComponentPlugin, { workaroundText } from ".";
import { normalizeQuotes } from "@/helpers";
import AST from "@/utils/ast";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");

const toExpected = (s: string) =>
  normalizeQuotes(generateCodeFromAST(parseCodeToAST(s)) + workaroundText);

describe("utils", () => {
  describe("serverComponentPlugin", () => {
    it('should not register action ids if the attribute event does not start with "on"', () => {
      const code = `
        export default function ServerComponent({ onFoo }) {
          return <Component style={some({ onFoo })} />;
        }
      `;

      const out = serverComponentPlugin(code, {}, "a1");
      expect(out.hasActions).toBeFalse();
    });

    it('should add the attribute "actionId-onClick" when a server-component has an event defined', () => {
      const code = `
        export default function ServerComponent() {
          return <Component onClick={() => console.log('clicked')} />;
        }
      `;
      const out = serverComponentPlugin(code, {}, "a1");
      const outputCode = normalizeQuotes(out.code);

      expect(out.hasActions).toBeTrue();
      expect(outputCode).toBe(
        toExpected(`
        export default function ServerComponent() {
          return <Component onClick={() => console.log('clicked')} actionId-onClick="a1_1" />;
        }
      `),
      );
    });

    it("should register different action ids for each event of a server-component", () => {
      const code = `
        export default function ServerComponent() {
          return <Component onClick={() => console.log('clicked')} onMouseEnter={() => console.log('mouse-enter')} />;
        }
      `;
      const out = serverComponentPlugin(code, {}, "a1");
      const outputCode = normalizeQuotes(out.code);

      expect(out.hasActions).toBeTrue();
      expect(outputCode).toBe(
        toExpected(`
        export default function ServerComponent() {
          return <Component onClick={() => console.log('clicked')} onMouseEnter={() => console.log('mouse-enter')} actionId-onClick="a1_1" actionId-onMouseEnter="a1_2" />;
        }
      `),
      );
    });

    it("should register different action ids of different inner server-components", () => {
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
      const out = serverComponentPlugin(code, {}, "a1");
      const outputCode = normalizeQuotes(out.code);

      expect(out.hasActions).toBeTrue();
      expect(outputCode).toBe(
        toExpected(`
        export default function ServerComponent() {
          return (
            <>
              <Component onClick={() => console.log('clicked')} actionId-onClick="a1_1" />
              <Component onClick={() => console.log('clicked')} actionId-onClick="a1_2" />
            </>
          );
        }
      `),
      );
    });

    it("should register different action ids of different outer server-components", () => {
      const code = `
        export default function ServerComponent1() {
          return <ServerComponent2 onFoo={() => console.log('foo')} />;
        }

        export function ServerComponent2({ onFoo }) {
          return <Component onClick={onFoo} />;
        }
      `;

      const out = serverComponentPlugin(code, {}, "a1");

      expect(out.hasActions).toBeTrue();
      expect(normalizeQuotes(out.code)).toBe(
        toExpected(`
        export default function ServerComponent1() {
          return <ServerComponent2 onFoo={() => console.log('foo')} actionId-onFoo="a1_1" />;
        }

        export function ServerComponent2({ onFoo }) {
          return <Component onClick={onFoo} actionId-onClick="a1_2" />;
        }
      `),
      );
    });

    it("should convert a web-component to ServerComponent", () => {
      const code = `
        export default function ServerComponent() {
          return <web-component />;
        }
      `;
      const allWebComponents = {
        "web-component": "src/components/web-component.tsx",
      };
      const out = serverComponentPlugin(code, allWebComponents, "a1");
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(`
        import {SSRWebComponent as _Brisa_SSRWebComponent} from "brisa/server";
        import _Brisa_WC1 from "src/components/web-component.tsx";

        export default function ServerComponent() {
          return <_Brisa_SSRWebComponent Component={_Brisa_WC1} selector="web-component" />;
        }
      `);

      expect(out.hasActions).toBeFalse();
      expect(outputCode).toEqual(expected);
    });

    it("should convert a list of the same web-component to ServerComponent", () => {
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
        "web-component": "src/components/web-component.tsx",
      };
      const out = serverComponentPlugin(code, allWebComponents, "a1");
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(`
        import {SSRWebComponent as _Brisa_SSRWebComponent} from "brisa/server";
        import _Brisa_WC1 from "src/components/web-component.tsx";

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
      expect(outputCode).toEqual(expected);
    });

    it('should not convert a web-component to ServerComponent if has the attribute "skipSSR"', () => {
      const code = `
        export default function ServerComponent() {
          return <web-component skipSSR />;
        }
      `;
      const allWebComponents = {
        "web-component": "src/components/web-component.tsx",
      };
      const out = serverComponentPlugin(code, allWebComponents, "a1");
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(`
        export default function ServerComponent() {
          return <web-component skipSSR />;
        }
      `);

      expect(out.hasActions).toBeFalse();
      expect(outputCode).toEqual(expected);
    });

    it("should not convert a web-component that starts with native-", () => {
      const code = `
        export default function ServerComponent() {
          return <native-web-component />;
        }
      `;
      const allWebComponents = {
        "native-web-component": "src/components/native-web-component.tsx",
      };
      const out = serverComponentPlugin(code, allWebComponents, "a1");
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(`
        export default function ServerComponent() {
          return <native-web-component />;
        }
      `);

      expect(out.hasActions).toBeFalse();
      expect(outputCode).toEqual(expected);
    });

    it('should not convert a web-component to ServerComponent if has the attribute "skipSSR" set to true', () => {
      const code = `
        export default function ServerComponent() {
          return <web-component skipSSR={true} />;
        }
      `;
      const allWebComponents = {
        "web-component": "src/components/web-component.tsx",
      };
      const out = serverComponentPlugin(code, allWebComponents, "a1");
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(`
        export default function ServerComponent() {
          return <web-component skipSSR={true} />;
        }
      `);

      expect(out.hasActions).toBeFalse();
      expect(outputCode).toEqual(expected);
    });

    it("should use the same name if the web-component is used more than once", () => {
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
        "web-component": "src/components/web-component.tsx",
      };
      const out = serverComponentPlugin(code, allWebComponents, "a1");
      const outputCode = normalizeQuotes(out.code);
      const expected = toExpected(`
        import {SSRWebComponent as _Brisa_SSRWebComponent} from "brisa/server";
        import _Brisa_WC1 from "src/components/web-component.tsx";

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
      expect(outputCode).toEqual(expected);
    });
  });
});
