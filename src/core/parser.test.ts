import { describe, expect, it } from 'vitest'
import { parseFormula } from './parser.ts'
import { FormulaError } from './types.ts'

describe('numbers', () => {
  it('parses an integer', () => {
    expect(parseFormula('42')).toEqual({ type: 'number', value: 42 })
  })

  it('parses a decimal', () => {
    expect(parseFormula('3.5')).toEqual({ type: 'number', value: 3.5 })
  })

  it('ignores surrounding whitespace', () => {
    expect(parseFormula('  7  ')).toEqual({ type: 'number', value: 7 })
  })
})

describe('cell references', () => {
  it('parses a cell reference', () => {
    expect(parseFormula('B3')).toEqual({ type: 'ref', address: 'B3' })
  })

  it('upper-cases references so A1 and a1 are the same cell', () => {
    expect(parseFormula('a1')).toEqual({ type: 'ref', address: 'A1' })
  })

  it('rejects a reference to a row that cannot exist', () => {
    expect(() => parseFormula('A0')).toThrow(FormulaError)
  })
})

describe('addition and subtraction', () => {
  it('parses addition', () => {
    expect(parseFormula('1+2')).toEqual({
      type: 'binary',
      op: '+',
      left: { type: 'number', value: 1 },
      right: { type: 'number', value: 2 },
    })
  })

  it('parses a reference as an operand', () => {
    expect(parseFormula('A1+1')).toEqual({
      type: 'binary',
      op: '+',
      left: { type: 'ref', address: 'A1' },
      right: { type: 'number', value: 1 },
    })
  })

  it('parses + and - left-associatively', () => {
    expect(parseFormula('1-2-3')).toEqual({
      type: 'binary',
      op: '-',
      left: {
        type: 'binary',
        op: '-',
        left: { type: 'number', value: 1 },
        right: { type: 'number', value: 2 },
      },
      right: { type: 'number', value: 3 },
    })
  })
})

describe('multiplication and division', () => {
  it('parses multiplication', () => {
    expect(parseFormula('2*3')).toEqual({
      type: 'binary',
      op: '*',
      left: { type: 'number', value: 2 },
      right: { type: 'number', value: 3 },
    })
  })

  it('gives * higher precedence than +', () => {
    expect(parseFormula('1+2*3')).toEqual({
      type: 'binary',
      op: '+',
      left: { type: 'number', value: 1 },
      right: {
        type: 'binary',
        op: '*',
        left: { type: 'number', value: 2 },
        right: { type: 'number', value: 3 },
      },
    })
  })

  it('parses / left-associatively', () => {
    expect(parseFormula('8/4/2')).toEqual({
      type: 'binary',
      op: '/',
      left: {
        type: 'binary',
        op: '/',
        left: { type: 'number', value: 8 },
        right: { type: 'number', value: 4 },
      },
      right: { type: 'number', value: 2 },
    })
  })
})

describe('parentheses', () => {
  it('lets parentheses override precedence', () => {
    expect(parseFormula('(1+2)*3')).toEqual({
      type: 'binary',
      op: '*',
      left: {
        type: 'binary',
        op: '+',
        left: { type: 'number', value: 1 },
        right: { type: 'number', value: 2 },
      },
      right: { type: 'number', value: 3 },
    })
  })
})

describe('unary minus', () => {
  it('parses a negated reference', () => {
    expect(parseFormula('-A1')).toEqual({
      type: 'unary',
      op: '-',
      operand: { type: 'ref', address: 'A1' },
    })
  })

  it('parses unary minus on the right of a binary operator', () => {
    expect(parseFormula('1--2')).toEqual({
      type: 'binary',
      op: '-',
      left: { type: 'number', value: 1 },
      right: { type: 'unary', op: '-', operand: { type: 'number', value: 2 } },
    })
  })
})

describe('syntax errors', () => {
  it.each([
    ['', 'an empty formula'],
    ['1+', 'a missing right operand'],
    ['*2', 'a missing left operand'],
    ['(1', 'an unclosed parenthesis'],
    ['1)', 'an unexpected closing parenthesis'],
    ['1 2', 'trailing input'],
    ['1 & 2', 'an unknown character'],
    ['A1:A2', 'a range, which this language does not have'],
    ['SUM(A1)', 'a function call, which this language does not have'],
  ])('rejects %o (%s)', (input) => {
    expect(() => parseFormula(input)).toThrow(FormulaError)
  })
})
