import type { EmailChallenge } from './authAdapter'

export const EMAIL_CODE_DURATION_MS = 5 * 60 * 1000
export function remainingEmailSeconds(expiresAt: number | null, now = Date.now()) {
  return expiresAt === null ? 0 : Math.max(0, Math.ceil((expiresAt - now) / 1000))
}

// Only used by the explicitly enabled UI preview. Never sends mail or issues real credentials.
export function createPreviewEmailVerification(now: () => number = Date.now) {
  const challenges = new Map<string, { email: string; expiresAt: number }>()
  return {
    async requestEmailCode(email: string): Promise<EmailChallenge> {
      const address = email.trim().toLowerCase()
      for (const [id, challenge] of challenges) {
        if (challenge.email === address || challenge.expiresAt <= now()) challenges.delete(id)
      }
      const challengeId = crypto.randomUUID()
      const expiresAt = now() + EMAIL_CODE_DURATION_MS
      challenges.set(challengeId, { email: address, expiresAt })
      return { challengeId, expiresAt, previewCode: '123456' }
    },
    async verifyEmailCode(input: { challengeId: string; email: string; code: string }) {
      const challenge = challenges.get(input.challengeId)
      if (!challenge || challenge.email !== input.email.trim().toLowerCase()) throw new Error('이메일 인증번호를 다시 요청해 주세요.')
      if (now() >= challenge.expiresAt) throw new Error('인증 시간이 만료됐어요. 인증번호를 다시 받아 주세요.')
      if (input.code !== '123456') throw new Error('인증번호가 일치하지 않아요. 다시 확인해 주세요.')
      challenges.delete(input.challengeId)
      return { verificationToken: `preview-email:${input.challengeId}` }
    },
  }
}
