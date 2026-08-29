import fs from 'fs'
import { pretty } from './resolve-tokens.mjs'

/** Every rule in a module stylesheet, in source order (cascade order). */
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

/** Which pseudo-state, if any, a selector targets. */
function stateOf(sel) {
  const m = sel.match(/:(hover|active|focus-visible|focus-within|disabled|checked)\b/)
  return m ? m[1] : null
}

/**
 * Effective values for one variant in one state, by walking the sheet in source order
 * and applying every rule whose class list this combination satisfies.
 */
/** Class + pseudo-class count, which is what decides these rules against each other. */
function specificity(sel) {
  const classes = (sel.match(/\.[A-Za-z][\w-]*/g) || []).length
  const pseudos = (sel.match(/:(?!not\()[a-z-]+/g) || []).length
  return classes + pseudos
}

function computed(rs, base, variant, size, state, props) {
  const have = new Set([base, variant, size].filter(Boolean))
  const matched = []
  for (const [i, r] of rs.entries()) {
    const classes = [...r.sel.matchAll(/\.([A-Za-z][\w-]*)/g)].map(m => m[1])
    if (!classes.length || !classes.every(c => have.has(c))) continue
    const s = stateOf(r.sel)
    if (s && s !== state) continue                       // a state rule for a different state
    if (/:not\(:disabled\)/.test(r.sel) && state === 'disabled') continue
    matched.push({ r, spec: specificity(r.sel), i })
  }
  // Apply in cascade order: specificity first, source order as the tie-break. Without
  // the specificity pass a later low-specificity rule (.block) wrongly beat an earlier
  // higher one (.trigger:focus-visible), and the matrix showed a focus ring that the
  // browser never renders that way.
  matched.sort((a, b) => a.spec - b.spec || a.i - b.i)
  const out = {}
  for (const { r } of matched) for (const p of props) if (r.decls[p] !== undefined) out[p] = r.decls[p]
  return out
}

const VISUAL = ['background', 'background-color', 'color', 'border-color', 'border', 'opacity', 'box-shadow', 'font-weight']

export function stateMatrix({ cssPath, base, variants, sizes = [null], states }) {
  const rs = rules(fs.readFileSync(cssPath, 'utf8'))
  const rows = []
  for (const v of variants) {
    for (const size of sizes) {
      for (const st of states) {
        const c = computed(rs, base, v, size, st, VISUAL)
        // does this state actually differ from the default?
        const d = computed(rs, base, v, size, null, VISUAL)
        const changed = Object.keys(c).filter(k => c[k] !== d[k])
        rows.push({ variant: v, size, state: st, values: c, differs: st === null ? true : changed.length > 0, changed })
      }
    }
  }
  return rows
}
export { VISUAL }
