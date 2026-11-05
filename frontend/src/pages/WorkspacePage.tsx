import { useRef, useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { WorkspaceLayout } from '../components/WorkspaceLayout'
import { roleLabels, useWorkspaceData, type Member, type TeamRole } from '../components/workspaceData'

const tabs = [
  { id: 'presentations', label: '프레젠테이션' }, { id: 'members', label: '멤버 관리' },
  { id: 'invitations', label: '보낸 초대' }, { id: 'settings', label: '워크스페이스 설정' },
] as const
type WorkspaceTab = typeof tabs[number]['id']
const presentationNames = ['팀 프로젝트 발표', '서비스 기획안', 'PIT 브랜드 가이드', '사용자 리서치', '제품 로드맵', '디자인 시스템', '협업 경험 제안', '11월 팀 회의', '프로토타입 리뷰', '서비스 소개', '발표 구성안', '다음 프로젝트']

export function WorkspacePage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { data, update } = useWorkspaceData()
  const [tab, setTab] = useState<WorkspaceTab>('members')
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Exclude<TeamRole, 'OWNER'>>('VIEWER')
  const [error, setError] = useState('')
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [memberRole, setMemberRole] = useState<Exclude<TeamRole, 'OWNER'>>('VIEWER')
  const [teamName, setTeamName] = useState(data.teamName)
  const [description, setDescription] = useState(data.description)
  const emailInput = useRef<HTMLInputElement>(null)
  const roleDialog = useRef<HTMLDialogElement>(null)
  const restoredDocs = data.restoredDocs.filter(item => item.place === 'PIT 디자인팀')
  const focusInvite = () => { setTab('members'); window.requestAnimationFrame(() => emailInput.current?.focus()) }
  const submitInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const address = email.trim().toLowerCase()
    if (data.members.some(member => member.email.toLowerCase() === address)) { setError('이미 워크스페이스에 참여한 팀원입니다.'); return }
    if (data.invitations.some(invitation => invitation.email.toLowerCase() === address)) { setError('이미 대기 중인 초대가 있습니다. 아래 목록에서 확인해 주세요.'); return }
    update(previous => ({ ...previous, invitations: [...previous.invitations, { id: crypto.randomUUID(), email: address, role }] }))
    setEmail(''); setError(''); setNotice('초대 미리보기가 추가되었습니다. 실제 이메일은 발송되지 않습니다.')
  }
  const cancelInvite = (id: string) => {
    update(previous => ({ ...previous, invitations: previous.invitations.filter(invitation => invitation.id !== id) }))
    setNotice('대기 중인 초대 예시를 취소했습니다.')
  }
  const invitationList = (compact = false) => <div className={`invitation-list ${compact ? 'is-compact' : ''}`}>
    {data.invitations.length ? data.invitations.map(invitation => <div className="invitation-item" key={invitation.id}>
      <div><span>{invitation.email}</span><span className="invitation-role">{invitation.role}</span></div>
      <p><span>유효기간 7일</span><span aria-hidden="true">·</span><button aria-label={`${invitation.email} 초대 취소`} onClick={() => cancelInvite(invitation.id)}>취소</button><span aria-hidden="true">/</span><button aria-label={`${invitation.email} 초대 재발송 미리보기`} onClick={() => setNotice(`${invitation.email} 재발송 미리보기입니다. 실제 이메일은 발송되지 않습니다.`)}>재발송</button></p>
    </div>) : <p className="management-description">대기 중인 초대가 없습니다.</p>}
  </div>
  const inviteCard = <aside className="management-card invite-card" aria-labelledby="invite-heading">
    <h2 id="invite-heading">새 팀원 초대</h2><p className="management-description">이메일로 초대하고 참여 권한을 선택하세요.</p>
    <form onSubmit={submitInvite}>
      <label htmlFor="invite-email">이메일 주소</label><input ref={emailInput} id="invite-email" type="email" required maxLength={254} placeholder="name@example.com" autoComplete="email" value={email} aria-invalid={!!error} aria-describedby={error ? 'invite-error' : 'invite-preview'} onChange={event => { setEmail(event.target.value); setError('') }} />
      {error && <p id="invite-error" className="management-error" role="alert">{error}</p>}
      <label htmlFor="invite-role">워크스페이스 권한</label><select id="invite-role" value={role} onChange={event => setRole(event.target.value as Exclude<TeamRole, 'OWNER'>)}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{value} · {label}</option>)}</select>
      <button type="submit" className="management-primary invite-submit">초대 미리보기 <span aria-hidden="true">→</span></button>
    </form>
    <div className="pending-invites"><h3>대기 중인 초대</h3>{invitationList(true)}</div>
  </aside>

  return <WorkspaceLayout page="workspace" onNavigate={onNavigate} notice={notice} onNotice={setNotice}>
    <main className="management-main team-main">
      <section className="team-summary" aria-labelledby="team-title"><div><p className="management-eyebrow">TEAM WORKSPACE &nbsp;/&nbsp; OWNER</p><h1 id="team-title" tabIndex={-1}>{data.teamName}</h1><p className="team-description">{data.description}</p><div className="team-stats"><span>멤버 {data.members.length}명</span><span>프레젠테이션 {presentationNames.length + restoredDocs.length}개</span></div></div>
        <div className="team-summary-actions"><button className="management-primary" onClick={focusInvite}><span aria-hidden="true">＋</span> 팀원 초대</button><button className="team-settings-link" onClick={() => setTab('settings')}><Icon name="settings" />워크스페이스 설정</button></div>
      </section>
      <div className="management-tabs team-tabs" role="tablist" aria-label="워크스페이스 관리">
        {tabs.map((item, index) => <button key={item.id} id={`team-tab-${item.id}`} role="tab" aria-selected={tab === item.id} aria-controls="team-panel" tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)} onKeyDown={event => {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
            event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
            setTab(tabs[next].id); document.getElementById(`team-tab-${tabs[next].id}`)?.focus()
          }
        }}>{item.label}</button>)}
      </div>
      <div id="team-panel" role="tabpanel" aria-labelledby={`team-tab-${tab}`}>
        {tab === 'members' && <div className="team-members-layout">
          <section className="management-card members-card" aria-labelledby="members-heading">
            <div className="management-section-heading"><h2 id="members-heading">멤버 관리</h2><span>총 {data.members.length}명</span></div><p className="management-description">권한은 워크스페이스 단위이며 문서별 공유 권한과 별도로 적용돼요.</p>
            <ul className="member-list">{data.members.map(member => <li key={member.id}>
              <span className={`member-avatar ${member.role === 'OWNER' ? 'is-owner' : ''}`}>{member.initial}</span><div className="member-identity"><strong>{member.name}</strong><span>{member.email}</span></div><span className={`member-role ${member.role === 'OWNER' ? 'is-owner' : ''}`}>{member.role}</span>
              {member.role === 'OWNER' ? <span className="member-owner-label">소유자</span> : <button className="member-manage" aria-label={`${member.name} 권한 관리`} onClick={() => { setEditingMember(member); setMemberRole(member.role as Exclude<TeamRole, 'OWNER'>); roleDialog.current?.showModal() }}>권한 관리 <span aria-hidden="true">⋯</span></button>}
            </li>)}</ul><p className="member-permission-note">OWNER만 ADMIN 승격 · 강등 가능 <span aria-hidden="true">·</span> 초대 시 기본 역할은 VIEWER</p>
          </section>{inviteCard}
        </div>}
        {tab === 'invitations' && <section className="management-card sent-invites-card"><div className="management-section-heading"><h2>보낸 초대</h2><span>대기 중 {data.invitations.length}건</span></div><p className="management-description">아직 참여하지 않은 팀원의 초대를 관리하세요.</p>{invitationList()}<button className="management-secondary" onClick={focusInvite}><Icon name="plus" />새 팀원 초대</button></section>}
        {tab === 'settings' && <section className="management-card team-settings-card"><h2>워크스페이스 설정</h2><p className="management-description">팀의 이름과 소개를 관리하세요.</p><form onSubmit={event => {
          event.preventDefault(); if (!teamName.trim()) return
          update(previous => ({ ...previous, teamName: teamName.trim(), description: description.trim() })); setNotice('워크스페이스 설정을 이 브라우저에 저장했습니다.')
        }}><label htmlFor="team-name">워크스페이스 이름</label><input id="team-name" required maxLength={40} value={teamName} onChange={event => setTeamName(event.target.value)} /><label htmlFor="team-description">소개</label><textarea id="team-description" maxLength={160} rows={3} value={description} onChange={event => setDescription(event.target.value)} /><button className="management-primary" type="submit">변경 사항 저장</button></form></section>}
        {tab === 'presentations' && <section className="management-card team-presentations-card"><div className="management-section-heading"><h2>팀 프레젠테이션</h2><span>총 {presentationNames.length + restoredDocs.length}개</span></div><p className="management-description">팀과 함께 만드는 발표 자료를 한곳에서 확인하세요.</p><div className="team-presentation-grid">{[...restoredDocs.map(item => item.name), ...presentationNames].map((name, index) => <button key={name} className="team-presentation" onClick={() => setNotice(`${name}은 미리보기 자료입니다. 편집 기능은 준비 중입니다.`)}><span className={`team-presentation-art art-${index % 3}`}><span><i /><i /><i /></span></span><strong>{name}</strong><small>{data.teamName} · {index < restoredDocs.length ? '복구한 자료' : '함께 편집'}</small></button>)}</div></section>}
      </div>
      {!!data.restoredTeams.length && <section className="management-card restored-teams"><h2>복구한 공간</h2><p className="management-description">휴지통에서 복구한 워크스페이스 예시입니다.</p>{data.restoredTeams.map(team => <div key={team.id}><Icon name="folder" /><strong>{team.name}</strong><span>복구 완료</span></div>)}</section>}
      <p className="management-preview-note" id="invite-preview">디자인 미리보기입니다. 권한·초대·설정 변경은 이 브라우저에만 저장되며, 실제 이메일은 발송되지 않습니다.</p>
    </main>
    <dialog ref={roleDialog} className="management-dialog" aria-labelledby="role-title" onClose={() => setEditingMember(null)}>
      <div className="management-dialog-heading"><h2 id="role-title">팀원 권한 관리</h2><button aria-label="권한 관리 닫기" onClick={() => roleDialog.current?.close()}><Icon name="close" /></button></div>
      <p><strong>{editingMember?.name}</strong> · {editingMember?.email}</p><label htmlFor="member-role">워크스페이스 권한</label><select id="member-role" value={memberRole} onChange={event => setMemberRole(event.target.value as Exclude<TeamRole, 'OWNER'>)}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{value} · {label}</option>)}</select><small>현재 계정은 OWNER입니다. 변경은 미리보기에만 적용됩니다.</small>
      <div className="management-dialog-actions"><button className="management-secondary" onClick={() => roleDialog.current?.close()}>취소</button><button className="management-primary" onClick={() => {
        update(previous => ({ ...previous, members: previous.members.map(member => member.id === editingMember?.id && member.role !== 'OWNER' ? { ...member, role: memberRole } : member) })); roleDialog.current?.close(); setNotice('팀원 권한을 미리보기에 저장했습니다.')
      }}>변경 사항 저장</button></div>
    </dialog>
  </WorkspaceLayout>
}
