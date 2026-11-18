import { useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { PresentationDialog, type PresentationDialogKind } from '../components/PresentationDialogs'
import {
  normalizePresentationName, personalSpace, presentationDate, presentationName, presentationRoles,
  presentationSpace, sharedSpace, type DocumentRole, type DocumentShare, type Presentation,
} from '../components/presentationData'
import { WorkspaceLayout } from '../components/WorkspaceLayout'
import { listPresentations, useWorkspaceData, type WorkspaceData } from '../components/workspaceData'
import './presentations.css'

type DocumentAction = 'rename' | 'share' | 'trash'
const actionTitles: Record<DocumentAction, string> = {
  rename: '프레젠테이션 이름 변경',
  share: '프레젠테이션 공유',
  trash: '프레젠테이션을 삭제할까요?',
}
const dateFormat = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })

function DocumentDialog({ action, doc, onClose, onNotice }: {
  action: DocumentAction
  doc: Presentation
  onClose: () => void
  onNotice: (notice: string) => void
}) {
  const { data, update } = useWorkspaceData()
  const dialog = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState(doc.name)
  const [role, setRole] = useState<DocumentShare['role']>('VIEWER')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const shares = doc.shares ?? []

  useLayoutEffect(() => {
    const node = dialog.current
    node?.showModal()
    return () => node?.close()
  }, [])

  function changeDoc(change: (doc: Presentation) => Presentation) {
    update(previous => {
      const current = listPresentations(previous).find(item => item.id === doc.id && item.role === 'OWNER')
      if (!current) return previous
      return {
        ...previous,
        restoredDocs: previous.restoredDocs.filter(item => item.id !== doc.id),
        presentations: [change(current), ...previous.presentations.filter(item => item.id !== doc.id)],
      }
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (doc.role !== 'OWNER') return
    if (action === 'share') {
      const address = email.trim().toLowerCase()
      if (shares.some(share => share.email === address)) { setError('이미 추가된 이메일이에요.'); return }
      changeDoc(current => ({ ...current, shares: [...(current.shares ?? []), { email: address, role }] }))
      setEmail('')
      setError('')
      return
    }
    if (action === 'rename') {
      const next = normalizePresentationName(name)
      if (!next) { setError('프레젠테이션 이름을 입력해 주세요.'); return }
      changeDoc(current => ({ ...current, name: next, updatedAt: Date.now(), activity: undefined }))
      onNotice('이름을 변경했어요.')
    } else {
      const deleted = new Date()
      const expires = new Date(deleted)
      expires.setDate(expires.getDate() + 10)
      update(previous => ({
        ...previous,
        presentations: previous.presentations.filter(item => item.id !== doc.id),
        restoredDocs: previous.restoredDocs.filter(item => item.id !== doc.id),
        deletedDocs: [{
          id: doc.id, name: presentationName(doc), place: presentationSpace(doc, previous.teamName),
          deleted: dateFormat.format(deleted), expires: dateFormat.format(expires), presentation: doc,
        }, ...previous.deletedDocs],
      }))
      onNotice('프레젠테이션을 휴지통으로 이동했어요.')
    }
    onClose()
  }

  return <dialog ref={dialog} className="management-dialog presentation-dialog" aria-labelledby="document-action-title"
    onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="management-dialog-heading">
      <h2 id="document-action-title">{actionTitles[action]}</h2>
      <button type="button" aria-label="닫기" onClick={onClose}><Icon name="close" /></button>
    </div>
    <p><strong>{presentationName(doc)}</strong> · {presentationSpace(doc, data.teamName)}</p>
    <form className="presentation-form" onSubmit={submit}>
      {action === 'rename' && <>
        <label htmlFor="presentation-rename">새 이름</label>
        <input id="presentation-rename" value={name} maxLength={100} required onChange={event => { setName(event.target.value); setError('') }} />
      </>}
      {action === 'trash' && <p>휴지통에서 다시 복구할 수 있어요.</p>}
      {action === 'share' && <>
        <p>이 브라우저에서만 공유 설정을 미리 볼 수 있어요.</p>
        {doc.space === 'team' && <p>팀 접근과 사용자별 문서 권한은 별도로 관리돼요.</p>}
        {doc.role === 'OWNER' && <>
          <label htmlFor="presentation-share-email">이메일</label>
          <input id="presentation-share-email" type="email" autoComplete="off" value={email} required onChange={event => { setEmail(event.target.value); setError('') }} />
          <label htmlFor="presentation-share-role">문서 권한</label>
          <select id="presentation-share-role" value={role} onChange={event => setRole(event.target.value as typeof role)}>
            <option value="VIEWER">읽기 전용</option><option value="EDITOR">편집 가능</option>
          </select>
          <button className="management-primary presentation-share-add" type="submit">공유 설정 추가</button>
        </>}
        {shares.length > 0 && <ul className="presentation-shares">{shares.map(share => <li key={share.email}>
          <span>{share.email}<small>{presentationRoles[share.role]}</small></span>
          {doc.role === 'OWNER' && <button type="button" className="management-secondary" aria-label={`${share.email} 공유 해제`}
            onClick={() => changeDoc(current => ({ ...current, shares: current.shares?.filter(item => item.email !== share.email) }))}>공유 해제</button>}
        </li>)}</ul>}
      </>}
      {error && <p className="management-error" role="alert">{error}</p>}
      <div className="management-dialog-actions">
        <button type="button" className="management-secondary" onClick={onClose}>{action === 'share' ? '닫기' : '취소'}</button>
        {action !== 'share' && <button className="management-primary" type="submit">{action === 'rename' ? '변경사항 저장' : '휴지통으로 이동'}</button>}
      </div>
    </form>
  </dialog>
}

const pageSize = 8
function documentList(data: WorkspaceData, query: string, space: string, permission: string, order: string) {
  const search = query.trim().toLocaleLowerCase()
  return listPresentations(data).filter(doc => (
    (!space || doc.space === space) && (!permission || doc.role === permission)
    && presentationName(doc).toLocaleLowerCase().includes(search)
  )).sort((a, b) => order === 'name' ? a.name.localeCompare(b.name, 'ko') : b.updatedAt - a.updatedAt)
}

export function PresentationsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { data } = useWorkspaceData()
  const [query, setQuery] = useState('')
  const [space, setSpace] = useState('')
  const [permission, setPermission] = useState<DocumentRole | ''>('')
  const [order, setOrder] = useState('recent')
  const [view, setView] = useState<'list' | 'cards'>('list')
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState<PresentationDialogKind | null>(null)
  const [selected, setSelected] = useState<{ action: DocumentAction; id: string } | null>(null)
  const menu = useRef<HTMLDetailsElement | null>(null)
  const results = documentList(data, query, space, permission, order)
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleDocs = results.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const activeDoc = selected && listPresentations(data).find(doc => doc.id === selected.id)
  const goToDocument = (id: string) => onNavigate(`/presentations/${id}`)
  const act = (action: DocumentAction, id: string) => {
    if (menu.current) menu.current.open = false
    setSelected({ action, id })
  }

  const actions = <div className="home-actions presentation-actions">
    <button className="home-action home-action--primary" onClick={() => setDialog('create')}>＋ 새 프레젠테이션</button>
    <button className="home-action" onClick={() => setDialog('import')}><Icon name="upload" /> PPTX 가져오기</button>
  </div>

  return <WorkspaceLayout page="presentations" onNavigate={onNavigate} notice={notice} onNotice={setNotice}>
    <main className="management-main presentation-main">
      <div className="presentation-heading">
        <div><h1 tabIndex={-1}>내 프레젠테이션</h1><p className="management-description">개인 자료와 공유받은 PPTX를 한곳에서 관리하세요.</p></div>
        {actions}
      </div>
      <div className="management-card presentation-filters">
        <div className="presentation-search"><Icon name="search" /><input type="search" aria-label="프레젠테이션 이름 검색" placeholder="프레젠테이션 이름 검색"
          value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} /></div>
        <select aria-label="소속 공간" value={space} onChange={event => { setSpace(event.target.value); setPage(1) }}>
          <option value="">전체 공간</option><option value="personal">{personalSpace}</option><option value="team">{data.teamName}</option><option value="shared">{sharedSpace}</option>
        </select>
        <select aria-label="정렬" value={order} onChange={event => { setOrder(event.target.value); setPage(1) }}>
          <option value="recent">최근 수정순</option><option value="name">이름순</option>
        </select>
        <select aria-label="문서 권한" value={permission} onChange={event => { setPermission(event.target.value as typeof permission); setPage(1) }}>
          <option value="">모든 권한</option>{Object.entries(presentationRoles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button className="management-secondary" onClick={() => setView(view === 'list' ? 'cards' : 'list')}>{view === 'list' ? '카드 보기' : '목록 보기'}</button>
      </div>
      <h2 className="presentation-count" aria-live="polite">{query || space || permission ? '검색 결과' : '전체 문서'} {results.length}</h2>
      {results.length ? <div className={`presentation-results is-${view}`}>
        <div className="presentation-table-heading" aria-hidden="true"><span>프레젠테이션</span><span>소속 공간</span><span>마지막 수정</span><span>작업</span></div>
        <ul>{visibleDocs.map(doc => <li className="presentation-row" key={doc.id}>
          <button className="presentation-document" onClick={() => goToDocument(doc.id)}>
            <span className={`presentation-thumbnail home-cover--${doc.cover}`}><Icon name="document" /></span>
            <span><strong>{presentationName(doc)}</strong><small>{doc.ratio ? `${doc.ratio} · 초안` : `PPTX · ${presentationRoles[doc.role]}`}</small></span>
          </button>
          <span className="presentation-space">{presentationSpace(doc, data.teamName)}</span>
          <span className="presentation-date">{presentationDate(doc)}</span>
          <div className="presentation-row-actions">
            <button className="presentation-text-action" aria-label={`${doc.name} 공유`} onClick={() => act('share', doc.id)}>공유</button>
            {doc.role === 'OWNER' && <details className="presentation-more" onToggle={event => {
              const target = event.currentTarget
              if (!target.open) return
              if (menu.current && menu.current !== target) menu.current.open = false
              menu.current = target
            }} onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false }}
              onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}>
              <summary aria-label={`${doc.name} 더보기`}>⋯</summary>
              <div>
                <button onClick={() => act('rename', doc.id)}>이름 변경</button>
                <button onClick={() => act('share', doc.id)}>공유 설정</button>
                <button onClick={() => act('trash', doc.id)}>휴지통으로 이동</button>
              </div>
            </details>}
          </div>
        </li>)}</ul>
      </div> : <div className="management-card management-empty">
        <Icon name={query || space || permission ? 'search' : 'document'} />
        <h3>{query || space || permission ? '검색 결과가 없어요.' : '아직 프레젠테이션이 없어요.'}</h3>
        {query || space || permission
          ? <button className="management-secondary" onClick={() => { setQuery(''); setSpace(''); setPermission(''); setOrder('recent'); setPage(1) }}>검색과 필터 초기화</button>
          : actions}
      </div>}
      {totalPages > 1 && <nav className="presentation-pagination" aria-label="프레젠테이션 목록 페이지">
        <button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>이전</button>
        <span>{currentPage} / {totalPages}</span>
        <button onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages}>다음</button>
      </nav>}
    </main>
    {dialog && <PresentationDialog kind={dialog} onClose={() => setDialog(null)} onDone={id => { setDialog(null); goToDocument(id) }} />}
    {selected && activeDoc && <DocumentDialog action={selected.action} doc={activeDoc} onClose={() => setSelected(null)} onNotice={setNotice} />}
  </WorkspaceLayout>
}
