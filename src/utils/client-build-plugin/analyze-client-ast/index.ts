import type { ESTree } from "meriyah";
import { logWarning } from "@/utils/log/log-build";
import AST from "@/utils/ast";

const { generateCodeFromAST } = AST("tsx");

export default function analyzeClientAst(ast: ESTree.Program) {
  let i18nKeys = new Set<string>();
  let useI18n = false;

  JSON.stringify(ast, (key, value) => {
    useI18n ||= value?.type === "Identifier" && value?.name === "i18n";

    if (
      value?.type === "CallExpression" &&
      ((value?.callee?.type === "Identifier" && value?.callee?.name === "t") ||
        (value?.callee?.property?.type === "Identifier" &&
          value?.callee?.property?.name === "t"))
    ) {
      if (value?.arguments?.[0]?.type === "Literal") {
        i18nKeys.add(value?.arguments?.[0]?.value);
      } else {
        logWarning(
          [
            "Addressing Dynamic i18n Key Export Limitations",
            "",
            `Code: ${generateCodeFromAST(value)}`,
            "",
            "When using dynamic i18n keys like t(someVar) instead of",
            `literal keys such as t('example'), exporting these keys`,
            `in the client code becomes challenging.`,
            "",
            "Unfortunately, it is not feasible to export dynamic keys",
            "directly.",
            "",
            "To address this, it is crucial to specify these keys at",
            `the page level. Here's an example:`,
            "",
            `export const i18nKeys = ['footer.*'] // You can use Glob`,
            "",
            "If you have any questions or need further assistance,",
            "feel free to contact us. We are happy to help!",
          ],
          "Docs: https://brisa.build/docs/building-your-application/routing/internationalization#translate-in-your-web-components",
        );
      }
    }

    return value;
  });

  if (!useI18n) i18nKeys = new Set();

  return { useI18n, i18nKeys };
}
