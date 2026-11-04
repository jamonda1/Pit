import { useEffect, useRef } from 'react'
import { Icon, type IconName } from './Icon'

const menu: { label: string; icon: IconName }[] = [
  { label: '홈', icon: 'home' },
  { label: '프레젠테이션', icon: 'folder' },
  { label: '워크스페이스', icon: 'users' },
  { label: '템플릿', icon: 'template' },
  { label: '휴지통', icon: 'trash' },
]

export function Sidebar({ expanded, onToggle, onLanding, onNotice, onSearch }: {
  expanded: boolean
  onToggle: () => void
  onLanding: () => void
  onNotice: (message: string) => void
  onSearch: () => void
}) {
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

  return <>
    <button className={`sidebar-scrim ${expanded ? 'is-visible' : ''}`} aria-hidden={!expanded} aria-label="사이드바 닫기" tabIndex={-1} onClick={onToggle} />
    <aside ref={sidebar} className={`sidebar ${expanded ? 'sidebar--expanded' : ''}`} aria-label="워크스페이스 탐색">
      <div className="sidebar-head">
        <button className="sidebar-brand" onClick={onLanding} aria-label="PIT 랜딩으로 이동"><img src="/images/brand/01_mark_only_liquid_glass_1024.png" alt="" width="134" height="89" /></button>
        <button ref={toggle} hidden={expanded} className="sidebar-toggle" aria-expanded={expanded} aria-controls="workspace-nav" aria-label="사이드바 펼치기" onClick={onToggle}><Icon name="panel" /></button>
        <button className="sidebar-quick-search" hidden={!expanded} aria-label="빠른 검색" onClick={onSearch}><Icon name="search" /><span>빠른 검색</span><kbd>Ctrl K</kbd></button>
      </div>
      <nav id="workspace-nav" aria-label="메인 메뉴">
        {menu.map(({ label, icon }, i) => <button key={label} className={`sidebar-menu ${i === 0 ? 'is-active' : ''}`} aria-current={i === 0 ? 'page' : undefined} aria-label={label} title={expanded ? undefined : label} onClick={() => i === 0 ? expanded && onToggle() : onNotice(`${label} 화면을 준비 중입니다.`)}>
          <Icon name={icon} /><span className="sidebar-label" aria-hidden={!expanded}>{label}</span>
        </button>)}
      </nav>
      <button className="sidebar-menu sidebar-settings" aria-label="설정" title={expanded ? undefined : '설정'} onClick={() => onNotice('설정 화면을 준비 중입니다.')}><Icon name="settings" /><span className="sidebar-label" aria-hidden={!expanded}>설정</span></button>
    </aside>
  </>
}
