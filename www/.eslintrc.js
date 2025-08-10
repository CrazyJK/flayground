module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    // Prettier rules
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],

    // General rules
    'no-console': 'off', // 개발 중엔 console 허용
    'no-debugger': 'error',
    'prefer-const': 'warn', // error에서 warn으로
    'no-var': 'error',

    // Disable JS rules that are covered by TypeScript
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'no-redeclare': 'off',
    'no-dupe-class-members': 'off',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './www/tsconfig.json',
      },
      plugins: ['@typescript-eslint', 'prettier'],
      rules: {
        // TypeScript specific rules
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off', // 너무 엄격함
        '@typescript-eslint/explicit-module-boundary-types': 'off', // 너무 엄격함
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': 'warn', // error에서 warn으로
        '@typescript-eslint/prefer-optional-chain': 'warn',
        '@typescript-eslint/prefer-as-const': 'error',
        '@typescript-eslint/no-unnecessary-type-assertion': 'warn', // error에서 warn으로
        '@typescript-eslint/no-floating-promises': 'warn', // error에서 warn으로 (개발 중엔 유연하게)
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/no-misused-promises': [
          'warn',
          {
            checksVoidReturn: false, // 이벤트 핸들러에서 완화
            checksConditionals: true, // 조건문에서는 유지
          },
        ],
        '@typescript-eslint/require-await': 'warn', // error에서 warn으로
        '@typescript-eslint/prefer-readonly': 'off', // 너무 많은 경고 발생
        '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
        '@typescript-eslint/prefer-includes': 'warn',
        '@typescript-eslint/no-useless-constructor': 'warn',
        '@typescript-eslint/switch-exhaustiveness-check': 'error',

        // Disable conflicting rules
        'no-unused-vars': 'off',
        'no-undef': 'off',
        'no-redeclare': 'off',
        'no-dupe-class-members': 'off',

        // Prettier rules
        'prettier/prettier': [
          'error',
          {
            endOfLine: 'auto',
          },
        ],
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'dist/', '**/*.js', '**/*.jsx', 'webpack.*.cjs', 'madge.cjs'],
};
