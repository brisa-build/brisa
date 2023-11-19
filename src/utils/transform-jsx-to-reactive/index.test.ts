import { describe, expect, it, spyOn } from "bun:test";
import transformJSXToReactive from ".";
import getConstants from "../../constants";

const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');

describe("utils", () => {
  describe("transform-jsx-to-reactive", () => {
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
            "/src/web-components/@react/my-component.tsx"
          )
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
            "/src/web-components/@react/my-component.tsx"
          )
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
          transformJSXToReactive(input, "/src/components/my-component.tsx")
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
          transformJSXToReactive(input, "/src/components/my-component.tsx")
        );
        const expected = toInline(`const element = ['div', {}, 'foo'];`);
        expect(output).toBe(expected);
      });

      it("should transform JSX to an array if is a variable with a function", () => {
        const input = `
            const element = () => <div>foo</div>
          `;
        const output = toInline(
          transformJSXToReactive(input, "/src/components/my-component.tsx")
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
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

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
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

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
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

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
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

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
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            export default brisaElement(function MyComponent({someProp}, {h}) {
              return h('div', {}, () => someProp.value);
            }, ['someProp']);
          `);
        expect(output).toBe(expected);
      });

      it("should work with async web components", () => {
        const input = `
            export default async function MyComponent() {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              return <div>foo</div>
            }
          `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";
  
            export default brisaElement(async function MyComponent({}, {h}) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              return h('div', {}, 'foo');
            });
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
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

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
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

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
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            export default brisaElement(function MyComponent(props, {h}) {
              return h(null, {}, [['div', {}, () => props.foo.value], ['span', {}, () => props.bar.value]]);
            }, ['foo', 'bar']);
          `);

        expect(output).toBe(expected);
      });

      it("should transform a basic web-component with fragments and props with a conflict with another component", () => {
        const input = `
            function Test(props) {
              return (
                <>
                  <div>{props.bla}</div>
                  <span>{props.another}</span>
                </>
              )
            }

            export default function MyComponent(props) {
              return (
                <>
                  <div>{props.foo}</div>
                  <span>{props.bar}</span>
                </>
              )
            }
          `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            let Test = function (props) {
              return [null, {}, [['div', {}, props.bla], ['span', {}, props.another]]];
            };

            export default brisaElement(function MyComponent(props, {h}) {
              return h(null, {}, [['div', {}, () => props.foo.value], ['span', {}, () => props.bar.value]]);
            }, ['foo', 'bar']);
          `);

        expect(output).toBe(expected);
      });

      it("should not allow to consume web-components as server-components and log with an error", () => {
        const { LOG_PREFIX } = getConstants();
        const mockLog = spyOn(console, "log");

        mockLog.mockImplementation(() => {});

        const input = `
            function Test(props) {
              return (
                <div>{props.children}</div>
              )
            }

            export default function MyComponent(props) {
              return (
                <Test someProp={true}>
                  <div>{props.foo}</div>
                  <span>{props.bar}</span>
                </Test>
              )
            }
          `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            let Test = function (props) {
              return ['div', {}, props.children];
            };

            export default brisaElement(function MyComponent(props, {h}) {
              return h(null, {}, [['div', {}, () => props.foo.value], ['span', {}, () => props.bar.value]]);
            }, ['foo', 'bar']);
          `);
        const logs = mockLog.mock.calls.slice(0);
        mockLog.mockRestore();
        expect(output).toBe(expected);
        expect(logs[0]).toEqual([LOG_PREFIX.ERROR, `Ops! Error:`]);
        expect(logs[1]).toEqual([
          LOG_PREFIX.ERROR,
          `--------------------------`,
        ]);
        expect(logs[2]).toEqual([
          LOG_PREFIX.ERROR,
          `You can't use "Test" variable as a tag name.`,
        ]);
        expect(logs[3]).toEqual([
          LOG_PREFIX.ERROR,
          `Please use a string instead. You cannot use server-components inside web-components directly.`,
        ]);
        expect(logs[4]).toEqual([
          LOG_PREFIX.ERROR,
          `You must use the "children" or slots in conjunction with the events to communicate with the server-components.`,
        ]);
        expect(logs[5]).toEqual([
          LOG_PREFIX.ERROR,
          `--------------------------`,
        ]);
        expect(logs[6]).toEqual([
          LOG_PREFIX.ERROR,
          `Docs: https://brisa.dev/docs/component-details/web-components`,
        ]);
      });

      it('should use a different name for the "h" function if there is a conflict with the name of a prop', () => {
        const input = `
            export default function MyComponent({ h }) {
              return <div>{h}</div>
            }
          `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            export default brisaElement(function MyComponent({h}, {h: h$}) {
              return h$('div', {}, () => h.value);
            }, ['h']);
          `);

        expect(output).toBe(expected);
      });
      it('should use a different name for the "h" function if there is a conflict with the name of a variable', () => {
        const input = `
            export default function MyComponent({}, {state}) {
              const h = state(3);
              return <div>{h.value}</div>
            }
          `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            export default brisaElement(function MyComponent({}, {state, h: h$}) {
              const h = state(3);
              return h$('div', {}, () => h.value);
            });
          `);

        expect(output).toBe(expected);
      });

      it('should use a different name for the "h" function if there are multi conflict with the name of a variable', () => {
        const input = `
            export default function MyComponent({}, context) {
              const h = context.state(3);
              const h$ = "foo";
              return <div>{h.value} {h$}</div>
            }
          `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            export default brisaElement(function MyComponent({}, {h: h$$, ...context}) {
              const h = context.state(3);
              const h$ = "foo";
              return h$$('div', {}, () => [h.value, ' ', h$].join(''));
            });
          `);

        expect(output).toBe(expected);
      });

      it("should be possible to return a string as a child", () => {
        const input = `
            export default function MyComponent() {
              return 'foo'
            }
          `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            export default brisaElement(function MyComponent({}, {h}) {
              return h(null, {}, 'foo');
            });
          `);

        expect(output).toBe(expected);
      });

      it("should be possible to return null as a child", () => {
        const input = `
            export default function MyComponent() {
              return null
            }
          `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            export default brisaElement(function MyComponent({}, {h}) {
              return h(null, {}, '');
            });
          `);

        expect(output).toBe(expected);
      });
      it("should be possible to return undefined as a child", () => {
        const input = `
            export default function MyComponent() {
              return undefined
            }
          `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            export default brisaElement(function MyComponent({}, {h}) {
              return h(null, {}, '');
            });
          `);

        expect(output).toBe(expected);
      });

      it("should wrap conditional renders inside an hyperScript function", () => {
        const input = `
          export default function MyComponent({show}) {
            return show ? <div>foo</div> : 'Empty'
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function MyComponent({show}, {h}) {
            return h(null, {}, () => show.value ? ['div', {}, 'foo'] : 'Empty');
          }, ['show']);
        `);

        expect(output).toBe(expected);
      });

      it("should work with a component as an arrow function without blockstatement", () => {
        const input = `
          export default (props) => <div>{props.foo}</div>
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function (props, {h}) {return h('div', {}, () => props.foo.value);}, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should work with a component as an arrow function without blockstatement that return a literal", () => {
        const input = `
          export default (props) => 'Hello World'
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function (props, {h}) {return h(null, {}, 'Hello World');});
        `);

        expect(output).toBe(expected);
      });

      it("should wrap reactivity returning a string with a prop concatenated with +", () => {
        const input = `
          export default function MyComponent({foo}) {
            return 'Hello ' + foo
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function MyComponent({foo}, {h}) {
            return h(null, {}, () => 'Hello ' + foo.value);
          }, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should wrap reactivity returning a string with a prop concatenated with multiple +", () => {
        const input = `
          export default function MyComponent({foo, bar, baz}) {
            return "Hello " + foo + " " + bar + " " +  baz
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function MyComponent({foo, bar, baz}, {h}) {
            return h(null, {}, () => 'Hello ' + foo.value + ' ' + bar.value + ' ' + baz.value);
          }, ['foo', 'bar', 'baz']);
        `);

        expect(output).toBe(expected);
      });

      it("should wrap reactivity returning a string with a prop concatenated with multiple + and props without destructuring", () => {
        const input = `
          export default function MyComponent(props) {
            return "Hello " + props.foo + " " + props.bar + " " +  props.baz
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function MyComponent(props, {h}) {
            return h(null, {}, () => 'Hello ' + props.foo.value + ' ' + props.bar.value + ' ' + props.baz.value);
          }, ['foo', 'bar', 'baz']);
        `);

        expect(output).toBe(expected);
      });

      it("should wrap reactivity returning a string with a prop concatenated with multiple + and arrow fn", () => {
        const input = `
          export default (props) => {
            return "Hello " + props.foo + " " + props.bar + " " +  props.baz
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function (props, {h}) {
            return h(null, {}, () => 'Hello ' + props.foo.value + ' ' + props.bar.value + ' ' + props.baz.value);
          }, ['foo', 'bar', 'baz']);
        `);

        expect(output).toBe(expected);
      });

      it("should work with a component as an arrow function without blockstatement that return a string with a prop", () => {
        const input = `
          export default (props) => 'Hello World' + props.foo
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function (props, {h}) {return h(null, {}, () => 'Hello World' + props.foo.value);}, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should not use HyperScript with a console.log in an arrow function with blockstatement", () => {
        const input = `
          export default (props) => { console.log('Hello World') }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function (props, {h}) {console.log('Hello World');});
        `);

        expect(output).toBe(expected);
      });

      it("should use HyperScript with a console.log in an arrow function without blockstatement but with props", () => {
        const input = `
          export default (props) => console.log('Hello World' + props.foo)
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function (props, {h}) {return h(null, {}, () => console.log('Hello World' + props.foo.value));}, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should use HyperScript printing an object with the shorthand syntax of some prop", () => {
        const input = `
          export default ({ foo }) => console.log({ foo })
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function ({foo}, {h}) {return h(null, {}, () => console.log({foo: foo.value}));}, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should work with a component as an arrow function with blockstatement and the default export on a different line", () => {
        const input = `
        const MyComponent = (props) => <div>{props.foo}</div>
        export default MyComponent
      `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
        import {brisaElement, _on, _off} from "brisa/client";

        export default brisaElement(function (props, {h}) {return h('div', {}, () => props.foo.value);}, ['foo']);
      `);

        expect(output).toBe(expected);
      });

      it("should work default export on a different line in a function declaration", () => {
        const input = `
        function MyComponent(props) {
          return <div>{props.foo}</div>
        }
        export default MyComponent
      `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
        import {brisaElement, _on, _off} from "brisa/client";

        export default brisaElement(function (props, {h}) {
          return h('div', {}, () => props.foo.value);
        }, ['foo']);
      `);

        expect(output).toBe(expected);
      });

      it("should work with attributes as boolean as <dialog open />", () => {
        const input = `
        export default function MyComponent() {
          return <dialog open />
        }
      `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected =
          toInline(`import {brisaElement, _on, _off} from "brisa/client";

        export default brisaElement(function MyComponent({}, {h}) {
          return h('dialog', {open: _on}, '');
        });`);

        expect(output).toBe(expected);
      });

      it("should work with attributes as boolean as <dialog open /> and props", () => {
        const input = `
        export default function MyComponent(props) {
          return <dialog open={props.open} />
        }
      `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected =
          toInline(`import {brisaElement, _on, _off} from "brisa/client";

        export default brisaElement(function MyComponent(props, {h}) {
          return h('dialog', {open: () => props.open.value ? _on : _off}, '');
        }, ['open']);`);

        expect(output).toBe(expected);
      });

      it("should work with attributes as boolean as <dialog open /> and state", () => {
        const input = `
        export default function MyComponent({}, {state}) {
          const open = state(true);
          return <dialog open={open.value} />
        }
      `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected =
          toInline(`import {brisaElement, _on, _off} from "brisa/client";

        export default brisaElement(function MyComponent({}, {state, h}) {
          const open = state(true);
          return h('dialog', {open: () => open.value ? _on : _off}, '');
        });`);

        expect(output).toBe(expected);
      });

      it("should work with attributes as boolean as <dialog open /> and static variable", () => {
        const input = `
        export default function MyComponent({}) {
          const open = true;
          return <dialog open={open} />
        }
      `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected =
          toInline(`import {brisaElement, _on, _off} from "brisa/client";

        export default brisaElement(function MyComponent({}, {h}) {
          const open = true;
          return h('dialog', {open: open ? _on : _off}, '');
        });`);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props inside arguments", () => {
        const input = `
          export default function MyComponent({foo = 'bar'}) {
            const someVar = 'test';
            return <div>{foo}</div>
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function MyComponent({foo}, {h, effect}) {
            effect(() => foo.value ??= 'bar');
            const someVar = 'test';
            return h('div', {}, () => foo.value);
          }, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props inside arrow function arguments and no-direct export default", () => {
        const input = `
          const Component = ({foo = 'bar'}) => {
            const someVar = 'test';
            return <div>{foo}</div>
          }

          export default Component
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function ({foo}, {h, effect}) {
            effect(() => foo.value ??= 'bar');
            const someVar = 'test';
            return h('div', {}, () => foo.value);
          }, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props inside arrow function arguments and ndirect export default", () => {
        const input = `
          const Component = ({foo = 'bar'}) => {
            const someVar = 'test';
            return <div>{foo}</div>
          }

          export default Component
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function ({foo}, {h, effect}) {
            effect(() => foo.value ??= 'bar');
            const someVar = 'test';
            return h('div', {}, () => foo.value);
          }, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props inside arrow function renamed arguments and ndirect export default", () => {
        const input = `
          const Component = ({foo: renamedFoo = 'bar'}) => {
            const someVar = 'test';
            return <div>{renamedFoo}</div>
          }

          export default Component
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function ({foo: renamedFoo}, {h, effect}) {
            effect(() => renamedFoo.value ??= 'bar');
            const someVar = 'test';
            return h('div', {}, () => renamedFoo.value);
          }, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should add the h function when there are more web context attributes", () => {
        const input = `
          export default function Component({ }, { effect, cleanup, state }: any) {
            const someState = state(0);
          
            effect(() => {
              console.log(someState.value)
            })
          
            return (
              <div>
                {someState.value}
              </div>
            )
          }        
        `;
        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected =
          toInline(`import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function Component({}, {effect, cleanup, state, h}) {
            const someState = state(0);
          
            effect(() => {
              console.log(someState.value);
            });
          
            return h('div', {}, () => someState.value);
          });`);

        expect(output).toBe(expected);
      });

      it('should not transform a prop that starts with "on" as an event', () => {
        const input = `
          export default function Component({ onFoo }) {
            return <div onClick={onFoo}>foo</div>
          }
        `;
        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected =
          toInline(`import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function Component({onFoo}, {h}) {
            return h('div', {onClick: onFoo}, 'foo');
          }, ['onFoo']);`);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props inside code with || operator", () => {
        const input = `
          export default function MyComponent({foo}) {
            const bar = foo || 'bar';
            return <div>{bar}</div>
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function MyComponent({foo}, {h, effect}) {
            effect(() => foo.value ||= 'bar');
            const bar = foo;
            return h('div', {}, () => bar.value);
          }, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props inside code with props identifier and || operator", () => {
        const input = `
          export default function MyComponent(props) {
            const bar = props.foo || 'bar';
            return <div>{bar}</div>
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function MyComponent(props, {h, effect}) {
            effect(() => props.foo.value ||= 'bar');
            const bar = props.foo;
            return h('div', {}, () => bar.value);
          }, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props inside code with ?? operator", () => {
        const input = `
          export default function MyComponent({foo}) {
            const bar = foo ?? 'bar';
            return <div>{bar}</div>
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function MyComponent({foo}, {h, effect}) {
            effect(() => foo.value ??= 'bar');
            const bar = foo;
            return h('div', {}, () => bar.value);
          }, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props inside code with props identifier and ?? operator", () => {
        const input = `
          export default function MyComponent(props) {
            const bar = props.foo ?? 'bar';
            return <div>{bar}</div>
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function MyComponent(props, {h, effect}) {
            effect(() => props.foo.value ??= 'bar');
            const bar = props.foo;
            return h('div', {}, () => bar.value);
          }, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props inside code with props identifier and ?? operator and effect variable", () => {
        const input = `
          export default function MyComponent(props) {
            const effect = false;
            const bar = props.foo ?? 'bar';
            return <div>{bar}</div>
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function MyComponent(props, {h, effect: effect$}) {
            effect$(() => props.foo.value ??= 'bar');
            const effect = false;
            const bar = props.foo;
            return h('div', {}, () => bar.value);
          }, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props inside code with ?? operator and some effect", () => {
        const input = `
          export default function MyComponent({foo}, {effect}) {
            const bar = foo ?? 'bar';
            effect(() => console.log(bar))
            return <div>{bar}</div>
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function MyComponent({foo}, {effect, h}) {
            effect(() => foo.value ??= 'bar');
            const bar = foo;
            effect(() => console.log(bar.value));
            return h('div', {}, () => bar.value);
          }, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should transform a web-component with conditional render inside the JSX", () => {
        const input = `
        export default function ConditionalRender({ name, children }: any) {
          return (
            <h2>
            <b>Hello { name }</b>
          {
            name === "Barbara" ? <b>!! 🥳</b> : "🥴"}
            { children }
            </h2>
          )
    }
          `;
        const output = toInline(
          transformJSXToReactive(
            input,
            "src/web-components/conditional-render.tsx"
          )
        );
        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function ConditionalRender({name, children}, {h}) {
            return h('h2', {}, [
              ['b', {}, () => ['Hello ', name.value].join('')], [null, {}, () => name.value === 'Barbara' ? ['b', {}, '!! 🥳'] : '🥴'], [null, {}, children]
            ]);
          }, ['name']);
      `);

        expect(output).toBe(expected);
      });

      it('should be possible to define reactivity props using "export const props = []"', () => {
        const input = `
          export const props = ['foo', 'bar'];
          export default function MyComponent(props) {
            return <div {...props}>Example</div>
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );
        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export const props = ['foo', 'bar'];
          export default brisaElement(function MyComponent(props, {h}) {
            return h('div', {...props}, 'Example');
          }, ['foo', 'bar']);
        `);

        expect(output).toBe(expected);
      });

      it('should be possible to define reactivity props using "export const props = []" keeping the autodetected', () => {
        const input = `
          export const props = ['bar'];
          export default function MyComponent({ foo, ...props }) {
            return <div {...props}>Example</div>
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );
        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export const props = ['bar'];
          export default brisaElement(function MyComponent({foo, ...props}, {h}) {
            return h('div', {...props}, 'Example');
          }, ['foo', 'bar']);
        `);

        expect(output).toBe(expected);
      });

      it.todo(
        "should alert with a warning in DEV when consuming spread props inside JSX",
        () => {}
      );

      it.todo(
        "should be possible to use props as conditional variables",
        () => {
          const input = `
          export default function MyComponent({foo, bar}) {
            const baz = foo && bar;
            return <div>{baz ? 'TRUE' : 'FALSE'}</div>
          }
        `;

          const output = toInline(
            transformJSXToReactive(input, "src/web-components/my-component.tsx")
          );

          const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export default brisaElement(function MyComponent({foo, bar}, {h}) {
            const baz = foo.value && bar.value;
            return h('div', {}, () => baz ? 'TRUE' : 'FALSE');
          }, ['foo', 'bar']);}`);

          expect(output).toBe(expected);
        }
      );

      it("should wrap conditional renders in different returns inside an hyperScript function", () => {
        const input = `
          export default function MyComponent({ show }) {
          if (show) return <div>foo</div>
          const bar = <b>bar</b>
          return <span>bar</span>
        }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
        import {brisaElement, _on, _off} from "brisa/client";

        export default brisaElement(function MyComponent({show}, {h}) {
          return h(null, {}, () => {
            if (show.value) return ['div', {}, 'foo'];
            const bar = ['b', {}, 'bar'];
            return ['span', {}, 'bar'];
          });
        }, ['show']);
        `);

        expect(output).toBe(expected);
      });

      it("should wrap conditional renders using switch-case and different returns inside an hyperScript function", () => {
        const input = `
        export default function MyComponent({ show }) {
          switch (show) {
            case true:
              return <div>foo</div>
            case false:
              return <b>bar</b>
            default:
              return <span>bar</span>
          }
        }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx")
        );

        const expected = toInline(`
        import {brisaElement, _on, _off} from "brisa/client";

        export default brisaElement(function MyComponent({show}, {h}) {
          return h(null, {}, () => {
            switch (show.value) {
              case true:return ['div', {}, 'foo'];
              case false:return ['b', {}, 'bar'];
              default:return ['span', {}, 'bar'];
            }
          });
        }, ['show']);
        `);

        expect(output).toBe(expected);
      });

      it.todo(
        "should be possible to set default props from ...rest inside code"
      );

      it.todo(
        "should log a warning when using spread props inside JSX that can lost the reactivity"
      );

      it.todo(
        'should only register the first effect signal on "<>sig.value && <div>{sig.value.message}</div>", the second one should be ignored'
      );
    });
  });
});
