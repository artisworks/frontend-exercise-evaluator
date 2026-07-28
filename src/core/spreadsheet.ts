import { collectRefs } from './ast.ts'
import type { Ast } from './ast.ts'
import { evaluate } from './evaluator.ts'
import { DependencyGraph } from './graph.ts'
import { parseFormula } from './parser.ts'
import { EMPTY, ERROR } from './types.ts'
import type { Address, CellValue } from './types.ts'

type Cell = {
  raw: string
  /** Present when the cell holds a formula that parsed successfully. */
  ast?: Ast
}

export class Spreadsheet {
  private cells = new Map<Address, Cell>()
  private values = new Map<Address, CellValue>()
  private graph = new DependencyGraph()
  private listeners = new Set<() => void>()
  private version = 0

  setCell(address: Address, raw: string): void {
    const key = address.toUpperCase()

    if (raw.trim() === '') {
      this.cells.delete(key)
      this.graph.setDependencies(key, [])
    } else {
      const cell: Cell = { raw }
      let dependencies: Address[] = []
      if (raw.startsWith('=')) {
        try {
          cell.ast = parseFormula(raw.slice(1))
          dependencies = collectRefs(cell.ast)
        } catch {
          cell.ast = undefined
        }
      }
      this.cells.set(key, cell)
      this.graph.setDependencies(key, dependencies)
    }

    const { order, circular } = this.graph.recalcOrder([key])
    for (const node of order) this.values.set(node, this.compute(node))
    // Real reason: #CIRCULAR!, these cells sit in a reference cycle or downstream of one.
    for (const node of circular) this.values.set(node, ERROR)

    this.version++
    for (const listener of this.listeners) listener()
  }

  getRaw(address: Address): string {
    return this.cells.get(address.toUpperCase())?.raw ?? ''
  }

  getValue(address: Address): CellValue {
    return this.values.get(address.toUpperCase()) ?? EMPTY
  }

  getVersion(): number {
    return this.version
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private compute(address: Address): CellValue {
    const cell = this.cells.get(address)
    if (!cell) return EMPTY

    if (cell.raw.startsWith('=')) {
      // Real reason: #SYNTAX, parseFormula rejected the text when it was typed.
      if (!cell.ast) return ERROR
      return evaluate(cell.ast, (ref) => this.getValue(ref))
    }

    const trimmed = cell.raw.trim()
    const asNumber = Number(trimmed)
    if (Number.isFinite(asNumber)) return { type: 'number', value: asNumber }
    return { type: 'text', value: cell.raw }
  }
}
