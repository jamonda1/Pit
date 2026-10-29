import { useEffect, useRef } from 'react'
import { Icon } from './Icon'
export function Sidebar({ expanded, onToggle, onLanding, onNotice }: { expanded: boolean; onToggle: () => void; onLanding: () => void; onNotice: (message: string) => void }) {
  const toggle = useRef<HTMLButtonElement>(null)
  const sidebar = useRef<HTMLElement>(null)
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!expanded) return
      if (event.key === 'Escape') { onToggle(); toggle.current?.focus() }
      if (event.key === 'Tab') {
        const buttons = sidebar.current?.querySelectorAll<HTMLButtonElement>('button')
        if (!buttons?.length) return
        const first = buttons[0], last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [expanded, onToggle])
  return <>
    <button className={`sidebar-scrim ${expanded ? 'is-visible' : ''}`} aria-hidden={!expanded} aria-label="사이드바 닫기" tabIndex={-1} onClick={() => { onToggle(); toggle.current?.focus() }} />
    <aside ref={sidebar} className={`sidebar ${expanded ? 'sidebar--expanded' : ''}`} aria-label="워크스페이스 탐색">
      <button className="sidebar-brand" onClick={onLanding} aria-label="PIT 랜딩으로 이동"><img className="sidebar-logo sidebar-logo--symbol" src="/images/brand/04_symbol_app_icon_1024.png" alt="" aria-hidden="true" />
        <img className="sidebar-logo sidebar-logo--wordmark" src="/images/brand/01_mark_only_liquid_glass_1024.png" alt="" aria-hidden="true" /></button>
      <button ref={toggle} className="sidebar-toggle" aria-expanded={expanded} aria-controls="workspace-nav" aria-label={expanded ? '사이드바 접기' : '사이드바 펼치기'} onClick={onToggle}><Icon name="panel" style={expanded ? { transform: 'scaleX(-1)' } : undefined} /></button>
      <button className="sidebar-profile" aria-label="내 워크스페이스 · 개인 계정" onClick={() => onNotice('개인 계정 프로필 기능을 준비 중입니다.')}><span className="avatar">P</span><span className="sidebar-label sidebar-profile-label" aria-hidden={!expanded}><b>내 워크스페이스</b><small>개인 계정</small></span></button>
      <nav id="workspace-nav" aria-label="메인 메뉴">
        <button className="sidebar-menu is-active" aria-current="page" aria-label="홈" onClick={() => expanded && onToggle()}><Icon name="home"/><span className="sidebar-label" aria-hidden={!expanded}>홈</span></button>
        <button className="sidebar-menu" aria-label="프로젝트" onClick={() => onNotice('프로젝트 화면을 준비 중입니다.')}><Icon name="folder"/><span className="sidebar-label" aria-hidden={!expanded}>프로젝트</span></button>
        <button className="sidebar-menu" aria-label="템플릿" onClick={() => onNotice('템플릿 화면을 준비 중입니다.')}><Icon name="template"/><span className="sidebar-label" aria-hidden={!expanded}>템플릿</span></button>
      </nav>
      <button className="sidebar-menu sidebar-settings" aria-label="설정" onClick={() => onNotice('설정 화면을 준비 중입니다.')}><Icon name="settings"/><span className="sidebar-label" aria-hidden={!expanded}>설정</span></button>
    </aside>
  </>
}
