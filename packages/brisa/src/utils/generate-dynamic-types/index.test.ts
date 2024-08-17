import { describe, expect, it } from 'bun:test';
import { normalizeQuotes } from '@/helpers';
import generateDynamicTypes from '@/utils/generate-dynamic-types';

describe('utils', () => {
  describe('generateDynamicTypes', () => {
    it('should generate the correct types', () => {
      const allWebComponents = {
        'my-component': 'src/components/my-component.tsx',
        'my-other-component': 'src/components/my-other-component.tsx',
      };

      const pagesRoutes = {
        routes: {
          '/': {},
          '/about': {},
          '/blog/[slug]': {},
        },
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

    it('should NOT generate PageRoute with no routes', () => {
      const allWebComponents = {
        'my-component': 'src/components/my-component.tsx',
        'my-other-component': 'src/components/my-other-component.tsx',
      };

      const pagesRoutes = {
        routes: {},
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
        routes: {
          '/': {},
          '/about': {},
          '/blog/[slug]': {},
          '/blog/[slug]/[id]': {},
          '/blog/[...slug]': {},
          '/optional/[[...slug]]': {},
        },
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
        routes: {
          '/': {},
          '/about': {},
          '/blog/[slug]': {},
          '/blog/[slug]/[id]': {},
          '/blog/[...slug]': {},
          '/optional/[[...slug]]': {},
          '/_404': {},
          '/_500': {},
        },
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
  });
});
