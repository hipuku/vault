import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error: plain ESM scripts with no type declarations
import { diff, accept, applyExceptions } from '../scripts/figma/diff.mjs'
// @ts-expect-error: plain ESM scripts with no type declarations
import { normaliseValue, figmaItems, variableToProperty } from '../scripts/figma/normalise.mjs'
// @ts-expect-error: plain ESM scripts with no type declarations
import { show } from '../scripts/figma/report.mjs'
// @ts-expect-error: plain ESM scripts with no type declarations
import { statesOf } from '../scripts/variants.mjs'

type Pair = { code?: string; figma?: string }
const kindOf = (code: Record<string, string>, figma: Record<string, string>, baseline: Record<string, Pair>) =>
  diff({ code, figma, baseline }).findings.map((f: { kind: string }) => f.kind)

describe('the decision rules', () => {
  const base = { 'axis Button.size': { code: 'md|sm', figma: 'md|sm' } }

  it('reports nothing when both sides match the baseline', () => {
    expect(kindOf({ 'axis Button.size': 'md|sm' }, { 'axis Button.size': 'md|sm' }, base)).toEqual([])
  })

  it('fails code ahead of Figma', () => {
    const r = diff({ code: { 'axis Button.size': 'lg|md|sm' }, figma: { 'axis Button.size': 'md|sm' }, baseline: base })
    expect(r.findings[0].kind).toBe('code-ahead')
    expect(r.failing).toHaveLength(1)
  })

  it('turns code ahead into a warning under figma-later', () => {
    const r = diff({
      code: { 'axis Button.size': 'lg|md|sm' },
      figma: { 'axis Button.size': 'md|sm' },
      baseline: base,
      figmaLater: true,
    })
    expect(r.findings[0].kind).toBe('code-ahead')
    expect(r.failing).toHaveLength(0)
  })

  it('treats something only Figma has as a proposal', () => {
    expect(kindOf({}, { 'axis Modal.size': 'lg|md' }, {})).toEqual(['figma-new'])
  })

  it('asks for a decision when Figma changes something code has', () => {
    expect(kindOf({ 'axis Button.size': 'md|sm' }, { 'axis Button.size': 'md|sm|xs' }, base)).toEqual(['figma-changed'])
  })

  it('asks for a decision when Figma deletes something code has', () => {
    expect(kindOf({ 'axis Button.size': 'md|sm' }, {}, base)).toEqual(['figma-changed'])
  })

  it('fails when both sides change differently, even under figma-later', () => {
    const r = diff({
      code: { 'axis Button.size': 'lg|md|sm' },
      figma: { 'axis Button.size': 'md|sm|xs' },
      baseline: base,
      figmaLater: true,
    })
    expect(r.findings[0].kind).toBe('conflict')
    expect(r.failing).toHaveLength(1)
  })

  it('keeps drift both sides already had as known, and does not fail it', () => {
    const known = { 'axis Popover.align': { code: 'left|right' } }
    const r = diff({ code: { 'axis Popover.align': 'left|right' }, figma: {}, baseline: known })
    expect(r.findings[0].kind).toBe('known')
    expect(r.failing).toHaveLength(0)
  })

  it('asks to advance the baseline when the sides come back together', () => {
    const known = { 'axis Popover.align': { code: 'left|right' } }
    const both = { 'axis Popover.align': 'left|right' }
    expect(kindOf(both, both, known)).toEqual(['advance'])
  })

  it('notices an item that left both sides', () => {
    expect(kindOf({}, {}, base)).toEqual(['advance'])
  })
})

describe('accepting a baseline', () => {
  it('records the current pair for every item', () => {
    const next = accept({ code: { a: '1' }, figma: { a: '2', b: '3' }, baseline: {} })
    expect(next).toEqual({ a: { code: '1', figma: '2' }, b: { code: undefined, figma: '3' } })
  })

  it('accepts only the named items', () => {
    const next = accept({ code: { a: '1', b: '1' }, figma: { a: '2', b: '2' }, baseline: {}, keys: ['a'] })
    expect(Object.keys(next)).toEqual(['a'])
  })

  it('drops an item absent from both sides', () => {
    const next = accept({ code: {}, figma: {}, baseline: { a: { code: '1', figma: '1' } } })
    expect(next).toEqual({})
  })
})

describe('normalising values', () => {
  it('reads lengths in px, with rem at 16px', () => {
    expect(normaliseValue('0.5rem')).toBe('8')
    expect(normaliseValue('18px')).toBe('18')
    expect(normaliseValue(18)).toBe('18')
  })

  it('reads colours as hex, whatever the space', () => {
    expect(normaliseValue('oklch(60% 0.175 65)')).toBe('#c46300')
    expect(normaliseValue({ hex: '#C46300' })).toBe('#c46300')
  })

  it('rounds a CSS length and a Figma number the same way', () => {
    expect(normaliseValue('1.2345px')).toBe(normaliseValue(1.2345))
  })

  it('keeps a function value whole, commas and all', () => {
    expect(normaliseValue('cubic-bezier(0.2, 0, 0, 1)')).toBe('cubic-bezier(0.2, 0, 0, 1)')
  })

  it('compares the first family of a font stack', () => {
    expect(normaliseValue("'Iowan Old Style', Georgia, serif")).toBe('Iowan Old Style')
  })

  it('writes aliases the same way on both sides', () => {
    expect(normaliseValue('var(--haus-ruby-500)')).toBe('{--haus-ruby-500}')
    expect(normaliseValue({ alias: '--haus-ruby-500' })).toBe('{--haus-ruby-500}')
  })

  it('maps a variable to its CSS property by code syntax, then by name', () => {
    expect(variableToProperty({ name: 'dot/xs', codeSyntax: { WEB: 'var(--dot-xs)' } })).toBe('--dot-xs')
    expect(variableToProperty({ name: 'font-icon' })).toBe('--font-icon')
  })
})

describe('reading Figma components', () => {
  const snapshot = {
    components: [
      {
        name: 'Button',
        inSet: false,
        props: [
          { name: 'variant', type: 'VARIANT', options: ['primary', 'ghost'] },
          { name: 'state', type: 'VARIANT', options: ['rest', 'hover', 'focus', 'pressed'] },
          { name: 'mono', type: 'VARIANT', options: ['True', 'False'] },
          { name: 'label#1:0', type: 'TEXT', options: [] },
        ],
      },
      { name: '_Button content', inSet: false, props: [] },
      { name: 'SegmentedControl / Segment', inSet: false, props: [] },
    ],
  }
  const items = figmaItems(snapshot, 'atoms')

  it('keeps variant axes and drops booleans, text and construction parts', () => {
    expect(items).toEqual({
      'component Button': 'atoms',
      'axis Button.variant': 'ghost|primary',
      'states Button': 'hover|pressed',
    })
  })
})

describe('the report', () => {
  it('escapes the pipes in a value, so a table cell holds all of it', () => {
    expect(show('lg|md|sm')).toBe('`lg\\|md\\|sm`')
    expect(show(undefined)).toBe('(none)')
  })
})

describe('exceptions', () => {
  const exceptions = { 'axis Popover.align': 'Position, not appearance.' }

  it('leaves an excepted item out of every side', () => {
    const r = applyExceptions({
      code: { 'axis Popover.align': 'left|right', 'axis Button.size': 'md|sm' },
      figma: { 'axis Button.size': 'md|sm' },
      baseline: { 'axis Popover.align': { code: 'left|right' } },
      exceptions,
    })
    expect(r.code).toEqual({ 'axis Button.size': 'md|sm' })
    expect(r.baseline).toEqual({})
    expect(r.stale).toEqual([])
  })

  it('calls an exception stale once both sides agree', () => {
    const both = { 'axis Popover.align': 'left|right' }
    expect(applyExceptions({ code: both, figma: both, exceptions }).stale).toEqual(['axis Popover.align'])
  })

  it('calls an exception stale once its item has left both sides', () => {
    expect(applyExceptions({ code: {}, figma: {}, exceptions }).stale).toEqual(['axis Popover.align'])
  })
})

describe('reading states from a stylesheet', () => {
  it('ignores a state that only appears inside :not()', () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'states-')), 'X.module.css')
    fs.writeFileSync(file, '.trigger:hover:not(:disabled) { color: red; }\n.trigger:active { color: blue; }\n')
    expect(statesOf(file)).toEqual(['hover', 'active'])
  })
})
