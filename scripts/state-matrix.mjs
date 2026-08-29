import fs from 'fs'

/** Every rule in a stylesheet, in source order. */
function rules(css) {
  const out = []
  css = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const decls = {}
    for (const d of m[2].split(';')) {
      const i = d.indexOf(':')
      if (i === -1) continue
      const p = d.slice(0, i).trim()
      if (p && !p.startsWith('--')) decls[p] = d.slice(i + 1).trim()
    }
    for (const sel of m[1].split(',')) out.push({ sel: sel.trim().replace(/\s+/g, ' '), decls })
  }
  return out
}

function stateOf(sel) {
  const m = sel.match(/:(hover|active|focus-visible|focus-within|disabled|checked)\b/)
  return m ? m[1] : null
}

/** Class + pseudo-class count — what decides these rules against each other. */
function specificity(sel) {
  return (sel.match(/\.[A-Za-z][\w-]*/g) || []).length + (sel.match(/:(?!not\()[a-z-]+/g) || []).length
}

/** Effective declarations for one set of classes in one state. */
function computed(rs, classes, state, props) {
  const have = new Set(classes.filter(Boolean))
  const matched = []
  for (const [i, r] of rs.entries()) {
    const cs = [...r.sel.matchAll(/\.([A-Za-z][\w-]*)/g)].map(m => m[1])
    if (!cs.length || !cs.every(c => have.has(c))) continue
    const s = stateOf(r.sel)
    if (s && s !== state) continue
    if (/:not\(:disabled\)/.test(r.sel) && state === 'disabled') continue
    matched.push({ r, spec: specificity(r.sel), i })
  }
  matched.sort((a, b) => a.spec - b.spec || a.i - b.i)
  const out = {}
  for (const { r } of matched) for (const p of props) if (r.decls[p] !== undefined) out[p] = r.decls[p]
  return out
}

export const PAINT = ['background', 'background-color', 'color', 'border-color', 'border', 'opacity', 'box-shadow']
export const LAYOUT = ['height', 'padding', 'border-radius', 'font-size', 'font-weight', 'gap']
const ALL = [...PAINT, ...LAYOUT]

/** Cartesian product of the declared axes. */
function combos(axes) {
  return axes.reduce((acc, ax) =>
    acc.flatMap(row => ax.values.map(v => [...row, { prop: ax.prop, value: v, asClass: ax.asClass }])), [[]])
}

/**
 * One row per combination of every non-state axis, one cell per state.
 * `asClass` axes contribute a CSS class; the others (an icon, a label) change the
 * frame without changing the selector, so they are carried through for rendering.
 */
export function fullMatrix({ cssPath, base, axes, states, labels = {} }) {
  const rs = rules(fs.readFileSync(cssPath, 'utf8'))
  return combos(axes).map(combo => {
    const classes = [base, ...combo.filter(c => c.asClass && c.value !== null).map(c => c.value)]
    const cells = states.map(st => {
      const values = computed(rs, classes, st, ALL)
      const dflt = computed(rs, classes, null, ALL)
      const differs = st === null || PAINT.some(p => values[p] !== dflt[p])
      return { state: st, values, differs }
    })
    const label = combo
      .map(c => labels[c.value] ?? (c.value === null ? (labels[`${c.prop}:null`] ?? 'default') : c.value))
      .join(' · ')
    return { combo, label, cells }
  })
}
