import { useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Icon } from './Icon'
import { useWorkspaceData } from './workspaceData'
import { normalizePresentationName, personalSpace, slideFormats, type Presentation, type SlideRatio } from './presentationData'
import { savePresentationFile, validatePptx } from './presentationFiles'

export type PresentationDialogKind = 'create' | 'import'

export function PresentationDialog({ kind, onClose, onDone }: {
  kind: PresentationDialogKind
  onClose: () => void
  onDone: (id: string) => void
}) {
  const { data, update } = useWorkspaceData()
  const dialog = useRef<HTMLDialogElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [ratio, setRatio] = useState<SlideRatio>('16:9')
  const [space, setSpace] = useState<'personal' | 'team'>(data.activeWorkspace)
  const [file, setFile] = useState<File>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const importing = kind === 'import'

  useLayoutEffect(() => {
    const node = dialog.current
    node?.showModal()
    return () => node?.close()
  }, [])

  function chooseFile(next?: File) {
    if (busy || !next) return
    setFile(next)
    setError('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || (importing && !file)) return
    const id = crypto.randomUUID()
    const sourceFile = importing ? file : undefined
    if (sourceFile) {
      setBusy(true)
      setError('')
      try {
        await validatePptx(sourceFile)
        await savePresentationFile(id, sourceFile)
      } catch (failure) {
        setError(failure instanceof Error && failure.name !== 'QuotaExceededError'
          ? failure.message : '브라우저에 파일을 저장할 수 없어요. 저장 공간을 확인해 주세요.')
        setBusy(false)
        return
      }
    }
    const doc: Presentation = {
      id,
      space,
      role: 'OWNER',
      updatedAt: Date.now(),
      name: normalizePresentationName(sourceFile?.name ?? name) || '제목 없는 프레젠테이션',
      cover: space === 'team' ? 'forest' : 'brand',
      ...(sourceFile ? { fileName: sourceFile.name } : { ratio }),
    }
    update(previous => ({ ...previous, presentations: [doc, ...previous.presentations] }))
    if (dialog.current?.isConnected) onDone(id)
  }

  return <dialog ref={dialog} className={importing ? 'management-dialog presentation-dialog' : 'home-create-dialog presentation-create'} aria-labelledby="presentation-dialog-title"
    onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <div className="management-dialog-heading">
      <h2 id="presentation-dialog-title">{importing ? 'PPTX 파일 가져오기' : '새 프레젠테이션'}</h2>
      <button type="button" aria-label="닫기" onClick={onClose} disabled={busy}><Icon name="close" /></button>
    </div>
    <form className="presentation-form" onSubmit={submit}>
      {importing ? <>
        <input ref={fileInput} type="file" hidden accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={event => { chooseFile(event.currentTarget.files?.[0]); event.currentTarget.value = '' }} />
        <button type="button" className="presentation-drop" disabled={busy} onClick={() => fileInput.current?.click()}
          onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); chooseFile(event.dataTransfer.files[0]) }}>
          <Icon name="upload" />
          <strong>{file?.name ?? 'PPTX 파일을 끌어다 놓거나 선택하세요'}</strong>
          <small>{file ? '다른 파일 선택' : '최대 50MB · 이 브라우저에 저장'}</small>
        </button>
      </> : <>
        <label htmlFor="presentation-create-name">프레젠테이션 이름</label>
        <input id="presentation-create-name" value={name} maxLength={100} placeholder="제목 없는 프레젠테이션"
          onChange={event => setName(event.target.value)} />
        <fieldset>
          <legend>슬라이드 비율</legend>
          <div className="home-format-grid presentation-format-grid">{slideFormats.map(format => <label key={format.ratio}>
            <input className="sr-only" type="radio" name="presentation-ratio" value={format.ratio} checked={ratio === format.ratio}
              onChange={() => setRatio(format.ratio)} />
            <span className={`home-format-preview home-format-preview--${format.ratio.replace(':', '-')}`}><i /><i /></span>
            <b>{format.ratio}</b><strong>{format.name}</strong><small>{format.detail}</small>
          </label>)}</div>
        </fieldset>
      </>}
      <label htmlFor="presentation-save-space">저장할 공간</label>
      <select id="presentation-save-space" value={space} disabled={busy} onChange={event => setSpace(event.target.value as typeof space)}>
        <option value="personal">{personalSpace}</option><option value="team">{data.teamName}</option>
      </select>
      {error && <p className="management-error" role="alert">{error}</p>}
      <div className="management-dialog-actions">
        <button type="button" className="management-secondary" disabled={busy} onClick={onClose}>취소</button>
        <button type="submit" className="management-primary" disabled={busy || (importing && !file)}>
          {busy ? '파일 확인 및 저장 중…' : importing ? '가져오기' : '만들기'}
        </button>
      </div>
    </form>
  </dialog>
}
