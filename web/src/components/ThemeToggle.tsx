import { Moon, Sun } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTheme } from '@/theme/ThemeProvider'
import { useT } from '@/i18n'
import { Tooltip } from '@/components/ui/Tooltip'

export function ThemeToggle() {
  const { resolved, toggle } = useTheme()
  const t = useT()
  const reduce = useReducedMotion()
  const isDark = resolved === 'dark'

  return (
    <Tooltip label={isDark ? t('theme.toLight') : t('theme.toDark')} side="bottom">
      <button
        type="button"
        onClick={toggle}
        aria-label={isDark ? t('theme.toLight') : t('theme.toDark')}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-muted transition-colors hover:border-border-strong hover:text-accent"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? 'moon' : 'sun'}
            initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="absolute grid place-items-center"
          >
            {isDark ? <Moon className="h-[1.05rem] w-[1.05rem]" /> : <Sun className="h-[1.05rem] w-[1.05rem]" />}
          </motion.span>
        </AnimatePresence>
      </button>
    </Tooltip>
  )
}
