import { useState, type FormEvent, type KeyboardEvent } from 'react'

interface ComposerProps {
  onSend: (content: string) => void
  disabled: boolean
  isSending: boolean
}

export function Composer({ onSend, disabled, isSending }: ComposerProps) {
  const [draft, setDraft] = useState('')

  function submit() {
    const content = draft.trim()
    if (!content || disabled || isSending) return
    onSend(content)
    setDraft('')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        className="composer__input"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Skryf jou boodskap… (Enter om te stuur, Shift+Enter vir nuwe reël)"
        rows={3}
        disabled={disabled || isSending}
        aria-label="Boodskap"
      />
      <div className="composer__actions">
        {isSending && <span className="composer__status">Dink… (kan 15–30s neem)</span>}
        <button type="submit" disabled={disabled || isSending || !draft.trim()}>
          Stuur
        </button>
      </div>
    </form>
  )
}
