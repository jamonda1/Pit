import { useEffect, useId, useRef, useState } from 'react'
import type { SlideRatio } from './presentationData'
import { getPresentationFile } from './presentationFiles'

type OfficeInstance = { destroyEditor(): void }
type OfficeAPI = { DocEditor: new (id: string, config: Record<string, unknown>) => OfficeInstance }
type OfficeWindow = Window & { DocsAPI?: OfficeAPI }

const apiUrl = '/onlyoffice/web-apps/apps/api/documents/api.js'
const pptxType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
let loadingApi: Promise<OfficeAPI> | undefined

function loadApi() {
  const officeWindow = window as OfficeWindow
  if (officeWindow.DocsAPI) return Promise.resolve(officeWindow.DocsAPI)
  if (loadingApi) return loadingApi

  loadingApi = new Promise<OfficeAPI>((resolve, reject) => {
    const script = document.createElement('script')
    const fail = () => {
      window.clearTimeout(timer)
      script.remove()
      loadingApi = undefined
      reject(new Error('로컬 ONLYOFFICE에 연결할 수 없어요. Docker와 8080 포트를 확인해 주세요.'))
    }
    const timer = window.setTimeout(fail, 8000)
    script.src = apiUrl
    script.onload = () => {
      if (!officeWindow.DocsAPI) { fail(); return }
      window.clearTimeout(timer)
      resolve(officeWindow.DocsAPI)
    }
    script.onerror = fail
    document.head.append(script)
  })
  return loadingApi
}

export function LocalOnlyOffice({ id, title, imported, ratio, readOnly }: {
  id: string
  title: string
  imported: boolean
  ratio?: SlideRatio
  readOnly: boolean
}) {
  const host = useRef<HTMLDivElement>(null)
  const holderId = `pit-onlyoffice-${useId().replace(/[^a-z0-9-]/gi, '')}`
  const [state, setState] = useState({ ready: false, error: '' })

  useEffect(() => {
    const controller = new AbortController()
    let editor: OfficeInstance | undefined
    const slot = host.current
    if (!slot) return

    const saveShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey || event.code !== 'KeyS') return
      event.preventDefault()
      if (event.repeat || readOnly) return
      const frame = slot.querySelector('iframe')
      const editorDocument = frame?.contentDocument
      const target = editorDocument?.activeElement ?? editorDocument?.body
      target?.dispatchEvent(new KeyboardEvent('keydown', {
        key: 's', code: 'KeyS', keyCode: 83, ctrlKey: event.ctrlKey, metaKey: event.metaKey,
        bubbles: true, cancelable: true,
      }))
    }
    window.addEventListener('keydown', saveShortcut, { signal: controller.signal })

    const open = async () => {
      const endpoint = `/__pit/local-onlyoffice/${id}`
      const request = () => fetch(`${endpoint}/open`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ title, imported, ratio, readOnly }),
      })
      let response = await request()
      if (response.status === 409 && imported) {
        const file = await getPresentationFile(id)
        if (!file) throw new Error('이 브라우저에서 원본 PPTX를 찾을 수 없어요.')
        const upload = await fetch(`${endpoint}/source`, {
          method: 'PUT', headers: { 'Content-Type': pptxType }, body: file, signal: controller.signal,
        })
        if (!upload.ok) throw new Error('원본 PPTX를 로컬 편집기로 가져올 수 없어요.')
        response = await request()
      }
      const config = await response.json()
      if (!response.ok) throw new Error(config.error || 'PPTX를 열 수 없어요.')
      const api = await loadApi()
      if (controller.signal.aborted) return

      const holder = document.createElement('div')
      holder.id = holderId
      slot.replaceChildren(holder)
      editor = new api.DocEditor(holderId, {
        ...config,
        events: {
          onDocumentReady: () => {
            if (!controller.signal.aborted) setState({ ready: true, error: '' })
          },
          onError: (event: { data?: { errorCode?: number } }) => {
            if (controller.signal.aborted) return
            const code = event.data?.errorCode
            setState(current => ({ ...current, error: `ONLYOFFICE 오류가 발생했어요.${code === undefined ? '' : ` (오류 ${code})`}` }))
          },
        },
      })
    }
    void open().catch(error => {
      if (!controller.signal.aborted) setState({ ready: false, error: error instanceof Error ? error.message : '편집기를 열지 못했어요.' })
    })
    return () => {
      controller.abort()
      editor?.destroyEditor()
      slot.replaceChildren()
    }
  }, [holderId, id, imported, ratio, readOnly, title])

  return <section className="management-card local-office" aria-label="로컬 ONLYOFFICE 편집기">
    {(!state.ready || state.error) && <p className="local-office-status" role={state.error ? 'alert' : 'status'}>{state.error || '프레젠테이션을 여는 중…'}</p>}
    <div ref={host} className="local-office-frame" hidden={!state.ready && !!state.error} />
  </section>
}
