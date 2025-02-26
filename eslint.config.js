import pkg from "globals";
import pluginJs from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

const { browser, node } = pkg;

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/*.test.ts",
      "**/*.spec.ts",
    ],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...browser,
        ...node,
        JSX: "readonly",
        React: "readonly",
        Bun: "readonly",
        SocketAddress: "readonly",
        HeadersInit: "readonly",
        Throwable: "readonly",
        ShadowRootMode: "readonly",
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-constant-condition": "off",
      "no-useless-escape": "off",
      "no-control-regex": "off",
      ...tsPlugin.configs.recommended.rules,
    },
  },
  pluginJs.configs.recommended,
];
