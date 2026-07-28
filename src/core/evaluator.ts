import type { Ast } from './ast.ts'
import type { Address, CellValue } from './types.ts'

export type Lookup = (address: Address) => CellValue

/**
 * Walks an Ast and produces the value of a cell.
 *
 * `lookup` reads another cell and never throws: an unset cell comes back
 * as { type: 'empty' }.
 *
 * This function never throws either. Anything that cannot produce a number
 * returns ERROR (from ./types.ts).
 * ./evaluator.test.ts is the full spec, in the same order as the README.
 */
export function evaluate(_ast: Ast, _lookup: Lookup): CellValue {
  throw new Error('evaluate is not implemented yet')
}
