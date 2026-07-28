import { FormulaError } from './types.ts'
import type { Address, Coord } from './types.ts'

const ADDRESS_PATTERN = /^([A-Z])([1-9]\d*)$/

export function toCoord(address: Address): Coord {
  const match = ADDRESS_PATTERN.exec(address.toUpperCase())
  if (!match) throw new FormulaError(`Invalid cell reference: ${address}`)
  return {
    col: match[1].charCodeAt(0) - 'A'.charCodeAt(0),
    row: Number(match[2]) - 1,
  }
}

export function toAddress({ col, row }: Coord): Address {
  return `${String.fromCharCode('A'.charCodeAt(0) + col)}${row + 1}`
}
