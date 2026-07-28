import { describe, expect, it } from 'vitest'
import { toAddress, toCoord } from './address.ts'
import { FormulaError } from './types.ts'

describe('toCoord', () => {
  it('maps the top-left cell to the origin', () => {
    expect(toCoord('A1')).toEqual({ col: 0, row: 0 })
  })

  it('maps columns to zero-based indexes', () => {
    expect(toCoord('H1')).toEqual({ col: 7, row: 0 })
  })

  it('maps rows to zero-based indexes', () => {
    expect(toCoord('C10')).toEqual({ col: 2, row: 9 })
  })

  it('accepts lowercase input', () => {
    expect(toCoord('b3')).toEqual({ col: 1, row: 2 })
  })

  it.each(['', 'A', '1', 'A0', 'AA1', '1A', 'A1B'])(
    'rejects %o',
    (input) => {
      expect(() => toCoord(input)).toThrow(FormulaError)
    },
  )
})

describe('toAddress', () => {
  it('is the inverse of toCoord', () => {
    expect(toAddress({ col: 0, row: 0 })).toBe('A1')
    expect(toAddress({ col: 7, row: 9 })).toBe('H10')
  })
})
