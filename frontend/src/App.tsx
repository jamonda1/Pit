import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PitLoadingExample } from './pages/PitLoadingExample'
import { AccountPage, accountSectionFor } from './pages/AccountPage'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'
import { WorkspacePage } from './pages/WorkspacePage'
import { TrashPage } from './pages/TrashPage'
import { AuthProvider, useAuth, type AuthReason } from './auth/AuthProvider'
import { WorkspaceProvider } from './components/workspaceData'

function authReasonFor(path: string): AuthReason | null {
  if (path === '/workspace') return 'workspace'
  if (path === '/trash') return 'trash'
  return accountSectionFor(path) ? 'account' : null
}

// Keep client navigation lightweight while supporting direct links and browser history.
function AppContent() {
  const { requireAuth, status } = useAuth()
  const [path, setPath] = useState(window.location.pathname)
  const authReason = authReasonFor(path)
  const displayedPath = authReason && status !== 'authenticated' ? '/home' : path
  const accountSection = accountSectionFor(displayedPath)
  const previousDisplayedPath = useRef(displayedPath)

  useLayoutEffect(() => {
    const previous = previousDisplayedPath.current
    previousDisplayedPath.current = displayedPath
    if (previous === displayedPath || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const main = document.querySelector<HTMLElement>('.workspace-content > main')
    const entrance = main?.animate?.([
      { opacity: 0.25, transform: 'translateY(4px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 180, easing: 'cubic-bezier(0.2, 0, 0, 1)' })
    return () => entrance?.cancel()
  }, [displayedPath])

  useEffect(() => {
    const sync = () => setPath(window.location.pathname)
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])
  const navigate = (next: string) => {
    const route = new URL(next, window.location.origin).pathname
    const reason = authReasonFor(route)
    if (reason) {
      requireAuth(reason, () => commitNavigation(next))
      return
    }
    commitNavigation(next)
  }
  const commitNavigation = (next: string) => {
    if (next === window.location.pathname + window.location.search) return
    const destination = new URL(next, window.location.origin)
    window.history.pushState(null, '', next)
    setPath(destination.pathname)
    window.scrollTo(0, 0)
  }
  useEffect(() => {
    document.title = accountSection
      ? `${accountSection.label} — PIT`
      : ({ '/home': '홈 — PIT', '/workspace': '워크스페이스 — PIT', '/trash': '휴지통 — PIT' } as Record<string, string>)[displayedPath] || 'PIT — Present It Together'
    const focusTarget = path === '/home' && new URLSearchParams(window.location.search).has('search') ? '.home-search input' : 'h1'
    document.querySelector<HTMLElement>(focusTarget)?.focus({ preventScroll: true })
  }, [accountSection, displayedPath, path])
  useEffect(() => {
    if (authReason && status !== 'authenticated') requireAuth(authReason)
  }, [authReason, path, status, requireAuth])
  if (path === '/loading-preview') return <PitLoadingExample />
  return <WorkspaceProvider>{displayedPath === '/home' ? <HomePage onNavigate={navigate} />
    : displayedPath === '/workspace' ? <WorkspacePage onNavigate={navigate} />
    : displayedPath === '/trash' ? <TrashPage onNavigate={navigate} />
    : accountSection ? <AccountPage key={accountSection.id} section={accountSection} onNavigate={navigate} />
    : <LandingPage onStart={() => { navigate('/home'); requireAuth('welcome') }} />}</WorkspaceProvider>
}

export default function App() { return <AuthProvider><AppContent /></AuthProvider> }
