module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended'
  ],
  rules: {
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
    quotes: ['error', 'single'],
    semi: ['error', 'never']
  }
}
