import { describe, expect, it } from "bun:test";
import wrapWithSSRWebComponent, { workaroundText } from ".";
import AST from "../../ast";

const { parseCodeToAST, generateCodeFromAST } = AST("tsx");

const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');
const toExpected = (s: string) =>
  toInline(generateCodeFromAST(parseCodeToAST(s)) + workaroundText);

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
      const output = toInline(
        wrapWithSSRWebComponent(code, allWebComponents).code
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
      const output = toInline(
        wrapWithSSRWebComponent(code, allWebComponents).code
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

    it('should not convert a web-component to ServerComponent if has the attribute "ssr" set to false', () => {
      const code = `
        export default function ServerComponent() {
          return <web-component ssr={false} />;
        }
      `;
      const allWebComponents = {
        "web-component": "src/components/web-component.tsx",
      };
      const output = toInline(
        wrapWithSSRWebComponent(code, allWebComponents).code
      );
      const expected = toExpected(`
        export default function ServerComponent() {
          return <web-component ssr={false} />;
        }
      `);

      expect(output).toEqual(expected);
    });
  });
});
