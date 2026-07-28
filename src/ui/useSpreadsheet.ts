import { useCallback, useSyncExternalStore } from 'react'
import type { Spreadsheet } from '../core/spreadsheet.ts'

/** Re-renders the caller whenever the sheet changes. */
export function useSpreadsheet(sheet: Spreadsheet): number {
  const subscribe = useCallback(
    (listener: () => void) => sheet.subscribe(listener),
    [sheet],
  )
  return useSyncExternalStore(subscribe, () => sheet.getVersion())
}
