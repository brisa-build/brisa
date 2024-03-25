import constants from "@/constants";
import AST from "@/utils/ast";
import { TRANSLATE_CORE_IMPORT } from "@/utils/client-build-plugin/constants";
import type { ESTree } from "meriyah";

const { parseCodeToAST } = AST("tsx");

type I18nBridgeConfig = {
  usei18nKeysLogic: boolean;
  isTranslateCoreAdded: boolean;
  i18nAdded: boolean;
};

const i18nKeysLogic = `
  get t() {
    return translateCore(this.locale, { ...i18nConfig, messages: this.messages })
  },
  get messages() { return {[this.locale]: window.i18nMessages } },
  overrideMessages(callback) {
    const p = callback(window.i18nMessages);
    const a = m => Object.assign(window.i18nMessages, m);
    return p.then?.(a) ?? a(p);
  }
`;

export default function addI18nBridge(
  ast: ESTree.Program,
  { usei18nKeysLogic, i18nAdded, isTranslateCoreAdded }: I18nBridgeConfig,
) {
  if (i18nAdded && isTranslateCoreAdded) return ast;

  const i18nConfig = JSON.stringify({
    ...constants.I18N_CONFIG,
    messages: undefined,
    pages: undefined,
  });
  let body = ast.body;

  const bridgeAst = parseCodeToAST(`
    const i18nConfig = ${i18nConfig};

    window.i18n = {
      ...i18nConfig,
      get locale(){ return document.documentElement.lang },
      ${usei18nKeysLogic ? i18nKeysLogic : ""}
    }
  `);

  if (usei18nKeysLogic && i18nAdded && !isTranslateCoreAdded) {
    const newAst = parseCodeToAST(
      `Object.assign(window.i18n, {${i18nKeysLogic}})`,
    );
    body = [TRANSLATE_CORE_IMPORT, ...ast.body, ...newAst.body];
  } else if (usei18nKeysLogic) {
    body = [TRANSLATE_CORE_IMPORT, ...ast.body, ...bridgeAst.body];
  } else {
    body = [...ast.body, ...bridgeAst.body];
  }

  return { ...ast, body };
}
