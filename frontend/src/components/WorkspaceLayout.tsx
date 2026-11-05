import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { Sidebar } from './Sidebar'
import { useWorkspaceData } from './workspaceData'
import '../pages/home.css'
import '../pages/management.css'

export function WorkspaceLayout({ page, onNavigate, notice, onNotice, children }: {
  page: 'workspace' | 'trash'; onNavigate: (path: string) => void
  notice: string; onNotice: (message: string) => void; children: ReactNode
}) {
  const { data } = useWorkspaceData()
  const [expanded, setExpanded] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const selector = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!switcherOpen) return
    const dismiss = (event: PointerEvent) => { if (!selector.current?.contains(event.target as Node)) setSwitcherOpen(false) }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSwitcherOpen(false); selector.current?.querySelector('button')?.focus() }
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape) }
  }, [switcherOpen])
  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => onNotice(''), 6000)
    return () => clearTimeout(timeout)
  }, [notice, onNotice])
  const navigate = (path: string) => { setExpanded(false); setSwitcherOpen(false); onNavigate(path) }
  return <div className="workspace">
    <Sidebar expanded={expanded} active={page} onToggle={() => { setSwitcherOpen(false); setExpanded(value => !value) }}
      onNavigate={navigate} onNotice={onNotice} />
    <div className="workspace-content" inert={expanded}>
      <header className="workspace-top">
        <div ref={selector} className="workspace-selector">
          <span className="workspace-caption">WORKSPACE</span>
          <button className="workspace-selector-trigger" aria-expanded={switcherOpen} aria-controls="workspace-options" onClick={() => setSwitcherOpen(value => !value)}>{page === 'workspace' ? data.teamName : '내 개인 공간'} <Icon name="chevron" /></button>
          {switcherOpen && <div id="workspace-options" className="workspace-options" role="group" aria-label="작업 공간 선택">
            <button onClick={() => navigate('/home')}><Icon name="home" /><span>내 개인 공간<small>나의 프레젠테이션을 모아두는 공간</small></span></button>
            <button onClick={() => navigate('/workspace')}><Icon name="users" /><span>{data.teamName}<small>멤버 · 초대 · 공유 공간 관리</small></span></button>
          </div>}
        </div>
        <p className="workspace-breadcrumb">/ &nbsp;{page === 'workspace' ? '워크스페이스' : '휴지통'}</p>
        <div className="workspace-account">
          <button className="notification-button" aria-label="알림" onClick={() => onNotice('새 알림이 없습니다. 현재 화면은 디자인 미리보기입니다.')}><Icon name="bell" /><i aria-hidden="true" /></button>
        </div>
      </header>
      {children}
    </div>
    <div className={`workspace-notice ${notice ? 'is-visible' : ''}`} role="status">{notice}</div>
  </div>
}
