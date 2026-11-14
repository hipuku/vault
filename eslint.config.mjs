import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'

const NODE_BUILTINS = ['fs', 'path', 'os', 'child_process', 'crypto', 'url', 'electron'].flatMap(m =>
  m === 'electron' ? [m] : [m, `node:${m}`],
)

/** Import patterns that point at `tier` or above it, in either path style. */
const upward = (...tiers) =>
  tiers.map(tier => ({
    group: [`**/${tier}/**`, `@renderer/${tier}/**`],
    message: `Imports never run upward: this file cannot import from ${tier}/.`,
  }))

/* One block per tier, each forbidding the tiers above it. Flat config replaces
   a rule's options rather than merging them, so each tier block repeats the
   renderer's process boundary as well. */
const RENDERER_PATTERNS = [
  { group: ['**/main/**', '**/preload/**'], message: 'The renderer reaches main only through window.api.' },
]
const tierRules = [
  ['atoms', ['molecules', 'organisms', 'pages']],
  ['molecules', ['organisms', 'pages']],
  ['organisms', ['pages']],
].map(([tier, above]) => ({
  files: [`src/renderer/src/${tier}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: NODE_BUILTINS.map(name => ({ name, message: 'The renderer is sandboxed: no Node built-ins.' })),
        patterns: [...RENDERER_PATTERNS, ...upward(...above)],
      },
    ],
  },
}))

export default tseslint.config(
  { ignores: ['out/**', 'dist/**', 'node_modules/**', 'resources/**', '**/*.config.*'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // The build scripts are Node ESM, not app code: they read argv, write files and
  // report to stdout. Without their own globals block they fall through to the base
  // config, which knows no `process` and no `console`.
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'module',
      ecmaVersion: 'latest',
    },
  },
  // Process boundaries. The renderer is sandboxed and reaches privilege only
  // through window.api, so it imports nothing from main or preload and no Node
  // built-in. shared/ is imported by both sides, so it can depend on neither.
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: NODE_BUILTINS.map(name => ({ name, message: 'The renderer is sandboxed: no Node built-ins.' })),
          patterns: RENDERER_PATTERNS,
        },
      ],
    },
  },
  {
    files: ['src/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: NODE_BUILTINS.map(name => ({
            name,
            message: 'shared/ runs in both processes: no Node, no Electron.',
          })),
          patterns: [
            { group: ['**/renderer/**', '**/main/**', '**/preload/**'], message: 'shared/ imports neither side.' },
          ],
        },
      ],
    },
  },
  // Component tiers, after the renderer block so they win for their own files.
  // DESIGN.md says imports never run upward: an atom cannot reach for a
  // molecule, a molecule for an organism, and nothing reaches for a page. Until
  // these blocks that was a convention; now it fails the build.
  ...tierRules,
  // Prettier owns formatting, so disable any stylistic ESLint rules that would fight it.
  prettier,
)
