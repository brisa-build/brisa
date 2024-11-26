import { describe, it, expect, spyOn } from 'bun:test';
import AST from '@/utils/ast';
import { processI18n } from '.';
import { normalizeHTML, toInline } from '@/helpers';

const { parseCodeToAST, generateCodeFromAST } = AST('tsx');
const out = (c: string) =>
  normalizeHTML(generateCodeFromAST(parseCodeToAST(c)));

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

      const res = processI18n(code, '');

      expect(normalizeHTML(res.code)).toBe(
        out(`
         export default function Component({i18n}) {
          const { locale } = i18n;
          return <div>{locale}</div>
        }  
      `),
      );
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toBeEmpty();
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

      const res = processI18n(code, '');

      expect(normalizeHTML(res.code)).toBe(
        out(`
         export default function Component({i18n}) {
          const { locale } = i18n;
          return <div>{locale}</div>
        }  
      `),
      );
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toBeEmpty();
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

      const res = processI18n(code, '');

      expect(normalizeHTML(res.code)).toBe(
        out(`
         export default function Component({i18n}) {
          const { t } = i18n;
          return <div>{t("hello")}</div>
        }  
      `),
      );
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(['hello']));
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

      const res = processI18n(code, '');

      expect(normalizeHTML(res.code)).toBe(
        out(`
         export default function Component({i18n}) {
          const { t } = i18n;
          return <div>{t("hello")}</div>
        }  
      `),
      );
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(['hello']));
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

      const res = processI18n(code, '');

      expect(normalizeHTML(res.code)).toBe(
        out(`
         export default function Component({i18n}) {
          const { t } = i18n;
          return <div>{t("hello")}</div>
        }  
      `),
      );
      expect(res.useI18n).toBeTrue();
      expect(res.i18nKeys).toEqual(new Set(['foo', 'bar', 'baz']));
    });
  });
});
