import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import AnimatedContent from '../components/AnimatedContent'
import { Sidebar } from '../components/Sidebar'
import { Icon, type IconName } from '../components/Icon'
import { useWorkspaceData } from '../components/workspaceData'
import './home.css'

const formats = [
  { ratio: '16:9', name: '와이드 프레젠테이션', detail: '일반 발표 · 가장 많이 사용' },
  { ratio: '4:3', name: '클래식 프레젠테이션', detail: '전통적인 발표 자료' },
  { ratio: '9:16', name: '세로 프레젠테이션', detail: '모바일 · 세로형 콘텐츠' },
]
const recent = [
  { name: '팀 프로젝트 발표', owner: 'PIT 디자인팀', updated: '함께 편집 중', color: '#f7faf8', accent: '#11976e' },
  { name: '서비스 기획안', owner: '내 개인 공간', updated: '어제 수정', color: '#e1f0e9', accent: '#8d76d1' },
  { name: '분산 처리 결과', owner: '개발 워크스페이스', updated: '3일 전 수정', color: '#f7faf8', accent: '#11976e' },
  { name: '새 프레젠테이션', owner: '내 개인 공간', updated: '7일 전 수정', color: '#e1f0e9', accent: '#dc9569' },
]
const quickActions: { title: string; description: string; action: string; icon: IconName }[] = [
  { title: '새 프레젠테이션', description: '빈 슬라이드에서 바로 시작', action: '16:9 · 4:3 · 9:16', icon: 'plus' },
  { title: 'PPTX 파일 가져오기', description: '기존 발표 파일을 이어서 편집', action: 'PPTX 가져오기', icon: 'upload' },
  { title: '팀 워크스페이스', description: '멤버와 공유 공간 관리', action: '팀 공간으로 이동', icon: 'users' },
  { title: '받은 초대 확인', description: '팀 초대를 수락하거나 거절', action: '대기 중 2건', icon: 'mail' },
]

function HomeHeroArtwork() {
  return <div className="home-hero-art" aria-hidden="true">
    <i className="home-hero-glow" />
    <div className="home-art-slide home-art-slide--first"><span>PRESENT IT TOGETHER</span><b /><i /><em /><small /></div>
    <div className="home-art-slide home-art-slide--second"><span>PRESENT IT TOGETHER</span><b /><i /><em /><small /></div>
    <i className="home-art-collaborator" />
  </div>
}

export function HomePage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { data } = useWorkspaceData()
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(() => new URLSearchParams(window.location.search).has('search'))
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const search = useRef<HTMLInputElement>(null)
  const upload = useRef<HTMLInputElement>(null)
  const selector = useRef<HTMLDivElement>(null)
  const createDialog = useRef<HTMLDialogElement>(null)
  const searchRequested = useRef(new URLSearchParams(window.location.search).has('search'))
  const openSearch = () => {
    searchRequested.current = true
    setWorkspaceOpen(false)
    setExpanded(false)
    setSearchOpen(true)
  }
  useEffect(() => {
    if (!expanded && searchOpen && searchRequested.current) {
      searchRequested.current = false
      search.current?.focus()
      search.current?.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  }, [expanded, searchOpen])
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (createDialog.current?.open) return
        event.preventDefault()
        if (searchOpen && !expanded) search.current?.focus()
        else openSearch()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [searchOpen, expanded])
  useEffect(() => {
    if (!workspaceOpen) return
    const dismiss = (event: PointerEvent) => {
      if (!selector.current?.contains(event.target as Node)) setWorkspaceOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setWorkspaceOpen(false)
        selector.current?.querySelector('button')?.focus()
      }
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [workspaceOpen])
  useEffect(() => {
    if (createOpen) createDialog.current?.showModal()
    else createDialog.current?.close()
  }, [createOpen])
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
  const startQuickAction = (index: number) => {
    if (index === 0) setCreateOpen(true)
    else if (index === 1) upload.current?.click()
    else if (index === 2) onNavigate('/workspace')
    else setNotice('받은 초대는 디자인 예시입니다. 초대 확인 기능을 준비 중입니다.')
  }
  const presentations = [...data.restoredDocs.map(item => ({ name: item.name, owner: item.place === 'PIT 디자인팀' ? data.teamName : item.place, updated: '복구한 자료', color: '#e1f0e9', accent: '#11976e' })), ...recent]
  const results = presentations.filter(item => `${item.name} ${item.owner}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))

  return <div className="workspace">
    <Sidebar expanded={expanded} onToggle={() => { setWorkspaceOpen(false); setExpanded(value => !value) }} onNavigate={onNavigate} onNotice={setNotice} />
    <div className="workspace-content" inert={expanded}>
      <header className="workspace-top">
        <div ref={selector} className="workspace-selector">
          <span className="workspace-caption">WORKSPACE</span>
          <button className="workspace-selector-trigger" aria-expanded={workspaceOpen} aria-controls="workspace-options" onClick={() => setWorkspaceOpen(value => !value)}>내 개인 공간 <Icon name="chevron" /></button>
          {workspaceOpen && <div id="workspace-options" className="workspace-options" role="group" aria-label="작업 공간 선택">
            <button onClick={() => setWorkspaceOpen(false)}><Icon name="check" /><span>내 개인 공간<small>나의 프레젠테이션을 모아두는 공간</small></span></button>
            <button onClick={() => { setWorkspaceOpen(false); onNavigate('/workspace') }}><Icon name="users" /><span>{data.teamName}<small>멤버 · 초대 · 공유 공간 관리</small></span></button>
          </div>}
        </div>
        <p className="workspace-breadcrumb">/ &nbsp;홈</p>
        <div className="workspace-account">
          <button className="notification-button" aria-label="알림" onClick={() => setNotice('받은 초대 확인 기능을 준비 중입니다.')}><Icon name="bell" /><i aria-hidden="true" /></button>
        </div>
      </header>

      <main className="home-main">
        <AnimatedContent distance={16} duration={0.65}>
          <section className="home-hero" aria-labelledby="home-title">
            <div className="home-hero-copy">
              <p className="home-eyebrow">PRESENT IT TOGETHER</p>
              <h1 id="home-title" tabIndex={-1}>함께 만드는 발표, 여기서 시작해요.</h1>
              <p className="home-hero-description">PPTX를 불러오거나 새 슬라이드를 만들고 팀과 이어서 편집하세요.</p>
              <button className="home-create-button" onClick={() => setCreateOpen(true)}>새 프레젠테이션 <span aria-hidden="true">↗</span></button>
            </div>
            <HomeHeroArtwork />
          </section>
        </AnimatedContent>

        <section className="home-quick-start" aria-labelledby="quick-title">
          <p className="home-eyebrow">QUICK START</p>
          <div className="home-quick-heading"><h2 id="quick-title">무엇부터 시작할까요?</h2><p>새 프레젠테이션과 워크스페이스를 빠르게 시작할 수 있어요.</p></div>
          <div className="home-quick-grid">{quickActions.map((action, index) => <AnimatedContent key={action.title} distance={18} duration={0.6} delay={index * 0.05}>
            <button className={`home-quick-card home-quick-card--${index}`} onClick={() => startQuickAction(index)}>
              <span className="home-quick-body"><span className="home-quick-icon"><Icon name={action.icon} /></span><span className="home-quick-copy"><strong>{action.title}</strong><span>{action.description}</span></span></span>
              <span className="home-quick-action">{action.action} <span aria-hidden="true">↗</span></span>
            </button>
          </AnimatedContent>)}</div>
          <input ref={upload} className="sr-only" tabIndex={-1} type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" aria-label="PPTX 파일 선택" onChange={selectFile} />
        </section>

        <section className="home-recent" aria-labelledby="recent-title">
          <div className="home-recent-heading"><h2 id="recent-title" tabIndex={-1}>최근 프레젠테이션</h2><button onClick={() => { setQuery(''); setNotice('현재 제공되는 프레젠테이션을 모두 표시합니다.') }}>모두 보기 <span aria-hidden="true">→</span></button></div>
          {searchOpen && <div className="home-search"><Icon name="search" /><input ref={search} type="search" aria-label="내 프레젠테이션 검색" placeholder="프레젠테이션 또는 워크스페이스 검색" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => {
            if (event.key === 'Escape') { setSearchOpen(false); setQuery(''); document.getElementById('recent-title')?.focus() }
          }} /><button aria-label="검색 닫기" onClick={() => { setSearchOpen(false); setQuery(''); document.getElementById('recent-title')?.focus() }}><Icon name="close" /></button></div>}
          {searchOpen && <p className="home-search-count" role="status">검색 결과 {results.length}개</p>}
          <div className="home-recent-grid">{results.map((item, index) => <AnimatedContent key={item.name} distance={18} duration={0.6} delay={index * 0.05}>
            <button className="home-recent-card" onClick={() => setNotice(`${item.name}은 디자인 미리보기 자료입니다. 편집 기능은 준비 중입니다.`)}>
              <span className="home-recent-thumbnail" style={{ background: item.color, '--thumbnail-accent': item.accent } as CSSProperties}><span className="home-recent-slide"><i /><i /><i /></span></span>
              <strong>{item.name}</strong><span className="home-recent-meta">{item.owner} · {item.updated}</span>
            </button>
          </AnimatedContent>)}</div>
          {!results.length && <p className="home-search-empty">‘{query}’에 해당하는 프레젠테이션이 없습니다.</p>}
        </section>
        <p className="home-footer-hint">팀 공간의 멤버·공유 설정은 [워크스페이스]에서, 삭제한 항목은 [휴지통]에서 관리해요.</p>
      </main>
    </div>

    <dialog ref={createDialog} className="home-create-dialog" aria-labelledby="create-title" onCancel={() => setCreateOpen(false)} onClose={() => setCreateOpen(false)}>
      <div className="home-dialog-heading"><div><p className="home-eyebrow">NEW PRESENTATION</p><h2 id="create-title">어떤 크기로 시작할까요?</h2></div><button aria-label="새 프레젠테이션 닫기" onClick={() => setCreateOpen(false)}><Icon name="close" /></button></div>
      <div className="home-format-grid">{formats.map(format => <button key={format.ratio} onClick={() => { setCreateOpen(false); setNotice(`${format.ratio} ${format.name} 선택 완료. 프레젠테이션 편집 기능은 준비 중입니다.`) }}>
        <span className={`home-format-preview home-format-preview--${format.ratio.replace(':', '-')}`}><i /><i /></span><b>{format.ratio}</b><strong>{format.name}</strong><small>{format.detail}</small>
      </button>)}</div>
    </dialog>
    <div className={`workspace-notice ${notice ? 'is-visible' : ''}`} role="status">{notice}</div>
  </div>
}
