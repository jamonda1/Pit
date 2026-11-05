import { useEffect, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { Sidebar } from './Sidebar'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import { useWorkspaceData } from './workspaceData'
import '../pages/home.css'
import '../pages/management.css'

export function WorkspaceLayout({ page, onNavigate, notice, onNotice, children }: {
  page: 'workspace' | 'trash'; onNavigate: (path: string) => void
  notice: string; onNotice: (message: string) => void; children: ReactNode
}) {
  const { data, update } = useWorkspaceData()
  const [expanded, setExpanded] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  useEffect(() => {
    if (page === 'workspace' && data.activeWorkspace !== 'team') {
      update(previous => ({ ...previous, activeWorkspace: 'team' }))
    }
  }, [page, data.activeWorkspace, update])
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
        <WorkspaceSwitcher open={switcherOpen} onOpenChange={setSwitcherOpen} onNavigate={navigate} />
        <div className="workspace-account">
          <button className="notification-button" aria-label="알림" onClick={() => onNotice('새 알림이 없습니다. 현재 화면은 디자인 미리보기입니다.')}><Icon name="bell" /><i aria-hidden="true" /></button>
        </div>
      </header>
      {children}
    </div>
    <div className={`workspace-notice ${notice ? 'is-visible' : ''}`} role="status">{notice}</div>
  </div>
}
