import { useEffect, useState } from 'react'
import { PitLoadingExample } from './pages/PitLoadingExample'
import { HomePage } from './pages/HomePage'
import { LandingPage } from './pages/LandingPage'

// Keep the two routes lightweight; no routing dependency is needed yet.
export default function App() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const sync = () => setPath(window.location.pathname)
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])
  const navigate = (next: string) => {
    if (next === window.location.pathname) return
    window.history.pushState(null, '', next)
    setPath(next)
    window.scrollTo(0, 0)
  }
  useEffect(() => {
    document.title = path === '/home' ? '홈 — PIT' : 'PIT — Present It Together'
    document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
  }, [path])
  if (path === '/loading-preview') return <PitLoadingExample />
  return path === '/home' ? <HomePage onLanding={() => navigate('/')} /> : <LandingPage onStart={() => navigate('/home')} />
}
