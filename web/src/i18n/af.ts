/**
 * Afrikaans (South Africa) — default and only locale for now.
 * Idiomatic copy, not literal English translations.
 * Add `en.ts` later with the same keys; no component changes needed.
 */
export const af = {
  'app.name': 'Koffiegesels',
  'app.tagline': 'Afrikaans gesels — helder en eerlik.',

  'sidebar.new': 'Nuwe gesprek',
  'sidebar.history': 'Geskiedenis',
  'sidebar.empty': 'Nog geen gesprekke nie.',
  'sidebar.collapse': 'Vou toe',
  'sidebar.expand': 'Vou oop',
  'sidebar.rename': 'Hernoem',
  'sidebar.delete': 'Skrap',
  'sidebar.deleteConfirm': 'Skrap hierdie gesprek? Dit kan nie ongedaan gemaak word nie.',

  'composer.placeholder': "Tik 'n boodskap…",
  'composer.placeholderRotating.0': 'Vra my enigiets in Afrikaans…',
  'composer.placeholderRotating.1': 'Wat wil jy vandag verstaan?',
  'composer.placeholderRotating.2': "Begin 'n gesprek oor koffie, kode of die kosmos…",
  'composer.placeholderRotating.3': 'Tik hier en druk Enter…',
  'composer.send': 'Stuur',
  'composer.stop': 'Stop genereer',
  'composer.hint': 'Enter om te stuur · Shift+Enter vir nuwe reël',

  'message.you': 'Jy',
  'message.assistant': 'Koffiegesels',
  'message.copy': 'Kopieer',
  'message.copied': 'Gekopieer',
  'message.retry': 'Herprobeer',
  'message.thinking': 'Dink…',
  'message.code.copy': 'Kopieer kode',

  'empty.greeting.morning': 'Goeiemôre',
  'empty.greeting.afternoon': 'Goeiemiddag',
  'empty.greeting.evening': 'Goeienaand',
  'empty.greeting.suffix': 'Waarmee kan ek vandag help?',
  'empty.suggestions.title': 'Probeer gerus',
  'empty.suggest.0.title': 'Verduidelik eenvoudig',
  'empty.suggest.0.prompt': "Verduidelik kwantumverstrengeling asof ek tien jaar oud is.",
  'empty.suggest.1.title': 'Skryf saam',
  'empty.suggest.1.prompt': "Help my 'n hoflike e-pos in Afrikaans skryf om 'n vergadering te skuif.",
  'empty.suggest.2.title': 'Idees vir koffie',
  'empty.suggest.2.prompt': 'Stel drie maniere voor om filterkoffie tuis lekkerder te maak.',
  'empty.suggest.3.title': 'Kode hulp',
  'empty.suggest.3.prompt': "Wys my 'n TypeScript-funksie wat 'n datum in Afrikaans formatteer.",

  'state.error.title': 'Iets het skeefgeloop',
  'state.error.body': 'Kon nie die boodskap stuur nie. Probeer asseblief weer.',
  'state.offline.title': 'Geen verbinding nie',
  'state.offline.body': 'Jy is tans van die lyn af. Ons probeer weer sodra jy terug is.',
  'state.aiDown.title': 'Die KI rus tans',
  'state.aiDown.body': 'Die KI-diens is nie nou beskikbaar nie. Loop Ollama?',
  'state.rateLimited.title': 'Net ’n oomblik',
  'state.rateLimited.body': 'Te veel versoeke te vinnig. Wag asseblief ’n oomblik.',
  'state.notFound': 'Gesprek nie gevind nie.',
  'state.loadingConversations': 'Laai gesprekke…',
  'state.loadingMessages': 'Laai boodskappe…',
  'state.selectConversation': "Kies 'n gesprek of begin 'n nuwe een.",

  'scroll.toLatest': 'Spring na nuutste',

  'theme.toLight': 'Skakel na lig',
  'theme.toDark': 'Skakel na donker',
  'theme.system': 'Volg stelsel',

  'auth.loading': 'Besig om aan te meld…',
  'auth.welcome': 'Welkom by Koffiegesels',
  'auth.signInBody': 'Meld aan om jou gesprekke te sien en voort te gaan.',
  'auth.signIn': 'Meld aan',
  'auth.signOut': 'Meld af',
  'auth.error.title': 'Aanmelding het misluk',
  'auth.error.body': 'Kon nie by die aanmelddiens uitkom nie. Loop Keycloak?',
  'auth.retry': 'Probeer weer',

  'untitled': 'Naamlose gesprek',
} as const

export type TranslationKey = keyof typeof af
