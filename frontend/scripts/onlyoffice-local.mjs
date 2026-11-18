import { execFile } from 'node:child_process'
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { access, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { createServer } from 'vite'

const runFile = promisify(execFile)
const host = '127.0.0.1'
const port = 5182
const browserHost = host + ':' + port
const dockerHost = 'host.docker.internal:' + port
const browserOrigin = 'http://' + browserHost
const documentServer = 'http://127.0.0.1:8080'
const proxyPath = '/onlyoffice'
const apiPath = '/__pit/local-onlyoffice'
const storage = join(homedir(), '.local', 'share', 'pit', 'onlyoffice')
const pptxType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const maxSourceBytes = 50 * 1024 * 1024
const maxSavedBytes = 100 * 1024 * 1024
const slideSizes = { '16:9': [12192000, 6858000], '4:3': [9144000, 6858000], '9:16': [6858000, 12192000] }
const sessions = new Map()
const layouts = new Map()

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
const signature = (value, secret) => createHmac('sha256', secret).update(value).digest('base64url')

function sign(value, secret) {
  const unsigned = encode({ alg: 'HS256', typ: 'JWT' }) + '.' + encode({
    ...value, exp: Math.floor(Date.now() / 1000) + 3600,
  })
  return unsigned + '.' + signature(unsigned, secret)
}

function readSignedCallback(request, tokenSettings, secret) {
  const prefix = tokenSettings.prefix ?? 'Bearer '
  const authorization = request.headers[(tokenSettings.header ?? 'Authorization').toLowerCase()]
  if (!authorization?.startsWith(prefix)) return
  const [header, data, mac, extra] = authorization.slice(prefix.length).split('.')
  if (!header || !data || !mac || extra !== undefined) return
  const expected = Buffer.from(signature(header + '.' + data, secret))
  const obtained = Buffer.from(mac)
  if (expected.length !== obtained.length || !timingSafeEqual(expected, obtained)) return
  const decoded = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
  if (!Number.isFinite(decoded.exp) || decoded.exp < Date.now() / 1000) return
  return decoded.payload ?? decoded
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(body))
}

async function readBytes(stream, limit) {
  const chunks = []
  let length = 0
  for await (const chunk of stream) {
    const bytes = Buffer.from(chunk)
    length += bytes.length
    if (length > limit) throw new Error('PPTX 파일 크기가 제한을 초과했어요.')
    chunks.push(bytes)
  }
  return Buffer.concat(chunks, length)
}

function sendPptx(response, bytes) {
  response.writeHead(200, {
    'Content-Type': pptxType,
    'Content-Length': bytes.length,
    'Cache-Control': 'no-store',
  })
  response.end(bytes)
}

const filePath = id => join(storage, id + '.pptx')

async function documentExists(id) {
  return access(filePath(id)).then(() => true).catch(error => {
    if (error.code !== 'ENOENT') throw error
    return false
  })
}

async function writeDocument(id, bytes) {
  if (bytes.length < 4 || bytes.readUInt32LE() !== 0x04034b50) throw new Error('PPTX 파일을 읽을 수 없어요.')
  const temp = filePath(id) + '.' + randomUUID() + '.tmp'
  try {
    await writeFile(temp, bytes, { mode: 0o600 })
    await rename(temp, filePath(id))
  } finally {
    await rm(temp, { force: true })
  }
}

async function makeBlank(ratio) {
  const { stdout: blank } = await runFile('docker', [
    'exec', 'pit-onlyoffice', 'cat', '/var/www/onlyoffice/documentserver/document-templates/new/ko-KR/new.pptx',
  ], { encoding: 'buffer', timeout: 5000 })
  const dir = await mkdtemp(join(tmpdir(), 'pit-pptx-'))
  try {
    const source = join(dir, 'blank.pptx')
    const entry = 'ppt/presentation.xml'
    await writeFile(source, blank)
    const { stdout: xml } = await runFile('unzip', ['-p', source, entry])
    const [width, height] = slideSizes[ratio]
    const slideSize = /<p:sldSz\b[^>]*\/>/
    if (!slideSize.test(xml)) throw new Error('PPTX 슬라이드 비율을 설정할 수 없어요.')
    await mkdir(join(dir, 'ppt'))
    await writeFile(join(dir, entry), xml.replace(slideSize, '<p:sldSz cx="' + width + '" cy="' + height + '"/>'))
    await runFile('zip', ['-q', source, entry], { cwd: dir })
    return await readFile(source)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

function blankPptx(ratio) {
  if (!layouts.has(ratio)) layouts.set(ratio, makeBlank(ratio).catch(error => {
    layouts.delete(ratio)
    throw error
  }))
  return layouts.get(ratio)
}

function savedFileUrl(value) {
  const url = new URL(value)
  const path = url.origin === browserOrigin && url.pathname.startsWith(proxyPath + '/')
    ? url.pathname.slice(proxyPath.length) : url.origin === documentServer ? url.pathname : ''
  if (!path.startsWith('/cache/files/')) throw new Error('ONLYOFFICE 저장 주소를 확인할 수 없어요.')
  return new URL(documentServer + path + url.search)
}

function installLocalOffice(vite, settings) {
  const browserSecret = settings.secret.browser.string
  const outboxSecret = settings.secret.outbox.string

  async function handle(request, response, endpoint) {
    const [, id, action, key] = endpoint
    const method = request.method
    if (key) {
      const session = sessions.get(id)
      if (request.headers.host !== dockerHost || session?.key !== key) {
        return sendJson(response, 404, { error: 1 })
      }
      if (action === 'source' && method === 'GET') return sendPptx(response, await readFile(filePath(id)))
      if (action !== 'callback' || method !== 'POST') return sendJson(response, 405, { error: 1 })

      const callback = readSignedCallback(request, settings.token.outbox, outboxSecret)
      const body = JSON.parse((await readBytes(request, 1024 * 1024)).toString())
      if (callback?.key !== key || callback.status !== body.status || callback.url !== body.url) {
        return sendJson(response, 403, { error: 1 })
      }
      const { status, url } = callback
      if (status === 2 || status === 6) {
        if (status === 6 && session.finalizing) return sendJson(response, 200, { error: 0 })
        const save = (session.saving ?? Promise.resolve()).catch(() => {}).then(async () => {
          const download = await fetch(savedFileUrl(url), { signal: AbortSignal.timeout(20_000), redirect: 'error' })
          if (!download.ok || !download.body) throw new Error('편집한 PPTX를 받아올 수 없어요.')
          await writeDocument(id, await readBytes(download.body, maxSavedBytes))
        })
        session.saving = save
        if (status === 2) session.finalizing = save
        try {
          await save
          if (status === 2) sessions.delete(id)
        } finally {
          if (session.saving === save) session.saving = undefined
          if (session.finalizing === save) session.finalizing = undefined
        }
      } else if (status === 4) {
        sessions.delete(id)
      }
      return sendJson(response, 200, { error: status === 3 || status === 7 ? 1 : 0 })
    }

    if (request.headers.host !== browserHost ||
      (request.headers['sec-fetch-site'] && request.headers['sec-fetch-site'] !== 'same-origin')) {
      return sendJson(response, 403, { error: '로컬 PIT에서 열어 주세요.' })
    }

    if (action === 'source' && method === 'PUT') {
      if (!request.headers['content-type']?.startsWith(pptxType)) return sendJson(response, 415, { error: 'PPTX 파일을 선택해 주세요.' })
      const bytes = await readBytes(request, maxSourceBytes)
      if (!await documentExists(id)) await writeDocument(id, bytes)
      return sendJson(response, 200, {})
    }
    if (action !== 'open' || method !== 'POST') return sendJson(response, 405, {})
    const { title, readOnly, imported, ratio } = JSON.parse((await readBytes(request, 4096)).toString())
    if (typeof title !== 'string' || !title.trim() || title.length > 300) {
      return sendJson(response, 400, { error: '프레젠테이션 이름을 확인해 주세요.' })
    }
    if (!await documentExists(id)) {
      if (imported) return sendJson(response, 409, { error: '원본 PPTX가 필요해요.' })
      const blank = await blankPptx(Object.hasOwn(slideSizes, ratio) ? ratio : '16:9')
      if (!await documentExists(id)) await writeDocument(id, blank)
    }

    await sessions.get(id)?.finalizing
    let session = sessions.get(id)
    if (!session) {
      session = { key: randomUUID() }
      sessions.set(id, session)
    }
    const source = 'http://' + dockerHost + apiPath + '/' + id
    const editable = readOnly !== true
    const config = {
      width: '100%',
      height: '100%',
      documentType: 'slide',
      document: {
        fileType: 'pptx',
        key: session.key,
        title,
        url: source + '/source/' + session.key,
        permissions: { edit: editable },
      },
      editorConfig: {
        callbackUrl: source + '/callback/' + session.key,
        lang: 'ko',
        mode: editable ? 'edit' : 'view',
        user: { id: 'pit-local-preview', name: 'PIT 테스트' },
        customization: { forcesave: true },
      },
    }
    return sendJson(response, 200, { ...config, token: sign(config, browserSecret) })
  }

  vite.middlewares.use((request, response, next) => {
    if (!request.url?.startsWith(apiPath + '/')) {
      if (request.headers.host === dockerHost) return sendJson(response, 404, {})
      return next()
    }
    const endpoint = /^\/([a-z0-9-]{1,100})\/(open|source|callback)(?:\/([0-9a-f-]{36}))?$/.exec(request.url.slice(apiPath.length))
    if (!endpoint) return sendJson(response, 404, {})
    void handle(request, response, endpoint).catch(error => {
      console.error('ONLYOFFICE 요청 실패:', endpoint[2], error.message)
      if (!response.headersSent) sendJson(response, 500, { error: endpoint[2] === 'callback' ? 1 : 'PPTX를 열거나 저장할 수 없어요.' })
    })
  })
}

async function run() {
  const health = await fetch(documentServer + '/healthcheck', { signal: AbortSignal.timeout(5000) }).catch(() => null)
  if (!health?.ok || (await health.text()).trim() !== 'true') {
    throw new Error('127.0.0.1:8080에서 ONLYOFFICE에 연결할 수 없어요. pit-onlyoffice 컨테이너 상태를 확인해 주세요.')
  }

  let settings
  try {
    const { stdout } = await runFile('docker', ['exec', 'pit-onlyoffice', 'cat', '/etc/onlyoffice/documentserver/local.json'], { timeout: 5000 })
    settings = JSON.parse(stdout).services.CoAuthoring
  } catch {
    throw new Error('로컬 Docker의 pit-onlyoffice 설정을 읽을 수 없어요.')
  }
  if (!settings.secret?.browser?.string || !settings.secret?.outbox?.string ||
    !settings.token?.enable?.browser || !settings.token.enable.request?.outbox || settings.token.outbox?.inBody) {
    throw new Error('pit-onlyoffice의 브라우저·콜백 JWT 설정을 확인해 주세요.')
  }

  await mkdir(storage, { recursive: true, mode: 0o700 })
  const server = await createServer({
    define: { 'import.meta.env.VITE_PIT_LOCAL_OFFICE': 'true' },
    server: {
      host, port, strictPort: true, cors: false, allowedHosts: ['host.docker.internal'],
      proxy: {
        [proxyPath + '/']: {
          target: documentServer,
          changeOrigin: true,
          ws: true,
          headers: { 'X-Forwarded-Host': browserHost + proxyPath, 'X-Forwarded-Proto': 'http' },
          rewrite: path => path.slice(proxyPath.length),
        },
      },
    },
    plugins: [{ name: 'pit-onlyoffice-local', configureServer: vite => installLocalOffice(vite, settings) }],
  })
  await server.listen()
  server.printUrls()
  console.log('ONLYOFFICE 확인:', browserOrigin + '/presentations')
}

run().catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
