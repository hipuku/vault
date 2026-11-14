import { builtinModules } from 'node:module'
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y-x'

/* Import boundaries, each a regex over the written specifier. ESLint does not
   resolve aliases, so `@renderer/` is named alongside relative paths. */
const BUILTINS = [...new Set(builtinModules.map(m => m.replace(/^node:/, '')))]
const NODE = `^(node:|electron(/|$)|(${BUILTINS.join('|')})(/|$))`
const MAIN = '(^|/)(main|preload)(/|$)'

/** Both rules for a set of boundaries: no-restricted-imports covers static
    imports and re-exports, and no-restricted-syntax covers `import('...')`
    and the type form `import('...').Name`, which no-restricted-imports does
    not see. A slash cannot appear inside an esquery regex, so it is written
    as `\x2F` there. */
const boundaries = list => ({
  'no-restricted-imports': ['error', { patterns: list.map(({ regex, message }) => ({ regex, message })) }],
  'no-restricted-syntax': [
    'error',
    ...list.map(({ regex, message }) => ({
      selector: `:matches(ImportExpression, TSImportType)[source.value=/${regex.replaceAll('/', '\\x2F')}/]`,
      message,
    })),
  ],
})

/* The renderer is sandboxed and reaches privilege only through window.api, so
   it imports nothing from main or preload and no Node built-in. */
const RENDERER = [
  { regex: NODE, message: 'The renderer is sandboxed: no Node built-ins.' },
  { regex: MAIN, message: 'The renderer reaches main only through window.api.' },
]

/* One block per tier, each forbidding the tiers above it. Flat config replaces
   a rule's options rather than merging them, so each tier block repeats the
   renderer's process boundary as well. */
const tierRules = [
  ['atoms', ['molecules', 'organisms', 'pages']],
  ['molecules', ['organisms', 'pages']],
  ['organisms', ['pages']],
].map(([tier, above]) => ({
  files: [`src/renderer/src/${tier}/**/*.{ts,tsx}`],
  rules: boundaries([
    ...RENDERER,
    {
      regex: `(^|/)(${above.join('|')})(/|$)`,
      message: `Imports never run upward: a file in ${tier}/ cannot import from ${above.join('/, ')}/.`,
    },
  ]),
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
      'react-hooks/exhaustive-deps': 'error',
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
  // Accessibility in JSX, caught at the line rather than in an audit. A
  // deliberate exception is disabled at its site with its reason. The fork is
  // used because eslint-plugin-jsx-a11y does not support ESLint 10 yet.
  {
    files: ['src/renderer/**/*.tsx'],
    ...jsxA11y.configs.recommended,
    rules: {
      ...jsxA11y.configs.recommended.rules,
      // vault's Input and Select render the control inside a wrapping <label>.
      'jsx-a11y-x/label-has-associated-control': ['error', { controlComponents: ['Input', 'Select'], depth: 3 }],
      // Every autoFocus moves focus into a surface the user just opened (a
      // dialog, a popover, an inline editor), as the WAI-ARIA dialog pattern
      // asks; none fires on page load.
      'jsx-a11y-x/no-autofocus': 'off',
    },
  },
  // Promises with type information. Vault's IPC is all promises, so a call nobody
  // awaits is where a failure disappears. A deliberate fire-and-forget says so
  // with `void`. An async handler passed to a JSX attribute is allowed: React
  // ignores a handler's return value.
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
    },
  },
  // Process boundaries. shared/ is imported by both sides, so it can depend on
  // neither: no Node, no Electron, and nothing from renderer, main or preload.
  { files: ['src/renderer/**/*.{ts,tsx}'], rules: boundaries(RENDERER) },
  {
    files: ['src/shared/**/*.ts'],
    rules: boundaries([
      { regex: NODE, message: 'shared/ runs in both processes: no Node, no Electron.' },
      { regex: '(^|/)(renderer|main|preload)(/|$)|^@renderer(/|$)', message: 'shared/ imports neither side.' },
    ]),
  },
  // Component tiers, after the renderer block so they win for their own files.
  // DESIGN.md says imports never run upward: an atom cannot reach for a
  // molecule, a molecule for an organism, and nothing reaches for a page. Until
  // these blocks that was a convention; now it fails the build.
  ...tierRules,
  // Prettier owns formatting, so disable any stylistic ESLint rules that would fight it.
  prettier,
)
