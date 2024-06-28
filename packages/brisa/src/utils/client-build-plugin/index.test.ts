import { describe, expect, it, spyOn } from "bun:test";
import clientBuildPlugin from ".";
import { getConstants } from "@/constants";
import { boldLog } from "@/utils/log/log-color";

const toInline = (s: string) => s.replace(/\s*\n\s*/g, "").replaceAll("'", '"');

describe("utils", () => {
  describe("client-build-plugin", () => {
    describe("without transformation", () => {
      it("should not transform if is inside _native folder", () => {
        const input = `
            export default function MyComponent() {
              return <div>foo</div>
            }
          `;
        const output = toInline(
          clientBuildPlugin(
            input,
            "/src/web-components/_native/my-component.tsx",
          ).code,
        );
        const expected = toInline(input);
        expect(output).toBe(expected);
      });
    });

    describe("basic components with transformation", () => {
      it("should transform if is inside _partials folder", () => {
        const input = `
            export default function partial() {
              return <div>foo</div>
            }
          `;
        const output = toInline(
          clientBuildPlugin(
            input,
            "/src/web-components/_partials/my-component.tsx",
          ).code,
        );
        const expected = toInline(`        
          export default function partial() {
            return ['div', {}, 'foo'];
          }
      `);
        expect(output).toBe(expected);
      });

      it('should transform if the path is internal web component "__BRISA_CLIENT__"', () => {
        const input = `
            export default function MyComponent() {
              return <div>foo</div>
            }
          `;
        const output = toInline(
          clientBuildPlugin(input, "__BRISA_CLIENT__ContextProvider").code,
        );
        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";
          
          function MyComponent() {return ["div", {}, "foo"];}
          
          const ContextProvider = brisaElement(MyComponent);
        `);
        expect(output).toBe(expected);
      });

      it("should transform JSX to an array if is a variable", () => {
        const input = `
            const element = <div>foo</div>
          `;
        const output = toInline(
          clientBuildPlugin(input, "/src/components/my-component.tsx").code,
        );
        const expected = toInline(
          `const element = ['div', {}, 'foo'];export default null;`,
        );
        expect(output).toBe(expected);
      });

      it("should transform JSX to an array if is a variable with a function", () => {
        const input = `
            const element = () => <div>foo</div>
          `;
        const output = toInline(
          clientBuildPlugin(input, "/src/components/my-component.tsx").code,
        );
        const expected = toInline(
          `const element = () => ['div', {}, 'foo'];export default null;`,
        );
        expect(output).toBe(expected);
      });

      it("should transform a basic web-component", () => {
        const input = `
            export default function MyComponent() {
              return <div>foo</div>
            }
          `;
        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            function MyComponent() {
              return ['div', {}, 'foo'];
            }

            export default brisaElement(MyComponent);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            function MyComponent() {
              return ['div', {}, ['b', {}, 'foo']];
            }

            export default brisaElement(MyComponent);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            function MyComponent(props) {
              return ['div', {}, () => props.someProp.value];
            }

            export default brisaElement(MyComponent, ['someProp']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            let Test = function (props) {
              return ['div', {}, props.anotherName];
            };

            function MyComponent(props) {
              return ['div', {}, () => props.someProp.value];
            }
  
            export default brisaElement(MyComponent, ['someProp']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            function MyComponent({someProp}) {
              return ['div', {}, () => someProp.value];
            }

            export default brisaElement(MyComponent, ['someProp']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            async function MyComponent() {
              await new Promise(resolve => setTimeout(resolve, 1000));
              return ['div', {}, 'foo'];
            }
  
            export default brisaElement(MyComponent);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            function MyComponent({someProp: somePropRenamed}) {
              return ['div', {}, () => somePropRenamed.value];
            }

            export default brisaElement(MyComponent, ['someProp']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            function MyComponent() {
              return [null, {}, [['div', {}, 'foo'], ['span', {}, 'bar']]];
            }

            export default brisaElement(MyComponent);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );
        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            function MyComponent(props) {
              return [null, {}, [['div', {}, () => props.foo.value], ['span', {}, () => props.bar.value]]];
            }

            export default brisaElement(MyComponent, ['foo', 'bar']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            let Test = function (props) {
              return [null, {}, [['div', {}, props.bla], ['span', {}, props.another]]];
            };

            function MyComponent(props) {
              return [null, {}, [['div', {}, () => props.foo.value], ['span', {}, () => props.bar.value]]];
            }

            export default brisaElement(MyComponent, ['foo', 'bar']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            let Test = function (props) {
              return ['div', {}, props.children];
            };

            function MyComponent(props) {
              return [null, {}, [['div', {}, () => props.foo.value], ['span', {}, () => props.bar.value]]];
            }

            export default brisaElement(MyComponent, ['foo', 'bar']);
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
          boldLog(`You can't use "Test" variable as a tag name.`),
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
          `File: src/web-components/my-component.tsx`,
        ]);
        expect(logs[6]).toEqual([
          LOG_PREFIX.ERROR,
          `--------------------------`,
        ]);
        expect(logs[7]).toEqual([
          LOG_PREFIX.ERROR,
          `Documentation about web-components: https://brisa.build/building-your-application/components-details/web-components`,
        ]);
      });

      it("should be possible to return a string as a child", () => {
        const input = `
            export default function MyComponent() {
              return 'foo'
            }
          `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            function MyComponent() {
              return 'foo';
            }

            export default brisaElement(MyComponent);
          `);

        expect(output).toBe(expected);
      });

      it("should be possible to return a variable as a child", () => {
        const input = `
            export default function MyComponent() {
              const foo = 'Some text'
              return foo
            }
          `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            function MyComponent() {
              const foo = 'Some text';
              return () => foo;
            }

            export default brisaElement(MyComponent);
          `);

        expect(output).toBe(expected);
      });

      it("should be possible to return a variable as a child inside suspense", () => {
        const input = `
            export default function MyComponent() {
              return 'Hello world'
            }

            MyComponent.suspense = () => {
              const foo = 'Some text'
              return foo
            }
          `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            function MyComponent() {
              return 'Hello world';
            }

            export default brisaElement(MyComponent);

            MyComponent.suspense = function suspense() {
              const foo = 'Some text';
              return () => foo;
            };
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            function MyComponent() {
              return '';
            }

            export default brisaElement(MyComponent);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
            import {brisaElement, _on, _off} from "brisa/client";

            function MyComponent() {
              return '';
            }

            export default brisaElement(MyComponent);
          `);

        expect(output).toBe(expected);
      });

      it("should wrap conditional renders inside a function", () => {
        const input = `
          export default function MyComponent({show}) {
            return show ? <div>foo</div> : 'Empty'
          }
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent({show}) {
            return () => show.value ? ['div', {}, 'foo'] : 'Empty';
          }

          export default brisaElement(MyComponent, ['show']);
        `);

        expect(output).toBe(expected);
      });

      it("should work with a component as an arrow function without blockstatement", () => {
        const input = `
          export default (props) => <div>{props.foo}</div>
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function Component(props) {return ['div', {}, () => props.foo.value];}

          export default brisaElement(Component, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should work with a component as an arrow function without blockstatement that return a literal", () => {
        const input = `
          export default (props) => 'Hello World'
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function Component(props) {return 'Hello World';}

          export default brisaElement(Component);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent({foo}) {
            return () => 'Hello ' + foo.value;
          }

          export default brisaElement(MyComponent, ['foo']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent({foo, bar, baz}) {
            return () => 'Hello ' + foo.value + ' ' + bar.value + ' ' + baz.value;
          }

          export default brisaElement(MyComponent, ['foo', 'bar', 'baz']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent(props) {
            return () => 'Hello ' + props.foo.value + ' ' + props.bar.value + ' ' + props.baz.value;
          }

          export default brisaElement(MyComponent, ['foo', 'bar', 'baz']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function Component(props) {
            return () => 'Hello ' + props.foo.value + ' ' + props.bar.value + ' ' + props.baz.value;
          }

          export default brisaElement(Component, ['foo', 'bar', 'baz']);
        `);

        expect(output).toBe(expected);
      });

      it("should work with a component as an arrow function without blockstatement that return a string with a prop", () => {
        const input = `
          export default (props) => 'Hello World' + props.foo
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function Component(props) {return () => 'Hello World' + props.foo.value;}

          export default brisaElement(Component, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should not do any transformation with a console.log in an arrow function with blockstatement", () => {
        const input = `
          export default (props) => { console.log('Hello World') }
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function Component(props) {console.log('Hello World');}

          export default brisaElement(Component);
        `);

        expect(output).toBe(expected);
      });

      it("should return a reactive console.log because is consuming a prop from props identifier", () => {
        const input = `
          export default (props) => console.log('Hello World' + props.foo)
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function Component(props) {return () => console.log('Hello World' + props.foo.value);}

          export default brisaElement(Component, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should return a reactive console.log because is consuming a prop from destructuring", () => {
        const input = `
          export default ({ foo }) => console.log({ foo })
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function Component({foo}) {return () => console.log({foo: foo.value});}

          export default brisaElement(Component, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should work with a component as an arrow function with blockstatement and the default export on a different line", () => {
        const input = `
        const MyComponent = (props) => <div>{props.foo}</div>
        export default MyComponent
      `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
        import {brisaElement, _on, _off} from "brisa/client";

        function Component(props) {return ['div', {}, () => props.foo.value];}

        export default brisaElement(Component, ['foo']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
        import {brisaElement, _on, _off} from "brisa/client";

        function Component(props) {
          return ['div', {}, () => props.foo.value];
        }

        export default brisaElement(Component, ['foo']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected =
          toInline(`import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent() {
            return ['dialog', {open: _on}, ''];
          }

          export default brisaElement(MyComponent);`);

        expect(output).toBe(expected);
      });

      it("should work with attributes as boolean as <dialog open /> and props", () => {
        const input = `
        export default function MyComponent(props) {
          return <dialog open={props.open} />
        }
      `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected =
          toInline(`import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent(props) {
            return ['dialog', {open: () => props.open.value ? _on : _off}, ''];
          }

          export default brisaElement(MyComponent, ['open']);`);

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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected =
          toInline(`import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent({}, {state}) {
            const open = state(true);
            return ['dialog', {open: () => open.value ? _on : _off}, ''];
          }

          export default brisaElement(MyComponent);`);

        expect(output).toBe(expected);
      });

      it("should work with attributes as boolean as <dialog open /> and static variable", () => {
        const input = `
        export default function MyComponent() {
          const open = true;
          return <dialog open={open} />
        }
      `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected =
          toInline(`import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent() {
            const open = true;
            return ['dialog', {open: open ? _on : _off}, ''];
          }

          export default brisaElement(MyComponent);`);

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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent({foo}, {effect}) {
            effect(r => foo.value ??= 'bar');
            const someVar = 'test';
            return ['div', {}, () => foo.value];
          }

          export default brisaElement(MyComponent, ['foo']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function Component({foo}, {effect}) {
            effect(r => foo.value ??= 'bar');
            const someVar = 'test';
            return ['div', {}, () => foo.value];
          }

          export default brisaElement(Component, ['foo']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function Component({foo}, {effect}) {
            effect(r => foo.value ??= 'bar');
            const someVar = 'test';
            return ['div', {}, () => foo.value];
          }

          export default brisaElement(Component, ['foo']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function Component({foo: renamedFoo}, {effect}) {
            effect(r => renamedFoo.value ??= 'bar');
            const someVar = 'test';
            return ['div', {}, () => renamedFoo.value];
          }

          export default brisaElement(Component, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should add the h function when there are more webContext attributes", () => {
        const input = `
          export default function Component({ }, { effect, cleanup, state }: any) {
            const someState = state(0);
          
            effect(r => {
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected =
          toInline(`import {brisaElement, _on, _off} from "brisa/client";

          function Component({}, {effect, cleanup, state}) {
            const someState = state(0);
          
            effect(r => {
              console.log(someState.value);
            });
          
            return ['div', {}, () => someState.value];
          }

          export default brisaElement(Component);`);

        expect(output).toBe(expected);
      });

      it('should not transform a prop that starts with "on" as an event', () => {
        const input = `
          export default function Component({ onFoo }) {
            return <div onClick={onFoo}>foo</div>
          }
        `;
        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected =
          toInline(`import {brisaElement, _on, _off} from "brisa/client";

          function Component({onFoo}) {
            return ['div', {onClick: onFoo}, 'foo'];
          }

          export default brisaElement(Component, ['onFoo']);`);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props inside a derived with || operator", () => {
        const input = `
          export default function MyComponent({foo}, {derived}) {
            const bar = derived(() => foo || 'bar');
            return <div>{bar.value}</div>
          }
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent({foo}, {derived}) {
            const bar = derived(() => foo.value || 'bar');
            return ['div', {}, () => bar.value];
          }

          export default brisaElement(MyComponent, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props inside a derived with props identifier and || operator", () => {
        const input = `
          export default function MyComponent(props, {derived}) {
            const bar = derived(() => props.foo || 'bar');
            return <div>{bar.value}</div>
          }
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent(props, {derived}) {
            const bar = derived(() => props.foo.value || 'bar');
            return ['div', {}, () => bar.value];
          }

          export default brisaElement(MyComponent, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props inside a derived with ?? operator", () => {
        const input = `
          export default function MyComponent({foo}, {derived}) {
            const bar = derived(() => foo ?? 'bar');
            return <div>{bar.value}</div>
          }
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent({foo}, {derived}) {
            const bar = derived(() => foo.value ?? 'bar');
            return ['div', {}, () => bar.value];
          }

          export default brisaElement(MyComponent, ['foo']);
        `);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props inside derived with props identifier and ?? operator", () => {
        const input = `
          export default function MyComponent(props, {derived}) {
            const bar = derived(() => props.foo ?? 'bar');
            return <div>{bar.value}</div>
          }
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent(props, {derived}) {
            const bar = derived(() => props.foo.value ?? 'bar');
            return ['div', {}, () => bar.value];
          }

          export default brisaElement(MyComponent, ['foo']);
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
          clientBuildPlugin(input, "src/web-components/conditional-render.tsx")
            .code,
        );
        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function ConditionalRender({name, children}) {
            return ['h2', {}, [
              ['b', {}, [[null, {}, "Hello "], [null, {}, () => name.value]]], [null, {}, () => name.value === 'Barbara' ? ['b', {}, '!! 🥳'] : '🥴'], [null, {}, children]
            ]];
          }

          export default brisaElement(ConditionalRender, ['name']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );
        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export const props = ['foo', 'bar'];

          function MyComponent(props) {
            return ['div', {...props}, 'Example'];
          }

          export default brisaElement(MyComponent, ['foo', 'bar']);
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );
        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          export const props = ['bar'];

          function MyComponent({foo, ...props}) {
            return ['div', {...props}, 'Example'];
          }

          export default brisaElement(MyComponent, ['foo', 'bar']);
        `);

        expect(output).toBe(expected);
      });

      it("should be possible to use props as conditional render inside JSX", () => {
        const input = `
          export default function MyComponent({foo, bar}) {
            return <div>{foo && bar ? 'TRUE' : 'FALSE'}</div>
          }
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent({foo, bar}) {
            return ['div', {}, () => foo.value && bar.value ? 'TRUE' : 'FALSE'];
          }

          export default brisaElement(MyComponent, ['foo', 'bar']);`);

        expect(output).toBe(expected);
      });

      it("should be possible to use props as conditional variables", () => {
        const input = `
          export default function MyComponent({foo, bar}, {derived}) {
            const baz = derived(() => foo && bar);
            return <div>{baz.value ? 'TRUE' : 'FALSE'}</div>
          }
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent({foo, bar}, {derived}) {
            const baz = derived(() => foo.value && bar.value);
            return ['div', {}, () => baz.value ? 'TRUE' : 'FALSE'];
          }

          export default brisaElement(MyComponent, ['foo', 'bar']);`);

        expect(output).toBe(expected);
      });

      it('should return the "key" attribute in list items when there is a "key" prop', () => {
        const input = `
          export default function MyComponent({ items }) {
            return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>
          }
        `;
        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );
        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent({items}) {
            return ['ul', {}, () => items.value.map(item => ['li', {key: item.id}, item.name])];
          }

          export default brisaElement(MyComponent, ['items']);`);

        expect(output).toBe(expected);
      });

      it("should wrap conditional renders in different returns inside a function", () => {
        const input = `
          export default function MyComponent({ show }) {
          if (show) return <div>foo</div>
          const bar = <b>bar</b>
          return <span>bar</span>
        }
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
        import {brisaElement, _on, _off} from "brisa/client";

        function MyComponent({show}) {
          return [null, {}, () => {
            if (show.value) return ['div', {}, 'foo'];
            const bar = ['b', {}, 'bar'];
            return ['span', {}, 'bar'];
          }];
        }

        export default brisaElement(MyComponent, ['show']);
        `);

        expect(output).toBe(expected);
      });

      it("should wrap conditional renders using switch-case and different returns inside a function", () => {
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
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
        import {brisaElement, _on, _off} from "brisa/client";

        function MyComponent({show}) {
          return [null, {}, () => {
            switch (show.value) {
              case true:return ['div', {}, 'foo'];
              case false:return ['b', {}, 'bar'];
              default:return ['span', {}, 'bar'];
            }
          }];
        }

        export default brisaElement(MyComponent, ['show']);
        `);

        expect(output).toBe(expected);
      });

      it("should be possible to set default props from ...rest inside code", () => {
        const input = `
          export default function MyComponent({ foo, ...rest }, {derived}) {
            const user = derived(() => rest.user ?? { name: 'No user'});
            return <div>{user.value.name}</div>
          }
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );

        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent({foo, ...rest}, {derived}) {
            const user = derived(() => rest.user.value ?? ({name: 'No user'}));
            return ['div', {}, () => user.value.name];
          }

          export default brisaElement(MyComponent, ['foo', 'user']);
        `);

        expect(output).toBe(expected);
      });

      it("should log a warning when using spread props inside JSX that can lost the reactivity", () => {
        const { LOG_PREFIX } = getConstants();
        const mockLog = spyOn(console, "log");

        mockLog.mockImplementation(() => {});

        const input = `
          export default function MyComponent(props) {
            return <div {...props}>Example</div>
          }
        `;

        const output = toInline(
          clientBuildPlugin(input, "src/web-components/my-component.tsx").code,
        );
        const expected = toInline(`
          import {brisaElement, _on, _off} from "brisa/client";

          function MyComponent(props) {
            return ['div', {...props}, 'Example'];
          }

          export default brisaElement(MyComponent);
        `);
        const logs = mockLog.mock.calls.slice(0);
        mockLog.mockRestore();
        expect(output).toBe(expected);
        expect(logs[0]).toEqual([LOG_PREFIX.WARN, `Ops! Warning:`]);
        expect(logs[1]).toEqual([
          LOG_PREFIX.WARN,
          `--------------------------`,
        ]);
        expect(logs[2]).toEqual([
          LOG_PREFIX.WARN,
          boldLog(`You can't use spread props inside web-components JSX.`),
        ]);
        expect(logs[3]).toEqual([
          LOG_PREFIX.WARN,
          `This can cause the lost of reactivity.`,
        ]);
        expect(logs[4]).toEqual([
          LOG_PREFIX.WARN,
          `File: src/web-components/my-component.tsx`,
        ]);
        expect(logs[5]).toEqual([
          LOG_PREFIX.WARN,
          `--------------------------`,
        ]);
        expect(logs[6]).toEqual([
          LOG_PREFIX.WARN,
          `Docs: https://brisa.build/building-your-application/components-details/web-components`,
        ]);
      });
    });
  });
});
