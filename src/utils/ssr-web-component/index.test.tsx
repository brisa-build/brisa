import { describe, expect, it } from "bun:test";
import SSRWebComponent from ".";
import { WebContext } from "../../types";

describe('utils', () => {
  describe('SSRWebComponent', () => {
    it('should render a web component', () => {
      const Component = () => <div>hello world</div>
      const selector = 'my-component'
      const output = SSRWebComponent({ Component, selector }) as any;

      expect(output.type).toBe(selector)
      expect(output.props.children.type).toBe('template')
      expect(output.props.children.props.shadowrootmode).toBe('open')
      expect(output.props.children.props.children[0].type).toBe('div')
      expect(output.props.children.props.children[0].props.children).toBe('hello world')
    });

    it('should render a web component with props', () => {
      const Component = ({ name }: { name: string }) => <div>hello {name}</div>
      const selector = 'my-component'
      const output = SSRWebComponent({ Component, selector, name: 'world' }) as any;

      expect(output.type).toBe(selector)
      expect(output.props.children.type).toBe('template')
      expect(output.props.children.props.shadowrootmode).toBe('open')
      expect(output.props.children.props.children[0].type).toBe('div')
      expect(output.props.children.props.children[0].props.children.join('')).toBe('hello world')
    });

    it('should render a web component with css template literal', () => {
      const Component = ({ }, { css }: WebContext) => {
        css`div { color: red; }`;

        return <div>hello world</div>
      }
      const selector = 'my-component'
      const output = SSRWebComponent({ Component, selector }) as any;

      expect(output.type).toBe(selector)
      expect(output.props.children.type).toBe('template')
      expect(output.props.children.props.shadowrootmode).toBe('open')
      expect(output.props.children.props.children[0].type).toBe('div')
      expect(output.props.children.props.children[0].props.children).toBe('hello world')
      expect(output.props.children.props.children[1].type).toBe('style')
      expect(output.props.children.props.children[1].props.children).toBe('div { color: red; }')
    });

    it('should render a web component with a initial state', () => {
      const Component = ({ }, { state }: WebContext) => {
        const foo = state({ name: 'world' });

        return <div>hello {foo.value.name}</div>
      }
      const selector = 'my-component'
      const output = SSRWebComponent({ Component, selector }) as any;

      expect(output.type).toBe(selector)
      expect(output.props.children.type).toBe('template')
      expect(output.props.children.props.shadowrootmode).toBe('open')
      expect(output.props.children.props.children[0].type).toBe('div')
      expect(output.props.children.props.children[0].props.children.join('')).toBe('hello world')
    })

    it('should render a web component with a derived state', () => {
      const Component = ({ }, { state, derived }: WebContext) => {
        const foo = state({ name: 'wor' });
        const bar = derived(() => foo.value.name + 'ld');

        return <div>hello {bar.value}</div>
      }
      const selector = 'my-component'
      const output = SSRWebComponent({ Component, selector }) as any;

      expect(output.type).toBe(selector)
      expect(output.props.children.type).toBe('template')
      expect(output.props.children.props.shadowrootmode).toBe('open')
      expect(output.props.children.props.children[0].type).toBe('div')
      expect(output.props.children.props.children[0].props.children.join('')).toBe('hello world')
    });

    it('should render a web component with a effect', () => {
      const Component = ({ }, { effect }: WebContext) => {
        effect(() => { document.title = 'hello world' });

        return <div>hello world</div>
      }
      const selector = 'my-component'
      const output = SSRWebComponent({ Component, selector }) as any;

      expect(output.type).toBe(selector)
      expect(output.props.children.type).toBe('template')
      expect(output.props.children.props.shadowrootmode).toBe('open')
      expect(output.props.children.props.children[0].type).toBe('div')
      expect(output.props.children.props.children[0].props.children).toBe('hello world')
    });

    it('should render a web component with a cleanup', () => {
      const Component = ({ }, { cleanup }: WebContext) => {
        cleanup(() => { document.title = 'hello world' });

        return <div>hello world</div>
      }
      const selector = 'my-component'
      const output = SSRWebComponent({ Component, selector }) as any;

      expect(output.type).toBe(selector)
      expect(output.props.children.type).toBe('template')
      expect(output.props.children.props.shadowrootmode).toBe('open')
      expect(output.props.children.props.children[0].type).toBe('div')
      expect(output.props.children.props.children[0].props.children).toBe('hello world')
    });

    it('should render a web component with a onMount', () => {
      const Component = ({ }, { onMount }: WebContext) => {
        onMount(() => { document.title = 'hello world' });

        return <div>hello world</div>
      }
      const selector = 'my-component'
      const output = SSRWebComponent({ Component, selector }) as any;

      expect(output.type).toBe(selector)
      expect(output.props.children.type).toBe('template')
      expect(output.props.children.props.shadowrootmode).toBe('open')
      expect(output.props.children.props.children[0].type).toBe('div')
      expect(output.props.children.props.children[0].props.children).toBe('hello world')
    });
  });
});
