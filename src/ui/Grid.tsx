import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { toAddress, toCoord } from '../core/address.ts'
import type { Spreadsheet } from '../core/spreadsheet.ts'
import type { Address, Coord } from '../core/types.ts'
import { EditorBar } from './EditorBar.tsx'
import { Row } from './Row.tsx'
import { useSpreadsheet } from './useSpreadsheet.ts'
import './Grid.css'

const COLUMN_COUNT = 8
const ROW_COUNT = 10

const COLUMNS = Array.from({ length: COLUMN_COUNT }, (_, col) =>
  toAddress({ col, row: 0 }).slice(0, -1),
)
const ROWS = Array.from({ length: ROW_COUNT }, (_, row) => row)

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max)

export function Grid({ sheet }: { sheet: Spreadsheet }) {
  const version = useSpreadsheet(sheet)

  const [selected, setSelected] = useState<Coord>({ col: 0, row: 0 })

  if (!sheet) return <p className="empty">No sheet loaded.</p>

  const [draft, setDraft] = useState('')
  const editor = useRef<HTMLInputElement>(null)

  const address = toAddress(selected)

  useEffect(() => {
    setDraft(sheet.getRaw(address))
  }, [address, sheet])

  // Stable so the memoised rows are not re-rendered by a new callback on every keystroke.
  const select = useCallback((next: Address) => {
    setSelected(toCoord(next))
  }, [])

  const startEditing = useCallback(
    (next: Address) => {
      select(next)
      editor.current?.focus()
    },
    [select],
  )

  const move = (columns: number, rows: number) => {
    selected.col = clamp(selected.col + columns, COLUMN_COUNT - 1)
    selected.row = clamp(selected.row + rows, ROW_COUNT - 1)
    setSelected({ ...selected })
  }

  const commit = () => {
    sheet.setCell(address, draft)
  }

  // Handed to a plain DOM node, so a stable identity would buy nothing.
  const handleGridKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        move(0, -1)
        break
      case 'ArrowDown':
        move(0, 1)
        break
      case 'ArrowLeft':
        move(-1, 0)
        break
      case 'ArrowRight':
        move(1, 0)
        break
      case 'Enter':
        editor.current?.focus()
        break
      case 'Delete':
      case 'Backspace':
        sheet.setCell(address, '')
        break
      default:
        // Typing on the grid starts an edit up in the editor, the way a spreadsheet does.
        if (event.key.length !== 1 || event.ctrlKey || event.metaKey) return
        setDraft(event.key)
        editor.current?.focus()
    }
    event.preventDefault()
  }

  return (
    <div className="sheet">
      {/* Not memoised: `value` changes on every keystroke, the only time it would re-render anyway. */}
      <EditorBar
        address={address}
        value={draft}
        inputRef={editor}
        onChange={setDraft}
        onSubmit={() => {
          commit()
          move(0, 1)
        }}
        onCommit={commit}
        onCancel={() => setDraft(sheet.getRaw(address))}
      />

      <div className="grid" tabIndex={0} onKeyDown={handleGridKeyDown}>
        <table>
          <thead>
            <tr>
              <th className="corner" scope="col" />
              {COLUMNS.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <Row
                key={row}
                row={row}
                columnCount={COLUMN_COUNT}
                sheet={sheet}
                selectedAddress={address}
                version={version}
                onSelect={select}
                onEdit={startEditing}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
