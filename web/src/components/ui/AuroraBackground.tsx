import { cn } from '@/lib/utils'

/**
 * Ambient warm "first light" backdrop. Low-opacity, GPU-only transforms,
 * sits behind all content. Lazy-loaded so it never blocks first paint.
 */
export default function AuroraBackground({
  intensity = 'soft',
}: {
  intensity?: 'soft' | 'vivid'
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className={cn(
          'absolute -top-1/3 left-1/4 h-[60vmax] w-[60vmax] rounded-full blur-3xl',
          intensity === 'vivid' ? 'opacity-50' : 'opacity-30',
        )}
        style={{
          background:
            'radial-gradient(circle at center, var(--accent-glow), transparent 60%)',
          animation: 'vroeg-aurora 16s var(--ease-out) infinite',
        }}
      />
      <div
        className={cn(
          'absolute top-1/4 -right-1/4 h-[55vmax] w-[55vmax] rounded-full blur-3xl',
          intensity === 'vivid' ? 'opacity-40' : 'opacity-25',
        )}
        style={{
          background:
            'radial-gradient(circle at center, color-mix(in oklab, var(--sage) 55%, transparent), transparent 62%)',
          animation: 'vroeg-aurora 22s var(--ease-out) infinite reverse',
        }}
      />
      <div
        className="absolute bottom-[-20%] left-[10%] h-[45vmax] w-[45vmax] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at center, var(--accent-glow), transparent 65%)',
          animation: 'vroeg-aurora 19s var(--ease-out) infinite',
        }}
      />
      {/* subtle grain/veil to keep text crisp over the glow */}
      <div className="absolute inset-0 bg-background/40" />
    </div>
  )
}
