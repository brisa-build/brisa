import type { i18nPages } from '@/types';
import transferTranslatedPagePaths from '@/utils/transfer-translated-page-paths';
import { expect, it, describe } from 'bun:test';

describe('transferTranslatedPagePaths', () => {
  it('should return an undefined when pages is undefined', () => {
    const pages = undefined;

    const result = transferTranslatedPagePaths(pages);

    expect(result).toBeUndefined();
  });
  it('should return an undefined when pages.config.transferToClient is false', () => {
    const pages = {
      config: {
        transferToClient: false,
      },
      '/about-us': {
        en: '/about-us/',
        es: '/sobre-nosotros/',
      },
      '/user/[username]': {
        en: '/user/[username]',
        es: '/usuario/[username]',
      },
      '/somepage': {
        en: '/somepage',
        es: '/alguna-pagina',
      },
    } satisfies i18nPages;

    const result = transferTranslatedPagePaths(pages);

    expect(result).toBeUndefined();
  });

  it('should return an undefined when pages.config.transferToClient is false', () => {
    const pages = {
      config: {
        transferToClient: false,
      },
      '/about-us': {
        en: '/about-us/',
        es: '/sobre-nosotros/',
      },
      '/user/[username]': {
        en: '/user/[username]',
        es: '/usuario/[username]',
      },
      '/somepage': {
        en: '/somepage',
        es: '/alguna-pagina',
      },
    } satisfies i18nPages;

    const result = transferTranslatedPagePaths(pages);

    expect(result).toBeUndefined();
  });

  it('should return undefined when pages.config.transferToClient is an empty array', () => {
    const pages = {
      config: {
        transferToClient: [],
      },
      '/about-us': {
        en: '/about-us/',
        es: '/sobre-nosotros/',
      },
      '/user/[username]': {
        en: '/user/[username]',
        es: '/usuario/[username]',
      },
      '/somepage': {
        en: '/somepage',
        es: '/alguna-pagina',
      },
    } satisfies i18nPages;

    const result = transferTranslatedPagePaths(pages);

    expect(result).toBeUndefined();
  });

  it('should return pages if pages.config.transferToClient is true', () => {
    const pages = {
      config: {
        transferToClient: true,
      },
      '/about-us': {
        en: '/about-us/',
        es: '/sobre-nosotros/',
      },
      '/user/[username]': {
        en: '/user/[username]',
        es: '/usuario/[username]',
      },
      '/somepage': {
        en: '/somepage',
        es: '/alguna-pagina',
      },
    } satisfies i18nPages;

    const result = transferTranslatedPagePaths(pages);

    expect(result).toEqual({
      '/about-us': {
        en: '/about-us/',
        es: '/sobre-nosotros/',
      },
      '/user/[username]': {
        en: '/user/[username]',
        es: '/usuario/[username]',
      },
      '/somepage': {
        en: '/somepage',
        es: '/alguna-pagina',
      },
    });
  });

  it('should return the translated pages without the config.transferToClient inside', () => {
    const pages = {
      config: {
        transferToClient: ['/user/[username]', '/somepage'],
      },
      '/about-us': {
        en: '/about-us/',
        es: '/sobre-nosotros/',
      },
      '/user/[username]': {
        en: '/user/[username]',
        es: '/usuario/[username]',
      },
      '/somepage': {
        en: '/somepage',
        es: '/alguna-pagina',
      },
    } satisfies i18nPages;

    const result = transferTranslatedPagePaths(pages);

    expect(result).toEqual({
      '/user/[username]': {
        en: '/user/[username]',
        es: '/usuario/[username]',
      },
      '/somepage': {
        en: '/somepage',
        es: '/alguna-pagina',
      },
    });
  });
});
