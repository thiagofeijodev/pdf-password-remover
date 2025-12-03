import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import eslint from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import jest from 'eslint-plugin-jest';
import jestDom from 'eslint-plugin-jest-dom';
import testingLibrary from 'eslint-plugin-testing-library';

const config = [
  // Base configuration for all files
  eslint.configs.recommended,
  prettier,

  // React files configuration
  {
    files: ['src/**/*.{js,jsx}'],
    ...react.configs.flat.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.jest,
        process: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/prop-types': 'off', // not using prop-types
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
    },
  },

  // Configuration files (including this one)
  {
    files: [
      'eslint.config.js',
      'playwright.config.js',
      '.config/**/*.{js,ts,mjs}',
      'commitlint.config.js',
      'jest.config.mjs',
    ],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'no-console': 'off',
    },
  },

  // Jest test configuration
  {
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    ignores: ['e2e/**'],
    languageOptions: {
      ...jest.configs['flat/recommended'].languageOptions,
      ...testingLibrary.configs['flat/react'].languageOptions,
      ...jestDom.configs['flat/recommended'].languageOptions,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.jest,
        global: 'readonly',
      },
    },
    plugins: {
      ...jest.configs['flat/recommended'].plugins,
      ...testingLibrary.configs['flat/react'].plugins,
      ...jestDom.configs['flat/recommended'].plugins,
    },
    rules: {
      ...jest.configs['flat/recommended'].rules,
      ...testingLibrary.configs['flat/react'].rules,
      ...jestDom.configs['flat/recommended'].rules,
      'jest/expect-expect': 'off', // Allow tests without assertions if using other checkers
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/prefer-to-have-length': 'warn',
      'testing-library/prefer-screen-queries': 'warn',
      'testing-library/no-container': 'warn',
      'testing-library/no-unnecessary-act': 'warn',
      'testing-library/no-node-access': 'off',
    },
  },

  // Playwright test configuration
  {
    files: ['e2e/**/*.{js,ts,mjs}'],
    plugins: {
      playwright,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...playwright.configs.recommended.rules,
      'no-console': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/docs/**',
      '**/build/**',
      '**/release/**',
      '**/*.d.ts',
      '**/coverage/**',
      '**/.cache/**',
      '**/bun.lock',
      '**/package-lock.json',
      '**/pdf-remover.js',
    ],
  },
];

export default config;
