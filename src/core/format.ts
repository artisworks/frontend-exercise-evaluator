import type { CellValue } from './types.ts'

export function formatValue(value: CellValue): string {
  switch (value.type) {
    case 'empty':
      return ''
    case 'text':
      return value.value
    case 'error':
      return '#ERROR!'
    case 'number':
      return String(Number(value.value.toFixed(10)))
  }
}
