import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { Icon } from '../components/Icon'
import { deleteResource, listResources, maxResourceSizeMB, resourceFormats, saveResource, validateResource, type LibraryResource, type ResourceKind } from '../components/resourceLibrary'
import { WorkspaceLayout } from '../components/WorkspaceLayout'
import './assets.css'

const categories = {
  image: { label: '에셋', icon: 'image', formats: 'PNG, JPG, WebP', empty: '등록한 에셋이 없어요.' },
  font: { label: '폰트', icon: 'type', formats: 'TTF, OTF, WOFF, WOFF2', empty: '등록한 폰트가 없어요.' },
} as const

function ResourcePreview({ resource }: { resource: LibraryResource }) {
  const { file, id, kind } = resource
  const [imageUrl, setImageUrl] = useState<string>()
  const [fontReady, setFontReady] = useState(false)
  const family = `pit-resource-${id}`

  useEffect(() => {
    if (kind === 'image') {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    let active = true
    let font: FontFace | undefined
    void file.arrayBuffer().then(buffer => new FontFace(family, buffer).load()).then(loaded => {
      if (!active) return
      font = loaded
      document.fonts.add(loaded)
      setFontReady(true)
    }).catch(() => {})
    return () => {
      active = false
      if (font) document.fonts.delete(font)
    }
  }, [family, file, kind])

  return <div className="asset-preview" aria-hidden="true">
    {kind === 'image' && imageUrl ? <img src={imageUrl} alt="" loading="lazy" decoding="async" />
      : fontReady ? <span style={{ fontFamily: family }}>가나다 ABC</span> : <Icon name={categories[kind].icon} />}
  </div>
}

function fileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function AssetsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { user } = useAuth()
  const ownerId = user?.id
  const [kind, setKind] = useState<ResourceKind>('image')
  const [resources, setResources] = useState<LibraryResource[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<LibraryResource | null>(null)
  const [removeError, setRemoveError] = useState('')
  const picker = useRef<HTMLInputElement>(null)
  const listHeading = useRef<HTMLHeadingElement>(null)
  const removeDialog = useRef<HTMLDialogElement>(null)
  const category = categories[kind]
  const items = resources.filter(item => item.kind === kind)
  const query = search.trim().toLocaleLowerCase()
  const filtered = items.filter(item => item.file.name.toLocaleLowerCase().includes(query))

  useEffect(() => {
    if (!ownerId) return
    let active = true
    void listResources(ownerId).then(result => {
      if (active) setResources(result.sort((a, b) => b.addedAt - a.addedAt))
    }).catch(() => {
      if (active) setError('저장한 파일을 불러올 수 없어요.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [ownerId])

  async function add(file: File) {
    if (!ownerId || busy) return
    setBusy(true)
    setError('')
    try {
      const validated = await validateResource(file, kind)
      const resource = { id: crypto.randomUUID(), ownerId, kind, file: validated, addedAt: Date.now() }
      await saveResource(resource)
      setResources(previous => [resource, ...previous])
      setSearch('')
      setNotice(`${category.label} 파일을 추가했어요.`)
    } catch (failure) {
      setError(failure instanceof Error && !(failure instanceof DOMException) ? failure.message : '브라우저에 파일을 저장할 수 없어요.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!removing || !ownerId || busy) return
    setBusy(true)
    setRemoveError('')
    try {
      await deleteResource(ownerId, removing.id)
      setResources(previous => previous.filter(item => item.id !== removing.id))
      setNotice(`${category.label} 파일을 삭제했어요.`)
      removeDialog.current?.close()
      listHeading.current?.focus()
    } catch {
      setRemoveError('파일을 삭제할 수 없어요. 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  return <WorkspaceLayout page="assets" onNavigate={onNavigate} notice={notice} onNotice={setNotice}>
    <main className="management-main asset-library">
      <div className="asset-library-heading">
        <div><h1 tabIndex={-1}>에셋 및 폰트</h1><p className="management-description">이미지와 폰트를 추가하고 미리 볼 수 있어요.</p></div>
        <input ref={picker} type="file" hidden aria-label={`${category.label} 파일 선택`}
          accept={Object.keys(resourceFormats[kind]).map(extension => `.${extension}`).join(',')}
          onChange={event => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ''
            if (file) void add(file)
          }} />
        <button className="management-primary" type="button" disabled={loading || busy} onClick={() => picker.current?.click()}>
          <Icon name="upload" /> {busy && !removing ? '추가 중…' : `${category.label} 추가`}
        </button>
      </div>

      <div className="asset-category-picker" role="group" aria-label="파일 종류">
        {(['image', 'font'] as const).map(value => <button key={value} type="button" aria-pressed={kind === value} disabled={busy}
          onClick={() => { if (kind !== value) { setKind(value); setSearch(''); setError('') } }}>
          <Icon name={categories[value].icon} />{categories[value].label}
        </button>)}
      </div>

      <section className="management-card asset-library-panel" aria-labelledby="asset-library-list">
        <div className="asset-list-heading">
          <h2 ref={listHeading} id="asset-library-list" tabIndex={-1}>등록된 {category.label} <span>{loading ? '' : items.length}</span></h2>
          {items.length > 0 && <input type="search" aria-label={`${category.label} 이름 검색`} placeholder="파일 이름 검색" value={search}
            onChange={event => setSearch(event.target.value)} />}
        </div>
        {error && <p role="alert" className="management-error">{error}</p>}
        {loading ? <p className="asset-loading" role="status">파일을 불러오는 중…</p>
          : filtered.length ? <ul className="asset-grid">
            {filtered.map(resource => <li key={resource.id}>
              <ResourcePreview resource={resource} />
              <div className="asset-item-details">
                <div><strong title={resource.file.name}>{resource.file.name}</strong><small>{fileSize(resource.file.size)}</small></div>
                <button type="button" className="asset-remove" aria-label={`${resource.file.name} 삭제`} disabled={busy} onClick={() => {
                  setRemoving(resource)
                  removeDialog.current?.showModal()
                }}><Icon name="trash" /></button>
              </div>
            </li>)}
          </ul> : <div className="management-empty asset-empty">
            <div className="asset-empty-icon"><Icon name={items.length ? 'search' : category.icon} /></div>
            <h3>{items.length ? '검색 결과가 없어요.' : category.empty}</h3>
            <p>{items.length ? '다른 파일 이름으로 검색해 보세요.' : `${category.formats} · 파일당 최대 ${maxResourceSizeMB}MB`}</p>
          </div>}
      </section>
      <p className="asset-storage-note">추가한 파일은 이 브라우저에 저장돼요.</p>
    </main>

    <dialog ref={removeDialog} className="management-dialog" aria-labelledby="asset-remove-title"
      onCancel={event => { if (busy) event.preventDefault() }} onClose={() => { setRemoving(null); setRemoveError('') }}>
      <div className="management-dialog-heading"><h2 id="asset-remove-title">파일을 삭제할까요?</h2></div>
      <p><strong>{removing?.file.name}</strong></p>
      <p>이 브라우저에 추가한 복사본을 삭제해요.</p>
      {removeError && <p role="alert" className="management-error">{removeError}</p>}
      <div className="management-dialog-actions">
        <button className="management-secondary" type="button" disabled={busy} onClick={() => removeDialog.current?.close()}>취소</button>
        <button className="management-primary" type="button" disabled={busy} onClick={() => void remove()}>{busy ? '삭제 중…' : '삭제'}</button>
      </div>
    </dialog>
  </WorkspaceLayout>
}
