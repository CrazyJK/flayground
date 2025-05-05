import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {
      js,
      prettier: prettierPlugin,
    },
    rules: {
      // 사용하지 않는 변수 규칙 비활성화
      'no-unused-vars': 'off',
      // 사용하지 않는 private 클래스 멤버에 대해 경고로 설정
      'no-unused-private-class-members': ['warn'],
      // prettier 규칙 설정
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        process: true,
      },
    },
    ignores: ['node_modules/', 'dist/'],
    // eslint-config-prettier 확장 - 마지막에 적용하여 충돌 방지
    ...prettierConfig,
  },
]);
