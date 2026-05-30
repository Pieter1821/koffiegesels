import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUp, Check, Loader2, Square } from 'lucide-react'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import { MagneticButton } from '@/components/ui/MagneticButton'

interface ComposerProps {
  onSend: (content: string) => void
  onStop?: () => void
  isSending: boolean
  disabled?: boolean
  justSent?: boolean
}

const ROTATING_KEYS = [
  'composer.placeholderRotating.0',
  'composer.placeholderRotating.1',
  'composer.placeholderRotating.2',
  'composer.placeholderRotating.3',
] as const

export function Composer({ onSend, onStop, isSending, disabled, justSent }: ComposerProps) {
  const t = useT()
  const reduce = useReducedMotion()
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [vanishing, setVanishing] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow the textarea.
  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  // Rotate placeholder while empty + unfocused.
  useEffect(() => {
    if (value || focused) return
    const id = setInterval(() => setPlaceholderIdx((i) => (i + 1) % ROTATING_KEYS.length), 3600)
    return () => clearInterval(id)
  }, [value, focused])

  function submit() {
    const content = value.trim()
    if (!content || isSending || disabled) return
    if (!reduce) setVanishing(content)
    setValue('')
    onSend(content)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submit()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const canSend = value.trim().length > 0 && !isSending && !disabled
  const showStop = isSending && !!onStop

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-5 pt-2 sm:px-6">
      <form
        onSubmit={handleSubmit}
        className={cn(
          'relative flex items-end gap-2 rounded-[1.75rem] border bg-surface px-2.5 py-2 shadow-e2 transition-[border-color,box-shadow] duration-200',
          focused ? 'border-accent' : 'border-border hover:border-border-strong',
        )}
        style={focused && !reduce ? { animation: 'vroeg-breathe 3.2s var(--ease-out) infinite' } : undefined}
      >
        <div className="relative flex-1">
          {/* Vanishing text echo on send */}
          <AnimatePresence>
            {vanishing && (
              <motion.span
                key={vanishing}
                initial={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                animate={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.42, ease: [0.2, 0, 0, 1] }}
                onAnimationComplete={() => setVanishing(null)}
                className="pointer-events-none absolute inset-0 px-3 py-2.5 text-[0.95rem] text-foreground"
              >
                {vanishing}
              </motion.span>
            )}
          </AnimatePresence>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            rows={1}
            disabled={disabled}
            aria-label={t('composer.placeholder')}
            placeholder={t(ROTATING_KEYS[placeholderIdx])}
            className="block max-h-[200px] w-full resize-none border-0 bg-transparent px-3 py-2.5 text-[0.95rem] leading-relaxed text-foreground outline-none placeholder:text-muted-2 disabled:opacity-60"
          />
        </div>

        <MagneticButton
          type={showStop ? 'button' : 'submit'}
          ariaLabel={showStop ? t('composer.stop') : t('composer.send')}
          onClick={showStop ? onStop : undefined}
          disabled={showStop ? false : !canSend}
          className={cn(
            'mb-0.5 h-10 w-10 shrink-0 rounded-full text-accent-foreground shadow-e1',
            canSend || isSending ? 'bg-accent hover:bg-accent-hover' : 'bg-border-strong text-surface',
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {showStop ? (
              <motion.span key="stop" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <Square className="h-[1.05rem] w-[1.05rem] fill-current" />
              </motion.span>
            ) : isSending ? (
              <motion.span key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 className="h-[1.1rem] w-[1.1rem] animate-spin" />
              </motion.span>
            ) : justSent ? (
              <motion.span key="ok" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                <Check className="h-[1.1rem] w-[1.1rem]" />
              </motion.span>
            ) : (
              <motion.span key="send" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                <ArrowUp className="h-[1.15rem] w-[1.15rem]" />
              </motion.span>
            )}
          </AnimatePresence>
        </MagneticButton>
      </form>

      <p className="mt-2 text-center text-xs text-muted-2">
        {showStop ? t('composer.hintStop') : t('composer.hint')}
      </p>
    </div>
  )
}
