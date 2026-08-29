import fs from 'fs'
import { stateMatrix } from './state-matrix.mjs'
import { pretty } from './resolve-tokens.mjs'

const REF = process.env.REF
const page = process.argv[2]
const specs = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'))
let html = fs.readFileSync(`${REF}/${page}`, 'utf8')

const STYLE = `
/* ── state matrix ──────────────────────────────────────────────────────── */
.mx { margin-top: var(--space-4); border-top: 1px dashed var(--color-border-default); padding-top: var(--space-4); }
.mx > h3 { font-size: var(--text-11); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-ink-tertiary); margin: 0 0 var(--space-3); }
.mxtbl { border-collapse: collapse; width: 100%; }
.mxtbl th { font-size: var(--text-11); text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-ink-tertiary); font-weight: var(--weight-semibold); text-align: left; padding: 0 10px 6px 0; }
.mxtbl td { padding: 8px 10px 8px 0; border-top: 1px solid var(--color-border-subtle); vertical-align: top; }
.mxtbl td.rowh { font-family: var(--font-mono); font-size: var(--text-11); color: var(--color-primary-default); white-space: nowrap; padding-top: 14px; }
.mxcell .chip { display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; border-style: solid; }
.mxvals { margin-top: 5px; font-family: var(--font-mono); font-size: 10px; line-height: 1.5; color: var(--color-ink-tertiary); }
.mxvals b { color: var(--color-ink-secondary); font-weight: var(--weight-medium); }
.mxsame { font-size: var(--text-11); color: var(--color-ink-tertiary); font-style: italic; }
`
if (!html.includes('state matrix')) html = html.replace('</style>', STYLE + '</style>')

const SHOW = ['background', 'color', 'border-color', 'opacity']

let done = 0
for (const [heading, spec] of Object.entries(specs)) {
  const rows = stateMatrix(spec)
  const states = spec.states
  const byVariant = new Map()
  for (const r of rows) {
    if (!byVariant.has(r.variant)) byVariant.set(r.variant, {})
    byVariant.get(r.variant)[String(r.state)] = r
  }

  let t = '      <table class="mxtbl"><thead><tr><th></th>'
  for (const s of states) t += `<th>${s ?? 'default'}</th>`
  t += '</tr></thead><tbody>\n'

  for (const [variant, cells] of byVariant) {
    const label = variant === "null" || variant === null
      ? (spec.baseLabel ?? "default")
      : (spec.labels?.[variant] ?? variant)
    t += `        <tr><td class="rowh">${label}</td>`
    for (const s of states) {
      const r = cells[String(s)]
      const v = r.values
      const style = [
        `background:${pretty(v.background ?? v['background-color'] ?? 'transparent')}`,
        `color:${pretty(v.color ?? 'inherit')}`,
        `border-width:${pretty(spec.chip?.borderWidth ?? '1px')}`,
        `border-color:${pretty(v['border-color'] ?? 'transparent')}`,
        `border-radius:${pretty(spec.chip?.radius ?? '9999px')}`,
        `height:${pretty(spec.chip?.height ?? '40px')}`,
        `padding:${pretty(spec.chip?.padding ?? '0 20px')}`,
        `font-size:${pretty(spec.chip?.fontSize ?? '14px')}`,
        `font-weight:${pretty(v['font-weight'] ?? spec.chip?.fontWeight ?? '700')}`,
        `font-family:var(--font-sans)`,
        v.opacity ? `opacity:${pretty(v.opacity)}` : '',
      ].filter(Boolean).join(';')
      const vals = SHOW.filter(k => v[k] !== undefined)
        .map(k => `<b>${k}</b> ${pretty(v[k])}`).join('<br>')
      const same = s !== null && !r.differs
        ? '<div class="mxsame">same as default — no frame needed</div>' : ''
      t += `<td class="mxcell"><span class="chip" style="${style}">${spec.chip?.label ?? 'Label'}</span>${same}<div class="mxvals">${vals}</div></td>`
    }
    t += '</tr>\n'
  }
  t += '      </tbody></table>\n'

  const real = rows.filter(r => r.differs).length
  const note = `      <p class="frames">${real} distinct frames — cells marked “same as default” need no frame of their own.</p>\n`
  const block = `    <div class="mx">\n      <h3>Every variant × state, rendered</h3>\n${t}${note}    </div>\n  `

  const i = html.indexOf(`<h2>${heading}`)
  if (i === -1) { console.log('  no heading:', heading); continue }
  const secEnd = html.indexOf('</section>', i)
  if (html.slice(i, secEnd).includes('class="mx"')) { console.log('  already:', heading); continue }
  html = html.slice(0, secEnd) + block + html.slice(secEnd)
  done++
}
fs.writeFileSync(`${REF}/${page}`, html)
console.log(`${done} sections given a rendered state matrix`)
