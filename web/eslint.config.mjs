// Minimal flat ESLint config (ESLint 9) for web/ — PHASE-1 INTERIM.
//
// Uses only packages already in package.json (@eslint/eslintrc + eslint-config-next),
// so `npm run lint` works with NO extra installs. The strict config with import-order,
// layer boundaries, and max-lines is reintroduced at Phase 4 (when src/features/** exists
// and a clean reinstall can add eslint-plugin-boundaries / -import / the TS resolver).

import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
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
];

export default eslintConfig;
