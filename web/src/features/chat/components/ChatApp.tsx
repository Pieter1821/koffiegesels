import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useQueryClient } from '@tanstack/react-query'
import { Menu } from 'lucide-react'
import type { ConversationDetail, ConversationSummary, Message, MessageWithConversation } from '@/api/types'
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
  /** Prevents double-submit (e.g. double-clicking a suggested prompt). */
  const sendLockRef = useRef(false)
  /** When true, skip auto-selecting the most recent thread (user chose "Nuwe gesprek"). */
  const draftModeRef = useRef(false)

  const conversationsQuery = useConversations()
  const conversationQuery = useConversation(selectedId)
  const createMutation = useCreateConversation()
  const deleteMutation = useDeleteConversation()

  const conversations = conversationsQuery.data ?? []
  const detail = conversationQuery.data
  const messages =
    selectedId && detail?.id === selectedId ? detail.messages : []

  const clearStreamState = useCallback(() => {
    setPendingUser(null)
    setStreamingText(null)
    setIsStreaming(false)
  }, [])

  // Auto-select the most recent conversation on first load (not after "Nuwe gesprek").
  useEffect(() => {
    if (draftModeRef.current) return
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
              // Persisted user message replaces the optimistic bubble immediately.
              setPendingUser(null)
              queryClient.setQueryData<ConversationDetail>(
                conversationKeys.detail(conversationId),
                (old) => {
                  const base: ConversationDetail = old ?? {
                    id: conversationId,
                    title: t('untitled'),
                    createdAt: userMessage.createdAt,
                    updatedAt: userMessage.createdAt,
                    messages: [],
                  }
                  if (base.messages.some((m) => m.id === userMessage.id)) return base
                  return {
                    ...base,
                    messages: [
                      ...base.messages,
                      {
                        id: userMessage.id,
                        role: userMessage.role,
                        content: userMessage.content,
                        createdAt: userMessage.createdAt,
                      },
                    ],
                  }
                },
              )
            },
            onToken: (delta) => {
              setStreamingText((prev) => (prev ?? '') + delta)
            },
            onDone: (assistantMessage) => {
              queryClient.setQueryData<ConversationDetail>(
                conversationKeys.detail(conversationId),
                (old) => {
                  const base: ConversationDetail = old ?? {
                    id: conversationId,
                    title: t('untitled'),
                    createdAt: realUser?.createdAt ?? assistantMessage.createdAt,
                    updatedAt: assistantMessage.createdAt,
                    messages: [],
                  }
                  const next = [...base.messages]
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
                  return { ...base, messages: next, updatedAt: assistantMessage.createdAt }
                },
              )
              queryClient.setQueryData<ConversationSummary[]>(
                conversationKeys.all,
                (old) => {
                  const list = old ?? []
                  const idx = list.findIndex((c) => c.id === conversationId)
                  if (idx === -1) return list
                  const updated = { ...list[idx], updatedAt: assistantMessage.createdAt }
                  return [updated, ...list.filter((c) => c.id !== conversationId)]
                },
              )
              void queryClient.invalidateQueries({ queryKey: conversationKeys.all })
              void queryClient.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) })
              setStreamingText(null)
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
    [queryClient, t],
  )

  const handleSelect = useCallback(
    (id: string) => {
      draftModeRef.current = false
      streamAbortRef.current?.abort()
      clearStreamState()
      setSelectedId(id)
    },
    [clearStreamState],
  )

  const handleSend = useCallback(
    async (content: string) => {
      if (sendLockRef.current || isStreaming || createMutation.isPending) return
      sendLockRef.current = true

      try {
        let id = selectedId
        if (!id) {
          try {
            const created = await createMutation.mutateAsync(undefined)
            id = created.id
            draftModeRef.current = false
            setSelectedId(id)
          } catch (err) {
            setBanner(mapError(err))
            return
          }
        }
        await send(content, id)
      } finally {
        sendLockRef.current = false
      }
    },
    [selectedId, createMutation, send, isStreaming],
  )

  const handleNew = useCallback(() => {
    setBanner(null)
    streamAbortRef.current?.abort()
    clearStreamState()
    draftModeRef.current = true
    setSelectedId(null)
  }, [clearStreamState])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm(t('sidebar.deleteConfirm'))) return
      try {
        await deleteMutation.mutateAsync(id)
        if (selectedId === id) {
          streamAbortRef.current?.abort()
          clearStreamState()
          draftModeRef.current = true
          setSelectedId(null)
        }
      } catch (err) {
        setBanner(mapError(err))
      }
    },
    [deleteMutation, selectedId, t, clearStreamState],
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
  const isBusy = isStreaming || createMutation.isPending
  const showEmpty = !selectedId || (messages.length === 0 && !pendingUser && !conversationQuery.isLoading)
  const title = detail?.id === selectedId ? (detail.title || t('untitled')) : t('app.name')

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
        onSelect={handleSelect}
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
          <EmptyState disabled={isBusy} onPick={(prompt) => void handleSend(prompt)} />
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
          isSending={isBusy}
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
