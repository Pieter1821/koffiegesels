import { motion } from 'motion/react'
import { AlertTriangle, WifiOff } from 'lucide-react'
import { useT, type TranslationKey } from '@/i18n'

export type BannerKind = 'error' | 'offline' | 'aiDown' | 'rateLimited'

const MAP: Record<BannerKind, { title: TranslationKey; body: TranslationKey; icon: 'warn' | 'offline' }> = {
  error: { title: 'state.error.title', body: 'state.error.body', icon: 'warn' },
  offline: { title: 'state.offline.title', body: 'state.offline.body', icon: 'offline' },
  aiDown: { title: 'state.aiDown.title', body: 'state.aiDown.body', icon: 'warn' },
  rateLimited: { title: 'state.rateLimited.title', body: 'state.rateLimited.body', icon: 'warn' },
}

export function StateBanner({ kind }: { kind: BannerKind }) {
  const t = useT()
  const cfg = MAP[kind]
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      role="alert"
      className="mx-auto flex w-full max-w-3xl items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3"
    >
      <span className="mt-0.5 text-danger">
        {cfg.icon === 'offline' ? <WifiOff className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      </span>
      <span>
        <span className="block text-sm font-semibold text-foreground">{t(cfg.title)}</span>
        <span className="block text-sm text-muted">{t(cfg.body)}</span>
      </span>
    </motion.div>
  )
}
