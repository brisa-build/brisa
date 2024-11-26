import { describe, it, expect, spyOn } from 'bun:test';
import { join } from 'node:path';
import AST from '@/utils/ast';
import processClientAST from '.';
import { normalizeHTML, toInline } from '@/helpers';

const brisaClient = join('brisa', 'client', 'index.js');
const { parseCodeToAST, generateCodeFromAST } = AST('tsx');

describe('utils', () => {
  describe('process-client-ast', () => {
    it('should remove import from "react/jsx-runtime" (some TSX -> JS transpilers like @swc add it, but then jsx-runtme is not used...)', () => {
      const ast = parseCodeToAST(`
        import { jsx } from 'react/jsx-runtime';
        export default function Component() {
          return jsx('div', null, 'Hello World');
        }
      `);

      const res = processClientAST(ast);

      expect(toInline(generateCodeFromAST(res))).toBe(
        normalizeHTML(`
        export default function Component() {
          return jsx('div', null, 'Hello World');
        }
      `),
      );
    });

    it('should remove ".css" imports and log a warning', () => {
      const mockLog = spyOn(console, 'log');
      const ast = parseCodeToAST(`
        import './styles.css';
        export default function Component() {
          return jsx('div', null, 'Hello World');
        }
      `);

      const res = processClientAST(ast);

      const logs = mockLog.mock.calls.toString();
      mockLog.mockRestore();

      expect(toInline(generateCodeFromAST(res))).toBe(
        normalizeHTML(`
        export default function Component() {
          return jsx('div', null, 'Hello World');
        }
      `),
      );
      expect(logs).toContain(
        'Add this global import into the layout or the page.',
      );
    });
    it('should detect i18n when is declated and used to consume the locale', () => {
      const ast = parseCodeToAST(`  
        export default function Component({i18n}) {
          const { locale } = i18n;
          return <div>{locale}</div>
        }
      `);

      const res = generateCodeFromAST(processClientAST(ast));

      expect(res).toContain('useI18n = true');
      expect(res).not.toContain('i18nKeys');
    });

    it('should not detect i18n when the path is brisa client', () => {
      const ast = parseCodeToAST(`  
        export default function Component({i18n}) {
          const { locale } = i18n;
          return <div>{locale}</div>
        }
      `);

      const res = generateCodeFromAST(processClientAST(ast, brisaClient));

      expect(res).not.toContain('useI18n = true');
      expect(res).not.toContain('i18nKeys');
    });

    it('should detect i18n when is used to consume the locale from webContext identifier', () => {
      const ast = parseCodeToAST(`  
        export default function Component(webContext) {
          const { locale } = webContext.i18n;
          return <div>{locale}</div>
        }
      `);

      const res = generateCodeFromAST(processClientAST(ast));

      expect(res).toContain('useI18n = true');
      expect(res).not.toContain('i18nKeys');
    });

    it('should detect i18n when is used to consume the locale from webContext identifier + destructuring', () => {
      const ast = parseCodeToAST(`  
        export default function Component(webContext) {
          const { i18n } = webContext;
          return <div>{i18n.locale}</div>
        }
      `);

      const res = generateCodeFromAST(processClientAST(ast));

      expect(res).toContain('useI18n = true');
      expect(res).not.toContain('i18nKeys');
    });

    it('should detect i18n when is used to consume t function', () => {
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n}) {
          return <div>{i18n.t("hello")}</div>
        }
      `);

      const res = generateCodeFromAST(processClientAST(ast));

      expect(res).toContain('useI18n = true');
      expect(res).toContain('i18nKeys = ["hello"]');
    });

    it('should detect i18n when is used to consume t function from arrow function', () => {
      const ast = parseCodeToAST(`
        const Component = ({}, {i18n}) => {
          return <div>{i18n.t("hello")}</div>
        }

        export default Component;
      `);

      const res = generateCodeFromAST(processClientAST(ast));

      expect(res).toContain('useI18n = true');
      expect(res).toContain('i18nKeys = ["hello"]');
    });

    it('should return all the i18n keys used in the component', () => {
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n}) {
          return <div>{i18n.t("hello")}</div>
        }
      `);

      const res = generateCodeFromAST(processClientAST(ast));

      expect(res).toContain('useI18n = true');
      expect(res).toContain('i18nKeys = ["hello"]');
    });

    it('should return all the i18n keys used in the component using destructuring', () => {
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n: { t }}) {
          return <div>{t("hello")}</div>
        }
      `);

      const res = generateCodeFromAST(processClientAST(ast));

      expect(res).toContain('useI18n = true');
      expect(res).toContain('i18nKeys = ["hello"]');
    });

    it('should return all the i18n keys used in the component using webContext identifier', () => {
      const ast = parseCodeToAST(`
        export default function Component({}, webContext) {
          return <div>{webContext.i18n.t("hello")}</div>
        }
      `);

      const res = generateCodeFromAST(processClientAST(ast));

      expect(res).toContain('useI18n = true');
      expect(res).toContain('i18nKeys = ["hello"]');
    });

    it('should not return as i18n keys when is not using i18n', () => {
      const ast = parseCodeToAST(`
        import t from "i18n";

        export default function Component() {
          return <div>{t("hello")}</div>
        }
      `);

      const res = generateCodeFromAST(processClientAST(ast));

      expect(res).not.toContain('useI18n');
      expect(res).not.toContain('i18nKeys');
    });

    it('should log a warning and no return i18n keys when there is no literal as first argument', () => {
      const mockLog = spyOn(console, 'log');
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n}) {
          const variable = "hello";
          const variable2 = "world";
          return <div>{i18n.t(variable + variable2)}<span>{i18n.t(variable)}</span></div>
        }
      `);

      const res = generateCodeFromAST(processClientAST(ast));

      expect(res).toContain('useI18n = true');
      expect(res).not.toContain('i18nKeys');

      const logs = mockLog.mock.calls.toString();
      mockLog.mockRestore();

      expect(logs).toContain('Ops! Warning:');
      expect(logs).toContain('Addressing Dynamic i18n Key Export Limitations');
      expect(logs).toContain(
        'Code: i18n.t(variable + variable2), i18n.t(variable)',
      );
    });

    it('should add the keys specified inside MyWebComponent.i18nKeys array', () => {
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n}) {
          return i18n.t("hello");
        }

        Component.i18nKeys = ["hello-world"];
      `);

      const res = generateCodeFromAST(processClientAST(ast));

      expect(toInline(res)).toBe(
        toInline(`
        export default function Component({}, {i18n}) {
          return i18n.t("hello");
        }
    
        window.i18nKeys = ["hello", "hello-world"];
        window.useI18n = true;
      `),
      );
    });

    it('should not log the warning if already has the i18nKeys', () => {
      const mockLog = spyOn(console, 'log');
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n}) {
          const someVar = "hello-world";
          return i18n.t(someVar);
        }

        Component.i18nKeys = ["hello-world"];
      `);

      const res = processClientAST(ast);

      expect(mockLog).not.toHaveBeenCalled();
      mockLog.mockRestore();

      expect(toInline(generateCodeFromAST(res))).toBe(
        toInline(`
        export default function Component({}, {i18n}) {
          const someVar = "hello-world";
          return i18n.t(someVar);
        }

        window.i18nKeys = ["hello-world"];
        window.useI18n = true;
      `),
      );
    });

    it('should work i18nKeys inside a conditional', () => {
      const ast = parseCodeToAST(`
        export default function Component({}, {i18n}) {
          const someVar = "hello-world";
          return i18n.t(someVar);
        }
        
        if (true) {
          Component.i18nKeys = ["hello-world"];
        }
      `);

      const res = processClientAST(ast);

      expect(toInline(generateCodeFromAST(res))).toBe(
        toInline(`
        export default function Component({}, {i18n}) {
          const someVar = "hello-world";
          return i18n.t(someVar);
        }

        if (true) {}
        window.i18nKeys = ["hello-world"];
        window.useI18n = true;
      `),
      );
    });
  });
});
