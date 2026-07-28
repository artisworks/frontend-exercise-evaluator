import { describe, expect, it } from 'vitest'
import { evaluate } from './evaluator.ts'
import { parseFormula } from './parser.ts'
import { ERROR } from './types.ts'
import type { Address, CellValue } from './types.ts'

const sheet: Record<Address, CellValue> = {
  A1: { type: 'number', value: 10 },
  A2: { type: 'number', value: 32 },
  A3: { type: 'text', value: 'hello' },
  A4: ERROR,
}

const lookup = (address: Address): CellValue =>
  sheet[address] ?? { type: 'empty' }

const run = (formula: string): CellValue => evaluate(parseFormula(formula), lookup)

describe('reading values', () => {
  it('evaluates a number literal', () => {
    expect(run('42')).toEqual({ type: 'number', value: 42 })
  })

  it('reads the value of a referenced cell', () => {
    expect(run('A1')).toEqual({ type: 'number', value: 10 })
  })

  it('treats an empty cell as zero', () => {
    expect(run('H9')).toEqual({ type: 'number', value: 0 })
  })
})

describe('arithmetic', () => {
  it.each([
    ['1+2', 3],
    ['7-10', -3],
    ['2*3', 6],
    ['9/2', 4.5],
    ['1+2*3', 7],
    ['(1+2)*3', 9],
    ['-A1', -10],
    ['A1+A2', 42],
    ['H9+1', 1],
  ])('evaluates %o to %o', (formula, expected) => {
    expect(run(formula)).toEqual({ type: 'number', value: expected })
  })
})

describe('errors', () => {
  it('reports division by zero', () => {
    expect(run('1/0')).toEqual(ERROR)
  })

  it('reports text used as a number', () => {
    expect(run('A3+1')).toEqual(ERROR)
  })

  it('propagates an error from a referenced cell', () => {
    expect(run('A4+1')).toEqual(ERROR)
  })
})
