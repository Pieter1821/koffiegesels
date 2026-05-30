import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import type { Message } from '@/api/types'
import { useT } from '@/i18n'
import { MessageBubble } from './MessageBubble'
import { ThinkingIndicator } from './ThinkingIndicator'

interface MessageThreadProps {
  messages: Message[]
  revealIds: Set<string>
  pendingUser: string | null
  isThinking: boolean
  onRetry: (assistantMessage: Message) => void
}

const PIN_THRESHOLD = 120

export function MessageThread({
  messages,
  revealIds,
  pendingUser,
  isThinking,
  onRetry,
}: MessageThreadProps) {
  const t = useT()
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef(true)
  const [showPill, setShowPill] = useState(false)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    const pinned = distance < PIN_THRESHOLD
    pinnedRef.current = pinned
    setShowPill(!pinned)
  }, [])

  // Keep pinned to bottom as content grows (new messages + token reveal).
  useEffect(() => {
    const content = contentRef.current
    if (!content) return
    const observer = new ResizeObserver(() => {
      if (pinnedRef.current) scrollToBottom('auto')
    })
    observer.observe(content)
    return () => observer.disconnect()
  }, [scrollToBottom])

  // Snap to bottom on conversation/message-count change.
  useEffect(() => {
    pinnedRef.current = true
    setShowPill(false)
    scrollToBottom('auto')
  }, [messages.length, pendingUser, isThinking, scrollToBottom])

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
      >
        <div ref={contentRef} className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              reveal={revealIds.has(message.id)}
              onRetry={message.role === 'assistant' ? () => onRetry(message) : undefined}
            />
          ))}

          {pendingUser && (
            <MessageBubble
              key="pending-user"
              message={{
                id: 'pending-user',
                role: 'user',
                content: pendingUser,
                createdAt: new Date().toISOString(),
              }}
              reveal={false}
            />
          )}

          {isThinking && <ThinkingIndicator />}
        </div>
      </div>

      <AnimatePresence>
        {showPill && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-medium text-foreground shadow-e2 transition-colors hover:border-accent hover:text-accent"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            {t('scroll.toLatest')}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
