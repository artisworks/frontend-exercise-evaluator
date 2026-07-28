import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Spreadsheet } from './spreadsheet.ts'
import { ERROR } from './types.ts'

let sheet: Spreadsheet

beforeEach(() => {
  sheet = new Spreadsheet()
})

const number = (value: number) => ({ type: 'number', value })

describe('cell contents', () => {
  it('starts empty', () => {
    expect(sheet.getRaw('A1')).toBe('')
    expect(sheet.getValue('A1')).toEqual({ type: 'empty' })
  })

  it('stores a number', () => {
    sheet.setCell('A1', '42')
    expect(sheet.getValue('A1')).toEqual(number(42))
  })

  it('stores a negative and a decimal number', () => {
    sheet.setCell('A1', '-2.5')
    expect(sheet.getValue('A1')).toEqual(number(-2.5))
  })

  it('stores anything else as text', () => {
    sheet.setCell('A1', 'hello')
    expect(sheet.getValue('A1')).toEqual({ type: 'text', value: 'hello' })
  })

  it('clears a cell when set to an empty string', () => {
    sheet.setCell('A1', '5')
    sheet.setCell('A1', '')
    expect(sheet.getRaw('A1')).toBe('')
    expect(sheet.getValue('A1')).toEqual({ type: 'empty' })
  })
})

describe('formulas', () => {
  it('evaluates anything starting with =', () => {
    sheet.setCell('A1', '=1+1')
    expect(sheet.getValue('A1')).toEqual(number(2))
  })

  it('keeps the raw text of a formula for editing', () => {
    sheet.setCell('A1', '=1+1')
    expect(sheet.getRaw('A1')).toBe('=1+1')
  })

  it('reads another cell', () => {
    sheet.setCell('A1', '7')
    sheet.setCell('B1', '=A1')
    expect(sheet.getValue('B1')).toEqual(number(7))
  })

  it('is case-insensitive about references', () => {
    sheet.setCell('A1', '7')
    sheet.setCell('B1', '=a1')
    expect(sheet.getValue('B1')).toEqual(number(7))
  })

  it('reports a syntax error without throwing', () => {
    sheet.setCell('A1', '=1+')
    expect(sheet.getValue('A1')).toEqual(ERROR)
  })
})

describe('recalculation', () => {
  it('updates a dependent when its dependency changes', () => {
    sheet.setCell('A1', '1')
    sheet.setCell('B1', '=A1*10')
    expect(sheet.getValue('B1')).toEqual(number(10))

    sheet.setCell('A1', '2')
    expect(sheet.getValue('B1')).toEqual(number(20))
  })

  it('updates a whole chain', () => {
    sheet.setCell('A1', '1')
    sheet.setCell('B1', '=A1+1')
    sheet.setCell('C1', '=B1+1')

    sheet.setCell('A1', '10')
    expect(sheet.getValue('B1')).toEqual(number(11))
    expect(sheet.getValue('C1')).toEqual(number(12))
  })

  it('updates dependents when a cell is cleared', () => {
    sheet.setCell('A1', '5')
    sheet.setCell('B1', '=A1+1')
    sheet.setCell('A1', '')
    expect(sheet.getValue('B1')).toEqual(number(1))
  })

  it('recalculates a cell that reads several others', () => {
    sheet.setCell('A1', '1')
    sheet.setCell('A2', '2')
    sheet.setCell('B1', '=A1+A2+A3')
    expect(sheet.getValue('B1')).toEqual(number(3))

    sheet.setCell('A3', '4')
    expect(sheet.getValue('B1')).toEqual(number(7))
  })

  it('stops tracking a dependency the formula no longer uses', () => {
    sheet.setCell('A1', '1')
    sheet.setCell('B1', '=A1')
    sheet.setCell('B1', '=100')

    sheet.setCell('A1', '999')
    expect(sheet.getValue('B1')).toEqual(number(100))
  })

  it('propagates a value error through the chain', () => {
    sheet.setCell('A1', 'text')
    sheet.setCell('B1', '=A1+1')
    sheet.setCell('C1', '=B1+1')
    expect(sheet.getValue('C1')).toEqual(ERROR)
  })
})

describe('circular references', () => {
  it('flags a cell that refers to itself', () => {
    sheet.setCell('A1', '=A1')
    expect(sheet.getValue('A1')).toEqual(ERROR)
  })

  it('flags both sides of a mutual reference', () => {
    sheet.setCell('A1', '=B1')
    sheet.setCell('B1', '=A1')
    expect(sheet.getValue('A1')).toEqual(ERROR)
    expect(sheet.getValue('B1')).toEqual(ERROR)
  })

  it('recovers when the cycle is broken', () => {
    sheet.setCell('A1', '=B1+1')
    sheet.setCell('B1', '=A1+1')
    sheet.setCell('B1', '5')

    expect(sheet.getValue('B1')).toEqual(number(5))
    expect(sheet.getValue('A1')).toEqual(number(6))
  })

  it('leaves unrelated cells alone', () => {
    sheet.setCell('A1', '=B1')
    sheet.setCell('B1', '=A1')
    sheet.setCell('D1', '3')
    expect(sheet.getValue('D1')).toEqual(number(3))
  })
})

describe('subscriptions', () => {
  it('notifies listeners after a change', () => {
    const listener = vi.fn()
    sheet.subscribe(listener)
    sheet.setCell('A1', '1')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('changes the version on every change', () => {
    const before = sheet.getVersion()
    sheet.setCell('A1', '1')
    expect(sheet.getVersion()).not.toBe(before)
  })

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = sheet.subscribe(listener)
    unsubscribe()
    sheet.setCell('A1', '1')
    expect(listener).not.toHaveBeenCalled()
  })
})
