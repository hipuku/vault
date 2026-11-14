/* One vocabulary for both sides. Code and Figma describe the same token or
   component in different units and shapes; everything is reduced here to a flat
   map of item keys to strings, so the diff is plain string equality.

   Item keys:
     token --dot-xs        the token's value
     component Button      the tier it lives in
     axis Button.variant   the axis's values, sorted, joined by |
     states Button         the compared states it styles, sorted, joined by | */

import chroma from 'chroma-js'
import { COMPARED_STATES, isPrivateComponent } from './config.mjs'

const ROOT_PX = 16

export const joinSet = values => [...new Set(values)].sort().join('|')

const round = n => String(Math.round(n * 1000) / 1000)

/** A CSS value or a Figma value, reduced to what both can express. */
export function normaliseValue(raw) {
  if (raw == null) return undefined
  if (typeof raw === 'number') return round(raw)
  if (typeof raw === 'object' && 'alias' in raw) return `{${raw.alias}}`
  if (typeof raw === 'object' && 'hex' in raw) return raw.hex.toLowerCase()
  const v = String(raw).trim()
  const alias = v.match(/^var\((--[\w-]+)\)$/)
  if (alias) return `{${alias[1]}}`
  const len = v.match(/^(-?[\d.]+)(px|rem)$/)
  if (len) return round(Number(len[1]) * (len[2] === 'rem' ? ROOT_PX : 1))
  if (chroma.valid(v)) return chroma(v).hex().toLowerCase()
  // A font stack: Figma holds one family, so compare the first. A comma inside
  // brackets belongs to a function (`cubic-bezier(0.2, 0, 0, 1)`), kept whole.
  const unquote = s => s.trim().replace(/^['"]|['"]$/g, '')
  return v.includes(',') && !v.includes('(') ? unquote(v.split(',')[0]) : unquote(v)
}

/** A Figma colour (0 to 1 channels) as hex, alpha included when it is not opaque. */
export function figmaColourToHex({ r, g, b, a = 1 }) {
  return chroma
    .gl(r, g, b, a)
    .hex(a < 1 ? 'rgba' : 'rgb')
    .toLowerCase()
}

/** The CSS custom property a Figma variable stands for. */
export function variableToProperty(v) {
  const syntax = v.codeSyntax?.WEB?.match(/var\((--[\w-]+)\)/)
  return syntax ? syntax[1] : `--${v.name.replace(/\//g, '-')}`
}

/** Items from one exported Figma file. `tier` is null for the tokens file. */
export function figmaItems(snapshot, tier) {
  const items = {}
  for (const v of snapshot.variables ?? []) {
    items[`token ${variableToProperty(v)}`] = normaliseValue(v.value)
  }
  if (!tier) return items
  for (const c of snapshot.components ?? []) {
    if (c.inSet || isPrivateComponent(c.name)) continue
    items[`component ${c.name}`] = tier
    for (const p of c.props) {
      if (p.type !== 'VARIANT') continue
      const name = p.name.split('#')[0]
      if (name === 'state') {
        const states = p.options.filter(o => COMPARED_STATES.has(o))
        if (states.length) items[`states ${c.name}`] = joinSet(states)
        continue
      }
      // A variant axis of false|true is a boolean, which is a layer toggle as
      // often as a prop; booleans are not compared on either side.
      if (joinSet(p.options.map(o => o.toLowerCase())) === 'false|true') continue
      items[`axis ${c.name}.${name}`] = joinSet(p.options)
    }
  }
  return items
}
