import { useLayoutEffect, useRef } from 'react'

type Connection = { source: string; target: string; targetY?: number }

export const fileConnections: readonly Connection[] = [
  { source: '.loose-file-0', target: '.shared-workspace' },
  { source: '.loose-file-1', target: '.shared-workspace' },
  { source: '.loose-file-2', target: '.shared-workspace' },
]

export const ideaConnections: readonly Connection[] = [
  { source: '.idea-note', target: '.composed-slide', targetY: .46 },
  { source: '.evidence-note', target: '.composed-slide', targetY: .66 },
]

/** Connect actual card edges, including their rotation and placement animation. */
export function SceneConnections({ connections }: { connections: readonly Connection[] }) {
  const ref = useRef<SVGSVGElement>(null)

  useLayoutEffect(() => {
    const svg = ref.current
    const scene = svg?.parentElement
    if (!svg || !scene) return
    let disposed = false
    let frame = 0
    const routes = connections.map(connection => ({
      ...connection,
      sourceElement: scene.querySelector<HTMLElement>(connection.source),
      targetElement: scene.querySelector<HTMLElement>(connection.target),
    }))
    const paths = [...svg.querySelectorAll('path')]
    const edge = (el: HTMLElement, side: 'left' | 'right' | 'top' | 'bottom', fraction: number) => {
      const r = el.getBoundingClientRect()
      const style = getComputedStyle(el)
      const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform)
      const rotation = (parseFloat(style.rotate) || 0) * Math.PI / 180
      const cos = Math.cos(rotation)
      const sin = Math.sin(rotation)
      // Enter one pixel underneath the card so antialiasing cannot leave a gap.
      const vertical = side === 'top' || side === 'bottom'
      const x = vertical ? el.offsetWidth * (fraction - .5) : (side === 'right' ? 1 : -1) * (el.offsetWidth / 2 - 1)
      const localY = vertical ? (side === 'bottom' ? 1 : -1) * (el.offsetHeight / 2 - 1) : el.offsetHeight * (fraction - .5)
      const tx = matrix.a * x + matrix.c * localY
      const ty = matrix.b * x + matrix.d * localY
      return { x: r.left + r.width / 2 + cos * tx - sin * ty, y: r.top + r.height / 2 + sin * tx + cos * ty }
    }
    const update = () => {
      if (disposed) return
      const origin = scene.getBoundingClientRect()
      if (!origin.width || !origin.height) return
      const viewBox = `0 0 ${origin.width} ${origin.height}`
      if (svg.getAttribute('viewBox') !== viewBox) svg.setAttribute('viewBox', viewBox)
      routes.forEach(({ sourceElement, targetElement, targetY = .5 }, i) => {
        if (!sourceElement || !targetElement) return
        const source = sourceElement.getBoundingClientRect()
        const target = targetElement.getBoundingClientRect()
        const stacked = target.top >= source.bottom - 2 && source.right > target.left && target.right > source.left
        const from = edge(sourceElement, stacked ? 'bottom' : 'right', .5)
        const to = edge(targetElement, stacked ? 'top' : 'left', targetY)
        const x1 = from.x - origin.left
        const y1 = from.y - origin.top
        const x2 = to.x - origin.left
        const y2 = to.y - origin.top
        const reach = Math.max(16, (stacked ? y2 - y1 : x2 - x1) * .48)
        const d = stacked
          ? `M ${x1} ${y1} C ${x1} ${y1 + reach}, ${x2} ${y2 - reach}, ${x2} ${y2}`
          : `M ${x1} ${y1} C ${x1 + reach} ${y1}, ${x2 - reach} ${y2}, ${x2} ${y2}`
        if (paths[i].getAttribute('d') !== d) paths[i].setAttribute('d', d)
      })
    }
    const tick = () => {
      frame = 0
      update()
      // During construction, follow transforms as well as layout changes.
      if (!disposed && scene.querySelector('[data-building="true"]')) schedule()
    }
    const schedule = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(tick)
    }
    const resize = new ResizeObserver(schedule)
    resize.observe(scene)
    routes.forEach(({ sourceElement, targetElement }) => {
      if (sourceElement) resize.observe(sourceElement)
      if (targetElement) resize.observe(targetElement)
    })
    const changes = new MutationObserver(schedule)
    changes.observe(scene, { subtree: true, attributes: true, childList: true, attributeFilter: ['style', 'class', 'data-building', 'data-built'] })
    document.fonts.ready.then(schedule)
    update()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resize.disconnect()
      changes.disconnect()
    }
  }, [connections])

  return <svg ref={ref} className="connection-paths" preserveAspectRatio="none" aria-hidden="true" data-build="draw">
    {connections.map(({ source, target }) => <path key={`${source}-${target}`} vectorEffect="non-scaling-stroke" strokeLinecap="round" />)}
  </svg>
}
