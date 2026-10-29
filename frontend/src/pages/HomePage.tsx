import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import AnimatedContent from '../components/AnimatedContent'
import { Sidebar } from '../components/Sidebar'
import { Icon } from '../components/Icon'
import './home.css'
const formats = [
  { ratio: '16:9', name: '와이드 프레젠테이션', detail: '일반 발표 · 가장 많이 사용', color: '#e2f3e8' },
  { ratio: '4:3', name: '클래식 프레젠테이션', detail: '전통적인 발표 자료', color: '#edf1e5' },
  { ratio: '9:16', name: '세로 프레젠테이션', detail: '모바일 · 세로형 콘텐츠', color: '#ebedf8' },
]
const recent = [
  { name: '팀 프로젝트 발표', updated: '오늘 수정', privacy: '공유 중', color: '#e5f2e9', accent: '#1b7654' },
  { name: 'PIT 서비스 기획안', updated: '어제 수정', privacy: '내 프레젠테이션', color: '#eff3e7', accent: '#4d8270' },
  { name: '서비스 구조 설계', updated: '3일 전 수정', privacy: '공유 중', color: '#e8edf3', accent: '#3d658c' },
  { name: '새 프레젠테이션', updated: '7일 전 수정', privacy: '내 프레젠테이션', color: '#f0f5ee', accent: '#3e8066' },
]
export function HomePage({ onLanding }: { onLanding: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const search = useRef<HTMLInputElement>(null)
  const upload = useRef<HTMLInputElement>(null)
  const searchRequested = useRef(false)
  const openSearch = () => {
    if (expanded) { searchRequested.current = true; setExpanded(false) }
    else search.current?.focus()
  }
  useEffect(() => {
    if (!expanded && searchRequested.current) {
      searchRequested.current = false
      search.current?.focus()
    }
  }, [expanded])
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [expanded])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])
  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setNotice(/\.pptx$/i.test(file.name) ? `${file.name} 선택 완료. PPTX 불러오기 기능은 준비 중입니다.` : 'PPTX 형식의 파일을 선택해 주세요.')
    event.target.value = ''
  }
  const results = recent.filter(item => item.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  return <div className="workspace">
    <Sidebar expanded={expanded} onToggle={() => setExpanded(value => !value)} onLanding={onLanding} onNotice={setNotice} onSearch={openSearch}/>
    <div className="workspace-content" inert={expanded}>
      <header className="workspace-top"><p>WORKSPACE&nbsp; / &nbsp;홈</p><button className="notification-button" aria-label="알림" onClick={() => setNotice('새로운 알림이 없습니다.')}><Icon name="bell"/></button></header>
      <main className="home-main">
        <AnimatedContent distance={22} duration={0.75}><section className="home-hero" aria-labelledby="home-title">
          <h1 id="home-title" tabIndex={-1}>오늘은 어떤 프레젠테이션을 만들어볼까요?</h1>
          <p>새로운 슬라이드를 시작하거나, 기존 PPTX를 불러와 함께 편집하세요.</p>
          <div className="search-box"><Icon name="search"/><input ref={search} type="search" aria-label="내 프레젠테이션 검색" placeholder="내 프레젠테이션 검색" value={query} onChange={event => setQuery(event.target.value)} /><button aria-label="검색창으로 이동" onClick={() => search.current?.focus()}><kbd>⌘ K</kbd></button></div>
          <div className="home-hero-art" aria-hidden="true"><span>MAKE IT TOGETHER</span><div className="hero-orb"/><div className="art-deck art-deck--rear"/><div className="art-deck art-deck--center"><i/><b/><i/><i/></div><div className="art-deck art-deck--front"><i/><div><b/><b/><b/></div></div></div>
        </section></AnimatedContent>
        <section className="quick-start" aria-labelledby="quick-title"><h2 id="quick-title">새로 시작하기</h2><p className="section-description">원하는 형식을 선택하면 빈 PPTX에서 바로 시작해요.</p>
          <div className="create-grid">{formats.map((format, index) => <AnimatedContent key={format.ratio} distance={26} duration={0.75} delay={index * 0.09}><button className="create-card" onClick={() => setNotice(`${format.ratio} ${format.name} 선택 완료. 프레젠테이션 편집 기능은 준비 중입니다.`)}>
            <div className="create-card-body"><div className="format-preview" style={{ background: format.color }}><div className={`mini-slide mini-slide--${format.ratio.replace(':', '-')}`}><i/><i/></div></div><div className="format-info"><span>{format.ratio}</span><h3>{format.name}</h3><p>{format.detail}</p></div></div><span className="create-action">새로 만들기 <span aria-hidden="true">↗</span></span>
          </button></AnimatedContent>)}
          <AnimatedContent distance={26} duration={0.75} delay={0.27}><div className="upload-card"><span className="upload-icon"><Icon name="upload"/></span><h3>PPTX 파일 가져오기</h3><p>기존 파일을 업로드하고 함께 편집하세요.</p><button onClick={() => upload.current?.click()}>파일 업로드 <span aria-hidden="true">↗</span></button><input ref={upload} className="sr-only" tabIndex={-1} type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" aria-label="PPTX 파일 선택" onChange={selectFile}/></div></AnimatedContent>
          </div>
        </section>
        <section className="recent-section" aria-labelledby="recent-title"><div className="section-heading"><h2 id="recent-title">최근 작업</h2><button onClick={() => { setQuery(''); setNotice('현재 제공되는 최근 작업 4개를 모두 표시합니다.') }}>모두 보기 <span aria-hidden="true">→</span></button></div>
          <div className="recent-grid">{results.map((item, index) => <AnimatedContent key={item.name} distance={24} duration={0.7} delay={index * 0.08}><button className="recent-card" onClick={() => setNotice(`${item.name}은 디자인 미리보기 자료입니다. 편집 기능은 준비 중입니다.`)}><div className="recent-thumbnail" style={{ background: item.color, '--thumbnail-accent': item.accent } as CSSProperties}><div className="recent-slide"><i/><i/><i/></div></div><div className="recent-info"><h3>{item.name}</h3><p>{item.updated}</p><small>{item.privacy}</small></div></button></AnimatedContent>)}</div>
          {!results.length && <p className="search-empty" role="status">‘{query}’에 해당하는 프레젠테이션이 없습니다.</p>}
        </section>
      </main>
    </div>
    <div className={`workspace-notice ${notice ? 'is-visible' : ''}`} role="status">{notice}</div>
  </div>
}
