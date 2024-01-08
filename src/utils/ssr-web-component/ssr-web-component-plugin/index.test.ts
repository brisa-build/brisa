import { describe, expect, it } from "bun:test";

import wrapWithSSRWebComponent, { workaroundText } from ".";
import { normalizeQuotes } from "@/helpers";
import AST from "@/utils/ast";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");

const toExpected = (s: string) =>
  normalizeQuotes(generateCodeFromAST(parseCodeToAST(s)) + workaroundText);

describe("utils", () => {
  describe("ssrWebComponentPlugin", () => {
    it("should convert a web-component to ServerComponent", () => {
      const code = `
        export default function ServerComponent() {
          return <web-component />;
        }
      `;
      const allWebComponents = {
        "web-component": "src/components/web-component.tsx",
      };
      const output = normalizeQuotes(
        wrapWithSSRWebComponent(code, allWebComponents).code,
      );
      const expected = toExpected(`
        import {SSRWebComponent as _Brisa_SSRWebComponent} from "brisa/server";
        import _Brisa_WC1 from "src/components/web-component.tsx";

        export default function ServerComponent() {
          return <_Brisa_SSRWebComponent Component={_Brisa_WC1} selector="web-component" />;
        }
      `);

      expect(output).toEqual(expected);
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
      const output = normalizeQuotes(
        wrapWithSSRWebComponent(code, allWebComponents).code,
      );
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

      expect(output).toEqual(expected);
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
      const output = normalizeQuotes(
        wrapWithSSRWebComponent(code, allWebComponents).code,
      );
      const expected = toExpected(`
        export default function ServerComponent() {
          return <web-component skipSSR />;
        }
      `);

      expect(output).toEqual(expected);
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
      const output = normalizeQuotes(
        wrapWithSSRWebComponent(code, allWebComponents).code,
      );
      const expected = toExpected(`
        export default function ServerComponent() {
          return <web-component skipSSR={true} />;
        }
      `);

      expect(output).toEqual(expected);
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
      const output = normalizeQuotes(
        wrapWithSSRWebComponent(code, allWebComponents).code,
      );
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

      expect(output).toEqual(expected);
    });
  });
});
