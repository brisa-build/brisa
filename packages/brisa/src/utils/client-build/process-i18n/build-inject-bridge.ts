// Standalone build script spawned from inject-bridge.ts macro
// This avoids calling Bun.build inside a macro (deadlock in Bun >= 1.2)
import { join, resolve } from 'node:path';

const usei18nKeysLogic = process.argv[2] === 'true';
const useFormatter = process.argv[3] === 'true';

const translateCoreFile = resolve(
  import.meta.dirname,
  join('..', '..', 'translate-core', 'index.ts'),
);

function i18nKeysLogic(useFormatter: boolean) {
  const formatters = useFormatter
    ? `interpolation: {...i18nConfig.interpolation, format:__FORMATTER__},`
    : '';

  return `
    get t() {
      return translateCore(this.locale, { ...i18nConfig, messages: this.messages, ${formatters} });
    },
    get messages() { return {[this.locale]: window.i18nMessages } },
    overrideMessages(callback) {
      const p = callback(window.i18nMessages);
      const a = m => Object.assign(window.i18nMessages, m);
      return p.then?.(a) ?? a(p);
    }
   `;
}

const { success, outputs } = await Bun.build({
  throw: false,
  entrypoints: [translateCoreFile],
  target: 'browser',
  root: import.meta.dirname,
  minify: true,
  format: 'iife',
  plugins: [
    {
      name: 'i18n-bridge',
      setup(build) {
        const filter = /.*/;

        build.onLoad({ filter }, async ({ path, loader }) => {
          const contents = `
              ${
                usei18nKeysLogic
                  ? await Bun.readableStreamToText(Bun.file(path).stream())
                  : ''
              }

              const i18nConfig = __CONFIG__;

              window.i18n = {
                ...i18nConfig,
                get locale(){ return document.documentElement.lang },
                ${usei18nKeysLogic ? i18nKeysLogic(useFormatter) : ''}
              }
            `;

          return { contents, loader };
        });
      },
    },
  ],
});

if (success && outputs?.[0]) {
  process.stdout.write(await outputs[0].text());
}
