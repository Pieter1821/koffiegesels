import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Menu } from 'lucide-react'
import type { Message } from '@/api/types'
import { ApiError } from '@/api/client'
import { useT } from '@/i18n'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  useConversation,
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useSendMessage,
} from '../hooks/useConversations'
import { Sidebar } from './Sidebar'
import { MessageThread } from './MessageThread'
import { Composer } from './Composer'
import { EmptyState } from './EmptyState'
import { StateBanner, type BannerKind } from './StateBanner'

const AuroraBackground = lazy(() => import('@/components/ui/AuroraBackground'))

export function ChatApp() {
  const t = useT()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingUser, setPendingUser] = useState<string | null>(null)
  const [justSent, setJustSent] = useState(false)
  const [banner, setBanner] = useState<BannerKind | null>(null)
  const [revealIds, setRevealIds] = useState<Set<string>>(() => new Set())
  const revealedRef = useRef<Set<string>>(new Set())

  const conversationsQuery = useConversations()
  const conversationQuery = useConversation(selectedId)
  const createMutation = useCreateConversation()
  const deleteMutation = useDeleteConversation()
  const sendMutation = useSendMessage()

  const conversations = conversationsQuery.data ?? []
  const messages = conversationQuery.data?.messages ?? []

  // Auto-select the most recent conversation on first load.
  useEffect(() => {
    if (selectedId === null && conversations.length > 0) {
      setSelectedId(conversations[0].id)
    }
  }, [conversations, selectedId])

  // Reveal (animate) each freshly received assistant message exactly once.
  useEffect(() => {
    const id = sendMutation.data?.assistantMessage.id
    if (id && !revealedRef.current.has(id)) {
      revealedRef.current.add(id)
      setRevealIds((prev) => new Set(prev).add(id))
    }
  }, [sendMutation.data])

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
      try {
        await sendMutation.mutateAsync({ conversationId, content })
        setJustSent(true)
        setTimeout(() => setJustSent(false), 1500)
      } catch (err) {
        setBanner(mapError(err))
      } finally {
        setPendingUser(null)
      }
    },
    [sendMutation],
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

  const isThinking = sendMutation.isPending
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
