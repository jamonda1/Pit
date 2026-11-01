import { useState } from 'react'
import PitLoading from '../components/PitLoading'

export function PitLoadingExample() {
  const [paused, setPaused] = useState(false)
  const [size, setSize] = useState(180)
  return <main style={{ minHeight: '100svh', display: 'grid', placeContent: 'center', gap: 24, padding: 24, background: '#e9f7ef', textAlign: 'center' }}>
    <h1>PIT 로딩 모션</h1>
    <div style={{ minHeight: 200, display: 'grid', placeItems: 'center' }}>
      <PitLoading size={size} paused={paused} />
    </div>
    <p>물방울 → pit → 물방울 · 2.67초 반복</p>
    <label>크기 {size}px <input aria-label="로딩 모션 크기" type="range" min="90" max="540" value={size} onChange={event => setSize(Number(event.target.value))} /></label>
    <button onClick={() => setPaused(!paused)}>{paused ? '재생' : '일시 정지'}</button>
    <a href="/">랜딩으로 돌아가기</a>
  </main>
}
