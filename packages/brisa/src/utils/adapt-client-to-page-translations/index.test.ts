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

    it('should return null if no route was matched', () => {
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
      ).toBeNull();
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
  });
});
