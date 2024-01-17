import type { ESTree } from "meriyah";
import { logWarning } from "@/utils/log/log-build";
import AST from "@/utils/ast";

const { generateCodeFromAST } = AST("tsx");

export default function analyzeClientAst(ast: ESTree.Program) {
  let i18nKeys = new Set<string>();
  let useI18n = false;
  let logs: any[] = [];
  let isDynamicKeysSpecified = false;

  JSON.stringify(ast, function (key, value) {
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
        logs.push(value);
      }
    }

    // Add dynamic keys from: MyWebComponent.i18nKeys = ['footer*'];
    if (
      value?.type === "AssignmentExpression" &&
      value?.left?.property?.name === "i18nKeys" &&
      value?.right?.type === "ArrayExpression"
    ) {
      for (let element of value?.right?.elements ?? []) {
        i18nKeys.add(element.value);
        isDynamicKeysSpecified = true;
      }
    }

    return value;
  });

  if (logs.length > 0 && !isDynamicKeysSpecified) {
    logWarning(
      [
        "Addressing Dynamic i18n Key Export Limitations",
        "",
        `Code: ${logs.map(generateCodeFromAST).join(", ")}`,
        "",
        "When using dynamic i18n keys like t(someVar) instead of",
        `literal keys such as t('example'), exporting these keys`,
        `in the client code becomes challenging.`,
        "",
        "Unfortunately, it is not feasible to export dynamic keys",
        "directly.",
        "",
        "To address this, it is crucial to specify these keys at",
        `web-component level. Here's an example:`,
        "",
        `MyWebComponent.i18nKeys = ['footer.*'] // You can use Glob`,
        "",
        "If you have any questions or need further assistance,",
        "feel free to contact us. We are happy to help!",
      ],
      "Docs: https://brisa.build/docs/building-your-application/routing/internationalization#translate-in-your-web-components",
    );
  }

  if (!useI18n) i18nKeys = new Set();

  return { useI18n, i18nKeys };
}
