import fs from 'fs'
import { pretty, tokensIn } from './resolve-tokens.mjs'

const SRC = 'src/renderer/src'
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

/** Parse a .module.css into [{selector, decls:[[prop,value]]}] */
function rules(css) {
  const out = []
  css = css.replace(/\/\*[\s\S]*?\*\//g, '')   // comments first, or they land in selectors
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const sel = m[1].trim().replace(/\s+/g,' ')
    const decls = m[2].split(';').map(d => d.trim()).filter(Boolean)
      .map(d => { const i = d.indexOf(':'); return [d.slice(0,i).trim(), d.slice(i+1).trim()] })
      .filter(([p]) => p && !p.startsWith('--'))
    if (decls.length) out.push({ sel, decls })
  }
  return out
}

/** Group the properties a designer actually sets in Figma, in the order they set them. */
const ORDER = ['height','min-height','width','min-width','max-width','padding','gap',
  'border-radius','border','border-color','border-width','background','background-color','color',
  'font-family','font-size','font-weight','line-height','letter-spacing','text-transform',
  'box-shadow','opacity','transition']
const rank = p => { const i = ORDER.indexOf(p); return i === -1 ? 99 : i }

export function specTable(cssPath, keep) {
  const css = fs.readFileSync(cssPath,'utf8')
  const rs = rules(css).filter(r => !keep || keep.some(k => r.sel === k || r.sel.startsWith(k+':') || r.sel.startsWith(k+' ')))
  let html = ''
  for (const r of rs) {
    const decls = r.decls.filter(([p]) => rank(p) < 99).sort((a,b) => rank(a[0]) - rank(b[0]))
    if (!decls.length) continue
    html += `      <div class="specrow"><div class="specsel"><code>${esc(r.sel)}</code></div>\n`
    html += '      <table class="valtbl"><tbody>\n'
    for (const [prop, val] of decls) {
      const toks = tokensIn(val)
      const tokCell = toks.length ? toks.map(t => `<code>${t}</code>`).join(' ') : '<span class="lit">literal</span>'
      html += `        <tr><td class="p">${esc(prop)}</td><td class="t">${tokCell}</td><td class="v">${esc(pretty(val))}</td></tr>\n`
    }
    html += '      </tbody></table></div>\n'
  }
  return html
}


