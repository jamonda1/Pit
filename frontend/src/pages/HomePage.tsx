import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Sidebar } from '../components/Sidebar'
import { WorkspaceSwitcher } from '../components/WorkspaceSwitcher'
import { Icon } from '../components/Icon'
import { useWorkspaceData } from '../components/workspaceData'
import './home.css'

type CoverKind = 'forest' | 'purple' | 'blue' | 'warm' | 'brand'
type Presentation = { id: string; name: string; owner: string; updated: string; cover: CoverKind }
const latest: Presentation = { id: 'team-project', name: '팀 프로젝트 발표', owner: 'PIT 디자인팀', updated: '함께 편집 중', cover: 'forest' }
const library: Presentation[] = [
  { id: 'service-plan', name: '서비스 기획안', owner: '내 개인 공간', updated: '어제 수정', cover: 'purple' },
  { id: 'distributed-results', name: '분산 처리 결과', owner: '개발 워크스페이스', updated: '3일 전 수정', cover: 'blue' },
  { id: 'presentation-outline', name: '발표 구성안', owner: '내 개인 공간', updated: '7일 전 수정', cover: 'warm' },
  { id: 'brand-guide', name: 'PIT 브랜드 가이드', owner: 'PIT 디자인팀', updated: '팀 자료', cover: 'brand' },
]
const formats = [
  { ratio: '16:9', name: '와이드 프레젠테이션', detail: '일반 발표 · 가장 많이 사용' },
  { ratio: '4:3', name: '클래식 프레젠테이션', detail: '전통적인 발표 자료' },
  { ratio: '9:16', name: '세로 프레젠테이션', detail: '모바일 · 세로형 콘텐츠' },
]
const covers: Record<CoverKind, { caption: string; title: string }> = {
  forest: { caption: 'TEAM PROJECT / 2026', title: '같은 방향,\n더 나은 이야기.' },
  purple: { caption: 'SERVICE PLANNING', title: '생각을\n설계하다.' },
  blue: { caption: 'SYSTEM & INSIGHT', title: '문제에서\n해결까지.' },
  warm: { caption: 'THE NEXT CHAPTER', title: '다음 장을\n함께.' },
  brand: { caption: 'PRESENT IT TOGETHER', title: '우리다운\n협업의 기준.' },
}

function SlideCover({ kind }: { kind: CoverKind }) {
  return <span className={`home-cover home-cover--${kind}`} aria-hidden="true">
    <span className="home-cover-caption">{covers[kind].caption}</span>
    <span className="home-cover-title">{covers[kind].title}</span>
    <span className="home-cover-art"><i /><i /><i /></span>
  </span>
}
function Collaborators({ initials }: { initials: string[] }) {
  return <span className="home-collaborators" aria-hidden="true">{initials.map((initial, index) => <span key={`${initial}-${index}`}>{initial}</span>)}</span>
}

export function HomePage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { data } = useWorkspaceData()
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(() => new URLSearchParams(window.location.search).has('search'))
  const [showAll, setShowAll] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const search = useRef<HTMLInputElement>(null)
  const upload = useRef<HTMLInputElement>(null)
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
  const getOwner = (owner: string) => owner === 'PIT 디자인팀' ? data.teamName : owner
  const documents: Presentation[] = [
    ...data.restoredDocs.map(item => ({ id: item.id, name: item.name, owner: item.place, updated: '복구한 자료', cover: 'warm' as const })),
    ...library,
  ]
  const allDocuments = [latest, ...documents]
  const results = searchOpen
    ? allDocuments.filter(item => `${item.name} ${getOwner(item.owner)}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    : documents
  const closeSearch = () => { setSearchOpen(false); setQuery(''); document.getElementById('recent-title')?.focus() }
  const previewDocument = (name: string) => setNotice(`${name}은 디자인 미리보기 자료입니다. 편집 기능은 준비 중입니다.`)
  const members = data.members.slice(0, 4).map(member => member.initial)

  return <div className="workspace">
    <Sidebar expanded={expanded} onToggle={() => { setWorkspaceOpen(false); setExpanded(value => !value) }} onNavigate={onNavigate} onNotice={setNotice} />
    <div className="workspace-content" inert={expanded}>
      <header className="workspace-top">
        <WorkspaceSwitcher open={workspaceOpen} onOpenChange={setWorkspaceOpen} onNavigate={onNavigate} />
        <div className="workspace-account"><button className="notification-button" aria-label="알림" onClick={() => setNotice('받은 초대 확인 기능은 준비 중입니다.')}><Icon name="bell" /><i aria-hidden="true" /></button></div>
      </header>

      <main className="home-main">
        <section className="home-intro" aria-labelledby="home-title">
          <div><h1 id="home-title" tabIndex={-1}>이어서 만들어볼까요?</h1><p>최근 작업에서 팀의 다음 이야기로.</p></div>
          <div className="home-actions">
            <button className="home-action home-action--primary" onClick={() => setCreateOpen(true)}><span aria-hidden="true">＋</span> 새 프레젠테이션</button>
            <button className="home-action" onClick={() => upload.current?.click()}><Icon name="upload" /> PPTX 가져오기</button>
          </div>
          <input ref={upload} className="sr-only" tabIndex={-1} type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" aria-label="PPTX 파일 선택" onChange={selectFile} />
        </section>

        <div className="home-dashboard">
          <section className="home-continue" aria-labelledby="continue-title">
            <h2 id="continue-title">이어서 작업하기</h2>
            <button className="home-latest" aria-label={`${latest.name} 이어서 편집`} onClick={() => previewDocument(latest.name)}>
              <span className="home-latest-preview"><SlideCover kind="forest" /></span>
              <span className="home-latest-copy"><span className="home-latest-eyebrow">마지막으로 열었던 자료</span><strong>{latest.name}</strong><span className="home-latest-meta">{data.teamName} · {latest.updated}</span></span>
              <span className="home-latest-footer"><span className="home-latest-collaboration"><Collaborators initials={members.slice(0, 3)} /><span>팀원과 같은 화면에서 작업 중</span></span><span className="home-resume">이어서 편집 <span aria-hidden="true">→</span></span></span>
            </button>
          </section>

          <section className="home-library" aria-labelledby="recent-title">
            <div className="home-library-heading"><h2 id="recent-title" tabIndex={-1}>내 프레젠테이션</h2><button aria-expanded={searchOpen ? undefined : showAll} aria-controls="home-documents" onClick={() => { if (searchOpen) { setSearchOpen(false); setQuery(''); setShowAll(true) } else setShowAll(value => !value) }}>{searchOpen ? '전체 자료 보기' : showAll ? '간단히 보기' : '모두 보기'} <span aria-hidden="true">→</span></button></div>
            {searchOpen && <div className="home-search"><Icon name="search" /><input ref={search} type="search" aria-label="내 프레젠테이션 검색" placeholder="프레젠테이션 또는 워크스페이스 검색" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') closeSearch() }} /><button aria-label="검색 닫기" onClick={closeSearch}><Icon name="close" /></button></div>}
            {searchOpen && <p className="home-search-count" role="status">검색 결과 {results.length}개</p>}
            <div id="home-documents" className={`home-library-grid ${showAll || searchOpen ? 'is-expanded' : ''}`}>
              {results.map(item => <button key={item.id} className="home-document-card" aria-label={`${item.name} 열기`} onClick={() => previewDocument(item.name)}><SlideCover kind={item.cover} /><span className="home-document-info"><strong>{item.name}</strong><span className="home-document-meta">{getOwner(item.owner)} · {item.updated}</span><span className="home-document-arrow" aria-hidden="true">↗</span></span></button>)}
            </div>
            {!results.length && <p className="home-search-empty">‘{query}’에 해당하는 프레젠테이션이 없습니다.</p>}
          </section>

          <aside className="home-team-card" aria-labelledby="home-team-title">
            <p className="home-team-eyebrow">함께 만드는 공간</p><h2 id="home-team-title">{data.teamName}</h2>
            <div className="home-team-members"><Collaborators initials={members} /><span>멤버 {data.members.length}명</span></div>
            <div className="home-team-actions"><button onClick={() => onNavigate('/workspace')}>팀원 · 권한 관리 <span aria-hidden="true">→</span></button><button onClick={() => setNotice('받은 초대 확인 기능은 준비 중입니다. 현재 초대 수는 디자인 예시입니다.')}>받은 초대 2건 <span aria-hidden="true">→</span></button></div>
          </aside>
        </div>
        <p className="home-footer-hint">작업하던 자료를 열고, 팀과 같은 화면에서 이어가세요.</p>
      </main>
    </div>

    <dialog ref={createDialog} className="home-create-dialog" aria-labelledby="create-title" onCancel={() => setCreateOpen(false)} onClose={() => setCreateOpen(false)}>
      <div className="home-dialog-heading"><div><p className="home-eyebrow">NEW PRESENTATION</p><h2 id="create-title">어떤 크기로 시작할까요?</h2></div><button aria-label="새 프레젠테이션 닫기" onClick={() => setCreateOpen(false)}><Icon name="close" /></button></div>
      <div className="home-format-grid">{formats.map(format => <button key={format.ratio} onClick={() => { setCreateOpen(false); setNotice(`${format.ratio} ${format.name} 선택 완료. 프레젠테이션 편집 기능은 준비 중입니다.`) }}><span className={`home-format-preview home-format-preview--${format.ratio.replace(':', '-')}`}><i /><i /></span><b>{format.ratio}</b><strong>{format.name}</strong><small>{format.detail}</small></button>)}</div>
    </dialog>
    <div className={`workspace-notice ${notice ? 'is-visible' : ''}`} role="status">{notice}</div>
  </div>
}
