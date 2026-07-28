import type { KeyboardEvent, RefObject } from 'react'
import type { Address } from '../core/types.ts'

type EditorBarProps = {
  address: Address
  value: string
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  onSubmit: () => void
  onCommit: () => void
  onCancel: () => void
}

export function EditorBar({
  address,
  value,
  inputRef,
  onChange,
  onSubmit,
  onCommit,
  onCancel,
}: EditorBarProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') onSubmit()
    else if (event.key === 'Escape') onCancel()
    else return
    event.preventDefault()
  }

  return (
    <div className="editor-bar">
      <span className="editor-address" data-testid="editor-address">
        {address}
      </span>
      <input
        ref={inputRef}
        className="editor-input"
        aria-label={`Contents of ${address}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onCommit}
      />
    </div>
  )
}
