import { describe, it, expect } from 'bun:test';
import AST from '@/utils/ast';
import { processI18n } from '.';
import { normalizeHTML } from '@/helpers';

const { parseCodeToAST, generateCodeFromAST, minify } = AST('tsx');
const out = (c: string) =>
  minify(normalizeHTML(generateCodeFromAST(parseCodeToAST(c))));

describe('utils', () => {
  describe('client-build -> process-i18n', () => {
    it('should return useI18n + cleanup', () => {
      const code = `  
        export default function Component({i18n}) {
          const { locale } = i18n;
          return <div>{locale}</div>
        }
       
        window.useI18n = true;
      `;

      const res = processI18n(code);
      const resCode = normalizeHTML(res.code);

      expect(resCode).toEndWith(
        out(`
         export default function Component({i18n}) {
          const { locale } = i18n;
          return <div>{locale}</div>
        }  
      `),
      );
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toBeEmpty();
      expect(res.size).toBe(res.code.length);

      // Bridge without keys
      expect(resCode).toContain('window.i18n');
      expect(resCode).not.toContain('messages()');
    });

    it('should return useI18n + cleanup multi useI18n (entrypoint with diferent pre-analyzed files)', () => {
      const code = `  
        export default function Component({i18n}) {
          const { locale } = i18n;
          return <div>{locale}</div>
        }
       
        window.useI18n = true;
        window.useI18n = true;
        window.useI18n = true;
        window.useI18n = true;
      `;

      const res = processI18n(code);
      const resCode = normalizeHTML(res.code);

      expect(resCode).toEndWith(
        out(`
         export default function Component({i18n}) {
          const { locale } = i18n;
          return <div>{locale}</div>
        }  
      `),
      );
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toBeEmpty();
      expect(res.size).toBe(res.code.length);

      // Bridge without keys
      expect(resCode).toContain('window.i18n');
      expect(resCode).not.toContain('messages()');
    });

    it('should return useI18n and i18nKeys + cleanup', () => {
      const code = `  
        export default function Component({i18n}) {
          const { t } = i18n;
          return <div>{t("hello")}</div>
        }
       
        window.useI18n = true;
        window.i18nKeys = ["hello"]
      `;

      const res = processI18n(code);
      const resCode = normalizeHTML(res.code);

      expect(resCode).toEndWith(
        out(`
         export default function Component({i18n}) {
          const { t } = i18n;
          return <div>{t("hello")}</div>
        }  
      `),
      );
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(['hello']));
      expect(res.size).toBe(res.code.length);

      // Bridge with keys
      expect(resCode).toContain('window.i18n');
      expect(resCode).toContain('messages()');
    });

    it('should return useI18n and i18nKeys + cleanup multi', () => {
      const code = `  
        export default function Component({i18n}) {
          const { t } = i18n;
          return <div>{t("hello")}</div>
        }
       
        window.useI18n = true;
        window.i18nKeys = ["hello"]
        window.useI18n = true;
        window.i18nKeys = ["hello"]
      `;

      const res = processI18n(code);
      const resCode = normalizeHTML(res.code);

      expect(resCode).toEndWith(
        out(`
         export default function Component({i18n}) {
          const { t } = i18n;
          return <div>{t("hello")}</div>
        }  
      `),
      );
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(['hello']));
      expect(res.size).toBe(res.code.length);

      // Bridge with keys
      expect(resCode).toContain('window.i18n');
      expect(resCode).toContain('messages()');
    });

    it('should return useI18n and i18nKeys + collect and cleanup multi', () => {
      const code = `  
        export default function Component({i18n}) {
          const { t } = i18n;
          return <div>{t("hello")}</div>
        }
       
        window.useI18n = true;
        window.i18nKeys = ["foo", "bar"]
        window.i18nKeys = ["bar"]
        window.i18nKeys = ["baz"]
      `;

      const res = processI18n(code);
      const resCode = normalizeHTML(res.code);

      expect(resCode).toEndWith(
        out(`
         export default function Component({i18n}) {
          const { t } = i18n;
          return <div>{t("hello")}</div>
        }  
      `),
      );
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(['foo', 'bar', 'baz']));
      expect(res.size).toBe(res.code.length);

      // Bridge with keys
      expect(resCode).toContain('window.i18n');
      expect(resCode).toContain('messages()');
    });
  });
});
