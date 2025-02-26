import { afterEach, describe, it, expect, mock } from 'bun:test';
import substituteI18nRouteValues from '.';
import constants from '@/constants';

describe('utils', () => {
  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  describe('substituteI18nRouteValues', () => {
    it('should translate the pathname', () => {
      mock.module('@/constants', () => ({
        default: () => ({
          ...constants,
          I18N_CONFIG: {
            locales: ['es', 'en'],
            defaultLocale: 'es',
            pages: {
              '/example/[id]': {
                es: '/ejemplo/[id]',
              },
            },
          },
        }),
      }));

      const output = substituteI18nRouteValues(
        '/example/[id]',
        '/ejemplo/some-id',
      );

      expect(output).toBe('/example/some-id');
    });

    it('should work with dynamic routes and catchAll routes', () => {
      mock.module('@/constants', () => ({
        default: () => ({
          ...constants,
          I18N_CONFIG: {
            locales: ['es', 'en'],
            defaultLocale: 'es',
            pages: {
              '/example/[id]/settings/[[...catchAll]]': {
                es: '/ejemplo/[id]/configuracion/[[...catchAll]]',
              },
            },
          },
        }),
      }));

      const output = substituteI18nRouteValues(
        '/example/[id]/settings/[[...catchAll]]',
        '/ejemplo/1/configuracion/2/3',
      );

      expect(output).toBe('/example/1/settings/2/3');
    });

    it('should work with params and hash routes', () => {
      mock.module('@/constants', () => ({
        default: () => ({
          ...constants,
          I18N_CONFIG: {
            locales: ['es', 'en'],
            defaultLocale: 'es',
            pages: {
              '/example': {
                es: '/ejemplo',
              },
            },
          },
        }),
      }));

      const output = substituteI18nRouteValues(
        '/example',
        '/ejemplo?foo=bar#baz',
      );

      expect(output).toBe('/example?foo=bar#baz');
    });
  });
});
