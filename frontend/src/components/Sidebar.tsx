import { useAuth } from '../auth/AuthProvider'
import { useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from './Icon'

const menu: { label: string; icon: IconName; id: string; path?: string }[] = [
  { label: '홈', icon: 'home', id: 'home', path: '/home' },
  { label: '프레젠테이션', icon: 'folder', id: 'presentations' },
  { label: '워크스페이스', icon: 'users', id: 'workspace', path: '/workspace' },
  { label: '템플릿', icon: 'template', id: 'templates' },
  { label: '휴지통', icon: 'trash', id: 'trash', path: '/trash' },
]

export function Sidebar({ expanded, active = 'home', onToggle, onNavigate, onNotice }: {
  active?: string
  onNavigate: (path: string) => void
  expanded: boolean
  onToggle: () => void
  onNotice: (message: string) => void
}) {
  const { requireAuth, user, logout } = useAuth()
  const [accountOpen, setAccountOpen] = useState(false)
  const accountMenu = useRef<HTMLDivElement>(null)
  const profile = useRef<HTMLButtonElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const sidebar = useRef<HTMLElement>(null)
  const previousExpanded = useRef(expanded)
  useEffect(() => {
    if (expanded === previousExpanded.current) return
    previousExpanded.current = expanded
    if (expanded) sidebar.current?.querySelector<HTMLButtonElement>('.sidebar-brand')?.focus()
    else toggle.current?.focus()
  }, [expanded])
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!expanded) return
      if (event.key === 'Escape') { event.preventDefault(); onToggle() }
      if (event.key === 'Tab') {
        const buttons = sidebar.current?.querySelectorAll<HTMLButtonElement>('button:not([hidden]):not([tabindex="-1"])')
        if (!buttons?.length) return
        const first = buttons[0], last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [expanded, onToggle])

  useEffect(() => {
    if (!accountOpen) return
    accountMenu.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const dismiss = (event: PointerEvent) => {
      if (!accountMenu.current?.contains(event.target as Node) && !profile.current?.contains(event.target as Node)) setAccountOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setAccountOpen(false); profile.current?.focus() }
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape) }
  }, [accountOpen])

  return <>
    <button className={`sidebar-scrim ${expanded ? 'is-visible' : ''}`} aria-hidden={!expanded} aria-label="사이드바 닫기" tabIndex={-1} onClick={onToggle} />
    <aside ref={sidebar} className={`sidebar ${expanded ? 'sidebar--expanded' : ''}`} aria-label="워크스페이스 탐색">
      <div className="sidebar-head">
        <button className="sidebar-brand" onClick={() => { if (expanded) onToggle(); onNavigate('/home') }} aria-label="PIT 홈으로 이동"><img src="/images/brand/01_mark_only_liquid_glass_1024.png" alt="" width="134" height="89" /></button>
        <button ref={profile} className="sidebar-profile" aria-expanded={accountOpen} aria-controls={accountOpen ? 'account-menu' : undefined} aria-label="개인 계정 프로필" title={expanded ? undefined : '개인 계정 프로필'} onClick={() => { if (expanded) onToggle(); requireAuth('account', () => setAccountOpen(value => !value)) }}><span className="sidebar-profile-avatar" aria-hidden="true">P</span><span className="sidebar-profile-copy" aria-hidden={!expanded}><strong>{user?.nickname || '내 계정'}</strong><small>개인 프로필</small></span></button>
        <button ref={toggle} hidden={expanded} className="sidebar-toggle" aria-expanded={expanded} aria-controls="workspace-nav" aria-label="사이드바 펼치기" onClick={onToggle}><Icon name="panel" /></button>
      </div>
      <nav id="workspace-nav" aria-label="메인 메뉴">
        {menu.map(({ label, icon, id, path }) => <button key={label} className={`sidebar-menu ${active === id ? 'is-active' : ''}`} aria-current={active === id ? 'page' : undefined} aria-label={label} title={expanded ? undefined : label} onClick={() => { if (path) { if (expanded) onToggle(); onNavigate(path) } else requireAuth('document', () => onNotice(`${label} 화면을 준비 중입니다.`)) }}>
          <Icon name={icon} /><span className="sidebar-label" aria-hidden={!expanded}>{label}</span>
        </button>)}
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-menu sidebar-settings" aria-label="설정" title={expanded ? undefined : '설정'} onClick={() => { if (expanded) onToggle(); requireAuth('account', () => setAccountOpen(value => !value)) }}><Icon name="settings" /><span className="sidebar-label" aria-hidden={!expanded}>설정</span></button>
      </div>
      {accountOpen && <div ref={accountMenu} id="account-menu" className="sidebar-account-menu" role="group" aria-label="내 계정 메뉴">
        <div className="sidebar-account-name">{user?.nickname || '내 계정'}</div>
        <button onClick={() => onNotice('프로필 확인 및 수정 기능은 준비 중입니다.')}>프로필 확인 및 수정</button>
        <button onClick={() => onNotice('로그인 및 보안 기능은 준비 중입니다.')}>로그인 및 보안</button>
        <button className="account-logout" onClick={() => { onNavigate('/home'); void logout().then(() => setAccountOpen(false)).catch(error => onNotice(error.message)) }}>로그아웃</button>
      </div>}
    </aside>
  </>
}
