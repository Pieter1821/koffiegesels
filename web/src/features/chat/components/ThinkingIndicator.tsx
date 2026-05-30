import { motion } from 'motion/react'
import { Coffee } from 'lucide-react'
import { useT } from '@/i18n'
import { ShimmerDots } from '@/components/ui/TextGenerateEffect'

export function ThinkingIndicator() {
  const t = useT()
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
      className="flex items-center gap-3"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
        <Coffee className="h-4 w-4" />
      </span>
      <span className="inline-flex items-center gap-2.5 rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-3 shadow-e1">
        <span className="text-sm text-muted">{t('message.thinking')}</span>
        <ShimmerDots />
      </span>
    </motion.div>
  )
}
