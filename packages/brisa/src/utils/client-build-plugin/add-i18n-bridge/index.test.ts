import AST from '@/utils/ast';
import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import addI18nBridge from '.';
import { normalizeQuotes } from '@/helpers';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import type { I18nConfig } from '@/types';

const I18N_CONFIG = {
  defaultLocale: 'en',
  locales: ['en', 'pt'],
  messages: {
    en: {
      hello: 'Hello {{name}}',
    },
    pt: {
      hello: 'Olá {{name}}',
    },
  },
  pages: {},
};

mock.module('@/constants', () => ({
  default: { I18N_CONFIG },
}));

const { parseCodeToAST, generateCodeFromAST } = AST('tsx');
const emptyAst = parseCodeToAST('');

describe('utils', () => {
  beforeEach(() => {
    mock.module('@/constants', () => ({
      default: { I18N_CONFIG },
    }));
  });
  describe('client-build-plugin', () => {
    describe('add-i18n-bridge', () => {
      it('should add the code at the bottom', () => {
        const code = `
          import foo from 'bar';
          import baz from 'qux';

          const a = 1;
        `;
        const outputAst = addI18nBridge(parseCodeToAST(code), {
          usei18nKeysLogic: false,
          i18nAdded: false,
          isTranslateCoreAdded: false,
        });
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
          import foo from 'bar';
          import baz from 'qux';

          const a = 1;

          const i18nConfig = {
            defaultLocale: "en",
            locales: ["en", "pt"]
          };

          window.i18n = {
            ...i18nConfig,
            get locale() {return document.documentElement.lang;}
          };
        `);
        expect(outputCode).toBe(expectedCode);
      });

      it('should add only the i18n keys logic at the botton if "i18nAdded" is true', () => {
        const code = `
          import foo from 'bar';
          import baz from 'qux';

          const a = 1;
        `;
        const outputAst = addI18nBridge(parseCodeToAST(code), {
          usei18nKeysLogic: true,
          i18nAdded: true,
          isTranslateCoreAdded: false,
        });
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
          import {translateCore} from "brisa";
          import foo from 'bar';
          import baz from 'qux';

          const a = 1;

          Object.assign(window.i18n, {
            get t() {return translateCore(this.locale, {...{defaultLocale: "en",locales: ["en", "pt"]},messages: this.messages});},
            get messages() {return {[this.locale]: window.i18nMessages};},
            overrideMessages(callback) {
              const p = callback(window.i18nMessages);
              const a = m => Object.assign(window.i18nMessages, m);
              return p.then?.(a) ?? a(p);
            }
          });
        `);
        expect(outputCode).toBe(expectedCode);
      });

      it('should add the code at the bottom with i18n keys logic and the import on top', () => {
        const code = `
          import foo from 'bar';
          import baz from 'qux';

          const a = 1;
        `;
        const outputAst = addI18nBridge(parseCodeToAST(code), {
          usei18nKeysLogic: true,
          i18nAdded: false,
          isTranslateCoreAdded: false,
        });
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
          import {translateCore} from "brisa";
          import foo from 'bar';
          import baz from 'qux';

          const a = 1;

          const i18nConfig = {
            defaultLocale: "en",
            locales: ["en", "pt"]
          };

          window.i18n = {
            ...i18nConfig,
            get locale() {return document.documentElement.lang;},
            get t() {return translateCore(this.locale, {...i18nConfig,messages: this.messages});},
            get messages() {return {[this.locale]: window.i18nMessages};},
            overrideMessages(callback) {
              const p = callback(window.i18nMessages);
              const a = m => Object.assign(window.i18nMessages, m);
              return p.then?.(a) ?? a(p);
            }
          };
        `);
        expect(outputCode).toBe(expectedCode);
      });

      it('should add work with empty code', () => {
        const outputAst = addI18nBridge(emptyAst, {
          usei18nKeysLogic: false,
          i18nAdded: false,
          isTranslateCoreAdded: false,
        });
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
          const i18nConfig = {
            defaultLocale: "en",
            locales: ["en", "pt"]
          };

          window.i18n = {
            ...i18nConfig,
            get locale() {return document.documentElement.lang;}
          };
        `);
        expect(outputCode).toBe(expectedCode);
      });

      it('should work with empty code with i18n keys logic', () => {
        const outputAst = addI18nBridge(emptyAst, {
          usei18nKeysLogic: true,
          i18nAdded: false,
          isTranslateCoreAdded: false,
        });
        const outputCode = normalizeQuotes(generateCodeFromAST(outputAst));
        const expectedCode = normalizeQuotes(`
          import {translateCore} from "brisa";

          const i18nConfig = {
            defaultLocale: "en",
            locales: ["en", "pt"]
          };

          window.i18n = {
            ...i18nConfig,
            get locale() {return document.documentElement.lang;},
            get t() {return translateCore(this.locale, {...i18nConfig,messages: this.messages});},
            get messages() {return {[this.locale]: window.i18nMessages};},
            overrideMessages(callback) {
              const p = callback(window.i18nMessages);
              const a = m => Object.assign(window.i18nMessages, m);
              return p.then?.(a) ?? a(p);
            }
          };
        `);
        expect(outputCode).toBe(expectedCode);
      });
    });
    describe('add-i18n-bridge functionality', () => {
      beforeEach(() => GlobalRegistrator.register());
      afterEach(() => GlobalRegistrator.unregister());

      it('should work the window.i18n without translate code', async () => {
        const ast = addI18nBridge(emptyAst, {
          usei18nKeysLogic: false,
          i18nAdded: false,
          isTranslateCoreAdded: false,
        });
        const output = generateCodeFromAST(ast);
        const script = document.createElement('script');
        script.innerHTML = output;
        document.documentElement.lang = 'pt';
        document.body.appendChild(script);

        expect(window.i18n.locale).toBe('pt');
      });

      it('should work the window.i18n with translate code', async () => {
        const ast = addI18nBridge(emptyAst, {
          usei18nKeysLogic: true,
          i18nAdded: false,
          isTranslateCoreAdded: false,
        });
        let output = generateCodeFromAST(ast);

        output = output.replace(
          normalizeQuotes("import {translateCore} from 'brisa';"),
          'const translateCore = () => (k) => "Olá John";',
        );

        window.i18nMessages = I18N_CONFIG.messages['pt'];

        const script = document.createElement('script');
        script.innerHTML = output;
        document.documentElement.lang = 'pt';
        document.body.appendChild(script);

        expect(window.i18n.locale).toBe('pt');
        expect(window.i18n.t('hello', { name: 'John' })).toBe('Olá John');
      });

      it('should work the window.i18n with translate code in separate steps', async () => {
        const ast1 = addI18nBridge(emptyAst, {
          usei18nKeysLogic: false,
          i18nAdded: false,
          isTranslateCoreAdded: false,
        });
        const ast2 = addI18nBridge(emptyAst, {
          usei18nKeysLogic: true,
          i18nAdded: true,
          isTranslateCoreAdded: false,
        });

        let output = generateCodeFromAST(ast1) + generateCodeFromAST(ast2);

        output = output.replace(
          normalizeQuotes("import {translateCore} from 'brisa';"),
          'const translateCore = () => (k) => "Olá John";',
        );

        window.i18nMessages = I18N_CONFIG.messages['pt'];

        const script = document.createElement('script');
        script.innerHTML = output;
        document.documentElement.lang = 'pt';
        document.body.appendChild(script);

        expect(window.i18n.locale).toBe('pt');
        expect(window.i18n.t('hello', { name: 'John' })).toBe('Olá John');
      });

      it('should override messages using i18n.overrideMessages util', () => {
        const ast = addI18nBridge(emptyAst, {
          usei18nKeysLogic: true,
          i18nAdded: false,
          isTranslateCoreAdded: true,
        });
        let output = generateCodeFromAST(ast);

        output = output.replace(
          normalizeQuotes("import {translateCore} from 'brisa';"),
          "const translateCore = () => (k) => window.i18nMessages[k].replace('{{name}}', 'John');",
        );

        window.i18nMessages = structuredClone(I18N_CONFIG.messages['pt']);

        const script = document.createElement('script');
        script.innerHTML = output;
        document.documentElement.lang = 'pt';
        document.body.appendChild(script);

        expect(window.i18n.locale).toBe('pt');
        expect(window.i18n.t('hello', { name: 'John' })).toBe('Olá John');

        window.i18n.overrideMessages((messages: Record<string, any>) => ({
          ...messages,
          hello: 'Olááá {{name}}',
        }));

        expect(window.i18n.messages).toEqual({ pt: window.i18nMessages });
        expect(window.i18nMessages).toEqual({ hello: 'Olááá {{name}}' });
        expect(window.i18n.t('hello', { name: 'John' })).toBe('Olááá John');
      });

      it('should override messages using ASYNC i18n.overrideMessages util', async () => {
        const ast = addI18nBridge(emptyAst, {
          usei18nKeysLogic: true,
          i18nAdded: false,
          isTranslateCoreAdded: true,
        });
        let output = generateCodeFromAST(ast);

        output = output.replace(
          normalizeQuotes("import {translateCore} from 'brisa';"),
          "const translateCore = () => (k) => window.i18nMessages[k].replace('{{name}}', 'John');",
        );

        window.i18nMessages = structuredClone(I18N_CONFIG.messages['pt']);

        const script = document.createElement('script');
        script.innerHTML = output;
        document.documentElement.lang = 'pt';
        document.body.appendChild(script);

        expect(window.i18n.locale).toBe('pt');
        expect(window.i18n.t('hello', { name: 'John' })).toBe('Olá John');

        await window.i18n.overrideMessages(
          async (messages: Record<string, any>) => ({
            ...messages,
            hello: 'Olááá {{name}}',
          }),
        );

        expect(window.i18n.messages).toEqual({ pt: window.i18nMessages });
        expect(window.i18nMessages).toEqual({ hello: 'Olááá {{name}}' });
        expect(window.i18n.t('hello', { name: 'John' })).toBe('Olááá John');
      });

      it('should import the i18n pages when config.transferToClient is true', () => {
        mock.module('@/constants', () => ({
          default: {
            I18N_CONFIG: {
              ...I18N_CONFIG,
              pages: {
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
              },
            } as I18nConfig,
          },
        }));

        const ast = addI18nBridge(emptyAst, {
          usei18nKeysLogic: false,
          i18nAdded: false,
          isTranslateCoreAdded: false,
        });

        let output = generateCodeFromAST(ast);
        const script = document.createElement('script');

        script.innerHTML = output;

        document.body.appendChild(script);

        expect(window.i18n.pages).toEqual({
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

      it('should import the i18n pages when config.transferToClient is an array', () => {
        mock.module('@/constants', () => ({
          default: {
            I18N_CONFIG: {
              ...I18N_CONFIG,
              pages: {
                config: {
                  transferToClient: ['/about-us', '/user/[username]'],
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
              },
            } as I18nConfig,
          },
        }));

        const ast = addI18nBridge(emptyAst, {
          usei18nKeysLogic: false,
          i18nAdded: false,
          isTranslateCoreAdded: false,
        });

        let output = generateCodeFromAST(ast);
        const script = document.createElement('script');

        script.innerHTML = output;

        document.body.appendChild(script);

        expect(window.i18n.pages).toEqual({
          '/about-us': {
            en: '/about-us/',
            es: '/sobre-nosotros/',
          },
          '/user/[username]': {
            en: '/user/[username]',
            es: '/usuario/[username]',
          },
        });
      });
    });
  });
});
