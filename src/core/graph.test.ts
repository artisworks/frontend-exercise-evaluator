import { beforeEach, describe, expect, it } from 'vitest'
import { DependencyGraph } from './graph.ts'

let graph: DependencyGraph

beforeEach(() => {
  graph = new DependencyGraph()
})

/** Index of `address` in the recalculation order, or -1. */
const at = (order: string[], address: string) => order.indexOf(address)

describe('recording dependencies', () => {
  it('records what a cell depends on', () => {
    graph.setDependencies('B1', ['A1', 'A2'])
    expect(graph.dependenciesOf('B1')).toEqual(['A1', 'A2'])
  })

  it('reports no edges for a cell it has never seen', () => {
    expect(graph.dependenciesOf('Z9')).toEqual([])
    expect(graph.dependentsOf('Z9')).toEqual([])
  })

  it('records the reverse edges too', () => {
    graph.setDependencies('B1', ['A1'])
    graph.setDependencies('C1', ['A1'])
    expect(graph.dependentsOf('A1').sort()).toEqual(['B1', 'C1'])
  })

  it('replaces the previous dependencies of a cell', () => {
    graph.setDependencies('B1', ['A1'])
    graph.setDependencies('B1', ['C1'])
    expect(graph.dependenciesOf('B1')).toEqual(['C1'])
    expect(graph.dependentsOf('A1')).toEqual([])
  })

  it('drops all edges when a cell stops being a formula', () => {
    graph.setDependencies('B1', ['A1'])
    graph.setDependencies('B1', [])
    expect(graph.dependentsOf('A1')).toEqual([])
  })
})

describe('deciding what to recalculate', () => {
  it('recalculates the changed cell when nothing depends on it', () => {
    expect(graph.recalcOrder(['A1'])).toEqual({
      order: ['A1'],
      circular: new Set(),
    })
  })

  it('follows dependents down a chain', () => {
    graph.setDependencies('B1', ['A1'])
    graph.setDependencies('C1', ['B1'])
    expect(graph.recalcOrder(['A1']).order).toEqual(['A1', 'B1', 'C1'])
  })

  it('leaves cells upstream of the change alone', () => {
    graph.setDependencies('B1', ['A1'])
    graph.setDependencies('C1', ['B1'])
    expect(graph.recalcOrder(['B1']).order).toEqual(['B1', 'C1'])
  })

  it('leaves unrelated cells out entirely', () => {
    graph.setDependencies('B1', ['A1'])
    graph.setDependencies('H9', ['H8'])
    expect(graph.recalcOrder(['A1']).order).toEqual(['A1', 'B1'])
  })

  it('recalculates a shared dependent only once', () => {
    graph.setDependencies('C1', ['A1', 'B1'])
    const { order } = graph.recalcOrder(['A1', 'B1'])
    expect(order).toHaveLength(3)
    expect(order.filter((address) => address === 'C1')).toHaveLength(1)
  })
})

describe('ordering the recalculation', () => {
  it('puts a cell after every cell it depends on', () => {
    graph.setDependencies('C1', ['A1', 'B1'])
    graph.setDependencies('D1', ['C1'])

    const { order } = graph.recalcOrder(['A1', 'B1'])
    expect(at(order, 'C1')).toBeGreaterThan(at(order, 'A1'))
    expect(at(order, 'C1')).toBeGreaterThan(at(order, 'B1'))
    expect(at(order, 'D1')).toBeGreaterThan(at(order, 'C1'))
  })

  it('orders a diamond so both branches come before the join', () => {
    graph.setDependencies('B1', ['A1'])
    graph.setDependencies('C1', ['A1'])
    graph.setDependencies('D1', ['B1', 'C1'])

    const { order } = graph.recalcOrder(['A1'])
    expect(order).toHaveLength(4)
    expect(at(order, 'A1')).toBeLessThan(at(order, 'B1'))
    expect(at(order, 'A1')).toBeLessThan(at(order, 'C1'))
    expect(at(order, 'B1')).toBeLessThan(at(order, 'D1'))
    expect(at(order, 'C1')).toBeLessThan(at(order, 'D1'))
  })

  it('does not wait for dependencies that are not being recalculated', () => {
    graph.setDependencies('C1', ['A1', 'X1'])
    const { order } = graph.recalcOrder(['A1'])
    expect(order).toEqual(['A1', 'C1'])
  })
})

describe('cycles', () => {
  it('flags a cell that refers to itself', () => {
    graph.setDependencies('A1', ['A1'])
    const { order, circular } = graph.recalcOrder(['A1'])
    expect(circular).toEqual(new Set(['A1']))
    expect(order).toEqual([])
  })

  it('flags both cells of a two-step cycle', () => {
    graph.setDependencies('A1', ['B1'])
    graph.setDependencies('B1', ['A1'])
    const { circular } = graph.recalcOrder(['A1'])
    expect(circular).toEqual(new Set(['A1', 'B1']))
  })

  it('flags cells downstream of a cycle, since they can never be ordered', () => {
    graph.setDependencies('A1', ['B1'])
    graph.setDependencies('B1', ['A1'])
    graph.setDependencies('C1', ['B1'])
    const { order, circular } = graph.recalcOrder(['A1'])
    expect(circular).toEqual(new Set(['A1', 'B1', 'C1']))
    expect(order).toEqual([])
  })

  it('still orders the cells a cycle does not touch', () => {
    graph.setDependencies('A1', ['B1'])
    graph.setDependencies('B1', ['A1'])
    graph.setDependencies('D1', ['C1'])

    const { order, circular } = graph.recalcOrder(['A1', 'C1'])
    expect(order).toEqual(['C1', 'D1'])
    expect(circular).toEqual(new Set(['A1', 'B1']))
  })

  it('recovers once the cycle is broken', () => {
    graph.setDependencies('A1', ['B1'])
    graph.setDependencies('B1', ['A1'])
    graph.setDependencies('B1', [])

    const { order, circular } = graph.recalcOrder(['B1'])
    expect(order).toEqual(['B1', 'A1'])
    expect(circular).toEqual(new Set())
  })
})
