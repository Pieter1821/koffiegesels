import { useEffect, useState } from 'react'
import { ApiError } from '../../../api/client'
import {
  useConversation,
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useSendMessage,
} from '../hooks/useConversations'
import { Composer } from './Composer'
import { ConversationSidebar } from './ConversationSidebar'
import { MessageList } from './MessageList'

export function ChatApp() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const conversationsQuery = useConversations()
  const conversationQuery = useConversation(selectedId)
  const createMutation = useCreateConversation()
  const deleteMutation = useDeleteConversation()
  const sendMutation = useSendMessage(selectedId)

  const conversations = conversationsQuery.data ?? []

  useEffect(() => {
    if (selectedId !== null) return
    if (conversations.length > 0) {
      setSelectedId(conversations[0].id)
    }
  }, [conversations, selectedId])

  async function handleCreate() {
    setError(null)
    try {
      const created = await createMutation.mutateAsync(undefined)
      setSelectedId(created.id)
    } catch (err) {
      setError(formatError(err))
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Is jy seker jy wil hierdie gesprek skrap?')) return
    setError(null)
    try {
      await deleteMutation.mutateAsync(id)
      if (selectedId === id) {
        const remaining = conversations.filter((c) => c.id !== id)
        setSelectedId(remaining[0]?.id ?? null)
      }
    } catch (err) {
      setError(formatError(err))
    }
  }

  async function handleSend(content: string) {
    if (!selectedId) return
    setError(null)
    try {
      await sendMutation.mutateAsync(content)
    } catch (err) {
      setError(formatError(err))
    }
  }

  const queryError =
    conversationsQuery.error ?? conversationQuery.error ?? null

  return (
    <div className="chat-app">
      <ConversationSidebar
        conversations={conversations}
        selectedId={selectedId}
        isLoading={conversationsQuery.isLoading}
        isCreating={createMutation.isPending}
        onSelect={setSelectedId}
        onCreate={() => void handleCreate()}
        onDelete={(id) => void handleDelete(id)}
      />

      <main className="chat-main">
        {!selectedId ? (
          <div className="chat-main__empty">
            <p>Kies ’n gesprek of begin ’n nuwe een.</p>
          </div>
        ) : (
          <>
            <header className="chat-main__header">
              <h2>{conversationQuery.data?.title ?? '…'}</h2>
            </header>

            {(error || queryError) && (
              <p className="chat-main__error" role="alert">
                {error ?? formatError(queryError)}
              </p>
            )}

            <MessageList
              messages={conversationQuery.data?.messages ?? []}
              isLoading={conversationQuery.isLoading}
            />

            <Composer
              onSend={(content) => void handleSend(content)}
              disabled={!selectedId}
              isSending={sendMutation.isPending}
            />
          </>
        )}
      </main>
    </div>
  )
}

function formatError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 502 || err.status === 503) {
      return 'Die AI-diens is nie beskikbaar nie. Is Ollama aan die gang?'
    }
    if (err.status === 404) {
      return 'Gesprek nie gevind nie.'
    }
    return `Fout (${err.status}): ${err.message}`
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Onbekende fout'
}
