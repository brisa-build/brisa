import globals from "globals";
import pluginJs from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import pluginReact from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        Bun: "readonly",
      },
      parser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: pluginReact,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      "no-console": "off", // Disable or adjust as needed
      "jsx-a11y/aria-props": "error", // Ensure valid ARIA attributes
      "jsx-a11y/aria-role": "error", // Ensure valid ARIA roles
      semi: ["error", "always"],
      "react/style-prop-object": "error",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-require-imports": "off", // Disable if using CommonJS
      "@typescript-eslint/no-explicit-any": "off", // Disable if using `any`
      "no-restricted-syntax": [
        "warn",
        {
          selector: "CallExpression[callee.property.name='preventDefault']",
          message: "Calling preventDefault() on a server event is unnecessary.",
        },
        {
          selector: "CallExpression[callee.property.name='stopPropagation']",
          message:
            "Calling stopPropagation() on a server event is unnecessary.",
        },
        {
          selector: "NewExpression[callee.name='FormData']",
          message: "Use e.formData instead of new FormData(e.target).",
        },
        {
          selector: "JSXExpressionContainer Identifier[name=/.*signal/]",
          message: "Signals must use .value inside JSX.",
        },
      ],
    },
    settings: {
      react: {
        version: "18.0",
      },
    },
  },
];
