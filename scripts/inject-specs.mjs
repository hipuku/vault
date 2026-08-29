import fs from 'fs'
import { specTable } from './spec-table.mjs'
import { pretty } from './resolve-tokens.mjs'

const REF = process.env.REF
const page = process.argv[2]
const map = JSON.parse(process.argv[3])   // { "1 · Button": "src/.../Button.module.css", ... }

let html = fs.readFileSync(`${REF}/${page}`, 'utf8')

// styles for the spec tables, injected once
const STYLE = `
/* ── resolved value tables ─────────────────────────────────────────────── */
.specs { margin-top: var(--space-4); border-top: 1px dashed var(--color-border-default); padding-top: var(--space-4); }
.specs > h3 { font-size: var(--text-11); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-ink-tertiary); margin: 0 0 var(--space-3); }
.specrow { margin-bottom: var(--space-3); }
.specsel { font-size: var(--text-12); margin-bottom: 4px; }
.specsel code { background: var(--color-surface-sunken); padding: 1px 6px; border-radius: var(--radius-sm); }
.valtbl { width: 100%; border-collapse: collapse; font-size: var(--text-12); }
.valtbl td { padding: 3px 8px; border-bottom: 1px solid var(--color-border-subtle); vertical-align: top; }
.valtbl td.p { width: 24%; color: var(--color-ink-secondary); font-weight: var(--weight-medium); }
.valtbl td.t { width: 38%; }
.valtbl td.t code { font-size: var(--text-11); color: var(--color-primary-default); }
.valtbl td.v { font-family: var(--font-mono); font-size: var(--text-11); color: var(--color-ink-primary); }
.valtbl .lit { color: var(--color-ink-tertiary); font-style: italic; font-size: var(--text-11); }
`
if (!html.includes('resolved value tables')) html = html.replace('</style>', STYLE + '</style>')

let done = 0
for (const [heading, css] of Object.entries(map)) {
  if (!fs.existsSync(css)) { console.log('  skip (no css):', heading); continue }
  const i = html.indexOf(`<h2>${heading}`)
  if (i === -1) { console.log('  skip (no heading):', heading); continue }
  const secEnd = html.indexOf('</section>', i)
  if (html.slice(i, secEnd).includes('class="specs"')) { console.log('  already has specs:', heading); continue }
  const table = specTable(css)
  const block = `    <div class="specs">\n      <h3>Resolved values — from ${css.replace('src/renderer/src/','')}</h3>\n${table}    </div>\n  `
  html = html.slice(0, secEnd) + block + html.slice(secEnd)
  done++
}
fs.writeFileSync(`${REF}/${page}`, html)
console.log(`${done} sections given resolved-value tables`)
