import { describe, expect, it } from "bun:test";
import jsxToReactiveHyperscript from ".";

const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');

describe("utils", () => {
  describe("jsxToReactiveHyperscript", () => {
    describe("without transformation", () => {
      it("should not transform if is inside @react folder", () => {
        const input = `
            export default function MyComponent() {
              return <div>foo</div>
            }
          `;
        const output = toInline(
          jsxToReactiveHyperscript(
            input,
            "/src/web-components/@react/my-component.tsx",
          ),
        );
        const expected = toInline(input);
        expect(output).toBe(expected);
      });

      it("should not transform if is inside @native folder", () => {
        const input = `
            export default function MyComponent() {
              return <div>foo</div>
            }
          `;
        const output = toInline(
          jsxToReactiveHyperscript(
            input,
            "/src/web-components/@react/my-component.tsx",
          ),
        );
        const expected = toInline(input);
        expect(output).toBe(expected);
      });
    });

    describe("basic components with transformation", () => {
      it("should transform JSX to an array if is not a web-component", () => {
        const input = `
            export default function MyComponent() {
              return <div>foo</div>
            }
          `;
        const output = toInline(
          jsxToReactiveHyperscript(input, "/src/components/my-component.tsx"),
        );
        const expected = toInline(`
            export default function MyComponent() {
              return ['div', {}, 'foo'];
            }`);
        expect(output).toBe(expected);
      });

      it("should transform a basic web-component", () => {
        const input = `
            export default function MyComponent() {
              return <div>foo</div>
            }
          `;
        const output = toInline(
          jsxToReactiveHyperscript(
            input,
            "src/web-components/my-component.tsx",
          ),
        );
        const expected = toInline(`
            export default function MyComponent({}, {h}) {
              return h('div', {}, 'foo');
            }
          `);
        expect(output).toBe(expected);
      });

      it("should transform a basic web-component with node children", () => {
        const input = `
            export default function MyComponent() {
              return <div><b>foo</b></div>
            }
          `;
        const output = toInline(
          jsxToReactiveHyperscript(
            input,
            "src/web-components/my-component.tsx",
          ),
        );
        const expected = toInline(`
            export default function MyComponent({}, {h}) {
              return h('div', {}, ['b', {}, 'foo']);
            }
          `);
        expect(output).toBe(expected);
      });

      it("should transform a basic web-component with props", () => {
        const input = `
            export default function MyComponent(props) {
              return <div>{props.someProp}</div>
            }
          `;
        const output = toInline(
          jsxToReactiveHyperscript(
            input,
            "src/web-components/my-component.tsx",
          ),
        );
        const expected = toInline(`
            export default function MyComponent(props, {h}) {
              return h('div', {}, () => props.someProp.value);
            }
          `);
        expect(output).toBe(expected);
      });

      it("should transform a basic web-component with destructuring props", () => {
        const input = `
            export default function MyComponent({someProp}) {
              return <div>{someProp}</div>
            }
          `;
        const output = toInline(
          jsxToReactiveHyperscript(
            input,
            "src/web-components/my-component.tsx",
          ),
        );
        const expected = toInline(`
            export default function MyComponent({someProp}, {h}) {
              return h('div', {}, () => someProp.value);
            }
          `);
        expect(output).toBe(expected);
      });

      it("should transform a basic web-component with renamed destructuring props", () => {
        const input = `
            export default function MyComponent({someProp: somePropRenamed}) {
              return <div>{somePropRenamed}</div>
            }
          `;
        const output = toInline(
          jsxToReactiveHyperscript(
            input,
            "src/web-components/my-component.tsx",
          ),
        );
        const expected = toInline(`
            export default function MyComponent({someProp: somePropRenamed}, {h}) {
              return h('div', {}, () => somePropRenamed.value);
            }
          `);
        expect(output).toBe(expected);
      });
    });
  });
});
