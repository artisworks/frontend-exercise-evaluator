import type { Address } from './types.ts'

/**
 * An AST (abstract syntax tree) is a formula rewritten as a tree. The parser
 * turns the text `1+2*3` into
 *
 *           ╭───╮
 *           │ + │
 *           ╰───╯
 *          /     \
 *      ╭───╮     ╭───╮
 *      │ 1 │     │ * │
 *      ╰───╯     ╰───╯
 *               /     \
 *           ╭───╮     ╭───╮
 *           │ 2 │     │ 3 │
 *           ╰───╯     ╰───╯
 *
 * The operators are `binary` nodes, the leaves `number` nodes. Precedence is
 * already baked into the shape, so nothing downstream has to think about it
 * again: `*` sits below `+` because it binds tighter.
 *
 * There are four kinds of node, and `operand` / `left` / `right` are themselves
 * Asts, nested as deeply as the formula goes. So anything that consumes a tree
 * is a recursive walk over those four cases, one `switch` deep. `collectRefs`
 * below is the smallest example of that shape.
 */

export type BinaryOperator = '+' | '-' | '*' | '/'

export type Ast =
  | { type: 'number'; value: number }
  | { type: 'ref'; address: Address }
  | { type: 'unary'; op: '-'; operand: Ast }
  | { type: 'binary'; op: BinaryOperator; left: Ast; right: Ast }

export function collectRefs(ast: Ast): Address[] {
  const found = new Set<Address>()
  walk(ast, found)
  return [...found]
}

function walk(ast: Ast, found: Set<Address>): void {
  switch (ast.type) {
    case 'number':
      return
    case 'ref':
      found.add(ast.address)
      return
    case 'unary':
      walk(ast.operand, found)
      return
    case 'binary':
      walk(ast.left, found)
      walk(ast.right, found)
  }
}
