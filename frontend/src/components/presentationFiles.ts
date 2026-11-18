const maxFileSize = 50 * 1024 * 1024

// Inspect the ZIP central directory to distinguish PPTX from other renamed ZIP files.
export async function validatePptx(file: File) {
  if (!/\.pptx$/i.test(file.name) || !file.size) throw new Error('PPTX 파일을 선택해 주세요.')
  if (file.size > maxFileSize) throw new Error('50MB 이하의 PPTX 파일을 선택해 주세요.')

  const tail = new DataView(await file.slice(-65_557).arrayBuffer())
  const invalid = 'PPTX 파일 구조를 읽을 수 없어요. 다른 파일을 선택해 주세요.'
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) !== 0x06054b50 || i + 22 + tail.getUint16(i + 20, true) !== tail.byteLength) continue
    const length = tail.getUint32(i + 12, true)
    const offset = tail.getUint32(i + 16, true)
    if (offset + length > file.size - tail.byteLength + i) throw new Error(invalid)

    const entries = await file.slice(offset, offset + length).arrayBuffer()
    const view = new DataView(entries)
    const decode = new TextDecoder()
    let manifest = false
    let presentation = false
    for (let entry = 0; entry + 46 <= view.byteLength;) {
      if (view.getUint32(entry, true) !== 0x02014b50) throw new Error(invalid)
      const nameLength = view.getUint16(entry + 28, true)
      const next = entry + 46 + nameLength + view.getUint16(entry + 30, true) + view.getUint16(entry + 32, true)
      if (next > view.byteLength) throw new Error(invalid)
      const name = decode.decode(new Uint8Array(entries, entry + 46, nameLength))
      if (name === '[Content_Types].xml') manifest = true
      if (name === 'ppt/presentation.xml') presentation = true
      if (manifest && presentation) return
      entry = next
    }
    break
  }
  throw new Error(invalid)
}

function openFiles(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pit.presentation-files.preview', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('pptx')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function useFileStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openFiles()
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction('pptx', mode)
      const request = run(tx.objectStore('pptx'))
      tx.oncomplete = () => resolve(request.result)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function savePresentationFile(id: string, file: File) {
  await useFileStore('readwrite', store => store.put(file, id))
}

export async function getPresentationFile(id: string): Promise<Blob | undefined> {
  return useFileStore('readonly', store => store.get(id))
}
