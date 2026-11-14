/* The code side of the parity check: vault's own tokens and its components,
   reduced to the same item keys as the Figma side (see normalise.mjs). */

import fs from 'fs'
import path from 'path'
import { variantsOf, statesOf } from '../variants.mjs'
import { CSS_STATES, PATHS, TIERS } from './config.mjs'
import { joinSet, normaliseValue } from './normalise.mjs'

/** Custom properties vault declares itself. `--haus-*` names are haus's roles,
    which the haus library holds in Figma; an override of one is not a vault
    token, so it is left to haus's own check. */
export function codeTokens(root = '.') {
  const css = fs.readFileSync(path.join(root, PATHS.tokens), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const items = {}
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = m
    if (name.startsWith('--haus-')) continue
    items[`token ${name}`] = normaliseValue(value)
  }
  return items
}

/** String-union type aliases declared in the file: `size?: ModalSize` is as much
    a variant axis as `size?: 'sm' | 'md'`, and variantsOf only reads the second. */
function unionAliases(src) {
  const aliases = {}
  for (const m of src.matchAll(/^(?:export )?type (\w+)\s*=\s*('[^'\n]*'(?:\s*\|\s*'[^'\n]*')+)/gm)) {
    aliases[m[1]] = m[2].split('|').map(v => v.trim().replace(/'/g, ''))
  }
  return aliases
}

/** Every component folder in the three tiers, with its variant axes and the
    compared states its stylesheet styles. */
export function codeComponents(root = '.') {
  const items = {}
  for (const tier of TIERS) {
    const dir = path.join(root, PATHS.components, tier)
    for (const name of fs.readdirSync(dir).sort()) {
      const tsx = path.join(dir, name, `${name}.tsx`)
      if (!fs.existsSync(tsx)) continue
      items[`component ${name}`] = tier
      const aliases = unionAliases(fs.readFileSync(tsx, 'utf8'))
      for (const p of variantsOf(tsx).props) {
        const values = p.kind === 'variant' ? p.values : aliases[p.type]
        if (values) items[`axis ${name}.${p.prop}`] = joinSet(values)
      }
      const states = statesOf(path.join(dir, name, `${name}.module.css`))
        .map(s => CSS_STATES[s])
        .filter(Boolean)
      if (states.length) items[`states ${name}`] = joinSet(states)
    }
  }
  return items
}

export const codeItems = (root = '.') => ({ ...codeTokens(root), ...codeComponents(root) })
