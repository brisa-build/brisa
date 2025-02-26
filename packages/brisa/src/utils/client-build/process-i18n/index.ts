import AST from '@/utils/ast';
import { build } from './inject-bridge' with { type: 'macro' };
import { getConstants } from '@/constants';
import transferTranslatedPagePaths from '@/utils/transfer-translated-page-paths';
import type { ESTree } from 'meriyah';

const { parseCodeToAST, generateCodeFromAST, minify } = AST('tsx');
const bridgeWithKeys = await build({ usei18nKeysLogic: true });
const bridgeWithoutKeys = await build({ usei18nKeysLogic: false });
const bridgeWithKeysAndFormatter = await build({
  usei18nKeysLogic: true,
  useFormatter: true,
});

export function processI18n(code: string) {
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

  const newCode = useI18n ? astToI18nCode(ast, i18nKeys) : code;

  return {
    code: newCode,
    useI18n,
    i18nKeys,
    size: newCode.length,
  };
}

function isWindowProperty(value: any, property: string) {
  return (
    value?.type === 'ExpressionStatement' &&
    value.expression?.left?.object?.name === 'window' &&
    value.expression?.left?.property?.name === property
  );
}

function astToI18nCode(ast: ESTree.Program, i18nKeys: Set<string>) {
  const { I18N_CONFIG } = getConstants();
  const usei18nKeysLogic = i18nKeys.size > 0;
  const i18nConfig = JSON.stringify({
    ...I18N_CONFIG,
    messages: undefined,
    pages: transferTranslatedPagePaths(I18N_CONFIG?.pages),
  });
  const formatterString =
    typeof I18N_CONFIG?.interpolation?.format === 'function'
      ? I18N_CONFIG.interpolation?.format.toString()
      : '';

  const bridge =
    usei18nKeysLogic && formatterString
      ? bridgeWithKeysAndFormatter
      : usei18nKeysLogic
        ? bridgeWithKeys
        : bridgeWithoutKeys;

  // Note: It's important to run on the top of the AST, this way then the
  // brisaElement will be able to use window.i18n
  ast.body.unshift(
    ...parseCodeToAST(
      bridge
        .replaceAll('__CONFIG__', i18nConfig)
        .replaceAll('__FORMATTER__', formatterString),
    ).body,
  );

  return minify(generateCodeFromAST(ast));
}
