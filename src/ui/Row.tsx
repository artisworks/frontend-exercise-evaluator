import { memo } from 'react'
import { toAddress } from '../core/address.ts'
import type { Spreadsheet } from '../core/spreadsheet.ts'
import type { Address } from '../core/types.ts'
import { Cell } from './Cell.tsx'

type RowProps = {
  row: number
  columnCount: number
  sheet: Spreadsheet
  selectedAddress: Address
  /** Unread on purpose: the sheet is mutable, so this is what tells memo a value changed. */
  version: number
  onSelect: (address: Address) => void
  onEdit: (address: Address) => void
}

export const Row = memo(function Row({
  row,
  columnCount,
  sheet,
  selectedAddress,
  onSelect,
  onEdit,
}: RowProps) {
  return (
    <tr>
      <th className="row-header" scope="row">
        {row + 1}
      </th>
      {Array.from({ length: columnCount }, (_, col) => {
        const address = toAddress({ col, row })
        return (
          <Cell
            key={address}
            address={address}
            value={sheet.getValue(address)}
            isSelected={address === selectedAddress}
            onSelect={onSelect}
            onEdit={onEdit}
          />
        )
      })}
    </tr>
  )
})
