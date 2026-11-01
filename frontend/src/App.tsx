import { useEffect, useState } from 'react'
import { PitLoadingExample } from './pages/PitLoadingExample'
import Magnet from './components/Magnet'
import AnimatedContent from './components/AnimatedContent'
import { HomePage } from './pages/HomePage'
import { Wordmark } from './components/Wordmark'
import { SlideBackground } from './components/SlideBackground'
function LandingPage({ onStart }: { onStart: () => void }) {
  const [paused, setPaused] = useState(false)
  return <div className="landing relative isolate flex min-h-svh flex-col overflow-hidden">
    <SlideBackground paused={paused}/>
    <header className="site-header relative z-10 flex items-center justify-between"><Wordmark/><p>PRESENT BETTER, TOGETHER</p></header>
    <main id="main" className="hero relative z-10 flex flex-1 flex-col items-center text-center">
      <AnimatedContent distance={16} duration={0.7} trigger="mount"><div className="eyebrow inline-flex items-center rounded-full"><span/>REAL-TIME PRESENTATION COLLABORATION</div></AnimatedContent>
      <AnimatedContent distance={28} duration={0.85} delay={0.1} trigger="mount"><h1 tabIndex={-1}><span>발표의 모든 순간을,</span><span>PIT을 통해 함께 완성하세요.</span></h1></AnimatedContent>
      <AnimatedContent distance={22} duration={0.8} delay={0.22} trigger="mount"><div className="description"><p>PPTX 파일을 올리고, 팀원과 같은 화면에서 실시간으로 편집하세요.</p><p>아이디어부터 마지막 슬라이드까지, 하나의 공간에서.</p></div></AnimatedContent>
      <AnimatedContent distance={18} duration={0.75} delay={0.34} trigger="mount"><Magnet padding={150} magnetStrength={4} maxOffset={12} tilt={7} scale={1.1} spring={{ stiffness: 170, damping: 20 }} wrapperClassName="landing-cta-magnet"><button className="cta inline-flex items-center justify-between transition-colors focus-visible:outline-2 focus-visible:outline-offset-4" onClick={onStart}>PIT 시작하기 <span aria-hidden="true">→</span></button></Magnet></AnimatedContent>

    </main>
    <footer className="site-footer relative z-10"><ul className="flex items-center justify-center"><li>PPTX 파일 업로드</li><li>실시간 공동 편집</li><li>하나의 공간에서 관리</li></ul></footer>
    <button className="motion-toggle" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? '배경 애니메이션 재생' : '배경 애니메이션 일시 정지'}>{paused ? '재생' : '일시 정지'}</button>
  </div>
}

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
