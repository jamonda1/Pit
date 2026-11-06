import { createPreviewEmailVerification } from './emailVerification'

// Production authentication must be implemented against the agreed backend contract.
export type AuthUser = { id: string; nickname: string }
export type EmailChallenge = { challengeId: string; expiresAt: number; previewCode?: string }
export type Credentials = { email: string; password: string }
export interface AuthAdapter {
  readonly preview?: boolean
  session(): Promise<AuthUser | null>
  login(input: Credentials): Promise<AuthUser>
  requestEmailCode(email: string): Promise<EmailChallenge>
  verifyEmailCode(input: { challengeId: string; email: string; code: string }): Promise<{ verificationToken: string }>
  signup(input: Credentials & { nickname: string; consent: boolean; verificationToken: string }): Promise<void>
  resetPassword(email: string): Promise<void>
  oauth(provider: 'google' | 'kakao'): Promise<void>
  logout(): Promise<void>
}
const unavailable = async (): Promise<never> => { throw new Error('인증 서비스가 아직 연결되지 않았어요. 연결 후 다시 시도해 주세요.') }
const productionAdapter: AuthAdapter = {
  session: async () => null,
  requestEmailCode: unavailable, verifyEmailCode: unavailable,
  login: unavailable, signup: unavailable, resetPassword: unavailable,
  oauth: unavailable, logout: unavailable,
}

// Explicit UI preview only: no credentials, tokens, API calls, or account linking.
// Development is enabled by default; hosted previews require VITE_AUTH_PREVIEW=true.
const previewKey = 'pit.auth.preview.v1'
const previewUser: AuthUser = { id: 'preview-user', nickname: '테스트 계정' }
let previewLoggedIn = false
const previewAdapter: AuthAdapter = {
  ...productionAdapter,
  ...createPreviewEmailVerification(),
  preview: true,
  session: async () => {
    try { previewLoggedIn = sessionStorage.getItem(previewKey) === 'active' } catch { /* Memory-only when storage is blocked. */ }
    return previewLoggedIn ? previewUser : null
  },
  login: async () => {
    previewLoggedIn = true
    try { sessionStorage.setItem(previewKey, 'active') } catch { /* Preview remains usable without storage. */ }
    return previewUser
  },
  logout: async () => {
    previewLoggedIn = false
    try { sessionStorage.removeItem(previewKey) } catch { /* Memory state is cleared regardless. */ }
  },
}
export const authAdapter = import.meta.env.DEV || import.meta.env.VITE_AUTH_PREVIEW === 'true'
  ? previewAdapter : productionAdapter
