import { logBuildError } from '@/utils/log/log-build';
import { join, resolve } from 'node:path';

type I18nBridgeConfig = {
  usei18nKeysLogic?: boolean;
  useFormatter?: boolean;
};

const translateCoreFile = resolve(
  import.meta.dirname,
  join('..', '..', 'translate-core', 'index.ts'),
);

export async function build(
  { usei18nKeysLogic = false, useFormatter = false }: I18nBridgeConfig = {
    usei18nKeysLogic: false,
    useFormatter: false,
  },
) {
  const { success, logs, outputs } = await Bun.build({
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
                  ? // TODO: use (path).text() when Bun fix this issue:
                    // https://github.com/oven-sh/bun/issues/7611
                    await Bun.readableStreamToText(Bun.file(path).stream())
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

  if (!success) {
    logBuildError('Failed to integrate i18n core', logs);
  }

  return (await outputs?.[0]?.text?.()) ?? '';
}

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
