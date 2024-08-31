import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import path from 'node:path';

import { getConstants } from '@/constants';
import renderToReadableStream from '@/utils/render-to-readable-stream';
import extendRequestContext from '@/utils/extend-request-context';
import processPageRoute from '.';
import { toInline } from '@/helpers';
import translateCore from '@/utils/translate-core';
import type { MatchedBrisaRoute, RequestContext } from '@/types';

const FIXTURES = path.join(import.meta.dir, '..', '..', '__fixtures__');
const HOMEPAGE = path.join(FIXTURES, 'pages', 'index.tsx');
const I18N = path.join(FIXTURES, 'i18n.ts');
const i18nConfig = (await import.meta.require(I18N)).default;

const request = extendRequestContext({
  originalRequest: new Request('http://localhost:3000'),
  i18n: {
    locale: 'en',
    defaultLocale: i18nConfig.defaultLocale,
    locales: i18nConfig.locales,
    pages: i18nConfig.pages ?? {},
    t: translateCore('en', i18nConfig),
  } as unknown as RequestContext['i18n'],
});

const testOptions = {
  request,
};

const routeHomepage = { filePath: HOMEPAGE } as unknown as MatchedBrisaRoute;

describe('utils', () => {
  beforeEach(() => {
    globalThis.mockConstants = getConstants() ?? {};
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  describe('processPageRoute', () => {
    it('should return a page with the layout in production', async () => {
      globalThis.mockConstants = {
        ...(getConstants() ?? {}),
        IS_PRODUCTION: true,
        IS_DEVELOPMENT: false,
      };

      const { Page } = await processPageRoute(routeHomepage);

      // Rendered html
      const stream = renderToReadableStream(Page(), testOptions);
      const result = await Bun.readableStreamToText(stream);

      expect(result).toBe(
        toInline(`
          <!DOCTYPE html>
            <html lang="en" dir="ltr">
              <head>
                <meta charset="UTF-8"></meta>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
                <meta name="theme-color" content="#317EFB"></meta>
                <title>Brisa</title>
              </head>
              <body>
                <div id="S:1"><div>Loading...</div></div>
              </body>
            </html>
            <template id="U:1"><div data-action>Hello world!</div></template><script id="R:1">u$('1')</script>
          `),
      );
    });

    it('should return the page with hotreload connection in development', async () => {
      const { Page } = await processPageRoute(routeHomepage);
      const stream = renderToReadableStream(Page(), testOptions);
      const result = await Bun.readableStreamToText(stream);

      expect(result).toContain(
        'new WebSocket("ws://localhost:3000/__brisa_live_reload__")',
      );
    });
  });
});
