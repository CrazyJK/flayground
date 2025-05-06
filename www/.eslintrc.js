module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['prettier'],
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
  ignorePatterns: ['node_modules/', 'dist/'],
};
