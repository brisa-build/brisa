import { describe, expect, it } from 'bun:test';
import compileWC from '.';
import { normalizeHTML } from '@/helpers';

/**
 * This test is necessary only to know that it has been integrated correctly, but all tests on
 * the transpilation are inside `client-build-plugin`.
 */
describe('utils/compile-wc', () => {
  it('should transpile the code of a web component to be used in the browser', () => {
    const code = `export default function MyComponent() { return <div>Hello World</div>; }`;
    const result = compileWC(code);
    expect(normalizeHTML(result)).toBe(
      normalizeHTML(`
					import {brisaElement, _on, _off} from "brisa/client";
					
					function MyComponent() {
							return ["div", {}, "Hello World"];
					}
							
					export default brisaElement(MyComponent);
        `),
    );
  });
});
