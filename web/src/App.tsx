import { useAuth } from 'react-oidc-context'
import './App.css'

function App() {
  const auth = useAuth()

  if (auth.isLoading) {
    return <main className="app"><p>Laai…</p></main>
  }

  if (auth.error) {
    return (
      <main className="app">
        <p className="error">Aanmelding het misluk: {auth.error.message}</p>
      </main>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <main className="app">
        <header>
          <h1>Koffiegesels</h1>
          <p className="tagline">Afrikaans gesels — helder en eerlik.</p>
        </header>
        <button type="button" onClick={() => void auth.signinRedirect()}>
          Meld aan
        </button>
      </main>
    )
  }

  return (
    <main className="app">
      <header>
        <h1>Koffiegesels</h1>
        <p className="tagline">Welkom, {auth.user?.profile.preferred_username ?? 'gebruiker'}.</p>
      </header>
      <p className="hint">
        Kletskamer kom hier wanneer die API-gesprek-endpoints gereed is.
      </p>
      <button type="button" onClick={() => void auth.signoutRedirect()}>
        Meld af
      </button>
    </main>
  )
}

export default App
