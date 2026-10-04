// Strict flat ESLint config for import ordering and architectural boundaries.

import { FlatCompat } from "@eslint/eslintrc";
import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "next-env.d.ts",
      "node_modules/**",
      "e2e/**",
      "test-results/**",
      "src/styles/tokens/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      boundaries,
      import: importPlugin,
    },
    settings: {
      "boundaries/elements": [
        { partialMatch: false, pattern: "src/app/**", type: "app" },
        { partialMatch: false, pattern: "src/features/*/**", type: "feature" },
        { partialMatch: false, pattern: "src/components/**", type: "component" },
        { partialMatch: false, pattern: "src/lib/**", type: "lib" },
      ],
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              allow: {
                to: {
                  element: { types: { anyOf: ["app", "feature", "component", "lib"] } },
                },
              },
              from: { element: { type: "app" } },
            },
            {
              allow: {
                to: { element: { types: { anyOf: ["feature", "component", "lib"] } } },
              },
              from: { element: { type: "feature" } },
            },
            {
              allow: {
                to: { element: { types: { anyOf: ["component", "lib"] } } },
              },
              from: { element: { type: "component" } },
            },
            {
              allow: { to: { element: { type: "lib" } } },
              from: { element: { type: "lib" } },
            },
          ],
        },
      ],
      "import/order": [
        "error",
        {
          alphabetize: { caseInsensitive: true, order: "asc" },
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          "newlines-between": "always",
        },
      ],
      "max-lines": [
        "warn",
        {
          max: 250,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
];

export default eslintConfig;
