module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended', // React推荐规则
    'plugin:@typescript-eslint/recommended', // TS推荐规则
    'plugin:prettier/recommended', // 启用prettier插件，解决与eslint的冲突
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error', // prettier格式错误会报错
    'react/react-in-jsx-scope': 'off', // React 17+不需要引入React
    '@typescript-eslint/no-unused-vars': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}; 