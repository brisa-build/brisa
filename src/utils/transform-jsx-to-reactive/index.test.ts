import { describe, expect, it, spyOn } from "bun:test";
import transformJSXToReactive from ".";
import getConstants from "../../constants";

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

      it("should work with async web components", () => {
        const input = `
            export default async function MyComponent() {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              return <div>foo</div>
            }
          `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );

        const expected = toInline(`
            import {brisaElement} from "brisa/client";
  
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
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );

        const expected = toInline(`
            import {brisaElement} from "brisa/client";

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
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );

        const expected = toInline(`
            import {brisaElement} from "brisa/client";

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
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );

        const expected = toInline(`
            import {brisaElement} from "brisa/client";

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
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );

        const expected = toInline(`
            import {brisaElement} from "brisa/client";

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
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );

        const expected = toInline(`
            import {brisaElement} from "brisa/client";

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
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );

        const expected = toInline(`
            import {brisaElement} from "brisa/client";

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
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );

        const expected = toInline(`
            import {brisaElement} from "brisa/client";

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
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );

        const expected = toInline(`
            import {brisaElement} from "brisa/client";

            export default brisaElement(function MyComponent({}, {h}) {
              return h(null, {}, '');
            });
          `);

        expect(output).toBe(expected);
      });
    });

    it("should wrap conditional renders inside an hyperScript function", () => {
      const input = `
          export default function MyComponent({show}) {
            return show ? <div>foo</div> : 'Empty'
          }
        `;

      const output = toInline(
        transformJSXToReactive(input, "src/web-components/my-component.tsx"),
      );

      const expected = toInline(`
          import {brisaElement} from "brisa/client";

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
        transformJSXToReactive(input, "src/web-components/my-component.tsx"),
      );

      const expected = toInline(`
          import {brisaElement} from "brisa/client";

          export default brisaElement(function (props, {h}) {return h('div', {}, () => props.foo.value);}, ['foo']);
        `);

      expect(output).toBe(expected);
    });

    it("should work with a component as an arrow function without blockstatement that return a literal", () => {
      const input = `
          export default (props) => 'Hello World'
        `;

      const output = toInline(
        transformJSXToReactive(input, "src/web-components/my-component.tsx"),
      );

      const expected = toInline(`
          import {brisaElement} from "brisa/client";

          export default brisaElement(function (props, {h}) {return h(null, {}, 'Hello World');});
        `);

      expect(output).toBe(expected);
    });

    it("should not use HyperScript with a console.log in an arrow function with blockstatement", () => {
      const input = `
          export default (props) => { console.log('Hello World') }
        `;

      const output = toInline(
        transformJSXToReactive(input, "src/web-components/my-component.tsx"),
      );

      const expected = toInline(`
          import {brisaElement} from "brisa/client";

          export default brisaElement(function (props, {h}) {console.log('Hello World');});
        `);

      expect(output).toBe(expected);
    });

    it.todo(
      "should not use HyperScript with a console.log in an arrow function without blockstatement",
      () => {
        const input = `
          export default (props) => console.log('Hello World')
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );

        const expected = toInline(`
          import {brisaElement} from "brisa/client";

          export default brisaElement((props) => console.log('Hello World'));
        `);

        expect(output).toBe(expected);
      },
    );

    it.todo(
      "should work with a component as an arrow function with blockstatement and the default export on a different line",
      () => {
        const input = `
        const MyComponent = (props) => <div>{props.foo}</div>
        export default MyComponent
      `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );

        const expected = toInline(`
        import {brisaElement} from "brisa/client";

        const MyComponent = (props, {h}) => h('div', {}, () => props.foo.value);
        export default brisaElement(MyComponent, ['foo']);
      `);

        expect(output).toBe(expected);
      },
    );

    it.todo(
      "should wrap conditional renders in different returns inside an hyperScript function",
      () => {
        const input = `
          export default function MyComponent({show}) {
            if (show) return <div>foo</div>
            const bar = <b>bar</b>
            return <span>bar</span>
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );

        const expected = toInline(`
          import {brisaElement} from "brisa/client";

          export default brisaElement(function MyComponent({show}, {h}) {
            return h(null, {}, () => {
              if (show.value) return ['div', {}, 'foo'];
              const bar = ['b', {}, 'bar'];
              return ['span', {}, 'bar'];
            });
          }, ['show']);
        `);

        expect(output).toBe(expected);
      },
    );

    it.todo(
      "should wrap conditional renders using switch-case and different returns inside an hyperScript function",
      () => {
        const input = `
          export default function MyComponent({show}) {
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
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );

        const expected = toInline(`
          import {brisaElement} from "brisa/client";

          export default brisaElement(function MyComponent({show}, {h}) {
            return h(null, {}, () => {
              switch (show.value) {
                case true:
                  return ['div', {}, 'foo'];
                case false:
                  return ['b', {}, 'bar'];
                default:
                  return ['span', {}, 'bar'];
              }
            });
          }, ['show']);
        `);

        expect(output).toBe(expected);
      },
    );

    it.todo(
      "should work with attributes as boolean as <dialog open />",
      () => {},
    );

    it.todo(
      "should add propName.value when is used whatever in the component code: inside an if/else, console.log, etc",
    );

    it.todo("should be possible to set default props inside arguments");

    it.todo("should be possible to set default props inside code");

    it.todo(
      "should wrap reactivity returning a string with a prop concatenated",
      () => {
        const input = `
          export default function MyComponent({foo}) {
            return 'Hello ' + foo
          }
        `;

        const output = toInline(
          transformJSXToReactive(input, "src/web-components/my-component.tsx"),
        );

        const expected = toInline(`
          import {brisaElement} from "brisa/client";

          export default brisaElement(function MyComponent({foo}, {h}) {
            return h(null, {}, () => ['Hello ', foo.value].join(''));
          }, ['foo']);
        `);

        expect(output).toBe(expected);
      },
    );
  });
});
