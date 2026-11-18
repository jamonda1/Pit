export type SlideRatio = '16:9' | '4:3' | '9:16'
export const slideFormats: { ratio: SlideRatio; name: string; detail: string }[] = [
  { ratio: '16:9', name: '와이드 프레젠테이션', detail: '일반 발표 · 가장 많이 사용' },
  { ratio: '4:3', name: '클래식 프레젠테이션', detail: '전통적인 발표 자료' },
  { ratio: '9:16', name: '세로 프레젠테이션', detail: '모바일 · 세로형 콘텐츠' },
]

export type CoverKind = 'forest' | 'purple' | 'blue' | 'warm' | 'brand'
export type DocumentRole = 'OWNER' | 'EDITOR' | 'VIEWER'
export type DocumentShare = { email: string; role: Exclude<DocumentRole, 'OWNER'> }
export type Presentation = {
  id: string
  name: string
  space: 'personal' | 'team' | 'shared'
  role: DocumentRole
  cover: CoverKind
  updatedAt: number
  activity?: string
  ratio?: SlideRatio
  fileName?: string
  shares?: DocumentShare[]
}

export const personalSpace = '내 개인 공간'
export const sampleTeam = 'PIT 디자인팀'
export const sharedSpace = '개발 워크스페이스'
export const presentationRoles = { OWNER: '소유자', EDITOR: '편집 가능', VIEWER: '읽기 전용' } as const

export function presentationSpace(doc: Presentation, teamName: string) {
  return { personal: personalSpace, team: teamName, shared: sharedSpace }[doc.space]
}

export function presentationName(doc: Presentation) {
  return doc.ratio ? doc.name : `${doc.name}.pptx`
}

export const initialPresentations: Presentation[] = [
  { id: 'service-plan', name: '서비스 기획안', space: 'personal', cover: 'purple', activity: '어제 수정', updatedAt: 5, role: 'OWNER' },
  { id: 'team-project', name: '팀 프로젝트 발표', space: 'team', cover: 'forest', activity: '함께 편집 중', updatedAt: 4, role: 'OWNER' },
  { id: 'distributed-results', name: '분산 처리 결과', space: 'shared', cover: 'blue', activity: '3일 전 수정', updatedAt: 3, role: 'VIEWER' },
  { id: 'presentation-outline', name: '발표 구성안', space: 'personal', cover: 'warm', activity: '7일 전 수정', updatedAt: 2, role: 'OWNER' },
  { id: 'brand-guide', name: 'PIT 브랜드 가이드', space: 'team', cover: 'brand', activity: '팀 자료', updatedAt: 1, role: 'OWNER' },
]

// Existing workspace preview documents use the same data as the document list.
const teamSamples = [
  ['team-service-plan', '서비스 기획안'], ['team-user-research', '사용자 리서치'],
  ['team-roadmap', '제품 로드맵'], ['team-design-system', '디자인 시스템'],
  ['team-collaboration', '협업 경험 제안'], ['team-november', '11월 팀 회의'],
  ['team-prototype', '프로토타입 리뷰'], ['team-introduction', '서비스 소개'],
  ['team-outline', '발표 구성안'], ['team-next', '다음 프로젝트'],
]
initialPresentations.push(...teamSamples.map(([id, name]): Presentation => ({
  id, name, space: 'team', role: 'OWNER', cover: 'forest', activity: '팀 자료', updatedAt: 0,
})))

export function presentationDate(doc: Presentation) {
  return doc.activity ?? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(doc.updatedAt)
}

export function normalizePresentationName(value: string) {
  return value.trim().replace(/\.pptx$/i, '').trim()
}
