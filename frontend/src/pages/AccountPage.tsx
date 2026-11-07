import { useLayoutEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import type { AccountAdapter, AuthUser, SocialProvider } from '../auth/authAdapter'
import { previewConfirmationCode } from '../auth/previewAccount'
import { Icon } from '../components/Icon'
import { WorkspaceLayout } from '../components/WorkspaceLayout'
import './account.css'

const sections = [
  { id: 'profile', path: '/account/profile', label: '프로필', description: '내 정보 편집' },
  { id: 'security', path: '/account/security', label: '로그인 및 보안', description: '연결된 로그인 수단' },
  { id: 'withdraw', path: '/account/withdraw', label: '회원 탈퇴', description: '계정 종료' },
] as const

type AccountSection = typeof sections[number]
type SecurityAction = { type: 'unlink'; provider: SocialProvider } | { type: 'password' | 'logout' | 'withdraw' }
const providerNames = { google: 'Google', kakao: 'Kakao' }
const withdrawalPhrase = '탈퇴합니다'

export function accountSectionFor(path: string) {
  return path === '/account' ? sections[0] : sections.find(section => section.path === path)
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : '변경사항을 저장하지 못했어요. 다시 시도해 주세요.'

function ProfileForm({ user, account, onNotice }: {
  user: AuthUser
  account: AccountAdapter
  onNotice: (message: string) => void
}) {
  const [nickname, setNickname] = useState(user.nickname)
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl)
  const [reading, setReading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const dirty = nickname.trim() !== user.nickname || avatarUrl !== user.avatarUrl

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    setError('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('2MB 이하의 JPG, PNG, WEBP 사진을 선택해 주세요.')
      return
    }

    setReading(true)
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('사진을 읽을 수 없어요.'))
        reader.readAsDataURL(file)
      })
      const image = new Image()
      image.src = url
      await image.decode()
      setAvatarUrl(url)
    } catch {
      setError('사진을 열 수 없어요. 다른 파일을 선택해 주세요.')
    } finally {
      setReading(false)
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!dirty || reading || saving) return
    setError('')
    setSaving(true)
    try {
      const updated = await account.updateProfile({ nickname, avatarUrl })
      setNickname(updated.nickname)
      onNotice('프로필을 저장했어요.')
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="management-card account-card" onSubmit={save}>
      <h2>프로필 정보</h2>
      <p className="management-description">다른 팀원에게 보이는 정보예요.</p>
      <div className="account-photo">
        <div className="account-avatar" aria-hidden="true">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : Array.from(nickname.trim() || user.nickname)[0]}
        </div>
        <div>
          <div className="account-photo-actions">
            <button type="button" className="management-secondary" disabled={reading || saving} onClick={() => fileInput.current?.click()}>사진 변경</button>
            {avatarUrl && <button type="button" className="account-text-button" disabled={reading || saving} onClick={() => { setAvatarUrl(undefined); setError('') }}>사진 삭제</button>}
          </div>
          <p className="management-description">JPG · PNG · WEBP / 최대 2MB</p>
          <input ref={fileInput} className="account-file-input" type="file" accept="image/jpeg,image/png,image/webp" tabIndex={-1} aria-label="프로필 사진 파일" onChange={selectPhoto} />
        </div>
      </div>
      <div className="account-profile-fields">
        <div>
          <label htmlFor="account-nickname">닉네임</label>
          <input id="account-nickname" value={nickname} maxLength={30} required disabled={saving} onChange={event => { setNickname(event.target.value); setError('') }} />
        </div>
        <button type="submit" className="management-primary" disabled={!dirty || !nickname.trim() || reading || saving}>{saving ? '저장 중…' : '변경사항 저장'}</button>
      </div>
      {error && <p className="management-error" role="alert">{error}</p>}
    </form>
  )
}

function SecurityDialog({ action, account, user, preview, onClose, onComplete }: {
  action: SecurityAction
  account: AccountAdapter
  user: AuthUser
  preview: boolean
  onClose: () => void
  onComplete: (action: SecurityAction) => Promise<void>
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [step, setStep] = useState<'confirm' | 'identity' | 'password'>(
    action.type === 'unlink' || action.type === 'logout' ? 'confirm' : 'identity',
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const social = user.socialLogins?.[0]
  const provider = action.type === 'unlink' ? providerNames[action.provider] : ''
  const title = step === 'password' ? '비밀번호 변경'
    : step === 'identity' ? '계정 보호를 위해 다시 확인해요'
      : action.type === 'unlink' ? `${provider} 연결을 해제할까요?` : '모든 기기에서 로그아웃할까요?'

  useLayoutEffect(() => {
    const node = dialog.current
    node?.showModal()
    return () => node?.close()
  }, [])

  useLayoutEffect(() => {
    dialog.current?.querySelector<HTMLInputElement>('input')?.focus()
  }, [step])

  async function run(work: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await work()
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function verify(confirmation: Parameters<AccountAdapter['confirmIdentity']>[0]) {
    await account.confirmIdentity(confirmation)
    if (action.type === 'password') setStep('password')
    else await onComplete(action)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    if (step === 'confirm') {
      if (action.type === 'unlink') setStep('identity')
      else void run(() => onComplete(action))
      return
    }

    if (step === 'identity') {
      void run(() => verify({ code: String(fields.get('confirmation') || '') }))
      return
    }

    const password = String(fields.get('password') || '')
    if (password !== fields.get('repeat')) {
      setError('새 비밀번호가 서로 달라요.')
      return
    }
    void run(async () => {
      await account.changePassword(password)
      await onComplete(action)
    })
  }

  return (
    <dialog ref={dialog} className="management-dialog account-dialog" aria-labelledby="account-dialog-title"
      onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
      <div className="management-dialog-heading">
        <h2 id="account-dialog-title">{title}</h2>
        <button type="button" aria-label="닫기" disabled={busy} onClick={onClose}><Icon name="close" /></button>
      </div>
      {step === 'confirm' && <p>{action.type === 'unlink'
        ? `${provider}로 로그인할 수 없게 되며, 이메일 로그인은 유지돼요. 연결을 해제하면 로그아웃됩니다.`
        : preview ? '현재 탭의 테스트 세션을 종료해요.' : '활성 세션을 모두 종료해요.'}</p>}
      {step === 'identity' && <p>{preview ? `테스트 확인 번호 ${previewConfirmationCode}을 입력해 주세요.` : '이 작업을 진행하려면 본인 확인이 필요해요.'}</p>}
      {step === 'password' && preview && <p>테스트용 값으로 변경 과정을 확인할 수 있어요.</p>}
      <form key={step} onSubmit={submit}>
        {step === 'identity' && <div>
          <label htmlFor="account-confirmation">{preview ? '확인 번호' : '현재 비밀번호'}</label>
          <input id="account-confirmation" name="confirmation" type="password" inputMode={preview ? 'numeric' : undefined} autoComplete={preview ? 'off' : 'current-password'} required disabled={busy} />
        </div>}
        {step === 'password' && <>
          <label htmlFor="account-password">새 비밀번호</label>
          <input id="account-password" name="password" type="password" minLength={8} autoComplete={preview ? 'off' : 'new-password'} required disabled={busy} placeholder="8자 이상" />
          <label htmlFor="account-password-repeat">새 비밀번호 확인</label>
          <input id="account-password-repeat" name="repeat" type="password" minLength={8} autoComplete={preview ? 'off' : 'new-password'} required disabled={busy} />
        </>}
        {error && <p className="management-error" role="alert">{error}</p>}
        <div className="account-dialog-actions">
          <button type="button" className="management-secondary" onClick={onClose} disabled={busy}>취소</button>
          <button type="submit" className={step === 'confirm' && action.type === 'unlink' ? 'management-primary account-danger' : 'management-primary'} disabled={busy}>
            {busy ? '처리 중…' : step === 'identity' ? '확인하고 계속하기' : step === 'password' ? '변경하기' : action.type === 'unlink' ? '연결 해제' : '로그아웃'}
          </button>
        </div>
        {step === 'identity' && social && <button type="button" className="account-text-button account-social-confirm" disabled={busy} onClick={() => void run(() => verify({ provider: social }))}>{providerNames[social]}로 다시 확인하기</button>}
      </form>
    </dialog>
  )
}

export function AccountPage({ section, onNavigate }: { section: AccountSection; onNavigate: (path: string) => void }) {
  const { user, account, isPreview, logout } = useAuth()
  const [notice, setNotice] = useState('')
  const [action, setAction] = useState<SecurityAction | null>(null)
  const [connecting, setConnecting] = useState<SocialProvider | null>(null)
  const [withdrawal, setWithdrawal] = useState('')
  const connected = user?.socialLogins || []

  async function connect(provider: SocialProvider) {
    if (!account || connecting) return
    setConnecting(provider)
    try {
      await account.updateSocialLogin(provider, true)
      setNotice(`${providerNames[provider]} 로그인 수단을 연결했어요.`)
    } catch (error) {
      setNotice(errorMessage(error))
    } finally {
      setConnecting(null)
    }
  }

  async function complete(next: SecurityAction) {
    if (!account) return
    if (next.type === 'password') {
      setAction(null)
      setNotice(isPreview ? '테스트 비밀번호 변경 과정을 완료했어요.' : '비밀번호를 변경했어요.')
      return
    }

    if (next.type === 'unlink') await account.updateSocialLogin(next.provider, false)
    if (next.type === 'withdraw') await account.withdraw()
    setAction(null)
    onNavigate('/home')
    await logout()
  }

  return (
    <WorkspaceLayout page="account" accountTitle={section.label} onNavigate={onNavigate} notice={notice} onNotice={setNotice}>
      <main className="management-main account-main">
        <div className="account-heading">
          <h1 tabIndex={-1}>계정 설정</h1>
          <p className="management-description">프로필과 로그인 수단을 한곳에서 관리하세요.</p>
          {isPreview && <span className="account-preview-label">테스트 모드</span>}
        </div>

        <div className="account-grid">
          <nav className="management-card account-nav" aria-label="계정 설정 메뉴">
            {sections.map(item => (
              <button key={item.id} type="button" aria-current={section.id === item.id ? 'page' : undefined} onClick={() => onNavigate(item.path)}>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </button>
            ))}
          </nav>

          <div className="account-content">
            {!account || !user ? <section className="management-card"><h2>{section.label}</h2><p className="management-description">계정 관리 서비스가 연결되면 이용할 수 있어요.</p></section>
              : section.id === 'profile' ? <>
                <section className="team-summary account-summary"><div>
                  <h2>프로필</h2>
                  <p className="team-description">나를 나타내는 사진과 닉네임을 설정하세요.</p>
                </div></section>
                <ProfileForm user={user} account={account} onNotice={setNotice} />
              </> : section.id === 'security' ? <>
                <section className="team-summary account-summary"><div>
                  <h2>로그인 및 보안</h2>
                  <p className="team-description">연결된 로그인 수단과 활성 세션을 관리하세요.</p>
                </div></section>
                <section className="management-card account-card" aria-labelledby="login-methods-title">
                  <h2 id="login-methods-title">연결된 로그인 수단</h2>
                  <p className="management-description">최소 하나의 로그인 수단은 유지해야 해요.</p>
                  <ul className="account-methods">
                    <li>
                      <span className="account-method-icon"><Icon name="mail" /></span>
                      <div className="account-method-label"><strong>이메일 · 비밀번호</strong><small className="is-connected">연결됨</small></div>
                      <button type="button" className="management-secondary" onClick={() => setAction({ type: 'password' })}>비밀번호 변경</button>
                    </li>
                    {(['google', 'kakao'] as const).map(provider => {
                      const linked = connected.includes(provider)
                      return <li key={provider}>
                        <span className={`account-method-icon account-method-${provider}`} aria-hidden="true">{provider === 'google' ? 'G' : 'K'}</span>
                        <div className="account-method-label"><strong>{providerNames[provider]}</strong><small className={linked ? 'is-connected' : undefined}>{linked ? '연결됨' : '연결 안 됨'}</small></div>
                        <button type="button" className="management-secondary" disabled={connecting !== null}
                          aria-label={`${providerNames[provider]} ${linked ? '연결 해제' : '연결하기'}`}
                          onClick={() => linked ? setAction({ type: 'unlink', provider }) : void connect(provider)}>
                          {connecting === provider ? '연결 중…' : linked ? '연결 해제' : '연결하기'}
                        </button>
                      </li>
                    })}
                  </ul>
                </section>
                <section className="management-card account-card account-session">
                  <div><h2>활성 세션</h2><p className="management-description">{isPreview ? '테스트 모드에서는 현재 탭의 세션을 종료해요.' : '다른 기기에서 로그인한 세션도 함께 종료할 수 있어요.'}</p></div>
                  <button type="button" className="management-secondary" onClick={() => setAction({ type: 'logout' })}>모든 기기에서 로그아웃</button>
                </section>
              </> : <>
                <section className="team-summary account-summary"><div>
                  <h2>회원 탈퇴</h2>
                  <p className="team-description">탈퇴 전에 공유 문서와 워크스페이스의 소유권을 확인하세요.</p>
                </div></section>
                <form className="management-card account-card account-withdraw" onSubmit={event => {
                  event.preventDefault()
                  if (withdrawal.trim() === withdrawalPhrase) setAction({ type: 'withdraw' })
                }}>
                  <h2>탈퇴 시 처리되는 항목</h2>
                  <ul>
                    <li>개인 문서와 계정 정보 삭제</li>
                    <li>모든 기기에서 로그아웃</li>
                    <li>다른 사용자의 문서는 유지되며 내 접근 권한만 회수</li>
                  </ul>
                  {isPreview && <p className="management-description">테스트 모드에서는 테스트 프로필과 로그인 수단을 초기화하고 현재 세션을 종료해요.</p>}
                  <label htmlFor="account-withdrawal">확인을 위해 ‘{withdrawalPhrase}’를 입력하세요.</label>
                  <input id="account-withdrawal" value={withdrawal} autoComplete="off" onChange={event => setWithdrawal(event.target.value)} />
                  <div className="account-dialog-actions">
                    <button type="button" className="management-secondary" onClick={() => onNavigate('/account/profile')}>프로필로 돌아가기</button>
                    <button type="submit" className="management-primary account-danger" disabled={withdrawal.trim() !== withdrawalPhrase}>계정 탈퇴</button>
                  </div>
                </form>
              </>}
          </div>
        </div>
      </main>
      {action && account && user && <SecurityDialog action={action} account={account} user={user} preview={isPreview} onClose={() => setAction(null)} onComplete={complete} />}
    </WorkspaceLayout>
  )
}
