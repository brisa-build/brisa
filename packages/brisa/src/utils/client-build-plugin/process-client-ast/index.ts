import type { ESTree } from 'meriyah';
import { logWarning } from '@/utils/log/log-build';
import AST from '@/utils/ast';
import { toInline } from '@/helpers';

const { generateCodeFromAST } = AST('tsx');

export default function processClientAst(ast: ESTree.Program, path = '') {
  let i18nKeys = new Set<string>();
  let useI18n = false;
  const logs: any[] = [];
  let isDynamicKeysSpecified = false;

  const newAst = JSON.parse(JSON.stringify(ast), (key, value) => {
    useI18n ||= value?.type === 'Identifier' && value?.name === 'i18n';

    // Remove react/jsx-runtime import, some transpilers like @swc add it,
    // but we are not using jsx-runtime here, we are using jsx-buildtime
    if (
      value?.type === 'ImportDeclaration' &&
      value?.source?.value === 'react/jsx-runtime'
    ) {
      return null;
    }

    // Remove ".css" imports and log a warning
    // TODO: Remove this restriction when this Bun feature is solved:
    // https://github.com/oven-sh/bun/issues/8280
    if (
      value?.type === 'ImportDeclaration' &&
      value?.source?.value.endsWith('.css')
    ) {
      logWarning(
        [
          'CSS Global imports in web components',
          '',
          `Code: import '${value.source.value}';`,
          `Path: ${path}`,
          '',
          'Add this global import into the layout or the page.',
          'Currently, CSS Global imports only work in Web Components when it does not have the "skipSSR", to avoid problems, it is better not to use it here yet.',
          '',
          'If you have any questions or need further assistance,',
          'feel free to contact us. We are happy to help!',
        ],
        'Docs: https://brisa.build/building-your-application/styling/web-components#global-styles-in-web-components',
      );
      return null;
    }

    if (
      value?.type === 'CallExpression' &&
      ((value?.callee?.type === 'Identifier' && value?.callee?.name === 't') ||
        (value?.callee?.property?.type === 'Identifier' &&
          value?.callee?.property?.name === 't'))
    ) {
      if (value?.arguments?.[0]?.type === 'Literal') {
        i18nKeys.add(value?.arguments?.[0]?.value);
      } else {
        logs.push(value);
      }
    }

    // Add dynamic keys from: MyWebComponent.i18nKeys = ['footer', /projects.*title/];
    if (
      value?.type === 'ExpressionStatement' &&
      value.expression.left?.property?.name === 'i18nKeys' &&
      value.expression?.right?.type === 'ArrayExpression'
    ) {
      for (const element of value.expression.right.elements ?? []) {
        i18nKeys.add(element.value);
        isDynamicKeysSpecified = true;
      }
      // Remove the expression statement
      return null;
    }

    // Remove arrays with empty values
    if (Array.isArray(value)) return value.filter((v) => v);

    return value;
  });

  if (logs.length > 0 && !isDynamicKeysSpecified) {
    logWarning(
      [
        'Addressing Dynamic i18n Key Export Limitations',
        '',
        `Code: ${logs.map((v) => toInline(generateCodeFromAST(v))).join(', ')}`,
        '',
        'When using dynamic i18n keys like t(someVar) instead of',
        `literal keys such as t('example'), exporting these keys`,
        `in the client code becomes challenging.`,
        '',
        'Unfortunately, it is not feasible to export dynamic keys',
        'directly.',
        '',
        'To address this, it is crucial to specify these keys at',
        `web-component level. You can use RegExp. Here's an example:`,
        '',
        `MyWebComponent.i18nKeys = ['footer', /projects.*title/];`,
        '',
        'If you have any questions or need further assistance,',
        'feel free to contact us. We are happy to help!',
      ],
      'Docs: https://brisa.build/building-your-application/routing/internationalization#translate-in-your-web-components',
    );
  }

  if (!useI18n) i18nKeys = new Set();

  return { useI18n, i18nKeys, ast: newAst };
}
