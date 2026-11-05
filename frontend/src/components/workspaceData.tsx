import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type TeamRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'
export type Member = { id: string; name: string; email: string; initial: string; role: TeamRole }
export type Invitation = { id: string; email: string; role: Exclude<TeamRole, 'OWNER'> }
export type DeletedItem = { id: string; name: string; place: string; deleted: string; expires: string }
export type WorkspaceData = {
  nickname: string
  activeWorkspace: 'personal' | 'team'
  teamName: string
  description: string
  members: Member[]
  invitations: Invitation[]
  deletedDocs: DeletedItem[]
  deletedTeams: DeletedItem[]
  restoredDocs: DeletedItem[]
  restoredTeams: DeletedItem[]
}

const initialData: WorkspaceData = {
  nickname: '사용자',
  activeWorkspace: 'personal',
  teamName: 'PIT 디자인팀',
  description: '팀원과 프레젠테이션을 공유하고 권한을 관리하는 공간',
  members: [
    { id: 'owner', name: '내 계정', email: 'owner@example.com', initial: 'P', role: 'OWNER' },
    { id: 'admin', name: '사용자 A', email: 'admin@example.com', initial: 'A', role: 'ADMIN' },
    { id: 'editor', name: '사용자 B', email: 'editor@example.com', initial: 'B', role: 'EDITOR' },
    { id: 'viewer', name: '사용자 C', email: 'viewer@example.com', initial: 'C', role: 'VIEWER' },
  ],
  invitations: [{ id: 'sample-invite', email: 'example@sample.com', role: 'VIEWER' }],
  deletedDocs: [
    { id: 'doc-1', name: '서비스 기획 초안.pptx', place: '내 개인 공간', deleted: '2026.11.02', expires: '2026.11.12' },
    { id: 'doc-2', name: '분산 분석 발표.pptx', place: 'PIT 디자인팀', deleted: '2026.11.01', expires: '2026.11.11' },
    { id: 'doc-3', name: '팀 소개 자료.pptx', place: '개발 워크스페이스', deleted: '2026.10.29', expires: '2026.11.08' },
  ],
  deletedTeams: [
    { id: 'team-1', name: '프로젝트 아카이브', place: '팀 워크스페이스', deleted: '2026.11.01', expires: '2026.11.11' },
    { id: 'team-2', name: '이전 디자인 검토', place: '팀 워크스페이스', deleted: '2026.10.29', expires: '2026.11.08' },
  ],
  restoredDocs: [], restoredTeams: [],
}

// Preview state belongs to this browser only; no account data is sent to a server.
const storageKey = 'pit.workspace.preview.v1'
function readData(): WorkspaceData {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null')
    if (saved && typeof saved.teamName === 'string' && typeof saved.description === 'string'
      && ['members', 'invitations', 'deletedDocs', 'deletedTeams', 'restoredDocs', 'restoredTeams'].every(key => Array.isArray(saved[key]))) return {
        ...saved,
        nickname: typeof saved.nickname === 'string' && saved.nickname.trim() ? saved.nickname.trim() : initialData.nickname,
        activeWorkspace: saved.activeWorkspace === 'team' ? 'team' : 'personal',
      }
  } catch { /* A blocked or empty store should still allow the preview to open. */ }
  return structuredClone(initialData)
}
const Context = createContext<{ data: WorkspaceData; update: (change: (data: WorkspaceData) => WorkspaceData) => void } | null>(null)
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(readData)
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(data)) } catch { /* Keep in-memory editing available. */ } }, [data])
  return <Context.Provider value={{ data, update: setData }}>{children}</Context.Provider>
}
export function useWorkspaceData() {
  const value = useContext(Context)
  if (!value) throw new Error('WorkspaceProvider is required')
  return value
}
export const roleLabels: Record<Exclude<TeamRole, 'OWNER'>, string> = {
  ADMIN: '관리자', EDITOR: '편집 가능', VIEWER: '읽기 전용',
}
