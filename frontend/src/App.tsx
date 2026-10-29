import { useState } from 'react'
import { Wordmark } from './components/Wordmark'
import { SlideBackground } from './components/SlideBackground'
export default function App() {
  const [paused, setPaused] = useState(false)
  const [notice, setNotice] = useState(false)
  return <div className="landing relative isolate flex min-h-svh flex-col overflow-hidden">
    <SlideBackground paused={paused}/>
    <header className="site-header relative z-10 flex items-center justify-between"><Wordmark/><p>PRESENT BETTER, TOGETHER</p></header>
    <main id="main" className="hero relative z-10 flex flex-1 flex-col items-center text-center">
      <div className="eyebrow inline-flex items-center rounded-full"><span/>REAL-TIME PRESENTATION COLLABORATION</div>
      <h1><span>발표의 모든 순간을,</span><span>PIT을 통해 함께 완성하세요!</span></h1>
      <div className="description"><p>PPTX 파일을 올리고, 팀원과 같은 화면에서 실시간으로 편집하세요.</p><p>아이디어부터 마지막 슬라이드까지, 하나의 공간에서.</p></div>
      <button className="cta inline-flex items-center justify-between transition-colors focus-visible:outline-2 focus-visible:outline-offset-4" onClick={() => setNotice(true)}>PIT 시작하기 <span aria-hidden="true">→</span></button>
      <p className="start-notice" role="status">{notice ? 'PIT을 준비하고 있어요. 곧 함께 발표를 완성할 수 있어요.' : '\u00a0'}</p>
    </main>
    <footer className="site-footer relative z-10"><ul className="flex items-center justify-center"><li>PPTX 파일 업로드</li><li>실시간 공동 편집</li><li>하나의 공간에서 관리</li></ul></footer>
    <button className="motion-toggle" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? '배경 애니메이션 재생' : '배경 애니메이션 일시 정지'}>{paused ? '재생' : '일시 정지'}</button>
  </div>
}
