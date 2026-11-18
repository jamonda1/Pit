import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { getPresentationFile } from '../components/presentationFiles'
import { presentationName, presentationSpace } from '../components/presentationData'
import { listPresentations, useWorkspaceData } from '../components/workspaceData'

export function PresentationEditorPage({ id, onNavigate }: { id: string; onNavigate: (path: string) => void }) {
  const { data } = useWorkspaceData()
  const doc = listPresentations(data).find(item => item.id === id)
  const hasFile = !!doc?.fileName
  const [downloadUrl, setDownloadUrl] = useState<string>()
  const [fileReady, setFileReady] = useState(false)
  const [assetsOpen, setAssetsOpen] = useState(false)
  const [assetTab, setAssetTab] = useState<'personal' | 'team'>('personal')
  const back = () => onNavigate('/presentations')

  useEffect(() => {
    if (!hasFile) return
    let url: string | undefined
    let active = true
    void getPresentationFile(id).then(file => {
      if (!active || !file) return
      url = URL.createObjectURL(file)
      setDownloadUrl(url)
    }).catch(() => {}).finally(() => { if (active) setFileReady(true) })
    return () => {
      active = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [id, hasFile])

  return <div className="workspace presentation-editor">
    <header className="presentation-editor-header">
      <button type="button" className="management-secondary" onClick={back}><span aria-hidden="true">←</span> 내 프레젠테이션</button>
      <div>
        <h1 tabIndex={-1}>{doc ? presentationName(doc) : '프레젠테이션을 찾을 수 없어요'}</h1>
        {doc && <p>{presentationSpace(doc, data.teamName)}{doc.ratio ? ` · ${doc.ratio} 초안` : ''}</p>}
      </div>
      {doc && <button className="management-secondary" aria-expanded={assetsOpen} onClick={() => setAssetsOpen(open => !open)}>에셋</button>}
    </header>
    <main className="presentation-editor-main">
      <section className="management-card management-empty presentation-editor-stage" aria-labelledby="presentation-stage-title">
        <Icon name="document" />
        <h2 id="presentation-stage-title">{doc ? '편집기 연결 대기 중' : '열 수 있는 문서가 없어요'}</h2>
        <p>{doc ? 'ONLYOFFICE가 연결되면 여기에서 문서를 편집할 수 있어요.' : '삭제된 문서는 휴지통에서 확인할 수 있어요.'}</p>
        {downloadUrl && doc && <a className="management-secondary" href={downloadUrl} download={`${doc.name}.pptx`}>원본 PPTX 다운로드</a>}
        {hasFile && fileReady && !downloadUrl && <p role="status">이 브라우저에 원본 파일이 없어요.</p>}
        {!doc && <button className="management-secondary" onClick={back}>목록으로 돌아가기</button>}
      </section>
      {doc && assetsOpen && <aside className="management-card presentation-assets" aria-label="에셋 패널">
        <div className="management-dialog-heading"><h2>에셋</h2><button aria-label="에셋 닫기" onClick={() => setAssetsOpen(false)}><Icon name="close" /></button></div>
        <div className="presentation-asset-tabs" role="group" aria-label="에셋 종류">
          <button aria-pressed={assetTab === 'personal'} onClick={() => setAssetTab('personal')}>개인 에셋</button>
          <button aria-pressed={assetTab === 'team'} onClick={() => setAssetTab('team')}>팀 에셋</button>
        </div>
        <p>{assetTab === 'personal' ? '개인 에셋은 연결 후 표시돼요.' : '팀에서 공유한 에셋은 연결 후 표시돼요.'}</p>
      </aside>}
    </main>
  </div>
}
