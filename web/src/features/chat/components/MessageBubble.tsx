import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Check, Coffee, Copy, RotateCcw } from 'lucide-react'
import type { Message } from '@/api/types'
import { useT } from '@/i18n'
import { formatTime } from '@/i18n/format'
import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { Tooltip } from '@/components/ui/Tooltip'
import { TextGenerateEffect } from '@/components/ui/TextGenerateEffect'
import { parseContent, hasCode } from '../lib/parseContent'

interface MessageBubbleProps {
  message: Message
  reveal: boolean
  onRetry?: () => void
  onRevealProgress?: () => void
}

export function MessageBubble({ message, reveal, onRetry, onRevealProgress }: MessageBubbleProps) {
  const t = useT()
  const reduce = useReducedMotion()
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const segments = parseContent(message.content)
  const animateText = reveal && !hasCode(message.content)

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  return (
    <motion.div
      layout="position"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.7 }}
      className={cn('group flex w-full gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {!isUser && (
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <Coffee className="h-4 w-4" />
        </span>
      )}

      <div className={cn('flex min-w-0 max-w-[min(46rem,82%)] flex-col', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'relative rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed shadow-e1',
            isUser
              ? 'rounded-br-md bg-foreground text-background'
              : 'rounded-bl-md border border-border bg-surface text-foreground',
          )}
        >
          {segments.map((seg, i) =>
            seg.type === 'code' ? (
              <CodeBlock key={i} code={seg.value} lang={seg.lang} />
            ) : animateText ? (
              <TextGenerateEffect
                key={i}
                text={seg.value}
                className="whitespace-pre-wrap break-words"
                onSettled={onRevealProgress}
              />
            ) : (
              <p key={i} className="m-0 whitespace-pre-wrap break-words">
                {seg.value}
              </p>
            ),
          )}
        </div>

        <div
          className={cn(
            'mt-1 flex items-center gap-1 px-1 text-xs text-muted-2',
            isUser ? 'flex-row-reverse' : 'flex-row',
          )}
        >
          <time className="opacity-0 transition-opacity group-hover:opacity-100">
            {formatTime(message.createdAt)}
          </time>

          <span className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <Tooltip label={copied ? t('message.copied') : t('message.copy')}>
              <button
                type="button"
                onClick={copy}
                aria-label={t('message.copy')}
                className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-accent-soft hover:text-accent"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </Tooltip>

            {!isUser && onRetry && (
              <Tooltip label={t('message.retry')}>
                <button
                  type="button"
                  onClick={onRetry}
                  aria-label={t('message.retry')}
                  className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-accent-soft hover:text-accent"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </Tooltip>
            )}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
