import type { AccountAdapter, AuthUser } from './authAdapter'

const profileKey = 'pit.account.preview.v1'
const defaultUser: AuthUser = {
  id: 'preview-user',
  nickname: '테스트 계정',
  socialLogins: ['google'],
}

export const previewConfirmationCode = '123456'

export function readPreviewUser(): AuthUser {
  try {
    const raw = localStorage.getItem(profileKey)
    if (!raw) return defaultUser
    const saved = JSON.parse(raw) as Partial<AuthUser>
    return {
      ...defaultUser,
      nickname: typeof saved.nickname === 'string' && saved.nickname.trim()
        ? saved.nickname.trim().slice(0, 30) : defaultUser.nickname,
      avatarUrl: typeof saved.avatarUrl === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(saved.avatarUrl)
        ? saved.avatarUrl : undefined,
      socialLogins: Array.isArray(saved.socialLogins)
        ? (['google', 'kakao'] as const).filter(provider => saved.socialLogins?.includes(provider))
        : defaultUser.socialLogins,
    }
  } catch {
    return defaultUser
  }
}

function savePreviewUser(user: AuthUser) {
  try {
    localStorage.setItem(profileKey, JSON.stringify(user))
  } catch {
    throw new Error('이 브라우저에 계정 정보를 저장할 수 없어요.')
  }
  return user
}

export const previewAccount: AccountAdapter = {
  async updateProfile(profile) {
    const nickname = profile.nickname.trim()
    if (!nickname || nickname.length > 30) throw new Error('닉네임은 1~30자로 입력해 주세요.')
    return savePreviewUser({ ...readPreviewUser(), ...profile, nickname })
  },
  async updateSocialLogin(provider, connected) {
    const user = readPreviewUser()
    const methods = new Set(user.socialLogins)
    if (connected) methods.add(provider)
    else methods.delete(provider)
    return savePreviewUser({ ...user, socialLogins: [...methods] })
  },
  async confirmIdentity(confirmation) {
    if ('provider' in confirmation) {
      if (readPreviewUser().socialLogins?.includes(confirmation.provider)) return
      throw new Error('연결된 로그인 수단으로 확인해 주세요.')
    }
    if (confirmation.code !== previewConfirmationCode) throw new Error('테스트 확인 번호를 다시 확인해 주세요.')
  },
  async changePassword(password) {
    if (password.length < 8) throw new Error('새 비밀번호는 8자 이상 입력해 주세요.')
    // The preview exercises the form without storing credentials.
  },
  async withdraw() {
    localStorage.removeItem(profileKey)
  },
}
