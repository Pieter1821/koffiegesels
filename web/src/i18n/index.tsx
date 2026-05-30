import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { af, type TranslationKey } from './af'

type Vars = Record<string, string | number>

type TranslateFn = (key: TranslationKey, vars?: Vars) => string

const dictionaries = { af } as const
type Locale = keyof typeof dictionaries

const I18nContext = createContext<{ locale: Locale; t: TranslateFn } | null>(null)

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  )
}

export function I18nProvider({
  children,
  locale = 'af',
}: {
  children: ReactNode
  locale?: Locale
}) {
  const value = useMemo(() => {
    const dict = dictionaries[locale]
    const t: TranslateFn = (key, vars) => interpolate(dict[key] ?? key, vars)
    return { locale, t }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT(): TranslateFn {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useT must be used within <I18nProvider>')
  return ctx.t
}

export type { TranslationKey }
