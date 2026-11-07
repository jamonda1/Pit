import { createPreviewEmailVerification } from './emailVerification'
import { previewAccount, readPreviewUser } from './previewAccount'

// Production authentication must be implemented against the agreed backend contract.
export type SocialProvider = 'google' | 'kakao'
export type AuthUser = {
  id: string
  nickname: string
  avatarUrl?: string
  socialLogins?: SocialProvider[]
}
export interface AccountAdapter {
  updateProfile(profile: Pick<AuthUser, 'nickname' | 'avatarUrl'>): Promise<AuthUser>
  updateSocialLogin(provider: SocialProvider, connected: boolean): Promise<AuthUser>
  confirmIdentity(confirmation: { code: string } | { provider: SocialProvider }): Promise<void>
  changePassword(password: string): Promise<void>
  withdraw(): Promise<void>
}
export type EmailChallenge = { challengeId: string; expiresAt: number; previewCode?: string }
export type Credentials = { email: string; password: string }
export interface AuthAdapter {
  readonly preview?: boolean
  readonly account?: AccountAdapter
  session(): Promise<AuthUser | null>
  login(input: Credentials): Promise<AuthUser>
  requestEmailCode(email: string): Promise<EmailChallenge>
  verifyEmailCode(input: { challengeId: string; email: string; code: string }): Promise<{ verificationToken: string }>
  signup(input: Credentials & { nickname: string; consent: boolean; verificationToken: string }): Promise<void>
  resetPassword(email: string): Promise<void>
  oauth(provider: SocialProvider): Promise<void>
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
// Development enables this by default. .env.production also enables the current hosted UI preview.
// Set VITE_AUTH_PREVIEW=false in the deployment environment when real authentication is connected.
const previewKey = 'pit.auth.preview.v1'
let previewLoggedIn = false
const previewAdapter: AuthAdapter = {
  ...productionAdapter,
  ...createPreviewEmailVerification(),
  preview: true,
  account: previewAccount,
  session: async () => {
    try { previewLoggedIn = sessionStorage.getItem(previewKey) === 'active' } catch { /* Memory-only when storage is blocked. */ }
    return previewLoggedIn ? readPreviewUser() : null
  },
  login: async () => {
    previewLoggedIn = true
    try { sessionStorage.setItem(previewKey, 'active') } catch { /* Preview remains usable without storage. */ }
    return readPreviewUser()
  },
  logout: async () => {
    previewLoggedIn = false
    try { sessionStorage.removeItem(previewKey) } catch { /* Memory state is cleared regardless. */ }
  },
}
export const authAdapter = import.meta.env.DEV || import.meta.env.VITE_AUTH_PREVIEW === 'true'
  ? previewAdapter : productionAdapter
