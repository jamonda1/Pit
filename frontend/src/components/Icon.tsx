import type { CSSProperties } from 'react'
export type IconName = 'home' | 'folder' | 'template' | 'settings' | 'panel' | 'search' | 'upload' | 'bell'
const paths: Record<IconName, string> = {
  home: 'M3 10 12 3l9 7v11h-6v-7H9v7H3Z',
  folder: 'M3 6h7l2 2h9v13H3Z',
  template: 'M4 3h16v18H4ZM9 3v18M4 9h5',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
  panel: 'M4 4h16v16H4ZM9 4v16m4-12 4 4-4 4',
  search: 'M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM16 16l5 5',
  upload: 'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6',
  bell: 'M5 16v-5c0-5 2-8 7-8s7 3 7 8v5l2 3H3Zm4 6h6',
}
export function Icon({ name, style }: { name: IconName; style?: CSSProperties }) {
  return <svg style={style} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
