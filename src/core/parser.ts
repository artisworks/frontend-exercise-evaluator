import { toCoord } from './address.ts'
import type { Ast, BinaryOperator } from './ast.ts'
import { FormulaError } from './types.ts'
import type { Address } from './types.ts'

const PRECEDENCE: BinaryOperator[][] = [
  ['+', '-'],
  ['*', '/'],
]

type Punct = '+' | '-' | '*' | '/' | '(' | ')'

type Token =
  | { kind: 'number'; value: number }
  | { kind: 'ref'; address: Address }
  | { kind: 'punct'; value: Punct }

const PUNCTUATION = new Set<string>(['+', '-', '*', '/', '(', ')'])
const WORD = /^[A-Za-z]+\d*/
const NUMBER = /^\d+(\.\d+)?/

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let rest = source.trim()

  while (rest.length > 0) {
    const word = WORD.exec(rest)
    if (word) {
      tokens.push({ kind: 'ref', address: normaliseRef(word[0]) })
      rest = rest.slice(word[0].length).trimStart()
      continue
    }

    const number = NUMBER.exec(rest)
    if (number) {
      tokens.push({ kind: 'number', value: Number(number[0]) })
      rest = rest.slice(number[0].length).trimStart()
      continue
    }

    const char = rest[0]
    if (!PUNCTUATION.has(char)) {
      throw new FormulaError(`Unexpected character: ${char}`)
    }
    tokens.push({ kind: 'punct', value: char as Punct })
    rest = rest.slice(1).trimStart()
  }

  return tokens
}

function normaliseRef(text: string): Address {
  toCoord(text)
  return text.toUpperCase()
}

export function parseFormula(source: string): Ast {
  const tokens = tokenize(source)
  let pos = 0

  const peek = (): Token | undefined => tokens[pos]

  const eatPunct = (value: Punct): boolean => {
    const token = peek()
    if (token?.kind === 'punct' && token.value === value) {
      pos++
      return true
    }
    return false
  }

  const parseExpression = (): Ast => parseBinary(0)

  const parseBinary = (level: number): Ast => {
    const operators = PRECEDENCE[level]
    if (!operators) return parseUnary()

    let left = parseBinary(level + 1)
    for (;;) {
      const token = peek()
      if (token?.kind !== 'punct') break
      const op = token.value
      if (!operators.includes(op as BinaryOperator)) break
      pos++
      left = {
        type: 'binary',
        op: op as BinaryOperator,
        left,
        right: parseBinary(level + 1),
      }
    }
    return left
  }

  const parseUnary = (): Ast =>
    eatPunct('-')
      ? { type: 'unary', op: '-', operand: parseUnary() }
      : parsePrimary()

  const parsePrimary = (): Ast => {
    const token = peek()
    if (!token) throw new FormulaError('Unexpected end of formula')
    pos++

    if (token.kind === 'number') return { type: 'number', value: token.value }
    if (token.kind === 'ref') return { type: 'ref', address: token.address }

    if (token.value === '(') {
      const inner = parseExpression()
      if (!eatPunct(')')) throw new FormulaError('Expected )')
      return inner
    }

    throw new FormulaError(`Unexpected token: ${token.value}`)
  }

  const ast = parseExpression()
  if (pos < tokens.length) throw new FormulaError('Unexpected trailing input')
  return ast
}
