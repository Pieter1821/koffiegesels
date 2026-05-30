import type { ConversationSummary } from '../../../api/types'

interface ConversationSidebarProps {
  conversations: ConversationSummary[]
  selectedId: string | null
  isLoading: boolean
  isCreating: boolean
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('af-ZA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ConversationSidebar({
  conversations,
  selectedId,
  isLoading,
  isCreating,
  onSelect,
  onCreate,
  onDelete,
}: ConversationSidebarProps) {
  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <h1>Koffiegesels</h1>
        <p className="sidebar__tagline">Afrikaans gesels — helder en eerlik.</p>
        <button
          type="button"
          className="sidebar__new"
          onClick={onCreate}
          disabled={isCreating}
        >
          {isCreating ? 'Skep…' : '+ Nuwe gesprek'}
        </button>
      </header>

      <nav className="sidebar__list" aria-label="Gesprekke">
        {isLoading && <p className="sidebar__hint">Laai gesprekke…</p>}
        {!isLoading && conversations.length === 0 && (
          <p className="sidebar__hint">Nog geen gesprekke nie. Begin een hierbo.</p>
        )}
        {conversations.map((conversation) => {
          const isSelected = conversation.id === selectedId
          return (
            <div
              key={conversation.id}
              className={`sidebar__item${isSelected ? ' sidebar__item--selected' : ''}`}
            >
              <button
                type="button"
                className="sidebar__item-button"
                onClick={() => onSelect(conversation.id)}
                aria-current={isSelected ? 'true' : undefined}
              >
                <span className="sidebar__item-title">{conversation.title}</span>
                <span className="sidebar__item-date">{formatDate(conversation.updatedAt)}</span>
              </button>
              <button
                type="button"
                className="sidebar__delete"
                onClick={() => onDelete(conversation.id)}
                aria-label={`Skrap ${conversation.title}`}
                title="Skrap gesprek"
              >
                ×
              </button>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
