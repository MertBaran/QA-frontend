import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  js.configs.recommended,
  // Test dosyaları için jest ve node global'leri
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/setupTests.js', '**/__mocks__/**'],
    languageOptions: {
      globals: {
        jest: true,
        describe: true,
        it: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        test: true,
        window: true,
        global: true,
        module: true,
        require: true,
        process: true,
      },
    },
  },
  // Node config dosyaları için node global'leri
  {
    files: ['*.config.js', '*.config.ts', '*.cjs', '*.mjs'],
    languageOptions: {
      globals: {
        module: true,
        require: true,
        process: true,
        __dirname: true,
        __filename: true,
      },
    },
  },
  // Tüm TypeScript ve React dosyaları için browser global'leri
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',
      },
      globals: {
        window: true,
        document: true,
        localStorage: true,
        setTimeout: true,
        clearTimeout: true,
        navigator: true,
        console: true,
        process: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react,
      'react-hooks': reactHooks,
      prettier,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs['recommended-type-checked'].rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      ...prettier.configs.recommended.rules,
      'prettier/prettier': 'warn',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'react/react-in-jsx-scope': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
