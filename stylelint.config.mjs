/**
 * The hardcoded-value gate.
 *
 * vault ships a token layer of 159 custom properties and had nothing checking
 * that components read it. Of the seven repos in this portfolio, this is the
 * one where that gap costs most: the app's entire subject is colour and type
 * values, and its own were the only ones nothing was measuring.
 *
 * Ported from haus, by way of drift, so the three agree about what counts as a
 * bypass. A rule stricter in the system than in the products teaches nobody
 * anything.
 */

/**
 * Values that are deliberately off the scale.
 *
 * The list is the point of the config: a blanket rule exclusion would hide
 * these, and enumerating them means a *new* raw value still fails while these
 * stay visible in one place. Grouped, with a reason per group.
 */
const OFF_SCALE = [
  /* ── Ink on a user's colour ────────────────────────────────────────────────
     Four labels that sit on top of a swatch the user chose, so the surface
     underneath is arbitrary and no semantic role describes it.
     `--color-ink-inverse` is white too, and means "text on a dark surface of
     ours", which is a different claim. ColorCard already says so at the call
     site: "Always light: the 10-shade ramp revealed on hover is dark at this
     corner". Four occurrences is enough to be a repeated decision rather than
     an oversight, and worth a role of its own one day. */
  '#fff',

  /* ── Off the type scale ────────────────────────────────────────────────────
     Two display sizes above the scale's top step of 28px, one specimen size
     between 16 and 20, and `em` sizes that are ratios to a parent and so
     cannot be a token at all. This is a font tool: some type here is the
     subject rather than the interface. */
  '32px',
  '18px',
  '0.85em',

  /* ── Below the leading and tracking scales ─────────────────────────────────
     1.1 is tighter than --leading-tight at 1.15, and 0.04em sits between
     --tracking-wide and nothing. Both are on display strings tuned by eye. */
  '1.1',
  '0.04em',

  /* ── Not measurements ──────────────────────────────────────────────────────
     A viewport fraction for a modal's offset, two panel floors, and a 5px
     vertical inset that is deliberately off the 4px grid because the control
     it pads is 26px. */
  '14vh',
  '120px',
  '240px',
  '5px var(--space-3)',
]

export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    'scale-unlimited/declaration-strict-value': [
      [
        '/color$/',
        'background',
        'box-shadow',
        'font-size',
        'font-weight',
        'font-family',
        'line-height',
        'letter-spacing',
        '/^padding/',
        '/^margin/',
        'gap',
        'row-gap',
        'column-gap',
        'border-radius',
        'border-width',
        'min-height',
        'z-index',
      ],
      {
        ignoreKeywords: [
          'transparent',
          'currentColor',
          'currentcolor',
          'inherit',
          'initial',
          'unset',
          'revert',
          'none',
          'auto',
        ],
        ignoreValues: ['0', '1', '50%', '100%', '1px', '2px', '-2px', ...OFF_SCALE],
        disableFix: true,
        message: 'Use a design token: `${property}` must be a var(--…), not a hardcoded value',
      },
    ],

    'custom-property-pattern': null,
    'selector-class-pattern': null,
    'declaration-empty-line-before': null,
    'no-descending-specificity': null,
    'alpha-value-notation': null,
    'color-function-notation': null,
    'rule-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'comment-empty-line-before': null,
    'declaration-block-single-line-max-declarations': null,
    'keyframes-name-pattern': null,
    'hue-degree-notation': null,
    'value-keyword-case': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'property-no-unknown': [true, { ignoreProperties: ['composes'] }],

    /* Off, as in drift, and for the same reason: there is no autoprefixer or
       browserslist here, so any -webkit- prefix is hand-written and
       load-bearing. Running --fix with this rule on stripped
       -webkit-backdrop-filter from drift's shell header, which Safari still
       requires. Electron is Chromium so the stakes are lower, but a rule that
       removes working CSS to satisfy itself is off whatever the renderer. */
    'property-no-vendor-prefix': null,
  },

  overrides: [
    {
      /* The token layer declares the values everything else reads, so a rule
         saying "use a token" cannot apply to the file defining them. */
      files: ['src/renderer/src/styles/*.css'],
      rules: {
        'scale-unlimited/declaration-strict-value': null,
        'no-duplicate-selectors': null,
      },
    },
  ],

  ignoreFiles: ['**/out/**', '**/dist/**', '**/node_modules/**', '**/coverage/**'],
}
