module.exports = {
  env: {
    node: true, // Node.js 环境
    es6: true,
  },
  extends: [
    'eslint:recommended', // 官方推荐规则
    'plugin:prettier/recommended', // 启用prettier插件，解决与eslint的冲突
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error', // prettier格式错误会报错
    'no-unused-vars': 'warn', // 未使用变量警告
    'no-undef': 'error', // 未定义变量报错
  },
}; 