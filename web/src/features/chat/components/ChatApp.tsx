import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useQueryClient } from '@tanstack/react-query'
import { Menu } from 'lucide-react'
import type { ConversationDetail, Message, MessageWithConversation } from '@/api/types'
import { ApiError, streamMessage } from '@/api/client'
import { useT } from '@/i18n'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  conversationKeys,
  useConversation,
  useConversations,
  useCreateConversation,
  useDeleteConversation,
} from '../hooks/useConversations'
import { Sidebar } from './Sidebar'
import { MessageThread } from './MessageThread'
import { Composer } from './Composer'
import { EmptyState } from './EmptyState'
import { StateBanner, type BannerKind } from './StateBanner'

const AuroraBackground = lazy(() => import('@/components/ui/AuroraBackground'))

export function ChatApp() {
  const t = useT()
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingUser, setPendingUser] = useState<string | null>(null)
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [justSent, setJustSent] = useState(false)
  const [banner, setBanner] = useState<BannerKind | null>(null)
  // Streamed replies reveal themselves token-by-token, so no per-message
  // reveal animation is needed; kept as a stable empty set for MessageThread.
  const revealIds = useMemo(() => new Set<string>(), [])
  const streamAbortRef = useRef<AbortController | null>(null)

  const conversationsQuery = useConversations()
  const conversationQuery = useConversation(selectedId)
  const createMutation = useCreateConversation()
  const deleteMutation = useDeleteConversation()

  const conversations = conversationsQuery.data ?? []
  const messages = conversationQuery.data?.messages ?? []

  // Auto-select the most recent conversation on first load.
  useEffect(() => {
    if (selectedId === null && conversations.length > 0) {
      setSelectedId(conversations[0].id)
    }
  }, [conversations, selectedId])

  // Abort any in-flight stream on unmount.
  useEffect(() => () => streamAbortRef.current?.abort(), [])

  // Offline awareness.
  useEffect(() => {
    const update = () => setBanner((b) => (navigator.onLine ? (b === 'offline' ? null : b) : 'offline'))
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  const send = useCallback(
    async (content: string, conversationId: string) => {
      setBanner(null)
      setPendingUser(content)
      setStreamingText('')
      setIsStreaming(true)

      const controller = new AbortController()
      streamAbortRef.current = controller
      let realUser: MessageWithConversation | null = null

      try {
        await streamMessage(
          conversationId,
          content,
          {
            onMeta: (userMessage) => {
              realUser = userMessage
            },
            onToken: (delta) => {
              setStreamingText((prev) => (prev ?? '') + delta)
            },
            onDone: (assistantMessage) => {
              // Write both persisted messages into the cache and clear the
              // streaming/optimistic state in a single batch — no flicker.
              queryClient.setQueryData<ConversationDetail>(
                conversationKeys.detail(conversationId),
                (old) => {
                  if (!old) return old
                  const next = [...old.messages]
                  if (realUser && !next.some((m) => m.id === realUser!.id)) {
                    next.push({
                      id: realUser.id,
                      role: realUser.role,
                      content: realUser.content,
                      createdAt: realUser.createdAt,
                    })
                  }
                  if (!next.some((m) => m.id === assistantMessage.id)) {
                    next.push({
                      id: assistantMessage.id,
                      role: assistantMessage.role,
                      content: assistantMessage.content,
                      createdAt: assistantMessage.createdAt,
                    })
                  }
                  return { ...old, messages: next }
                },
              )
              void queryClient.invalidateQueries({ queryKey: conversationKeys.all })
              setStreamingText(null)
              setPendingUser(null)
            },
          },
          controller.signal,
        )
        setJustSent(true)
        setTimeout(() => setJustSent(false), 1500)
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setBanner(mapError(err))
        }
      } finally {
        setStreamingText(null)
        setPendingUser(null)
        setIsStreaming(false)
        streamAbortRef.current = null
      }
    },
    [queryClient],
  )

  const handleSend = useCallback(
    async (content: string) => {
      let id = selectedId
      if (!id) {
        try {
          const created = await createMutation.mutateAsync(undefined)
          id = created.id
          setSelectedId(id)
        } catch (err) {
          setBanner(mapError(err))
          return
        }
      }
      await send(content, id)
    },
    [selectedId, createMutation, send],
  )

  const handleNew = useCallback(async () => {
    setBanner(null)
    try {
      const created = await createMutation.mutateAsync(undefined)
      setSelectedId(created.id)
    } catch (err) {
      setBanner(mapError(err))
    }
  }, [createMutation])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm(t('sidebar.deleteConfirm'))) return
      try {
        await deleteMutation.mutateAsync(id)
        if (selectedId === id) {
          const remaining = conversations.filter((c) => c.id !== id)
          setSelectedId(remaining[0]?.id ?? null)
        }
      } catch (err) {
        setBanner(mapError(err))
      }
    },
    [deleteMutation, selectedId, conversations, t],
  )

  const handleRetry = useCallback(
    (assistant: Message) => {
      const idx = messages.findIndex((m) => m.id === assistant.id)
      for (let i = idx - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          if (selectedId) void send(messages[i].content, selectedId)
          return
        }
      }
    },
    [messages, selectedId, send],
  )

  // "Thinking" = stream started but no token has arrived yet.
  const isThinking = isStreaming && !streamingText
  const showEmpty = !selectedId || (messages.length === 0 && !pendingUser && !conversationQuery.isLoading)
  const title = conversationQuery.data?.title ?? t('app.name')

  return (
    <div className="relative flex h-[100dvh] overflow-hidden">
      <Suspense fallback={null}>
        <AuroraBackground intensity={showEmpty ? 'vivid' : 'soft'} />
      </Suspense>

      <Sidebar
        conversations={conversations}
        selectedId={selectedId}
        isLoading={conversationsQuery.isLoading}
        creating={createMutation.isPending}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onCloseMobile={() => setMobileOpen(false)}
        onSelect={setSelectedId}
        onNew={handleNew}
        onDelete={handleDelete}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-surface/70 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Tooltip label={t('sidebar.expand')} side="bottom">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label={t('sidebar.expand')}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-accent-soft hover:text-accent md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </Tooltip>
            <h1 className="truncate font-display text-base font-semibold text-foreground">
              {showEmpty ? t('app.name') : title}
            </h1>
          </div>
          <ThemeToggle />
        </header>

        <AnimatePresence>
          {banner && (
            <div className="px-4 pt-3 sm:px-6">
              <StateBanner kind={banner} />
            </div>
          )}
        </AnimatePresence>

        {showEmpty ? (
          <EmptyState onPick={(prompt) => void handleSend(prompt)} />
        ) : (
          <MessageThread
            messages={messages}
            revealIds={revealIds}
            pendingUser={pendingUser}
            streamingText={streamingText}
            isThinking={isThinking}
            onRetry={handleRetry}
          />
        )}

        <Composer
          onSend={(content) => void handleSend(content)}
          isSending={isThinking}
          justSent={justSent}
        />
      </div>
    </div>
  )
}

function mapError(err: unknown): BannerKind {
  if (!navigator.onLine) return 'offline'
  if (err instanceof ApiError) {
    if (err.status === 502 || err.status === 503) return 'aiDown'
    if (err.status === 429) return 'rateLimited'
  }
  return 'error'
}
