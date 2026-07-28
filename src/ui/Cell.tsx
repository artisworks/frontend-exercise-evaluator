import { memo } from 'react'
import { formatValue } from '../core/format.ts'
import type { Address, CellValue } from '../core/types.ts'

type CellProps = {
  address: Address
  value: CellValue
  isSelected: boolean
  onSelect: (address: Address) => void
  onEdit: (address: Address) => void
}

/** Memoised because the sheet returns the same CellValue object until that cell is recomputed. */
export const Cell = memo(function Cell({
  address,
  value,
  isSelected,
  onSelect,
  onEdit,
}: CellProps) {
  return (
    <td
      data-testid={address}
      aria-selected={isSelected}
      className={isSelected ? 'cell selected' : 'cell'}
      onClick={() => onSelect(address)}
      onDoubleClick={() => onEdit(address)}
    >
      {formatValue(value)}
    </td>
  )
})
