import AST from '@/utils/ast';

const { parseCodeToAST, generateCodeFromAST } = AST('tsx');

export function processI18n(code: string, path: string) {
  const rawAst = parseCodeToAST(code);
  const i18nKeys = new Set<string>();
  let useI18n = false;

  const ast = JSON.parse(JSON.stringify(rawAst), (key, value) => {
    if (
      isWindowProperty(value, 'i18nKeys') &&
      value.expression?.right?.type === 'ArrayExpression'
    ) {
      for (const element of value.expression.right.elements ?? []) {
        i18nKeys.add(element.value);
      }
      return null;
    }

    if (isWindowProperty(value, 'useI18n')) {
      useI18n = true;
      return null;
    }

    // Clean null values inside arrays
    if (Array.isArray(value)) return value.filter(Boolean);

    return value;
  });

  // TODO
  // Add the i18n Bridge to AST
  // if (useI18n) {
  //   ast = addI18nBridge(ast, {
  //     usei18nKeysLogic: i18nKeys.size > 0
  //   });
  // }

  return { code: generateCodeFromAST(ast), useI18n, i18nKeys };
}

function isWindowProperty(value: any, property: string) {
  return (
    value?.type === 'ExpressionStatement' &&
    value.expression?.left?.object?.name === 'window' &&
    value.expression?.left?.property?.name === property
  );
}
