import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const t = useT()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border bg-surface-2 shadow-e1">
      <div className="flex items-center justify-between border-b border-border bg-background/60 px-3 py-1.5">
        <span className="font-mono text-[0.7rem] uppercase tracking-wide text-muted-2">
          {lang || 'kode'}
        </span>
        <button
          type="button"
          onClick={copy}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium',
            'text-muted transition-colors hover:bg-accent-soft hover:text-accent',
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="ok"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className="inline-flex items-center gap-1.5 text-accent"
              >
                <Check className="h-3.5 w-3.5" /> {t('message.copied')}
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className="inline-flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" /> {t('message.code.copy')}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 text-[0.85rem] leading-relaxed">
        <code className="font-mono text-foreground">{code}</code>
      </pre>
    </div>
  )
}
