import { describe, expect, it } from 'bun:test';
import adaptClientToPageTranslations from '@/utils/adapt-client-to-page-translations';

describe('utils', () => {
  describe('adaptClientToPageTranslations', () => {
    it('should match a route', () => {
      const pages = {
        '/about': {
          en: '/about',
          pt: '/sobre',
        },
        '/contact': {
          en: '/contact',
          pt: '/contato',
        },
        '/user/[id]': {
          en: '/user/[id]',
          pt: '/usuario/[id]',
        },
      };
      expect(adaptClientToPageTranslations(pages, '/about', 'pt')).toBe(
        '/sobre',
      );
      expect(adaptClientToPageTranslations(pages, '/sobre', 'en')).toBe(
        '/about',
      );
      expect(adaptClientToPageTranslations(pages, '/contact', 'pt')).toBe(
        '/contato',
      );
      expect(adaptClientToPageTranslations(pages, '/contato', 'en')).toBe(
        '/contact',
      );
      expect(adaptClientToPageTranslations(pages, '/user/john', 'pt')).toBe(
        '/usuario/john',
      );
      expect(adaptClientToPageTranslations(pages, '/usuario/john', 'en')).toBe(
        '/user/john',
      );
    });

    it('should match a nested dynamic route', () => {
      const lang = 'pt';
      const pages = {
        '/user/[id]/[name]': {
          en: '/user/[id]/[name]',
          pt: '/usuario/[id]/[name]',
        },
      };

      expect(adaptClientToPageTranslations(pages, '/user/john/doe', lang)).toBe(
        '/usuario/john/doe',
      );
    });

    it('should return undefined if no route was matched', () => {
      const pages = {
        '/about': {
          en: '/about',
          pt: '/sobre',
        },
        '/contact': {
          en: '/contact',
          pt: '/contato',
        },
        '/user/[id]': {
          en: '/user/[id]',
          pt: '/usuario/[id]',
        },
      };
      expect(
        adaptClientToPageTranslations(pages, '/not-found', 'pt'),
      ).toBeUndefined();
    });

    it('should work with [...rest]', () => {
      const pages = {
        '/user/[...rest]': {
          en: '/user/[...rest]',
          pt: '/usuario/[...rest]',
        },
      };
      expect(adaptClientToPageTranslations(pages, '/user/john/doe', 'pt')).toBe(
        '/usuario/john/doe',
      );
      expect(
        adaptClientToPageTranslations(pages, '/usuario/john/doe', 'en'),
      ).toBe('/user/john/doe');
    });

    it('should work with [[...catchAll]]', () => {
      const pages = {
        '/user/[[...catchAll]]': {
          en: '/user/[[...catchAll]]',
          pt: '/usuario/[[...catchAll]]',
        },
      };
      expect(adaptClientToPageTranslations(pages, '/user/john/doe', 'pt')).toBe(
        '/usuario/john/doe',
      );
      expect(
        adaptClientToPageTranslations(pages, '/usuario/john/doe', 'en'),
      ).toBe('/user/john/doe');
    });

    it('shoukd work with a mix of dynamic routes and [...rest]', () => {
      const pages = {
        '/user/[id]/[...rest]': {
          en: '/user/[id]/[...rest]',
          pt: '/usuario/[id]/[...rest]',
        },
      };
      expect(adaptClientToPageTranslations(pages, '/user/john/doe', 'pt')).toBe(
        '/usuario/john/doe',
      );
      expect(
        adaptClientToPageTranslations(pages, '/usuario/john/doe', 'en'),
      ).toBe('/user/john/doe');
    });

    it('should work with a mix of dynamic routes + static text + [...rest]', () => {
      const pages = {
        '/user/[id]/foo/bar/baz/[...rest]': {
          pt: '/usuario/[id]/foop/barp/bazp/[...rest]',
        },
      };
      expect(
        adaptClientToPageTranslations(
          pages,
          '/user/john/foo/bar/baz/doe',
          'pt',
        ),
      ).toBe('/usuario/john/foop/barp/bazp/doe');
      expect(
        adaptClientToPageTranslations(
          pages,
          '/usuario/john/foop/barp/bazp/doe',
          'en',
        ),
      ).toBe('/user/john/foo/bar/baz/doe');
    });

    it('should work with a mix of dynamic routes and [[...catchAll]]', () => {
      const pages = {
        '/user/[id]/[[...catchAll]]': {
          en: '/user/[id]/[[...catchAll]]',
          pt: '/usuario/[id]/[[...catchAll]]',
        },
      };
      expect(adaptClientToPageTranslations(pages, '/user/john/doe', 'pt')).toBe(
        '/usuario/john/doe',
      );
      expect(
        adaptClientToPageTranslations(pages, '/usuario/john/doe', 'en'),
      ).toBe('/user/john/doe');
    });

    it('should work with a mix of dynamic routes + static text + [[...catchAll]]', () => {
      const pages = {
        '/user/[id]/foo/bar/baz/[[...catchAll]]': {
          pt: '/usuario/[id]/foop/barp/bazp/[[...catchAll]]',
        },
      };
      expect(
        adaptClientToPageTranslations(
          pages,
          '/user/john/foo/bar/baz/doe',
          'pt',
        ),
      ).toBe('/usuario/john/foop/barp/bazp/doe');
      expect(
        adaptClientToPageTranslations(
          pages,
          '/usuario/john/foop/barp/bazp/doe',
          'en',
        ),
      ).toBe('/user/john/foo/bar/baz/doe');
    });

    it('should work with a mix of MULTI dynamic routes + static text + [[...catchAll]]', () => {
      const pages = {
        '/user/[id]/foo/[bar]/baz/[[...catchAll]]': {
          pt: '/usuario/[id]/foop/[bar]/bazp/[[...catchAll]]',
        },
      };
      expect(
        adaptClientToPageTranslations(
          pages,
          '/user/john/foo/test/baz/doe',
          'pt',
        ),
      ).toBe('/usuario/john/foop/test/bazp/doe');
      expect(
        adaptClientToPageTranslations(
          pages,
          '/usuario/john/foop/test/bazp/doe',
          'en',
        ),
      ).toBe('/user/john/foo/test/baz/doe');
    });
  });
});
