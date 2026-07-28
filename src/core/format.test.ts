import { describe, expect, it } from 'vitest'
import { formatValue } from './format.ts'

describe('formatValue', () => {
  it('renders an empty cell as nothing', () => {
    expect(formatValue({ type: 'empty' })).toBe('')
  })

  it('renders text as-is', () => {
    expect(formatValue({ type: 'text', value: 'hello' })).toBe('hello')
  })

  it('renders any error as #ERROR!', () => {
    expect(formatValue({ type: 'error' })).toBe('#ERROR!')
  })

  it('renders whole numbers without a decimal point', () => {
    expect(formatValue({ type: 'number', value: 42 })).toBe('42')
  })

  it('keeps a short fraction intact', () => {
    expect(formatValue({ type: 'number', value: 4.5 })).toBe('4.5')
  })

  it('hides floating point noise', () => {
    expect(formatValue({ type: 'number', value: 0.1 + 0.2 })).toBe('0.3')
  })

  it('truncates a long fraction', () => {
    expect(formatValue({ type: 'number', value: 1 / 3 })).toBe('0.3333333333')
  })
})
