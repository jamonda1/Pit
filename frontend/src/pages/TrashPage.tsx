import { useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { WorkspaceLayout } from '../components/WorkspaceLayout'
import { useWorkspaceData, type DeletedItem } from '../components/workspaceData'

export function TrashPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { data, update } = useWorkspaceData()
  const [tab, setTab] = useState<'docs' | 'teams'>('docs')
  const [notice, setNotice] = useState('')
  const [restoring, setRestoring] = useState<DeletedItem | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const restored = useRef(false)
  const items = tab === 'docs' ? data.deletedDocs : data.deletedTeams
  const changeTab = (next: 'docs' | 'teams') => setTab(next)
  const restore = () => {
    if (!restoring) return
    restored.current = true
    update(previous => tab === 'docs'
      ? { ...previous, deletedDocs: previous.deletedDocs.filter(item => item.id !== restoring.id), restoredDocs: [...previous.restoredDocs, restoring] }
      : { ...previous, deletedTeams: previous.deletedTeams.filter(item => item.id !== restoring.id), restoredTeams: [...previous.restoredTeams, restoring] })
    setNotice(`${restoring.name} 복구 미리보기를 완료했습니다. ${tab === 'docs' ? '홈의 최근 프레젠테이션' : '워크스페이스의 복구한 공간'}에서 확인하세요.`)
    dialog.current?.close()
  }
  return <WorkspaceLayout page="trash" onNavigate={onNavigate} notice={notice} onNotice={setNotice}>
    <main className="management-main trash-main">
      <div className="trash-intro"><h1 tabIndex={-1}>휴지통</h1><p>삭제된 워크스페이스와 프레젠테이션을 확인하고 복구할 수 있어요.</p></div>
      <section className="retention-banner" aria-label="휴지통 보관 정책"><span className="retention-icon"><Icon name="restore" /></span><div><h2>삭제한 항목은 10일 동안 보관됩니다.</h2><p>기한이 지나면 영구 삭제 대상이 됩니다. 보관 중에는 편집하거나 공유할 수 없어요.</p></div></section>
      <div className="management-tabs trash-tabs" role="tablist" aria-label="삭제된 항목 종류">
        {(['docs', 'teams'] as const).map((value, index) => <button key={value} role="tab" id={`trash-tab-${value}`} aria-selected={tab === value} aria-controls="trash-panel" tabIndex={tab === value ? 0 : -1} onClick={() => changeTab(value)} onKeyDown={event => {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
            event.preventDefault(); const next = event.key === 'Home' ? 'docs' : event.key === 'End' ? 'teams' : value === 'docs' ? 'teams' : 'docs'
            changeTab(next); document.getElementById(`trash-tab-${next}`)?.focus()
          }
        }}>{index === 0 ? '삭제된 PPT' : '삭제된 워크스페이스'}</button>)}
      </div>
      <section id="trash-panel" role="tabpanel" aria-labelledby={`trash-tab-${tab}`} className="management-card trash-card">
        <h2 tabIndex={-1}>{tab === 'docs' ? '삭제된 프레젠테이션' : '삭제된 워크스페이스'}</h2>
        <p className="management-description">{tab === 'docs' ? '개인 · 팀 공간의 PPT가 함께 표시됩니다.' : '삭제된 팀 공간을 복구할 수 있어요.'}</p>
        {items.length ? <table className="trash-table"><caption className="sr-only">{tab === 'docs' ? '삭제된 프레젠테이션' : '삭제된 워크스페이스'} 복구 목록</caption>
          <thead><tr><th scope="col">{tab === 'docs' ? '프레젠테이션' : '워크스페이스'}</th><th scope="col">{tab === 'docs' ? '원래 위치' : '공간 유형'}</th><th scope="col">삭제일</th><th scope="col">복구 만료일</th><th scope="col">복구</th></tr></thead>
          <tbody>{items.map(item => <tr key={item.id}>
            <th scope="row"><div className="trash-item"><span className={`trash-file-icon ${tab === 'teams' ? 'is-team' : ''}`}><Icon name={tab === 'docs' ? 'document' : 'folder'} /></span><span><strong>{item.name}</strong><small>{tab === 'docs' ? 'PPTX' : '팀 공간'} · 복구 대기</small></span></div></th>
            <td data-label={tab === 'docs' ? '원래 위치' : '공간 유형'}>{item.place === 'PIT 디자인팀' ? data.teamName : item.place}</td><td data-label="삭제일">{item.deleted}</td><td data-label="복구 만료일" className="trash-expiry">{item.expires}</td>
            <td><button className="restore-button" aria-label={`${item.name} 복구하기`} onClick={() => { setRestoring(item); dialog.current?.showModal() }}>복구하기</button></td>
          </tr>)}</tbody>
        </table> : <div className="management-empty"><Icon name="trash" /><h3>삭제된 {tab === 'docs' ? '프레젠테이션이' : '워크스페이스가'} 없어요.</h3><p>복구한 항목은 원래 공간에서 확인할 수 있어요.</p><button className="management-secondary" onClick={() => onNavigate(tab === 'docs' ? '/home' : '/workspace')}>{tab === 'docs' ? '홈으로 이동' : '워크스페이스로 이동'} <span aria-hidden="true">→</span></button></div>}
      </section>
    </main>
    <dialog ref={dialog} className="management-dialog" aria-labelledby="restore-title" onClose={() => { setRestoring(null); if (restored.current) { restored.current = false; document.querySelector<HTMLElement>('.trash-card h2')?.focus() } }}>
      <div className="management-dialog-heading"><h2 id="restore-title">{tab === 'docs' ? '프레젠테이션을' : '워크스페이스를'} 복구할까요?</h2><button aria-label="복구 창 닫기" onClick={() => dialog.current?.close()}><Icon name="close" /></button></div>
      <p className="restore-item-name">{restoring?.name}</p><p>{tab === 'docs' ? `${restoring?.place === 'PIT 디자인팀' ? data.teamName : restoring?.place}의 자료로 복구합니다.` : '복구한 공간은 워크스페이스에서 확인할 수 있어요. 내부 자료의 실제 복구는 서버 연결 후 지원됩니다.'}</p><small>지금은 화면 예시만 복구하며 실제 파일은 변경되지 않습니다.</small>
      <div className="management-dialog-actions"><button className="management-secondary" onClick={() => dialog.current?.close()}>취소</button><button className="management-primary" onClick={restore}>복구하기</button></div>
    </dialog>
  </WorkspaceLayout>
}
