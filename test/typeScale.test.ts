import { describe, it, expect } from 'vitest'
import {
  generateTypeScaleSteps,
  detectKind,
  isHeadingStep,
  isCustomScale,
  STEP_PRESETS,
  RATIO_PRESETS,
} from '@shared/lib/typeScale'

describe('generateTypeScaleSteps', () => {
  it('emits one step per preset entry in order', () => {
    const steps = generateTypeScaleSteps(16, 1.333, 'semantic')
    expect(steps).toHaveLength(STEP_PRESETS.semantic.length)
    expect(steps.map(s => s.step_name)).toEqual(STEP_PRESETS.semantic.map(s => s.name))
    steps.forEach((s, i) => expect(s.sort_order).toBe(i))
  })

  it('anchors the Body step (exponent 0) at exactly the base size', () => {
    const steps = generateTypeScaleSteps(18, 1.5, 'semantic')
    const body = steps.find(s => s.step_name === 'Body')
    expect(body?.size).toBe(18)
  })

  it('rounds sizes to whole pixels', () => {
    const steps = generateTypeScaleSteps(16, 1.25, 'semantic')
    steps.forEach(s => expect(Number.isInteger(s.size)).toBe(true))
  })

  it('scales larger steps up and smaller steps down from the base', () => {
    const steps = generateTypeScaleSteps(16, 1.333, 'semantic')
    const display = steps.find(s => s.step_name === 'Display')!
    const label = steps.find(s => s.step_name === 'Label')!
    expect(display.size).toBeGreaterThan(16)
    expect(label.size).toBeLessThan(16)
  })

  it('carries weight, line-height and tracking from the preset', () => {
    const steps = generateTypeScaleSteps(16, 1.333, 'semantic')
    const display = steps.find(s => s.step_name === 'Display')!
    expect(display.weight).toBe(700)
    expect(display.line_height).toBe('1.1')
    expect(display.letter_spacing).toBe('-0.02em')
  })

  it('produces the markup preset with h1–h6', () => {
    const steps = generateTypeScaleSteps(16, 1.333, 'markup')
    expect(steps.map(s => s.step_name)).toEqual(expect.arrayContaining(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']))
  })

  it('defaults to the semantic preset', () => {
    expect(generateTypeScaleSteps(16, 1.333).map(s => s.step_name)).toEqual(
      generateTypeScaleSteps(16, 1.333, 'semantic').map(s => s.step_name),
    )
  })
})

describe('detectKind', () => {
  it('detects markup from an h-tag name', () => {
    expect(detectKind(['H1', 'H2', 'Paragraph'])).toBe('markup')
  })

  it('treats everything else as semantic', () => {
    expect(detectKind(['Display', 'Body', 'Label'])).toBe('semantic')
    expect(detectKind([])).toBe('semantic')
  })
})

describe('isHeadingStep', () => {
  it('flags heading roles', () => {
    expect(isHeadingStep('Display')).toBe(true)
    expect(isHeadingStep('H1')).toBe(true)
  })

  it('does not flag body roles', () => {
    expect(isHeadingStep('Body')).toBe(false)
    expect(isHeadingStep('Paragraph')).toBe(false)
  })
})

describe('isCustomScale', () => {
  it('is false for an untouched generated scale', () => {
    const steps = generateTypeScaleSteps(16, 1.333, 'semantic').map(s => ({
      step_name: s.step_name,
      size: s.size,
      weight: s.weight,
      line_height: s.line_height,
      letter_spacing: s.letter_spacing,
    }))
    expect(isCustomScale(steps, 16, 1.333)).toBe(false)
  })

  it('is true once a single size has been hand-tuned', () => {
    const steps = generateTypeScaleSteps(16, 1.333, 'semantic').map(s => ({
      step_name: s.step_name,
      size: s.size,
      weight: s.weight,
      line_height: s.line_height,
      letter_spacing: s.letter_spacing,
    }))
    steps[0].size += 1
    expect(isCustomScale(steps, 16, 1.333)).toBe(true)
  })

  it('is true when the step count differs from the generated ramp', () => {
    const steps = generateTypeScaleSteps(16, 1.333, 'semantic')
      .slice(0, 4)
      .map(s => ({
        step_name: s.step_name,
        size: s.size,
        weight: s.weight,
        line_height: s.line_height,
        letter_spacing: s.letter_spacing,
      }))
    expect(isCustomScale(steps, 16, 1.333)).toBe(true)
  })
})

describe('RATIO_PRESETS', () => {
  it('marks exactly one preset as recommended', () => {
    expect(RATIO_PRESETS.filter(p => p.recommended)).toHaveLength(1)
  })

  it('lists ratios in ascending order', () => {
    const values = RATIO_PRESETS.map(p => p.value)
    expect(values).toEqual([...values].sort((a, b) => a - b))
  })
})
