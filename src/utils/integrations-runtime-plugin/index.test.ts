import { describe, it, expect } from "bun:test";
import { convertPathsToAbsolute } from ".";
import { normalizeQuotes } from "@/helpers";

describe("utils", () => {
  describe("integrationsRuntimePlugin > convertPathsToAbsolute", () => {
    it("should not convert anything if there is no default export", () => {
      const code = `
        export const foo = 'bar';
      `;
      const output = normalizeQuotes(convertPathsToAbsolute(code));
      const expected = normalizeQuotes(code);

      expect(output).toEqual(expected);
    });

    it("should convert paths to absolute", () => {
      const code = `
        export default {
          'foo-component': '@/lib/foo',
        }
      `;
      const output = normalizeQuotes(convertPathsToAbsolute(code));
      const expected = normalizeQuotes(`
        export default Object.fromEntries(Object.entries({
          'foo-component': '@/lib/foo'
        }).map(([key, value]) => [key, import.meta.resolveSync(value)]));
      `);

      expect(output).toEqual(expected);
    });

    it("should work with separate export default and spread", () => {
      const code = `
        import { foo } from 'bar';

        const integrations = {
          'foo-component': '@/lib/foo',
          ...foo
        }

        export default integrations;
      `;

      const output = normalizeQuotes(convertPathsToAbsolute(code));
      const expected = normalizeQuotes(`
        import {foo} from 'bar';

        const integrations = {
          'foo-component': '@/lib/foo',
          ...foo
        };

        export default Object.fromEntries(
          Object.entries(integrations)
            .map(([key, value]) => [key, import.meta.resolveSync(value)])
        );
      `);

      expect(output).toEqual(expected);
    });
  });
});
