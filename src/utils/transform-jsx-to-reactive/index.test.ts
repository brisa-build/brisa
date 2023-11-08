import { describe, expect, it } from "bun:test";
import transformJSXToReactive from ".";

const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');

describe("utils", () => {
  describe("transformJSXToReactive", () => {
    describe("without transformation", () => {
      it("should not transform if is inside @react folder", () => {
        const input = `
            export default function MyComponent() {
              return <div>foo</div>
            }
          `;
        const output = toInline(
          transformJSXToReactive(
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
          transformJSXToReactive(
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
          transformJSXToReactive(input, "/src/components/my-component.tsx"),
        );
        const expected = toInline(`
            export default function MyComponent() {
              return ['div', {}, 'foo'];
            }`);
        expect(output).toBe(expected);
      });

      it("should transform JSX to an array if is a variable", () => {
        const input = `
            const element = <div>foo</div>
          `;
        const output = toInline(
          transformJSXToReactive(input, "/src/components/my-component.tsx"),
        );
        const expected = toInline(`const element = ['div', {}, 'foo'];`);
        expect(output).toBe(expected);
      });

      it("should transform JSX to an array if is a variable with a function", () => {
        const input = `
            const element = () => <div>foo</div>
          `;
        const output = toInline(
          transformJSXToReactive(input, "/src/components/my-component.tsx"),
        );
        const expected = toInline(`const element = () => ['div', {}, 'foo'];`);
        expect(output).toBe(expected);
      });

      it("should transform a basic web-component", () => {
        const input = `
            export default function MyComponent() {
              return <div>foo</div>
            }
          `;
        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );
        const expected = toInline(`
            import {brisaElement} from "brisa/client";

            export default brisaElement(function MyComponent({}, {h}) {
              return h('div', {}, 'foo');
            });
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
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );
        const expected = toInline(`
            import {brisaElement} from "brisa/client";

            export default brisaElement(function MyComponent({}, {h}) {
              return h('div', {}, ['b', {}, 'foo']);
            });
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
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );
        const expected = toInline(`
            import {brisaElement} from "brisa/client";

            export default brisaElement(function MyComponent(props, {h}) {
              return h('div', {}, () => props.someProp.value);
            }, ['someProp']);
        `);
        expect(output).toBe(expected);
      });

      it("should transform a basic web-component with props without conflicts with other components", () => {
        const input = `
            function Test(props) {
              return <div>{props.anotherName}</div>
            }
  
            export default function MyComponent(props) {
              return <div>{props.someProp}</div>
            }
          `;
        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );
        const expected = toInline(`
            import {brisaElement} from "brisa/client";

            let Test = function (props) {
              return ['div', {}, props.anotherName];
            };
  
            export default brisaElement(function MyComponent(props, {h}) {
              return h('div', {}, () => props.someProp.value);
            }, ['someProp']);
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
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );
        const expected = toInline(`
            import {brisaElement} from "brisa/client";

            export default brisaElement(function MyComponent({someProp}, {h}) {
              return h('div', {}, () => someProp.value);
            }, ['someProp']);
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
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );
        const expected = toInline(`
            import {brisaElement} from "brisa/client";

            export default brisaElement(function MyComponent({someProp: somePropRenamed}, {h}) {
              return h('div', {}, () => somePropRenamed.value);
            }, ['someProp']);
          `);
        expect(output).toBe(expected);
      });
      it("should transform a basic web-component with fragments", () => {
        const input = `
            export default function MyComponent() {
              return <>
                <div>foo</div>
                <span>bar</span>
              </>
            }
          `;
        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );
        const expected = toInline(`
            import {brisaElement} from "brisa/client";

            export default brisaElement(function MyComponent({}, {h}) {
              return h(null, {}, [['div', {}, 'foo'], ['span', {}, 'bar']]);
            });
          `);
        expect(output).toBe(expected);
      });
      it("should transform a basic web-component with fragments and props", () => {
        const input = `
            export default function MyComponent(props) {
              return <>
                <div>{props.foo}</div>
                <span>{props.bar}</span>
              </>
            }
          `;
        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );
        const expected = toInline(`
            import {brisaElement} from "brisa/client";

            export default brisaElement(function MyComponent(props, {h}) {
              return h(null, {}, [['div', {}, () => props.foo.value], ['span', {}, () => props.bar.value]]);
            }, ['foo', 'bar']);
          `);

        expect(output).toBe(expected);
      });

      it.todo(
        'should use a different name for the "h" function if there is a conflict with the name of a prop',
      );
      it.todo(
        'should use a different name for the "h" function if there is a conflict with the name of a variable',
      );
    });
  });
});
