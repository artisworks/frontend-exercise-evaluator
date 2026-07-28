# Mini Spreadsheet: formula evaluator

**Finishing is not the goal.** We care about how you get there: how the solution
evolves, and whether you tell us what you are doing and why as you go.

**AI tools are allowed.** How you use them is part of what we look at, so work the
way you normally would.

```bash
npm install
npm test          # or: npx vitest    to re-run on save
npm run dev       # the app, at the printed URL
```

The app is a small spreadsheet: cells A1 to H10, each holding a number, some text,
or a formula starting with `=`. Editing a cell recomputes the cells that read it.

## Task 1: three React issues (10 min)

`src/ui/Grid.tsx` has three problems. The app still runs and nothing warns you.
Find them and say what each one costs. Fixing them is optional.

## Task 2: the evaluator

`src/core/evaluator.ts` is a stub. `src/core/evaluator.test.ts` is the spec, written
in the order below. Work down it. The parser is already written: read `ast.ts` for
the four node types you will be handed.

1. **Number literals**: `42`
2. **Cell references**: a number cell gives its value, an unset cell counts as `0`
3. **`+`, `-`, `*`**
4. **`/`**, where dividing by zero is an error
5. **Unary minus**: `-A1`
6. **Text used as a number** is an error
7. **An error in a referenced cell** spreads to whatever reads it

Never throw. Anything that cannot produce a number returns `ERROR` from `types.ts`.

`spreadsheet.test.ts` also fails until this works. It uses the evaluator, so it goes
green on its own. You only write `evaluator.ts`.
