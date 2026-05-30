import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { useT, type TranslationKey } from '@/i18n'

const SUGGESTIONS: { title: TranslationKey; prompt: TranslationKey }[] = [
  { title: 'empty.suggest.0.title', prompt: 'empty.suggest.0.prompt' },
  { title: 'empty.suggest.1.title', prompt: 'empty.suggest.1.prompt' },
  { title: 'empty.suggest.2.title', prompt: 'empty.suggest.2.prompt' },
  { title: 'empty.suggest.3.title', prompt: 'empty.suggest.3.prompt' },
]

function greetingKey(): TranslationKey {
  const h = new Date().getHours()
  if (h < 12) return 'empty.greeting.morning'
  if (h < 18) return 'empty.greeting.afternoon'
  return 'empty.greeting.evening'
}

export function EmptyState({
  onPick,
  disabled,
}: {
  onPick: (prompt: string) => void
  disabled?: boolean
}) {
  const t = useT()
  const reduce = useReducedMotion()

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-10">
      <div className="w-full max-w-2xl text-center">
        <motion.h1
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
          className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
        >
          {t(greetingKey())}
          <span className="text-accent">.</span>
        </motion.h1>
        <motion.p
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.2, 0, 0, 1] }}
          className="mt-3 text-lg text-muted"
        >
          {t('empty.greeting.suffix')}
        </motion.p>

        <div className="mt-10 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={s.title}
              type="button"
              disabled={disabled}
              onClick={() => onPick(t(s.prompt))}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 + i * 0.07, ease: [0.2, 0, 0, 1] }}
              whileHover={reduce || disabled ? undefined : { y: -3 }}
              className="group flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface/70 p-4 text-left shadow-e1 backdrop-blur-sm transition-colors hover:border-accent hover:shadow-gloed disabled:pointer-events-none disabled:opacity-50"
            >
              <span>
                <span className="block text-sm font-semibold text-foreground">{t(s.title)}</span>
                <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{t(s.prompt)}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-2 transition-colors group-hover:text-accent" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
