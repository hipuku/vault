import { describe, it, expect } from 'vitest'
import {
  formatSize,
  formatLineHeight,
  formatTracking,
  formatWeight,
} from '@renderer/lib/typeUnits'

describe('formatSize', () => {
  it('renders px verbatim', () => {
    expect(formatSize(16, 'px')).toBe('16px')
    expect(formatSize(24, 'px')).toBe('24px')
  })

  it('converts to rem against a 16px root', () => {
    expect(formatSize(16, 'rem')).toBe('1rem')
    expect(formatSize(24, 'rem')).toBe('1.5rem')
    expect(formatSize(8, 'rem')).toBe('0.5rem')
  })

  it('converts to pt at 0.75×', () => {
    expect(formatSize(16, 'pt')).toBe('12pt')
    expect(formatSize(24, 'pt')).toBe('18pt')
  })

  it('trims to at most 3 decimals with no trailing zeros', () => {
    // 13 / 16 = 0.8125 → rounds to 0.813
    expect(formatSize(13, 'rem')).toBe('0.813rem')
  })
})

describe('formatLineHeight', () => {
  it('keeps unitless multipliers as bare numbers', () => {
    expect(formatLineHeight('1.6', 16, 'unitless')).toBe('1.6')
  })

  it('resolves px against the step size', () => {
    expect(formatLineHeight('1.5', 20, 'px')).toBe('30px')
  })

  it('resolves percent', () => {
    expect(formatLineHeight('1.6', 16, '%')).toBe('160%')
  })

  it('passes non-numeric keywords (e.g. "normal") through untouched', () => {
    expect(formatLineHeight('normal', 16, 'px')).toBe('normal')
    expect(formatLineHeight('normal', 16, '%')).toBe('normal')
  })
})

describe('formatTracking', () => {
  it('emits a bare "0" for zero tracking in every unit', () => {
    expect(formatTracking('0', 16, 'em')).toBe('0')
    expect(formatTracking('0', 16, 'px')).toBe('0')
    expect(formatTracking('0', 16, '%')).toBe('0')
  })

  it('keeps em values, including negatives', () => {
    expect(formatTracking('-0.02em', 16, 'em')).toBe('-0.02em')
    expect(formatTracking('0.08em', 16, 'em')).toBe('0.08em')
  })

  it('resolves em → px against the step size', () => {
    expect(formatTracking('-0.02em', 100, 'px')).toBe('-2px')
  })

  it('resolves em → percent', () => {
    expect(formatTracking('0.08em', 16, '%')).toBe('8%')
  })
})

describe('formatWeight', () => {
  it('renders the numeric weight', () => {
    expect(formatWeight(700, 'number')).toBe('700')
  })

  it('maps known weights to names', () => {
    expect(formatWeight(400, 'name')).toBe('Regular')
    expect(formatWeight(700, 'name')).toBe('Bold')
  })

  it('falls back to the number for unnamed weights', () => {
    expect(formatWeight(450, 'name')).toBe('450')
  })
})
