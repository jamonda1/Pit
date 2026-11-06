import { useEffect, useState } from 'react'
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
    if (path === '/workspace' || path === '/trash') {
      if (status !== 'authenticated') requireAuth(path === '/trash' ? 'trash' : 'workspace')
    }
  }, [path, status, requireAuth])
  if (path === '/loading-preview') return <PitLoadingExample />
  return <WorkspaceProvider>{path === '/home' ? <HomePage onNavigate={navigate} />
    : path === '/workspace' && status === 'authenticated' ? <WorkspacePage onNavigate={navigate} />
    : path === '/trash' && status === 'authenticated' ? <TrashPage onNavigate={navigate} />
    : path === '/workspace' || path === '/trash' ? <HomePage onNavigate={navigate} />
    : <LandingPage onStart={() => { navigate('/home'); requireAuth('welcome') }} />}</WorkspaceProvider>
}

export default function App() { return <AuthProvider><AppContent /></AuthProvider> }
