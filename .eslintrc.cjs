module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: ['dist', 'node_modules', '**/*.d.ts'],
  overrides: [
    {
      files: ['*.js', '*.cjs', '*.mjs'],
      extends: ['eslint:recommended', 'prettier'],
      plugins: ['prettier'],
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      rules: {
        'prettier/prettier': 'error',
        'prefer-const': 'error',
        'no-var': 'error',
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      plugins: ['@typescript-eslint', 'prettier'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
      ],
      rules: {
        'prettier/prettier': 'error',
        'prefer-const': 'error',
        'no-var': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/consistent-type-imports': 'off',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.spec.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      plugins: ['@typescript-eslint', 'prettier'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
      ],
      rules: {
        'prettier/prettier': 'error',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
        '@typescript-eslint/no-non-null-assertion': 'off', // Allow non-null assertions in tests
        '@typescript-eslint/consistent-type-imports': 'off',
      },
    },
  ],
};
