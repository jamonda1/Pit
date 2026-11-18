import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Sidebar } from '../components/Sidebar'
import { WorkspaceSwitcher } from '../components/WorkspaceSwitcher'
import { Icon } from '../components/Icon'
import { listPresentations, useWorkspaceData } from '../components/workspaceData'
import { PresentationDialog, type PresentationDialogKind } from '../components/PresentationDialogs'
import { presentationDate, presentationSpace, type CoverKind } from '../components/presentationData'
import './home.css'

const covers: Record<CoverKind, { caption: string; title: string }> = {
  forest: { caption: 'TEAM PROJECT / 2026', title: '같은 방향,\n더 나은 이야기.' },
  purple: { caption: 'SERVICE PLANNING', title: '생각을\n설계하다.' },
  blue: { caption: 'SYSTEM & INSIGHT', title: '문제에서\n해결까지.' },
  warm: { caption: 'THE NEXT CHAPTER', title: '다음 장을\n함께.' },
  brand: { caption: 'PRESENT IT TOGETHER', title: '우리다운\n협업의 기준.' },
}

function SlideCover({ kind, title }: { kind: CoverKind; title?: string }) {
  return <span className={`home-cover home-cover--${kind}`} aria-hidden="true">
    <span className="home-cover-caption">{title ? 'PRESENT IT TOGETHER' : covers[kind].caption}</span>
    <span className="home-cover-title">{title ?? covers[kind].title}</span>
    <span className="home-cover-art"><i /><i /><i /></span>
  </span>
}
function Collaborators({ initials }: { initials: string[] }) {
  return <span className="home-collaborators" aria-hidden="true">{initials.map((initial, index) => <span key={`${initial}-${index}`}>{initial}</span>)}</span>
}

export function HomePage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { requireAuth } = useAuth()
  const { data } = useWorkspaceData()
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(() => new URLSearchParams(window.location.search).has('search'))
  const [showAll, setShowAll] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [dialog, setDialog] = useState<PresentationDialogKind | null>(null)
  const [notice, setNotice] = useState('')
  const search = useRef<HTMLInputElement>(null)
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
        if (document.querySelector('dialog[open]')) return
        event.preventDefault()
        if (searchOpen && !expanded) search.current?.focus()
        else openSearch()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [searchOpen, expanded])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const allDocuments = listPresentations(data)
  const latest = allDocuments.find(item => item.id === 'team-project') ?? allDocuments[0]
  const documents = allDocuments.filter(item => item.id !== latest?.id)
    .sort((a, b) => b.updatedAt - a.updatedAt)
  const results = searchOpen
    ? allDocuments.filter(item => `${item.name} ${presentationSpace(item, data.teamName)}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    : documents
  const closeSearch = () => { setSearchOpen(false); setQuery(''); document.getElementById('recent-title')?.focus() }
  const openDocument = (id: string) => onNavigate(`/presentations/${id}`)
  const members = data.members.slice(0, 4).map(member => member.initial)

  return <div className="workspace">
    <Sidebar expanded={expanded} onToggle={() => { setWorkspaceOpen(false); setExpanded(value => !value) }} onNavigate={onNavigate} onNotice={setNotice} />
    <div className="workspace-content" inert={expanded}>
      <header className="workspace-top">
        <WorkspaceSwitcher open={workspaceOpen} onOpenChange={setWorkspaceOpen} onNavigate={onNavigate} />
        <div className="workspace-account"><button className="notification-button" aria-label="알림" onClick={() => requireAuth('invite', () => setNotice('받은 초대 확인 기능은 준비 중입니다.'))}><Icon name="bell" /><i aria-hidden="true" /></button></div>
      </header>

      <main className="home-main">
        <section className="home-intro" aria-labelledby="home-title">
          <div><h1 id="home-title" tabIndex={-1}>이어서 만들어볼까요?</h1><p>최근 작업에서 팀의 다음 이야기로.</p></div>
          <div className="home-actions">
            <button className="home-action home-action--primary" onClick={() => requireAuth('create', () => setDialog('create'))}><span aria-hidden="true">＋</span> 새 프레젠테이션</button>
            <button className="home-action" onClick={() => requireAuth('upload', () => setDialog('import'))}><Icon name="upload" /> PPTX 가져오기</button>
          </div>
        </section>

        <div className="home-dashboard">
          <section className="home-continue" aria-labelledby="continue-title">
            <h2 id="continue-title">이어서 작업하기</h2>
            {latest ? <button className="home-latest" aria-label={`${latest.name} 이어서 편집`} onClick={() => openDocument(latest.id)}>
              <span className="home-latest-preview"><SlideCover kind={latest.cover} title={latest.fileName || latest.ratio ? latest.name : undefined} /></span>
              <span className="home-latest-copy"><span className="home-latest-eyebrow">마지막으로 열었던 자료</span><strong>{latest.name}</strong><span className="home-latest-meta">{presentationSpace(latest, data.teamName)} · {presentationDate(latest)}</span></span>
              <span className="home-latest-footer">{latest.id === 'team-project' && <span className="home-latest-collaboration"><Collaborators initials={members.slice(0, 3)} /><span>팀원과 같은 화면에서 작업 중</span></span>}<span className="home-resume">이어서 편집 <span aria-hidden="true">→</span></span></span>
            </button> : <p className="home-search-empty">최근 프레젠테이션이 없어요.</p>}
          </section>

          <section className="home-library" aria-labelledby="recent-title">
            <div className="home-library-heading"><h2 id="recent-title" tabIndex={-1}>내 프레젠테이션</h2><button aria-expanded={searchOpen ? undefined : showAll} aria-controls="home-documents" onClick={() => { if (searchOpen) { setSearchOpen(false); setQuery(''); setShowAll(true) } else setShowAll(value => !value) }}>{searchOpen ? '전체 자료 보기' : showAll ? '간단히 보기' : '모두 보기'} <span aria-hidden="true">→</span></button></div>
            {searchOpen && <div className="home-search"><Icon name="search" /><input ref={search} type="search" aria-label="내 프레젠테이션 검색" placeholder="프레젠테이션 또는 워크스페이스 검색" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') closeSearch() }} /><button aria-label="검색 닫기" onClick={closeSearch}><Icon name="close" /></button></div>}
            {searchOpen && <p className="home-search-count" role="status">검색 결과 {results.length}개</p>}
            <div id="home-documents" className={`home-library-grid ${showAll || searchOpen ? 'is-expanded' : ''}`}>
              {results.map(item => <button key={item.id} className="home-document-card" aria-label={`${item.name} 열기`} onClick={() => openDocument(item.id)}><SlideCover kind={item.cover} title={item.fileName || item.ratio ? item.name : undefined} /><span className="home-document-info"><strong>{item.name}</strong><span className="home-document-meta">{presentationSpace(item, data.teamName)} · {presentationDate(item)}</span><span className="home-document-arrow" aria-hidden="true">↗</span></span></button>)}
            </div>
            {!results.length && <p className="home-search-empty">{searchOpen ? `‘${query}’에 해당하는 프레젠테이션이 없습니다.` : '아직 표시할 프레젠테이션이 없어요.'}</p>}
          </section>

          <aside className="home-team-card" aria-labelledby="home-team-title">
            <p className="home-team-eyebrow">함께 만드는 공간</p><h2 id="home-team-title">{data.teamName}</h2>
            <div className="home-team-members"><Collaborators initials={members} /><span>멤버 {data.members.length}명</span></div>
            <div className="home-team-actions"><button onClick={() => onNavigate('/workspace')}>팀원 · 권한 관리 <span aria-hidden="true">→</span></button><button onClick={() => requireAuth('invite', () => setNotice('받은 초대 확인 기능은 준비 중입니다. 현재 초대 수는 디자인 예시입니다.'))}>받은 초대 2건 <span aria-hidden="true">→</span></button></div>
          </aside>
        </div>
      </main>
    </div>

    {dialog && <PresentationDialog kind={dialog} onClose={() => setDialog(null)} onDone={id => { setDialog(null); openDocument(id) }} />}
    <div className={`workspace-notice ${notice ? 'is-visible' : ''}`} role="status">{notice}</div>
  </div>
}
