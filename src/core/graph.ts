import type { Address } from './types.ts'

export type RecalcPlan = {
  /** Cells to recompute, each one after every cell it depends on. */
  order: Address[]
  /** Affected cells that could not be ordered because a cycle reaches them. */
  circular: Set<Address>
}

export class DependencyGraph {
  /** Which cells a formula reads. B1 = "=A1+A2" gives B1 -> {A1, A2}. */
  private dependencies = new Map<Address, Set<Address>>()

  /** The same edges reversed, so an edit to A1 can find B1 without scanning the sheet. */
  private dependents = new Map<Address, Set<Address>>()

  setDependencies(node: Address, deps: Address[]): void {
    // Retyping a formula replaces its references, so tear down the old edges first.
    for (const previous of this.dependencies.get(node) ?? []) {
      const reverse = this.dependents.get(previous)
      reverse?.delete(node)
      // Drop the set once it empties, so dependentsOf keeps reporting nothing.
      if (reverse?.size === 0) this.dependents.delete(previous)
    }

    // A literal or a cleared cell reads nothing, so there is no edge left to record.
    if (deps.length === 0) {
      this.dependencies.delete(node)
      return
    }

    this.dependencies.set(node, new Set(deps))

    // Mirror every edge so the reverse lookup stays in step with the forward one.
    for (const dep of deps) {
      const reverse = this.dependents.get(dep) ?? new Set<Address>()
      reverse.add(node)
      this.dependents.set(dep, reverse)
    }
  }

  dependenciesOf(node: Address): Address[] {
    return [...(this.dependencies.get(node) ?? [])]
  }

  dependentsOf(node: Address): Address[] {
    return [...(this.dependents.get(node) ?? [])]
  }

  recalcOrder(changed: Address[]): RecalcPlan {
    // Everything the edit can reach. The rest of the sheet keeps the values it has.
    const affected = this.affectedBy(changed)

    // How many dependencies each cell is still waiting on, the in-degree in Kahn's algorithm.
    const remaining = new Map<Address, number>()
    for (const node of affected) {
      const deps = this.dependencies.get(node) ?? []
      let count = 0
      // Count only deps inside the set: an untouched cell is already correct, so waiting on it would deadlock.
      for (const dep of deps) if (affected.has(dep)) count++
      remaining.set(node, count)
    }

    // Cells with nothing left to wait for. The changed cells themselves start here.
    const ready = [...affected].filter((node) => remaining.get(node) === 0)
    const order: Address[] = []
    while (ready.length > 0) {
      const node = ready.shift() as Address
      order.push(node)

      // Computing this cell settles one dependency for everything that reads it.
      for (const dependent of this.dependents.get(node) ?? []) {
        if (!affected.has(dependent)) continue
        const count = (remaining.get(dependent) as number) - 1
        remaining.set(dependent, count)
        // Its last dependency just landed, so it is safe to compute next.
        if (count === 0) ready.push(dependent)
      }
    }

    // Anything that never reached zero sits in a cycle, or downstream of one.
    const ordered = new Set(order)
    const circular = new Set([...affected].filter((node) => !ordered.has(node)))
    return { order, circular }
  }

  private affectedBy(changed: Address[]): Set<Address> {
    const affected = new Set<Address>()
    const pending = [...changed]
    while (pending.length > 0) {
      const node = pending.pop() as Address
      if (affected.has(node)) continue
      affected.add(node)
      for (const dependent of this.dependents.get(node) ?? []) {
        if (!affected.has(dependent)) pending.push(dependent)
      }
    }
    return affected
  }
}
