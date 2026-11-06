import { useEffect, useRef, useState, type FormEvent } from 'react'
import { remainingEmailSeconds } from './emailVerification'
import type { AuthAdapter, Credentials, EmailChallenge } from './authAdapter'
import './auth.css'
export function AuthModal({ adapter, onLogin, onClose, initialMessage }: {
  adapter: AuthAdapter; onLogin: (input: Credentials) => Promise<void>; onClose: () => void; initialMessage: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [message, setMessage] = useState(initialMessage)
  const [busy, setBusy] = useState(false)
  const alive = useRef(true)
  const emailInput = useRef<HTMLInputElement>(null)
  const passwordInput = useRef<HTMLInputElement>(null)
  const codeInput = useRef<HTMLInputElement>(null)
  const [signupEmail, setSignupEmail] = useState('')
  const [challenge, setChallenge] = useState<EmailChallenge | null>(null)
  const [code, setCode] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [verificationMessage, setVerificationMessage] = useState('')
  const [remaining, setRemaining] = useState(0)
  const showCode = challenge !== null && !verificationToken
  useEffect(() => {
    if (!showCode) return
    const tick = () => setRemaining(remainingEmailSeconds(challenge.expiresAt))
    tick()
    const interval = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', tick) }
  }, [showCode, challenge])
  useEffect(() => {
    if (!showCode || mode !== 'signup' || busy) return
    codeInput.current?.focus({ preventScroll: true })
  }, [showCode, challenge, mode, busy])
  useEffect(() => {
    if (verificationToken && mode === 'signup' && !busy) passwordInput.current?.focus({ preventScroll: true })
  }, [verificationToken, mode, busy])
  useEffect(() => {
    alive.current = true
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const node = dialog.current
    node?.showModal()
    return () => { alive.current = false; node?.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus() }
  }, [])
  const switchMode = (next: typeof mode) => { setMode(next); setMessage('') }
  const run = async (action: () => Promise<void>) => {
    if (busy) return
    setBusy(true); setMessage('')
    try { await action() } catch (error) { if (alive.current) setMessage(error instanceof Error ? error.message : '요청을 처리하지 못했어요. 다시 시도해 주세요.') }
    finally { if (alive.current) setBusy(false) }
  }
  const requestCode = () => {
    if (!emailInput.current?.reportValidity()) return
    void run(async () => {
      setVerificationMessage('')
      const next = await adapter.requestEmailCode(signupEmail.trim())
      if (!alive.current) return
      setChallenge(next); setCode(''); setVerificationToken('')
      setRemaining(remainingEmailSeconds(next.expiresAt))
    })
  }
  const verifyCode = () => {
    if (!challenge || busy) return
    if (!remainingEmailSeconds(challenge.expiresAt)) { setRemaining(0); return }
    void run(async () => {
      setVerificationMessage('')
      try {
        const result = await adapter.verifyEmailCode({ challengeId: challenge.challengeId, email: signupEmail.trim(), code })
        if (alive.current) { setVerificationToken(result.verificationToken); setCode('') }
      } catch (error) {
        if (alive.current) setVerificationMessage(error instanceof Error ? error.message : '인증번호를 다시 확인해 주세요.')
      }
    })
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (mode === 'signup' && !verificationToken) {
      setVerificationMessage('이메일 인증을 먼저 완료해 주세요.')
      if (challenge) codeInput.current?.focus()
      else emailInput.current?.focus()
      return
    }
    const values = new FormData(event.currentTarget)
    const input = { email: String(values.get('email')).trim(), password: String(values.get('password') || '') }
    void run(async () => {
      if (mode === 'login') await onLogin(input)
      else if (mode === 'signup') { await adapter.signup({ ...input, nickname: String(values.get('nickname')).trim(), consent: values.get('consent') === 'on', verificationToken }); if (alive.current) setMessage('회원가입이 완료됐어요. 로그인해 주세요.') }
      else { await adapter.resetPassword(input.email); if (alive.current) setMessage('등록된 이메일이라면 비밀번호 재설정 안내가 전송됩니다.') }
    })
  }
  return <dialog ref={dialog} className="auth-dialog" data-mode={mode} aria-labelledby="auth-title" onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose() } }}>
    <div className="auth-brand"><img src="/images/brand/01_mark_only_liquid_glass_1024.png" alt="" /><button type="button" aria-label="인증 모달 닫기" onClick={onClose}>×</button></div>
    <h2 id="auth-title">{mode === 'reset' ? '비밀번호 재설정' : mode === 'signup' ? '회원가입' : '로그인'}</h2>
    <div className="auth-tabs" role="tablist" aria-label="인증 방식">{(['login', 'signup'] as const).map(tab => <button type="button" key={tab} disabled={busy} role="tab" id={`auth-tab-${tab}`} aria-controls="auth-panel" aria-selected={mode === tab} tabIndex={mode === tab || (mode === 'reset' && tab === 'login') ? 0 : -1} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'login' : event.key === 'End' ? 'signup' : tab === 'login' ? 'signup' : 'login'; switchMode(next); document.getElementById(`auth-tab-${next}`)?.focus() } }} onClick={() => switchMode(tab)}>{tab === 'login' ? '로그인' : '회원가입'}</button>)}</div>
    <form noValidate={adapter.preview && mode === 'login'} key={mode} id="auth-panel" role="tabpanel" aria-labelledby={`auth-tab-${mode === 'signup' ? 'signup' : 'login'}`} onSubmit={submit} aria-busy={busy}>
      <fieldset disabled={busy}>
        {mode === 'signup' && <label>닉네임<input name="nickname" required maxLength={50} autoComplete="nickname" placeholder="사용할 닉네임을 입력해 주세요" /></label>}
        {mode === 'signup' ? <div className="auth-email-group">
          <label htmlFor="signup-email">이메일</label>
          <div className="auth-input-action">
            <input ref={emailInput} id="signup-email" name="email" type="email" required autoComplete="email" placeholder="example@email.com" value={signupEmail} onChange={event => {
              setSignupEmail(event.target.value); setChallenge(null); setCode(''); setVerificationToken(''); setVerificationMessage(''); setRemaining(0); setMessage('')
            }} />
            <button type="button" className="auth-inline-action" disabled={!!verificationToken} aria-expanded={showCode} aria-controls="email-code-panel" onClick={requestCode}>{verificationToken ? '인증 완료' : challenge ? '재발송' : '이메일 인증하기'}</button>
          </div>
          <div id="email-code-panel" className={`auth-code-reveal ${showCode ? 'is-open' : ''}`} inert={!showCode} aria-hidden={!showCode}>
            <div className="auth-code-content">
              <label htmlFor="signup-email-code">인증번호</label>
              <div className="auth-input-action">
                <div className="auth-code-input">
                  <input ref={codeInput} id="signup-email-code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6자리 인증번호" value={code} disabled={!showCode || remaining === 0} aria-invalid={!!verificationMessage} aria-describedby="email-code-status" onChange={event => { setCode(event.target.value.replace(/[^0-9]/g, '')); setVerificationMessage('') }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (code.length === 6) verifyCode() } }} />
                  <span className={remaining === 0 ? 'is-expired' : ''} role="timer" aria-live="off" aria-label="인증번호 유효시간">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</span>
                </div>
                <button type="button" className="auth-inline-action" disabled={!showCode || remaining === 0 || code.length !== 6} onClick={verifyCode}>인증하기</button>
              </div>
              <p id="email-code-status" className={`auth-verification-status ${remaining === 0 || verificationMessage ? 'is-error' : ''}`} role="status">{remaining === 0 ? '인증 시간이 만료됐어요. 재발송해 주세요.' : verificationMessage || (adapter.preview && challenge?.previewCode ? `테스트 인증번호: ${challenge.previewCode}` : '이메일로 전송된 인증번호를 입력해 주세요.')}</p>
            </div>
          </div>
          {verificationToken && <p className="auth-verification-status is-success" role="status">이메일 인증이 완료됐어요.</p>}
          {!showCode && !verificationToken && verificationMessage && <p className="auth-verification-status is-error" role="alert">{verificationMessage}</p>}
        </div> : <label>이메일<input name="email" type="email" required autoComplete="email" placeholder="example@email.com" /></label>}
        {mode !== 'reset' && <label>비밀번호<input ref={passwordInput} name="password" type="password" required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="비밀번호를 입력해 주세요" /></label>}
        {mode === 'login' && <button className="auth-forgot" type="button" onClick={() => switchMode('reset')}>비밀번호 찾기</button>}
        {mode === 'signup' && <><label className="auth-consent"><input name="consent" type="checkbox" required />[필수] 서비스 이용약관 및 개인정보 처리방침 동의</label><p className="auth-help">{adapter.preview ? '테스트 모드에서는 실제 계정이 생성되지 않아요.' : '약관은 서비스 연결 후 제공됩니다.'}</p></>}
        <button className="auth-primary" type="submit">{busy ? '처리 중…' : mode === 'signup' ? '회원가입' : mode === 'reset' ? '재설정 이메일 보내기' : '로그인'}</button>
      </fieldset>
    </form>
    {adapter.preview && mode === 'login' && <p className="auth-preview-hint">테스트 모드 · 입력 없이 로그인할 수 있어요.</p>}
    {message && <p className="auth-message" role="status">{message}</p>}
    {mode === 'login' && <><div className="auth-divider">또는</div><div className="auth-social"><button disabled={busy} onClick={() => void run(() => adapter.oauth('google'))}>G　 Google로 계속하기</button><button className="auth-kakao" disabled={busy} onClick={() => void run(() => adapter.oauth('kakao'))}>●　 카카오로 계속하기</button></div></>}
    {mode === 'reset' && <button className="auth-back" disabled={busy} onClick={() => switchMode('login')}>로그인으로 돌아가기</button>}
  </dialog>
}
