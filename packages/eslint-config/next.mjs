/**
 * ESLint Flat Config preset for Next.js apps (Next.js / eslint-config-next).
 */
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', '**/out/**'],
  },
  js.configs.recommended,
  ...compat.extends('eslint-config-next/core-web-vitals'),
];
