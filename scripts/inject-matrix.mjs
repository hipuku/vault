import fs from 'fs'
import { fullMatrix, PAINT } from './state-matrix.mjs'
import { pretty } from './resolve-tokens.mjs'

const REF = process.env.REF
const page = process.argv[2]
const specs = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'))
let html = fs.readFileSync(`${REF}/${page}`, 'utf8')

const STYLE = `
/* ── state matrix ──────────────────────────────────────────────────────── */
.mx { margin-top: var(--space-4); border-top: 1px dashed var(--color-border-default); padding-top: var(--space-4); }
.mx > h3 { font-size: var(--text-11); text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-ink-tertiary); margin: 0 0 var(--space-3); }
.mxwrap { overflow-x: auto; }
.mxtbl { border-collapse: collapse; }
.mxtbl th { font-size: var(--text-11); text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-ink-tertiary); font-weight: var(--weight-semibold); text-align: left; padding: 0 14px 6px 0; }
.mxtbl td { padding: 9px 14px 9px 0; border-top: 1px solid var(--color-border-subtle); vertical-align: top; }
.mxtbl td.rowh { font-family: var(--font-mono); font-size: var(--text-11); color: var(--color-primary-default); white-space: nowrap; padding-top: 15px; padding-right: var(--space-4); }
.mxcell .chip { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); white-space: nowrap; border-style: solid; }
.mxcell .chip svg { width: .85em; height: .85em; fill: currentColor; }
.mxvals { margin-top: 6px; font-family: var(--font-mono); font-size: 10px; line-height: 1.55; color: var(--color-ink-tertiary); }
.mxvals b { color: var(--color-ink-secondary); font-weight: var(--weight-medium); }
.mxsame { font-size: var(--text-11); color: var(--color-ink-tertiary); font-style: italic; margin-top: 4px; }
`
if (!html.includes('state matrix')) html = html.replace('</style>', STYLE + '</style>')

const PLUS = '<svg viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/></svg>'

let done = 0
for (const [heading, spec] of Object.entries(specs)) {
  const rows = fullMatrix(spec)
  const states = spec.states

  let t = '      <div class="mxwrap"><table class="mxtbl"><thead><tr><th></th>'
  for (const s of states) t += `<th>${s ?? 'default'}</th>`
  t += '</tr></thead><tbody>\n'

  for (const row of rows) {
    const wantsIcon = row.combo.some(c => c.prop === 'icon' && c.value === true)
    t += `        <tr><td class="rowh">${row.label}</td>`
    for (const cell of row.cells) {
      const v = cell.values
      const px = k => v[k] !== undefined ? pretty(v[k]) : null
      const style = [
        `background:${px('background') ?? px('background-color') ?? 'transparent'}`,
        `color:${px('color') ?? 'inherit'}`,
        `border-width:1px`,
        `border-color:${px('border-color') ?? 'transparent'}`,
        `border-radius:${px('border-radius') ?? '9999px'}`,
        `height:${px('height') ?? '40px'}`,
        `padding:${px('padding') ?? '0 20px'}`,
        `font-size:${px('font-size') ?? '14px'}`,
        `font-weight:${px('font-weight') ?? '600'}`,
        `font-family:var(--font-sans)`,
        v.opacity ? `opacity:${pretty(v.opacity)}` : '',
        v['box-shadow'] ? `box-shadow:${pretty(v['box-shadow'])}` : '',
      ].filter(Boolean).join(';')
      const vals = PAINT.filter(k => v[k] !== undefined && k !== 'border')
        .map(k => `<b>${k}</b> ${pretty(v[k])}`).join('<br>')
      const same = !cell.differs ? '<div class="mxsame">same as default — no frame needed</div>' : ''
      t += `<td class="mxcell"><span class="chip" style="${style}">${wantsIcon ? PLUS : ''}${spec.label ?? 'Label'}</span>${same}<div class="mxvals">${vals}</div></td>`
    }
    t += '</tr>\n'
  }
  t += '      </tbody></table></div>\n'

  const cells = rows.flatMap(r => r.cells)
  const distinct = cells.filter(c => c.differs).length
  const note = `      <p class="frames">${rows.length} combinations × ${states.length} state${states.length === 1 ? '' : 's'} = ${cells.length} cells; <b>${distinct} need a frame</b> — the rest repeat the default.</p>\n`
  const block = `    <div class="mx">\n      <h3>Every variant × state, rendered</h3>\n${t}${note}    </div>\n  `

  const i = html.indexOf(`<h2>${heading}`)
  if (i === -1) { console.log('  no heading:', heading); continue }
  const secEnd = html.indexOf('</section>', i)
  if (html.slice(i, secEnd).includes('class="mx"')) { console.log('  already:', heading); continue }
  html = html.slice(0, secEnd) + block + html.slice(secEnd)
  done++
}
fs.writeFileSync(`${REF}/${page}`, html)
console.log(`${done} sections given a rendered matrix`)
