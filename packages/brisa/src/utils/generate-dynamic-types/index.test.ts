import { describe, expect, it, afterEach } from 'bun:test';
import { normalizeQuotes } from '@/helpers';
import generateDynamicTypes from '@/utils/generate-dynamic-types';
import { getConstants } from '@/constants';

describe('utils', () => {
  describe('generateDynamicTypes', () => {
    afterEach(() => {
      globalThis.mockConstants = undefined;
    });
    it('should generate the correct types', () => {
      const allWebComponents = {
        'my-component': 'src/components/my-component.tsx',
        'my-other-component': 'src/components/my-other-component.tsx',
      };

      const pagesRoutes = {
        routes: [
          ['/', {}],
          ['/about', {}],
          ['/blog/[slug]', {}],
        ],
      } as any;

      const result = generateDynamicTypes({ allWebComponents, pagesRoutes });

      expect(normalizeQuotes(result)).toBe(
        normalizeQuotes(`export interface IntrinsicCustomElements {
        'my-component': JSX.WebComponentAttributes<typeof import("src/components/my-component.tsx").default>;
        'my-other-component': JSX.WebComponentAttributes<typeof import("src/components/my-other-component.tsx").default>;
      }
      
      export type PageRoute = "/" | "/about" | "/blog/abc-123";`),
      );
    });

    it('should use the "type" field when the location is JSON stringified', () => {
      const allWebComponents = {
        'my-component':
          '{"client":"src/components/my-component.tsx", "types":"src/types/my-component.ts"}',
        'my-other-component':
          '{"client":"src/components/other-component.tsx", "types":"src/types/other-component.ts"}',
      };

      const pagesRoutes = {
        routes: [
          ['/', {}],
          ['/about', {}],
          ['/blog/[slug]', {}],
        ],
      } as any;

      const result = generateDynamicTypes({ allWebComponents, pagesRoutes });

      expect(normalizeQuotes(result)).toBe(
        normalizeQuotes(`export interface IntrinsicCustomElements {
        'my-component': JSX.WebComponentAttributes<typeof import("src/types/my-component.ts").default>;
        'my-other-component': JSX.WebComponentAttributes<typeof import("src/types/other-component.ts").default>;
      }
      
      export type PageRoute = "/" | "/about" | "/blog/abc-123";`),
      );
    });

    it('should return "any" when the location is JSON stringified and not have the "types" field', () => {
      const allWebComponents = {
        'my-component': '{"client":"src/components/my-component.tsx"}',
        'my-other-component': '{"client":"src/components/other-component.tsx"}',
      };

      const pagesRoutes = {
        routes: [
          ['/', {}],
          ['/about', {}],
          ['/blog/[slug]', {}],
        ],
      } as any;

      const result = generateDynamicTypes({ allWebComponents, pagesRoutes });

      expect(normalizeQuotes(result)).toBe(
        normalizeQuotes(`export interface IntrinsicCustomElements {
        'my-component': any;
        'my-other-component': any;
      }
      
      export type PageRoute = "/" | "/about" | "/blog/abc-123";`),
      );
    });

    it('should NOT generate PageRoute with no routes', () => {
      const allWebComponents = {
        'my-component': 'src/components/my-component.tsx',
        'my-other-component': 'src/components/my-other-component.tsx',
      };

      const pagesRoutes = {
        routes: [],
      } as any;

      const result = generateDynamicTypes({ allWebComponents, pagesRoutes });

      expect(normalizeQuotes(result)).toBe(
        normalizeQuotes(`export interface IntrinsicCustomElements {
        'my-component': JSX.WebComponentAttributes<typeof import("src/components/my-component.tsx").default>;
        'my-other-component': JSX.WebComponentAttributes<typeof import("src/components/my-other-component.tsx").default>;
      }
      `),
      );
    });

    it('should generate routes with abc-123 slug for nested dynamic routes, catch-all and optional catch all', () => {
      const allWebComponents = {
        'my-component': 'src/components/my-component.tsx',
        'my-other-component': 'src/components/my-other-component.tsx',
      };

      const pagesRoutes = {
        routes: [
          ['/', {}],
          ['/about', {}],
          ['/blog/[slug]', {}],
          ['/blog/[slug]/[id]', {}],
          ['/blog/[...slug]', {}],
          ['/optional/[[...slug]]', {}],
        ],
      } as any;

      const result = generateDynamicTypes({ allWebComponents, pagesRoutes });

      expect(normalizeQuotes(result)).toBe(
        normalizeQuotes(`export interface IntrinsicCustomElements {
        'my-component': JSX.WebComponentAttributes<typeof import("src/components/my-component.tsx").default>;
        'my-other-component': JSX.WebComponentAttributes<typeof import("src/components/my-other-component.tsx").default>;
      }
      
      export type PageRoute = "/" | "/about" | "/blog/abc-123" | "/blog/abc-123/abc-123" | "/blog/abc-123" | "/optional/abc-123";`),
      );
    });

    it('should not add _404 and _500 pages to PageRoute', () => {
      const allWebComponents = {
        'my-component': 'src/components/my-component.tsx',
        'my-other-component': 'src/components/my-other-component.tsx',
      };

      const pagesRoutes = {
        routes: [
          ['/', {}],
          ['/about', {}],
          ['/blog/[slug]', {}],
          ['/blog/[slug]/[id]', {}],
          ['/blog/[...slug]', {}],
          ['/optional/[[...slug]]', {}],
          ['/_404', {}],
          ['/_500', {}],
        ],
      } as any;

      const result = generateDynamicTypes({ allWebComponents, pagesRoutes });

      expect(normalizeQuotes(result)).toBe(
        normalizeQuotes(`export interface IntrinsicCustomElements {
        'my-component': JSX.WebComponentAttributes<typeof import("src/components/my-component.tsx").default>;
        'my-other-component': JSX.WebComponentAttributes<typeof import("src/components/my-other-component.tsx").default>;
      }
      
      export type PageRoute = "/" | "/about" | "/blog/abc-123" | "/blog/abc-123/abc-123" | "/blog/abc-123" | "/optional/abc-123";`),
      );
    });

    it('should generate routes with trailing slash when it is present in the config', () => {
      globalThis.mockConstants = {
        ...getConstants(),
        CONFIG: {
          trailingSlash: true,
        },
      };

      const allWebComponents = {
        'my-component': 'src/components/my-component.tsx',
        'my-other-component': 'src/components/my-other-component.tsx',
      };

      const pagesRoutes = {
        routes: [
          ['/', {}],
          ['/about/', {}],
          ['/blog/[slug]', {}],
          ['/blog/[slug]/[id]', {}],
          ['/blog/[...slug]', {}],
          ['/optional/[[...slug]]', {}],
        ],
      } as any;

      const result = generateDynamicTypes({ allWebComponents, pagesRoutes });

      expect(normalizeQuotes(result)).toBe(
        normalizeQuotes(`export interface IntrinsicCustomElements {
          'my-component': JSX.WebComponentAttributes<typeof import("src/components/my-component.tsx").default>;
          'my-other-component': JSX.WebComponentAttributes<typeof import("src/components/my-other-component.tsx").default>;
        }
      
       export type PageRoute = "/" | "/about/" | "/blog/abc-123/" | "/blog/abc-123/abc-123/" | "/blog/abc-123/" | "/optional/abc-123/";`),
      );
    });
  });
});
