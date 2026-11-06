import { useAuth } from '../auth/AuthProvider'
import { useEffect, useRef } from 'react'
import { Icon } from './Icon'
import { useWorkspaceData } from './workspaceData'

export function WorkspaceSwitcher({ open, onOpenChange, onNavigate }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (path: string) => void
}) {
  const { requireAuth } = useAuth()
  const { data, update } = useWorkspaceData()
  const container = useRef<HTMLDivElement>(null)
  const personalName = `${data.nickname} 님의 개인 워크스페이스`
  const name = data.activeWorkspace === 'team' ? data.teamName : personalName
  useEffect(() => {
    if (!open) return
    const dismiss = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) onOpenChange(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onOpenChange(false); container.current?.querySelector('button')?.focus() }
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape) }
  }, [open, onOpenChange])
  const select = (workspace: 'personal' | 'team') => {
    onOpenChange(false)
    requireAuth('workspace', () => {
    update(previous => ({ ...previous, activeWorkspace: workspace }))
    onOpenChange(false)
    onNavigate(workspace === 'personal' ? '/home' : '/workspace')
    })
  }
  return <div ref={container} className="workspace-selector">
    <span className="workspace-caption">WORKSPACE</span>
    <button className="workspace-selector-trigger" aria-expanded={open} aria-controls="workspace-options" title={name} onClick={() => onOpenChange(!open)}><span className="workspace-selector-name">{name}</span><Icon name="chevron" /></button>
    {open && <div id="workspace-options" className="workspace-options" role="group" aria-label="작업 공간 선택">
      <button aria-pressed={data.activeWorkspace === 'personal'} onClick={() => select('personal')}><Icon name={data.activeWorkspace === 'personal' ? 'check' : 'home'} /><span><strong>{personalName}</strong><small>나의 프레젠테이션을 모아두는 공간</small></span></button>
      <button aria-pressed={data.activeWorkspace === 'team'} onClick={() => select('team')}><Icon name={data.activeWorkspace === 'team' ? 'check' : 'users'} /><span><strong>{data.teamName}</strong><small>멤버 · 초대 · 공유 공간 관리</small></span></button>
    </div>}
  </div>
}
