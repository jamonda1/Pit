/** Editable HTML/CSS artwork from the latest Penpot landing frame. */
export function Presence({ className = '', tone = 0 }: { className?: string; tone?: number }) {
  return <svg className={`presence presence-${tone} ${className}`} width="25" height="32" viewBox="0 0 25 32" aria-hidden="true"><path d="M4.2 3.5C2.9 2.4 1.4 3.4 1.8 5L6.7 26.7C7 28.1 8.8 28.4 9.5 27.2L13.3 20.8L20.3 20.3C21.7 20.2 22.2 18.4 21.1 17.5Z" fill="currentColor" stroke="white" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" /></svg>
}

export function Bars({ className = '' }: { className?: string }) {
  return <div className={`pit-bars ${className}`} aria-hidden="true">{[36, 58, 48, 78, 100].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div>
}

export function DeckSlide({ chapter }: { chapter: 0 | 1 | 2 }) {
  return <div className={`deck-slide deck-slide-${chapter}`}>
    <span className="slide-chapter">0{chapter + 1} / {['CONTEXT', 'EVIDENCE', 'DIRECTION'][chapter]}</span>
    <strong className="preview-copy">{chapter === 0 ? <>문제에서<br />출발하고.</> : chapter === 1 ? <>근거로<br />설득하고.</> : <>다음 행동으로<br />이어갑니다.</>}</strong>
    {chapter === 0 ? <small>발표의 배경을 분명하게.</small> : chapter === 1 ? <Bars /> : <div className="slide-direction" aria-hidden="true">↗</div>}
  </div>
}

export function HeroWorkspace() {
  return <div className="hero-workspace" role="img" aria-label="세 팀원이 제목과 그래픽을 함께 편집하는 프레젠테이션">
    <div className="workspace-ambient" data-build="draw" data-priority="4" />
    <div className="workspace-orb orb-one" data-build="place" /><div className="workspace-orb orb-two" data-build="place" />
    <div className="editor-window">
      <div className="editor-shell" data-build="draw" />
      <div className="editor-bar" data-build="draw"><span>우리의 다음 이야기.pptx</span><div className="editor-members"><i /><i /><i /></div></div>
      <div className="editor-canvas">
        <div className="canvas-paper" data-build="draw" />
        <span className="slide-chapter" data-build="type">THE NEXT CHAPTER</span>
        <strong data-build="type">작은 생각에서,<br />새로운 가능성으로.</strong>
        <div className="canvas-rule" data-build="draw" />
        <div className="canvas-sculpture" data-build="draw" data-priority="5"><i /><b /></div>
        <span className="canvas-footer" data-build="type">OUR IDEAS, TOGETHER. <span>01 / 08</span></span>
      </div>
    </div>
    <div className="editor-comment" data-build="place">민서 · 이 방향 좋아요!<br /><span>다음 슬라이드도 이어서 만들어 볼게요.</span></div>
  </div>
}
