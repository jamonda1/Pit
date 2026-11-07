import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PitLoadingExample } from './pages/PitLoadingExample'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'
import { WorkspacePage } from './pages/WorkspacePage'
import { TrashPage } from './pages/TrashPage'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { WorkspaceProvider } from './components/workspaceData'

// Keep client navigation lightweight while supporting direct links and browser history.
function AppContent() {
  const { requireAuth, status } = useAuth()
  const [path, setPath] = useState(window.location.pathname)
  const isProtectedPage = path === '/workspace' || path === '/trash'
  const displayedPath = isProtectedPage && status !== 'authenticated' ? '/home' : path
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
    if (route === "/workspace" || route === "/trash") {
      requireAuth(route === "/trash" ? "trash" : "workspace", () => commitNavigation(next)); return
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
    document.title = ({ '/home': '홈 — PIT', '/workspace': '워크스페이스 — PIT', '/trash': '휴지통 — PIT' } as Record<string, string>)[path] || 'PIT — Present It Together'
    const focusTarget = path === '/home' && new URLSearchParams(window.location.search).has('search') ? '.home-search input' : 'h1'
    document.querySelector<HTMLElement>(focusTarget)?.focus({ preventScroll: true })
  }, [path])
  useEffect(() => {
    if (isProtectedPage && status !== 'authenticated') requireAuth(path === '/trash' ? 'trash' : 'workspace')
  }, [isProtectedPage, path, status, requireAuth])
  if (path === '/loading-preview') return <PitLoadingExample />
  return <WorkspaceProvider>{displayedPath === '/home' ? <HomePage onNavigate={navigate} />
    : displayedPath === '/workspace' ? <WorkspacePage onNavigate={navigate} />
    : displayedPath === '/trash' ? <TrashPage onNavigate={navigate} />
    : <LandingPage onStart={() => { navigate('/home'); requireAuth('welcome') }} />}</WorkspaceProvider>
}

export default function App() { return <AuthProvider><AppContent /></AuthProvider> }
