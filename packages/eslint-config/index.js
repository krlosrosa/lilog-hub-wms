/**
 * Minimal ESLint preset for utilities without React/Next.
 */
module.exports = {
  root: true,
  ignores: ['dist/**', '.next/**', 'node_modules/**'],
  extends: ['eslint:recommended'],
  env: {
    es2024: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
};
