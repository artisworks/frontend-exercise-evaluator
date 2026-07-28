import { useState } from 'react'
import { Spreadsheet } from './core/spreadsheet.ts'
import { Grid } from './ui/Grid.tsx'
import './App.css'

const SEED: [string, string][] = [
  ['A1', '10'],
  ['A2', '20'],
  ['A3', '12'],
  ['B1', '=A1*2'],
  ['B2', '=A2*2'],
  ['B3', '=A3*2'],
  ['C1', 'Total'],
  ['C2', '=B1+B2+B3'],
]

function createSheet(): Spreadsheet {
  const sheet = new Spreadsheet()
  for (const [address, raw] of SEED) sheet.setCell(address, raw)
  return sheet
}

function App() {
  const [sheet] = useState(createSheet)

  return (
    <>
      <header className="app-header">
        <h1>Mini Spreadsheet</h1>
        <p>Pick a cell, then edit it in the bar below. Start a formula with =</p>
      </header>

      <Grid sheet={sheet} />

      <section className="hints">
        Supported formulas:
        <ul>
          <li>
            Numbers and cell references: <code>=42</code>, <code>=B3</code>
          </li>
          <li>
            Arithmetic: <code>=1+2*3</code>, <code>=(A1+A2)/2</code>,{' '}
            <code>=-A1</code>
          </li>
          <li>
            Anything that cannot be computed shows <code>#ERROR!</code>
          </li>
        </ul>
      </section>
    </>
  )
}

export default App
