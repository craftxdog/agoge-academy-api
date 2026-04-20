/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    // Tipos permitidos
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Code style
        'refactor', // Code refactor
        'perf', // Performance
        'test', // Tests
        'chore', // Maintenance
        'revert', // Revert
        'ci', // CI/CD
        'build', // Build system
      ],
    ],

    // Scope obligatorio
    'scope-empty': [2, 'never'],

    // Scopes permitidos
    'scope-enum': [
      2,
      'always',
      [
        'auth',
        'billing',
        'rbac',
        'settings',
        'users',
        'storage',
        'analytics',
        'common',
        'shared',
        'config',
        'database',
        'deps',
        'docker',
        'github',
        'release',
        'ci',
        'docs',
      ],
    ],

    // Subject reglas
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],

    // Header
    'header-max-length': [2, 'always', 100],
  },
};
