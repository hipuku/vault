import fs from 'fs'
import path from 'path'

const SKIP = new Set(['className', 'children', 'style', 'key', 'ref', 'id', 'ariaLabel', 'aria-label'])
const SKIP_RE = /ClassName$|^aria|^data-/ // styling hooks are not Figma properties

/** Pull the props interface out of a component and classify each prop. */
export function variantsOf(tsxPath) {
  const src = fs.readFileSync(tsxPath, 'utf8')
  const name = path.basename(tsxPath, '.tsx')

  // the interface / type that the component's own props are declared in
  const m = src.match(new RegExp(`(?:interface|type)\\s+${name}Props[^{]*\\{([\\s\\S]*?)\\n\\}`, 'm'))
  if (!m) return { name, extends: null, props: [] }

  const ext = (src.match(new RegExp(`${name}Props[^{]*?extends\\s+([^{]+)\\{`)) || [])[1]?.trim() || null

  // defaults, read off the destructured signature
  const sig = src.match(/export function [A-Za-z]+[\s\S]*?\{([\s\S]*?)\}:/)
  const defaults = {}
  if (sig) {
    for (const d of sig[1].matchAll(/(\w+)\s*=\s*('[^']*'|true|false|[\w.]+)/g)) {
      defaults[d[1]] = d[2].replace(/'/g, '')
    }
  }

  const props = []
  const body = m[1]
  // strip doc comments so they do not swallow the next line
  for (const line of body.replace(/\/\*\*[\s\S]*?\*\//g, '').split('\n')) {
    const p = line.match(/^\s*(\w+)(\?)?\s*:\s*(.+?);?\s*$/)
    if (!p) continue
    const [, prop, optional, rawType] = p
    if (SKIP.has(prop) || SKIP_RE.test(prop)) continue
    const type = rawType.replace(/\s+/g, ' ').trim()
    let kind, values
    if (/^'.*'(\s*\|\s*'.*')*$/.test(type)) {
      kind = 'variant'
      values = type.split('|').map(v => v.trim().replace(/'/g, ''))
    } else if (type === 'boolean') {
      kind = 'boolean'
      values = ['true', 'false']
    } else if (type === 'string') {
      kind = 'text'
      values = null
    } else if (/React\.ReactNode|ReactNode|IconDefinition/.test(type)) {
      kind = 'slot'
      values = null
    } else if (/=>/.test(type)) {
      kind = 'event'
      values = null
    } else {
      kind = 'other'
      values = null
    }
    props.push({ prop, optional: !!optional, kind, type, values, default: defaults[prop] ?? null })
  }
  return { name, extends: ext, props }
}

/** Interaction states a component actually styles. These are variant axes in Figma. */
export function statesOf(cssPath) {
  if (!fs.existsSync(cssPath)) return []
  const css = fs.readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const found = new Set()
  for (const m of css.matchAll(/:(hover|focus-visible|focus-within|active|disabled|checked)\b/g)) found.add(m[1])
  if (/\[disabled\]|\.disabled\b/.test(css)) found.add('disabled')
  const ORDER = ['hover', 'active', 'focus-visible', 'focus-within', 'disabled', 'checked']
  return ORDER.filter(s => found.has(s))
}

/** Every Figma frame the component set needs = product of its variant axes. */
export function frameCount(props, states) {
  const axes = props.filter(p => p.kind === 'variant' || p.kind === 'boolean').map(p => p.values.length)
  const n = axes.reduce((a, b) => a * b, 1)
  return n * Math.max(1, states.length + 1)
}
