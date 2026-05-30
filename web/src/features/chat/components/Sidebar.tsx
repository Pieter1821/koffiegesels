import { AnimatePresence, motion } from 'motion/react'
import { Coffee, PanelLeftClose, PanelLeft, Plus, Trash2 } from 'lucide-react'
import type { ConversationSummary } from '@/api/types'
import { useT } from '@/i18n'
import { formatListStamp } from '@/i18n/format'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'

interface SidebarProps {
  conversations: ConversationSummary[]
  selectedId: string | null
  isLoading: boolean
  creating: boolean
  collapsed: boolean
  mobileOpen: boolean
  onToggleCollapse: () => void
  onCloseMobile: () => void
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}

function SidebarBody({
  conversations,
  selectedId,
  isLoading,
  creating,
  onToggleCollapse,
  onSelect,
  onNew,
  onDelete,
  showCollapse,
}: Omit<SidebarProps, 'collapsed' | 'mobileOpen' | 'onCloseMobile'> & { showCollapse: boolean }) {
  const t = useT()

  return (
    <div className="flex h-full flex-col bg-surface-2">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-accent-foreground shadow-e1">
            <Coffee className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            {t('app.name')}
          </span>
        </div>
        {showCollapse && (
          <Tooltip label={t('sidebar.collapse')} side="bottom">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={t('sidebar.collapse')}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-accent-soft hover:text-accent"
            >
              <PanelLeftClose className="h-[1.05rem] w-[1.05rem]" />
            </button>
          </Tooltip>
        )}
      </div>

      <div className="px-3 pb-2 pt-1">
        <button
          type="button"
          onClick={onNew}
          disabled={creating}
          className={cn(
            'flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-foreground shadow-e1 transition-all',
            'hover:border-accent hover:text-accent hover:shadow-gloed disabled:opacity-60',
          )}
        >
          <Plus className="h-4 w-4" />
          {t('sidebar.new')}
        </button>
      </div>

      <div className="px-4 pb-1 pt-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-2">
          {t('sidebar.history')}
        </span>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4" aria-label={t('sidebar.history')}>
        {isLoading && <p className="px-2 py-2 text-sm text-muted-2">{t('state.loadingConversations')}</p>}
        {!isLoading && conversations.length === 0 && (
          <p className="px-2 py-2 text-sm text-muted-2">{t('sidebar.empty')}</p>
        )}
        <ul className="flex flex-col gap-0.5">
          {conversations.map((c) => {
            const selected = c.id === selectedId
            return (
              <li key={c.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={selected ? 'true' : undefined}
                  className={cn(
                    'flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 pr-9 text-left transition-colors',
                    selected ? 'bg-accent-soft' : 'hover:bg-background/70',
                  )}
                >
                  <span
                    className={cn(
                      'line-clamp-1 w-full text-sm font-medium',
                      selected ? 'text-accent' : 'text-foreground',
                    )}
                  >
                    {c.title || t('untitled')}
                  </span>
                  <span className="text-xs text-muted-2">{formatListStamp(c.updatedAt)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  aria-label={`${t('sidebar.delete')}: ${c.title}`}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-2 opacity-0 transition-all hover:bg-danger-soft hover:text-danger group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

export function Sidebar(props: SidebarProps) {
  const t = useT()
  const { collapsed, mobileOpen, onCloseMobile, onToggleCollapse } = props

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          'hidden border-r border-border md:block',
          'transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
          collapsed ? 'w-0 overflow-hidden' : 'w-[17rem]',
        )}
      >
        <SidebarBody {...props} showCollapse />
      </aside>

      {/* Collapsed rail (desktop) */}
      {collapsed && (
        <div className="hidden flex-col items-center gap-2 border-r border-border bg-surface-2 px-2 py-4 md:flex">
          <Tooltip label={t('sidebar.expand')} side="bottom">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={t('sidebar.expand')}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-accent-soft hover:text-accent"
            >
              <PanelLeft className="h-[1.05rem] w-[1.05rem]" />
            </button>
          </Tooltip>
          <Tooltip label={t('sidebar.new')} side="bottom">
            <button
              type="button"
              onClick={props.onNew}
              aria-label={t('sidebar.new')}
              className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground shadow-e1 transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-[1.05rem] w-[1.05rem]" />
            </button>
          </Tooltip>
        </div>
      )}

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="absolute inset-y-0 left-0 w-[82%] max-w-[20rem] border-r border-border shadow-e3"
            >
              <SidebarBody
                {...props}
                showCollapse={false}
                onSelect={(id) => {
                  props.onSelect(id)
                  onCloseMobile()
                }}
                onNew={() => {
                  props.onNew()
                  onCloseMobile()
                }}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
