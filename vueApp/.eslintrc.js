module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended', // Vue3推荐规则
    'plugin:@typescript-eslint/recommended', // TS推荐规则
    'plugin:prettier/recommended', // 启用prettier插件，解决与eslint的冲突
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['vue', '@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error', // prettier格式错误会报错
    'vue/multi-word-component-names': 'off', // 允许单词组件名
    '@typescript-eslint/no-unused-vars': 'warn',
  },
}; 