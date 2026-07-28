export type Address = string

export type Coord = { col: number; row: number }

export type CellValue =
  | { type: 'empty' }
  | { type: 'number'; value: number }
  | { type: 'text'; value: string }
  | { type: 'error' }

export const EMPTY: CellValue = { type: 'empty' }

/** Every failure looks the same to the sheet. It renders as #ERROR! */
export const ERROR: CellValue = { type: 'error' }

export class FormulaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FormulaError'
  }
}
