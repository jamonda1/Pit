import { useCollaborativeBuild } from '../components/useCollaborativeBuild'
import './landing.css'

function Presence({ className = '', tone = 0 }: { className?: string; tone?: number }) {
  return <svg className={`presence presence-${tone} ${className}`} width="25" height="32" viewBox="0 0 25 32" aria-hidden="true"><path d="M4.2 3.5C2.9 2.4 1.4 3.4 1.8 5L6.7 26.7C7 28.1 8.8 28.4 9.5 27.2L13.3 20.8L20.3 20.3C21.7 20.2 22.2 18.4 21.1 17.5Z" fill="currentColor" stroke="white" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" /></svg>
}

function Bars({ className = '' }: { className?: string }) {
  return <div className={`pit-bars ${className}`} aria-hidden="true">{[36, 58, 48, 78, 100].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div>
}

function DeckSlide({ chapter }: { chapter: 0 | 1 | 2 }) {
  return <div className={`deck-slide deck-slide-${chapter}`}>
    <span className="slide-chapter">0{chapter + 1} / {['CONTEXT', 'EVIDENCE', 'DIRECTION'][chapter]}</span>
    <strong>{chapter === 0 ? <>우리가 바꾸려는<br />작은 불편함.</> : chapter === 1 ? <>생각을 뒷받침하는<br />새로운 관점.</> : <>그래서, 다음은<br />함께 만듭니다.</>}</strong>
    {chapter === 0 ? <small>서로의 경험에서 출발합니다.</small> : chapter === 1 ? <Bars /> : <div className="slide-direction" aria-hidden="true">↗</div>}
    <Presence tone={chapter} />
  </div>
}

export function LandingPage({ onStart }: { onStart: () => void }) {
  const { root, ready, active, skip } = useCollaborativeBuild()
  return <div className="pit-landing" ref={root} data-motion="building">
    <a className="pit-skip" href="#main">본문으로 바로가기</a>
    <section className="landing-intro" data-scene>
      <header className="pit-header pit-container">
        <a href="#main" className="pit-brand" aria-label="PIT 홈" data-build="place" data-priority="0">
          <img src="/images/brand/01_mark_only_liquid_glass_1024.png" width="84" height="56" alt="PIT" />
          <span>PRESENT IT TOGETHER</span>
        </a>
        <nav aria-label="랜딩페이지 안내" data-build="type" data-priority="6"><a href="#why-pit">왜 PIT인가요</a><a href="#together">함께 만드는 방식</a><a href="#get-started">시작하는 방법</a></nav>
      </header>
      <main id="main" className="pit-hero pit-container">
        <div className="hero-story">
          <p className="pit-kicker" data-build="type"><i aria-hidden="true" />IDEAS MEET. GREAT THINGS HAPPEN.</p>
          <h1 tabIndex={-1} data-build="type" data-priority="1">혼자 떠올린 생각이,<br /><em>함께 만드는 발표로.</em></h1>
          <p className="pit-lead" data-build="type" data-priority="2">파일은 하나로, 아이디어는 자유롭게.<br />PPTX를 올리고 팀원과 같은 화면에서 완성하세요.</p>
          <div className="hero-actions">
            <button className="pit-start" data-build="draw" data-priority="3" data-build-id="hero-start" disabled={!ready.has('hero-start')} onClick={onStart}>PIT 시작하기</button>
            <a href="#together" className="pit-text-link" data-build="type">어떻게 함께 만드나요? <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <div className="hero-workspace" role="img" aria-label="세 팀원이 제목과 그래픽을 함께 편집하는 프레젠테이션">
          <div className="workspace-ambient" data-build="draw" data-priority="4" />
          <div className="hero-orb orb-one" data-build="place" /><div className="hero-orb orb-two" data-build="place" />
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
              <Presence className="editor-pointer-one" /><Presence className="editor-pointer-two" tone={1} /><Presence className="editor-pointer-three" tone={2} />
            </div>
          </div>
          <div className="editor-comment" data-build="place">이 방향 좋아요!<br /><span>다음 슬라이드도 이어서 만들어 볼게요.</span></div>
        </div>
      </main>
      <div className="pit-values pit-container">
        <p className="pit-kicker" data-build="type">ONE SPACE. MANY POSSIBILITIES.</p>
        <h2 data-build="type">함께할수록, 아이디어는 더 멀리.</h2>
        <div className="values-grid">{[['협업', '같은 화면, 같은 흐름'], ['창의성', '서로의 생각을 더 크게'], ['편리함', '주고받는 과정을 더 짧게'], ['새로움', '팀의 새로운 작업 방식']].map(([title, body], i) => <div data-build="draw" key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{body}</p></div></div>)}</div>
      </div>
    </section>

    <section id="why-pit" className="pit-why" data-scene>
      <div className="pit-container">
        <p className="pit-kicker" data-build="type">01 / LESS PASSING. MORE MAKING.</p>
        <div className="section-heading"><h2 data-build="type">파일을 주고받던 시간을,<br />함께 만드는 시간으로.</h2><p data-build="type">최신본을 찾고, 수정을 기다리고, 다시 합치는 대신.<br />팀의 작업이 만나는 하나의 공간을 만듭니다.</p></div>
        <div className="convergence-scene">
          <svg className="connection-paths" viewBox="0 0 1300 440" preserveAspectRatio="none" aria-hidden="true" data-build="draw"><path d="M290 80C510 80 440 210 670 210M390 220H670M290 370C510 370 440 210 670 210" /></svg>
          <div className="scattered-files">{[['최종_수정.pptx', '표지 수정', '지우의 수정본'], ['최종_진짜최종.pptx', '데이터 업데이트', '민서의 수정본'], ['최종_최종_v7.pptx', '이미지 교체', '도윤의 수정본']].map(([name, change, person], i) => <div className={`loose-file loose-file-${i}`} data-build="place" key={name}><strong>{name}</strong><span>{change}</span><small>{person}</small></div>)}</div>
          <div className="shared-workspace" data-build="draw"><p className="pit-kicker">OUR SHARED SPACE</p><h3>팀의 다음 발표.pptx</h3><div className="mini-deck">{(['새로운 관점', '근거 있는 생각', '다음의 가능성']).map((v, i) => <div key={v}><span>0{i + 1} / {['THE IDEA', 'THE INSIGHT', 'WHAT’S NEXT'][i]}</span><strong>{v}</strong><i /></div>)}</div><p>흩어졌던 수정이, 하나의 흐름 안으로.</p><Presence /><Presence tone={1} /><Presence tone={2} /></div>
        </div>
        <p className="scene-caption" data-build="type">파일은 하나로. 팀의 생각은 한곳으로.</p>
      </div>
    </section>

    <section id="together" className="pit-creative" data-scene>
      <div className="pit-container">
        <p className="pit-kicker" data-build="type">02 / DIFFERENT IDEAS. BETTER TOGETHER.</p>
        <h2 data-build="type">좋은 생각은,<br />다른 생각을 만나 자랍니다.</h2>
        <p className="creative-aside" data-build="type">누군가는 문장을 다듬고, 누군가는 근거를 더하고.<br />각자의 기여가 한 장의 이야기가 됩니다.</p>
        <div className="creative-studio">
          <div className="studio-surface" data-build="draw" /><p className="studio-label" data-build="type">THE MAKING OF A GOOD IDEA</p>
          <svg className="connection-paths" viewBox="0 0 1300 560" preserveAspectRatio="none" aria-hidden="true" data-build="draw"><path d="M260 230C380 230 390 280 530 280M310 440C430 440 420 350 530 350" /></svg>
          <div className="idea-note" data-build="place"><span>시작은 작은 질문</span><strong>우리의 다음은<br />어떤 모습일까?</strong><small>IDEA / 01</small><Presence /></div>
          <div className="evidence-note" data-build="place"><strong>생각에 근거를 더하면</strong><Bars /><Presence tone={2} /></div>
          <div className="composed-slide">
            <div className="composed-surface" data-build="draw" />
            <p className="slide-chapter" data-build="type">A SHARED PERSPECTIVE</p>
            <strong data-build="type">생각을 연결하면,<br />가능성이 보입니다.</strong>
            <p className="composed-body" data-build="type">작은 질문에 팀의 관점과 근거를 더해<br />다음 이야기를 함께 만들어갑니다.</p>
            <div className="composed-bars" data-build="draw"><i /><i /><i /></div>
            <span className="composed-footer" data-build="type">OUR NEXT CHAPTER</span><Presence tone={1} />
          </div>
        </div>
        <h3 className="creative-equation" data-build="type">질문 + 근거 + 서로의 관점</h3><p className="pit-lead" data-build="type">정답을 나누는 대신, 더 나은 답을 함께 만드는 공간.</p>
      </div>
    </section>

    <section className="pit-team" data-scene>
      <div className="pit-container"><p className="pit-kicker" data-build="type">03 / MANY HANDS. ONE STORY.</p>
        <div className="section-heading"><h2 data-build="type">각자 맡은 한 장.<br />함께 만드는 한 편.</h2><p data-build="type">각자의 작업이 따로 끝나지 않도록.<br />처음부터 같은 발표 안에서 만들어갑니다.</p></div>
        <div className="team-deck">{([0, 1, 2] as const).map(chapter => <div data-build="place" key={chapter}><DeckSlide chapter={chapter} /></div>)}</div>
        <div className="deck-spine" data-build="draw"><i /></div>
        <p className="team-conclusion" data-build="type">서로 다른 기여가 만나는,<br className="mobile-break" /> 하나의 프레젠테이션.</p>
      </div>
    </section>

    <section id="get-started" className="pit-how" data-scene>
      <div className="pit-container"><p className="pit-kicker" data-build="type">04 / START WITH WHAT YOU HAVE</p><h2 data-build="type">처음부터 다시 만들 필요 없이.</h2><p className="pit-lead" data-build="type">지금 가지고 있는 자료에서, 팀의 다음 작업으로.</p>
        <div className="how-layout"><div className="file-to-team">
          <div className="how-surface" data-build="draw" />
          <div className="source-pptx" data-build="place"><span>PPTX</span><strong>우리의<br />다음 발표</strong><small>가져온 자료에서 이어가기</small></div>
          <div className="destination-slide" data-build="place"><span>TOGETHER</span><strong>다음 이야기를<br />함께 쓰세요.</strong><small>ONE FILE. SHARED POSSIBILITIES.</small><Presence tone={1} /></div>
          <p data-build="type">내 자료에서, 우리의 작업으로.</p>
        </div>
          <ol className="how-steps">{[['자료를 가져오세요', '작업하던 PPTX에서 시작하세요.'], ['함께할 팀원을 초대하세요', '하나의 작업 공간에 모이세요.'], ['같은 화면에서 완성하세요', '각자의 생각을 더하며 다듬으세요.']].map(([title, description], i) => <li data-build="type" key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol>
        </div>
      </div>
    </section>

    <section className="pit-faq" data-scene aria-labelledby="faq-title"><div className="faq-container"><p className="pit-kicker" data-build="type">FAQ</p><h2 id="faq-title" data-build="type">자주 묻는 질문</h2><dl>
      {[
        ['어떤 팀을 위한 서비스인가요?', '공동 발표, 제안서, 팀 프로젝트처럼 여러 사람이 하나의 프레젠테이션을 만드는 작업을 위한 공간입니다.'],
        ['기존 PPTX 자료로 시작할 수 있나요?', 'PPTX 업로드를 출발점으로 설계하고 있습니다. 세부 지원 범위와 호환성은 정식 안내에서 확인해 주세요.'],
        ['PIT가 중요하게 생각하는 것은 무엇인가요?', '파일을 전달하는 과정보다 함께 만드는 과정에 집중할 수 있는 협업 경험입니다.'],
      ].map(([question, answer]) => <div data-build="type" key={question}><dt>{question}</dt><dd>{answer}</dd></div>)}
    </dl></div></section>
    <section className="pit-closing" data-scene aria-label="PIT 시작하기"><button className="pit-start pit-start-grand" data-build="draw" data-build-id="closing-start" disabled={!ready.has('closing-start')} onClick={onStart}>PIT 시작하기</button></section>

    <div className="builder-overlay" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <div className={`builder-worker builder-${i}`} key={i}><div className="builder-target"><i className="edit-caret" />{Array.from({ length: 8 }, (_, handle) => <i className={`selection-handle handle-${handle}`} key={handle} />)}</div><div className="builder-cursor"><Presence /></div></div>)}</div>
    {active && <button className="build-skip" onClick={skip}>애니메이션 건너뛰기 <span aria-hidden="true">↗</span></button>}
  </div>
}
