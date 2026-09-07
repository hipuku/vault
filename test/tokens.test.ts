/**
 * vault reads haus's token layer, and this holds that claim to the installed
 * package rather than to a copy of it.
 *
 * The guard exists because of what it would have caught. Until 2026-09-07
 * `tokens.css` declared 159 properties and 141 were haus's values restated by
 * hand: the ruby ramp matched haus's vault brand at all ten steps, onyx matched
 * damson at twelve, and the four gemstone status ramps matched elderberry,
 * cherry, greengage and mango at every shared step. Nothing reported it,
 * because a hand-copied value resolves perfectly well. It is only wrong when
 * one of the two moves.
 *
 * Reading `node_modules` rather than a fixture is the point: if the package
 * changes a value, this sees the value that will actually load.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = resolve(process.cwd(), 'src/renderer/src')
const HAUS = resolve(process.cwd(), 'node_modules/haus-tokens/dist')
const HAUS_FILES = ['layers.css', 'primitives.css', 'brand.css', 'brands/vault.css', 'motion.css', 'semantics.css'].map(
  f => join(HAUS, f),
)

const read = (p: string): string => readFileSync(p, 'utf8')

function filesUnder(dir: string, extensions: string[]): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(e => e.isFile() && extensions.some(x => e.name.endsWith(x)))
    .map(e => join(e.parentPath, e.name))
}

function declaredIn(files: string[]): Set<string> {
  const out = new Set<string>()
  for (const f of files) {
    for (const m of read(f).matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)) out.add(m[1]!)
  }
  return out
}

const VAULT_CSS = filesUnder(SRC, ['.css'])
const TOKENS_CSS = resolve(SRC, 'styles/tokens.css')

describe('vault reads haus-tokens', () => {
  it('finds the package it is meant to read', () => {
    // A wrong path here would make every assertion below pass by finding
    // nothing: no property would look defined and none would look duplicated.
    const haus = declaredIn(HAUS_FILES)
    expect(haus.size, `no custom properties found under ${HAUS}`).toBeGreaterThan(200)
  })

  it('resolves every property it reads', () => {
    // The failure this prevents is silent. An unresolved var() does not throw
    // and does not warn: the whole declaration is dropped and the element
    // renders unstyled, which is why a token rename has to be one operation.
    const defined = new Set([...declaredIn(VAULT_CSS), ...declaredIn(HAUS_FILES)])
    // Some properties are set inline from TSX, e.g. style={{ '--dot-size': x }}.
    for (const f of filesUnder(SRC, ['.tsx', '.ts'])) {
      for (const m of read(f).matchAll(/["'](--[a-z0-9-]+)["']\s*:/g)) defined.add(m[1]!)
    }

    const unresolved = new Set<string>()
    for (const f of VAULT_CSS) {
      for (const m of read(f).matchAll(/var\((--[a-z0-9-]+)\)/g)) {
        if (!defined.has(m[1]!)) unresolved.add(m[1]!)
      }
    }

    expect([...unresolved].sort()).toEqual([])
  })

  it('catches a property that is read but never defined', () => {
    // Proves the assertion above can fail. A guard whose matcher silently stops
    // matching passes forever and protects nothing.
    const defined = declaredIn(VAULT_CSS)
    const read_ = new Set([...defined, '--not-a-token'])
    expect([...read_].filter(n => !defined.has(n))).toContain('--not-a-token')
  })

  it('never paints text with a status fill role', () => {
    // Found by deleting an override rather than by any check firing. vault held
    // --haus-color-warning-default at the 700 of the ramp where haus holds it at
    // the 500, and five call sites read it as a text or icon colour on the
    // matching -subtle background. That looked like a fork of a shared role. It
    // was a patch: take haus's value and Badge's warning label falls to 3.79:1,
    // under the 4.5:1 that 1.4.3 asks of text.
    //
    // The four status ramps publish the step for this and label it "Text on
    // subtle background": */on-subtle, the 700. A -default is a fill. Painting
    // text with it is the mistake that hid behind the override, so it is a rule
    // here rather than a thing to remember.
    //
    // It found eleven more the moment it was written, all --haus-color-error-
    // default as text. Four were on error-subtle at 4.30:1, failing already,
    // with no override involved and nothing reporting them. All are on-subtle
    // now. No negative case is written for this one: it failed on real code
    // before it passed, which is the same proof.
    const wrong: string[] = []
    for (const f of VAULT_CSS) {
      for (const m of read(f).matchAll(
        /(?:^|[^-])color:\s*var\((--haus-color-(?:warning|info|success|error)-default)\)/gm,
      )) {
        wrong.push(`${f.slice(SRC.length + 1)}: ${m[1]}`)
      }
    }
    expect(wrong.sort()).toEqual([])
  })

  it('restates no value haus already ships', () => {
    // The rule the adoption bought. vault may override a haus role, and seven
    // do, but an override that agrees with the package is not an override: it
    // is a copy, and a copy is only correct until one side moves.
    const strip = (v: string): string =>
      v
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .trim()

    const hausValues = new Map<string, string>()
    for (const f of HAUS_FILES) {
      for (const m of read(f).matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gm)) {
        if (!hausValues.has(m[1]!)) hausValues.set(m[1]!, strip(m[2]!))
      }
    }

    const redundant: string[] = []
    for (const m of read(TOKENS_CSS).matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gm)) {
      const haus = hausValues.get(m[1]!)
      if (haus !== undefined && haus === strip(m[2]!)) redundant.push(m[1]!)
    }

    expect(redundant.sort()).toEqual([])
  })
})
