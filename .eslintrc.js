const tsParser = require.resolve('@typescript-eslint/parser', {
  paths: [require('path').join(__dirname, 'www')],
});

const commonTsOverride = {
  extends: ['eslint:recommended'],
  parser: tsParser,
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
};

const baseRules = {
  'no-console': 'off',
  'no-debugger': 'error',
  'prefer-const': 'warn',
  'no-var': 'error',
  'no-unused-vars': 'off',
  'no-undef': 'off',
  'no-redeclare': 'off',
  'no-dupe-class-members': 'off',
};

const tsRules = {
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-inferrable-types': 'off',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-non-null-assertion': 'off',
  '@typescript-eslint/prefer-nullish-coalescing': 'warn',
  '@typescript-eslint/prefer-optional-chain': 'warn',
  '@typescript-eslint/prefer-as-const': 'error',
  '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
  '@typescript-eslint/no-floating-promises': 'warn',
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/no-misused-promises': [
    'warn',
    {
      checksVoidReturn: false,
      checksConditionals: true,
    },
  ],
  '@typescript-eslint/require-await': 'warn',
  '@typescript-eslint/prefer-readonly': 'off',
  '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
  '@typescript-eslint/prefer-includes': 'warn',
  '@typescript-eslint/no-useless-constructor': 'warn',
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
};

module.exports = {
  root: true,
  ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/target/**', '**/*.js', '**/*.jsx', 'www/webpack.*.cjs', 'www/madge.cjs'],
  overrides: [
    {
      ...commonTsOverride,
      files: ['www/src/**/*.{ts,tsx}'],
      env: {
        browser: true,
        node: true,
        es2022: true,
      },
      parserOptions: {
        ...commonTsOverride.parserOptions,
        project: './www/tsconfig.json',
      },
      rules: {
        ...baseRules,
        ...tsRules,
      },
    },
    {
      ...commonTsOverride,
      files: ['mcp-gemini/src/**/*.ts'],
      env: {
        node: true,
        es2022: true,
      },
      parserOptions: {
        ...commonTsOverride.parserOptions,
        project: './mcp-gemini/tsconfig.json',
      },
      rules: {
        ...baseRules,
        ...tsRules,
      },
    },
  ],
};
