type SlideType = 'editorial' | 'chart' | 'roadmap' | 'team' | 'minimal' | 'data'
const types: SlideType[] = ['editorial', 'chart', 'roadmap', 'team', 'minimal', 'data']
const titles = { editorial: 'WHAT IS NEXT', chart: 'PROJECT GROWTH', roadmap: 'A CLEAR PATH', team: 'BETTER TOGETHER', minimal: 'A NEW', data: 'INSIGHTS' }
function Slide({ type }: { type: SlideType }) {
  return <div className={`slide slide--${type}`}><b>{titles[type]}</b>
    {type === 'minimal' ? <><strong>PERSPECTIVE</strong><i className="short-line" /></> :
    type === 'chart' ? <><div className="bars">{[32, 48, 42, 68, 80, 92].map((h, i) => <i key={i} style={{ height: h }} />)}</div><small>Q3 / 2026</small></> :
    type === 'roadmap' ? <><p>From concept to launch</p><div className="roadmap">{['01', '02', '03', '04'].map(n => <span key={n}><i />{n}</span>)}</div></> :
    type === 'team' ? <><p>One team. Shared ideas.</p><div className="people">{[0, 1, 2, 3].map(n => <i key={n} />)}</div></> :
    type === 'data' ? <div className="data"><i /><div><span /><span /><span /></div></div> :
    <><i className="short-line"/><p>Ideas in motion</p><div className="editorial-block"><i /></div></>}
  </div>
}
export function SlideBackground({ paused }: { paused: boolean }) {
  return <div className={`slide-background ${paused ? 'is-paused' : ''}`} aria-hidden="true"><div className="glow glow--top"/><div className="glow glow--bottom"/>
    {[0, 1, 2].map(lane => <div className={`lane lane--${lane + 1}`} key={lane}><div className="lane-track">
      {/* Two identical, equally sized groups make the -50% translation seamless. */}
      {[0, 1].map(copy => <div className="slide-set" key={copy}>{types.map((_, index) => <Slide key={index} type={types[(index + lane * 2) % 6]} />)}</div>)}
    </div></div>)}<div className="hero-wash"/></div>
}
