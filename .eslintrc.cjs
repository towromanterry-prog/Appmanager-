module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // В Vite/Vue проектах это часто мешает на старте
    'vue/multi-word-component-names': 'off',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
  ],
};
