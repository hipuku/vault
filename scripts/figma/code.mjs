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

/** The states global.css writes for each of its classes: `.icon-btn:hover`
    gives `icon-btn` hover. Some components are a global class rather than a
    module (IconButton is `.icon-btn`, PopoverTrigger is `.pill`, the cards are
    `.card`), so their states live here. */
function globalClassStates(root) {
  const file = path.join(root, PATHS.components, 'styles', 'global.css')
  const css = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const states = {}
  for (const m of css.matchAll(/\.([\w-]+):(hover|active|disabled)\b/g)) {
    ;(states[m[1]] ??= new Set()).add(m[2])
  }
  return states
}

/** Global classes a component applies: quoted strings made only of class-like
    words, at least one of them a global class with states. */
function globalClassesIn(src, known) {
  const used = new Set()
  for (const m of src.matchAll(/['"`]([^'"`\n]+)['"`]/g)) {
    const words = m[1].trim().split(/\s+/)
    if (!words.every(w => /^[a-z][\w-]*$/.test(w))) continue
    for (const w of words) if (known[w]) used.add(w)
  }
  return [...used]
}

/** Every component folder in the three tiers, with its variant axes and the
    compared states it styles, in its own module or as a global class. */
export function codeComponents(root = '.') {
  const items = {}
  const global = globalClassStates(root)
  for (const tier of TIERS) {
    const dir = path.join(root, PATHS.components, tier)
    for (const name of fs.readdirSync(dir).sort()) {
      const tsx = path.join(dir, name, `${name}.tsx`)
      if (!fs.existsSync(tsx)) continue
      items[`component ${name}`] = tier
      const src = fs.readFileSync(tsx, 'utf8')
      const aliases = unionAliases(src)
      for (const p of variantsOf(tsx).props) {
        const values = p.kind === 'variant' ? p.values : aliases[p.type]
        if (values) items[`axis ${name}.${p.prop}`] = joinSet(values)
      }
      // A component styles its own states in its module. Only when the module
      // styles none is the component a global class (`.card`, `.pill`); a global
      // class used inside a module-styled component belongs to a child, like
      // InlineEdit's pen, which is an `.icon-btn`.
      const own = statesOf(path.join(dir, name, `${name}.module.css`))
      const raw = own.length ? own : globalClassesIn(src, global).flatMap(c => [...global[c]])
      const states = raw.map(s => CSS_STATES[s]).filter(Boolean)
      if (states.length) items[`states ${name}`] = joinSet(states)
    }
  }
  return items
}

export const codeItems = (root = '.') => ({ ...codeTokens(root), ...codeComponents(root) })
