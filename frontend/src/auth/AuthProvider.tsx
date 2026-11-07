import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { authAdapter, type AccountAdapter, type AuthAdapter, type AuthUser, type Credentials } from './authAdapter'
import { AuthModal } from './AuthModal'
export type AuthReason = 'welcome' | 'create' | 'upload' | 'workspace' | 'document' | 'account' | 'trash' | 'invite'
type Request = { reason: AuthReason; resume?: () => void }
type AuthState = {
  status: 'checking' | 'guest' | 'authenticated'; user: AuthUser | null
  requireAuth: (reason: AuthReason, action?: () => void) => void
  logout: () => Promise<void>
  account?: AccountAdapter
  isPreview: boolean
}
const Context = createContext<AuthState | null>(null)
export function AuthProvider({ children, adapter = authAdapter }: { children: ReactNode; adapter?: AuthAdapter }) {
  const [status, setStatus] = useState<AuthState['status']>('checking')
  const statusRef = useRef(status)
  statusRef.current = status
  const [user, setUser] = useState<AuthUser | null>(null)
  const [request, setRequest] = useState<Request | null>(null)
  const currentRequest = useRef(request)
  currentRequest.current = request
  const pending = useRef<Request | null>(null)
  const [sessionError, setSessionError] = useState('')
  useEffect(() => {
    let active = true
    adapter.session().then(value => {
      if (!active) return
      setUser(value); setStatus(value ? 'authenticated' : 'guest')
    }).catch(() => { if (active) { setStatus('guest'); setSessionError('로그인 상태를 확인하지 못했어요. 다시 로그인해 주세요.') } })
    return () => { active = false }
  }, [adapter])
  useEffect(() => {
    if (status === 'checking' || !pending.current) return
    const next = pending.current; pending.current = null
    if (status === 'authenticated') next.resume?.()
    else setRequest(next)
  }, [status])
  const requireAuth = useCallback((reason: AuthReason, action?: () => void) => {
    if (statusRef.current === 'authenticated') { action?.(); return }
    const next = { reason, resume: action }
    if (statusRef.current === 'checking') pending.current = next
    else setRequest(next)
  }, [])
  const login = async (input: Credentials) => {
    const attempt = request
    const value = await adapter.login(input)
    const resume = currentRequest.current === attempt ? attempt?.resume : undefined
    setUser(value); setStatus('authenticated'); setRequest(null)
    // Let the native dialog close and restore focus before the next dialog opens.
    window.setTimeout(() => resume?.(), 0)
  }
  const logout = async () => { await adapter.logout(); setUser(null); setStatus('guest'); pending.current = null; setRequest(null) }
  const service = adapter.account
  const account: AccountAdapter | undefined = service && {
    ...service,
    async updateProfile(profile) {
      const updated = await service.updateProfile(profile)
      setUser(current => current?.id === updated.id ? updated : current)
      return updated
    },
    async updateSocialLogin(provider, connected) {
      const updated = await service.updateSocialLogin(provider, connected)
      setUser(current => current?.id === updated.id ? updated : current)
      return updated
    },
  }
  return <Context.Provider value={{ status, user, requireAuth, logout, account, isPreview: adapter.preview === true }}>{children}
    {request && <AuthModal initialMessage={sessionError} adapter={adapter} onLogin={login} onClose={() => { setRequest(null); setSessionError('') }} />}
  </Context.Provider>
}
export function useAuth() {
  const context = useContext(Context)
  if (!context) throw new Error('AuthProvider is required')
  return context
}
