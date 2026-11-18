export type ResourceKind = 'image' | 'font'
export type LibraryResource = {
  id: string
  ownerId: string
  kind: ResourceKind
  file: File
  addedAt: number
}

export const maxResourceSizeMB = 20
export const resourceFormats = {
  image: { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' },
  font: { ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2' },
} satisfies Record<ResourceKind, Record<string, string>>

export async function validateResource(file: File, kind: ResourceKind) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const formats: Record<string, string> = resourceFormats[kind]
  if (!file.size || !Object.hasOwn(formats, extension)) throw new Error('지원하는 형식의 파일을 선택해 주세요.')
  if (file.size > maxResourceSizeMB * 1024 * 1024) throw new Error(`${maxResourceSizeMB}MB 이하의 파일을 선택해 주세요.`)

  const normalized = new File([file], file.name, { type: formats[extension], lastModified: file.lastModified })
  try {
    if (kind === 'font') {
      await new FontFace('pit-font-validation', await normalized.arrayBuffer()).load()
    } else {
      const image = await createImageBitmap(normalized)
      image.close()
    }
  } catch {
    throw new Error('파일을 읽을 수 없어요. 파일 형식을 확인해 주세요.')
  }
  return normalized
}

async function withResources<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('pit.resource-library.v1', 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('resources', { keyPath: ['ownerId', 'id'] }).createIndex('ownerId', 'ownerId')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction('resources', mode)
      const request = operation(transaction.objectStore('resources'))
      transaction.oncomplete = () => resolve(request.result)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally {
    db.close()
  }
}

export function listResources(ownerId: string): Promise<LibraryResource[]> {
  return withResources('readonly', store => store.index('ownerId').getAll(ownerId))
}

export function saveResource(resource: LibraryResource) {
  return withResources('readwrite', store => store.add(resource))
}

export function deleteResource(ownerId: string, id: string) {
  return withResources('readwrite', store => store.delete([ownerId, id]))
}
