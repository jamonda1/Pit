import { useLayoutEffect, useRef, useState } from 'react'

/** A shared worker pool lets independent elements finish independently. */
export function useCollaborativeBuild() {
  const root = useRef<HTMLDivElement>(null)
  const stop = useRef<() => void>(() => {})
  const [ready, setReady] = useState<Set<string>>(new Set())
  const [active, setActive] = useState(true)

  useLayoutEffect(() => {
    const host = root.current
    if (!host) return
    let disposed = false
    let skipped = false
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const parts = [...host.querySelectorAll<HTMLElement>('[data-build]')]
    const scenes = [...host.querySelectorAll<HTMLElement>('[data-scene]')]
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const animations = new Set<Animation>()
    const queue: HTMLElement[] = []
    const observed = new Set<Element>()
    const cursors = [...host.querySelectorAll<HTMLElement>('.builder-cursor')]
    const workerCount = innerWidth < 640 ? 3 : innerWidth < 1000 ? 5 : 7
    const workers = cursors.slice(0, workerCount).map(cursor => ({
      cursor,
      frame: cursor.parentElement!.querySelector<HTMLElement>('.builder-target')!,
      busy: false,
    }))
    const frames = new Set<number>()
    const restorations = new Set<() => void>()
    const follow = (update: () => void) => {
      let id = 0
      let stopped = false
      const tick = () => {
        if (disposed || skipped || stopped) return
        update()
        frames.delete(id)
        id = requestAnimationFrame(tick)
        frames.add(id)
      }
      tick()
      return () => { stopped = true; cancelAnimationFrame(id); frames.delete(id) }
    }
    const typeText = (el: HTMLElement, frame: HTMLElement, onCaret: (x: number, y: number) => void) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      const nodes: { node: Text; text: string; chars: string[] }[] = []
      let current: Node | null
      while ((current = walker.nextNode())) {
        const text = current.textContent ?? ''
        nodes.push({ node: current as Text, text, chars: Array.from(text) })
      }
      const count = nodes.reduce((sum, entry) => sum + entry.chars.length, 0)
      const duration = Math.min(1900, Math.max(900, count * 24))
      const r = el.getBoundingClientRect()
      const original = { minHeight: el.style.minHeight, minWidth: el.style.minWidth, opacity: el.style.opacity }
      el.style.minHeight = `${r.height}px`
      el.style.minWidth = `${r.width}px`
      el.style.opacity = '1'
      const restore = () => {
        nodes.forEach(({ node, text }) => { node.data = text })
        Object.assign(el.style, original)
        restorations.delete(restore)
      }
      restorations.add(restore)
      nodes.forEach(({ node }) => { node.data = '' })
      const range = document.createRange()
      let last: Text | undefined
      let lastOffset = 0
      const start = performance.now()
      const updateCaret = () => {
        const caret = frame.querySelector<HTMLElement>('.edit-caret')!
        const box = frame.getBoundingClientRect()
        if (!last || !lastOffset) {
          caret.style.left = '8px'
          caret.style.top = '6px'
          caret.style.height = `${Math.min(parseFloat(getComputedStyle(el).fontSize) * 1.1, r.height)}px`
          onCaret(box.left + 18, box.top + 18)
          return
        }
        const trailing = Array.from(last.data.slice(0, lastOffset)).at(-1) ?? ''
        range.setStart(last, Math.max(0, lastOffset - trailing.length))
        range.setEnd(last, lastOffset)
        const glyph = range.getBoundingClientRect()
        if (!glyph.height) return
        caret.style.left = `${glyph.right - box.left}px`
        caret.style.top = `${glyph.top - box.top}px`
        caret.style.height = `${glyph.height}px`
        onCaret(glyph.right + 10, glyph.top + glyph.height * .58)
      }
      const stopFollowing = follow(() => {
        let remaining = Math.floor(Math.min(1, (performance.now() - start) / duration) * count)
        for (const entry of nodes) {
          const shown = Math.min(entry.chars.length, remaining)
          const text = entry.chars.slice(0, shown).join('')
          if (entry.node.data !== text) entry.node.data = text
          if (shown) { last = entry.node; lastOffset = text.length }
          remaining -= shown
        }
        updateCaret()
      })
      return { duration, restore, stopFollowing, finish: () => nodes.forEach(({ node, text }) => { node.data = text }) }
    }
    const sleep = (ms: number) => new Promise<void>(resolve => {
      const id = setTimeout(() => { timers.delete(id); resolve() }, ms)
      timers.add(id)
    })
    const play = async (el: Element, frames: Keyframe[], duration: number, easing = 'cubic-bezier(.22,1,.36,1)') => {
      const animation = el.animate(frames, { duration, easing, fill: 'both' })
      animations.add(animation)
      try { await animation.finished } catch { /* Unmount and skip cancel pending work. */ }
      animations.delete(animation)
      animation.cancel()
    }
    const complete = (el: HTMLElement) => {
      el.dataset.built = 'true'
      el.inert = false
      if (el.dataset.buildId) {
        const id = el.dataset.buildId
        setReady(previous => new Set(previous).add(id))
      }
    }
    // Overlay and artwork share document coordinates. Native scrolling then moves
    // both together, without waiting for a JS frame to reposition a fixed border.
    const inCanvas = (x: number, y: number) => {
      const origin = host.getBoundingClientRect()
      return { x: x - origin.left, y: y - origin.top }
    }
    const position = (el: HTMLElement, end = false) => {
      const r = el.getBoundingClientRect()
      return inCanvas(
        Math.min(innerWidth - 30, Math.max(8, r.left + r.width * (end ? .88 : .12))),
        r.top + r.height * (end ? .8 : .25),
      )
    }
    const transform = (p: { x: number; y: number }) => `translate3d(${p.x}px,${p.y}px,0)`
    const work = async (worker: typeof workers[number], el: HTMLElement) => {
      worker.busy = true
      const index = workers.indexOf(worker)
      worker.cursor.style.opacity = '1'
      const start = position(el)
      await play(worker.cursor, [
        { transform: worker.cursor.style.transform || transform(inCanvas(innerWidth * (index + 1) / (workerCount + 1), innerHeight * .45)) },
        { transform: transform(start) },
      ], 340 + index * 35)
      if (disposed || skipped) return
      worker.cursor.style.transform = transform(start)
      el.dataset.building = 'true'
      el.dataset.builder = String(index)
      const typing = el.dataset.build === 'type'
      const selection = worker.frame
      selection.dataset.mode = typing ? 'text' : 'object'
      selection.style.opacity = '1'
      const unfollow = follow(() => {
        const r = el.getBoundingClientRect()
        const p = inCanvas(r.left - 6, r.top - 6)
        selection.style.transform = transform(p)
        selection.style.width = `${r.width + 12}px`
        selection.style.height = `${r.height + 12}px`
      })
      const duration = el.dataset.build === 'draw' ? 950 : 850
      const keyframes: Keyframe[] = el.dataset.build === 'draw'
          ? [{ opacity: .3, clipPath: 'inset(0 90% 80% 0)' }, { opacity: 1, clipPath: 'inset(0 0 0 0)' }]
          : [{ opacity: 0, transform: 'translate3d(14px,18px,0) scale(.96)' }, { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' }]
      let pointer = start
      const movePointer = (x: number, y: number) => {
        const target = inCanvas(Math.min(innerWidth - 28, Math.max(6, x)), y)
        const dx = target.x - pointer.x
        const dy = target.y - pointer.y
        // Follow each keystroke with a small trailing motion, including line wraps.
        pointer = { x: pointer.x + dx * .32, y: pointer.y + dy * .32 }
        const tilt = Math.max(-7, Math.min(7, dx * .13))
        worker.cursor.style.transform = `${transform(pointer)} rotate(${tilt}deg)`
      }
      if (typing) {
        worker.cursor.dataset.action = 'typing'
        const text = typeText(el, selection, movePointer)
        await sleep(text.duration)
        text.stopFollowing()
        text.finish()
        if (!disposed && !skipped) await sleep(240)
        text.restore()
      } else {
        worker.cursor.dataset.action = el.dataset.build === 'draw' ? 'drawing' : 'dragging'
        const started = performance.now()
        const drawing = el.dataset.build === 'draw'
        const stopPointer = follow(() => {
          const t = Math.min(1, (performance.now() - started) / duration)
          const r = el.getBoundingClientRect()
          // Work through the content, rather than only tracing its outer border.
          // Draw strokes sweep across the emerging surface; placed assets get a
          // short drag-and-align gesture that settles at their lower-right handle.
          const x = drawing ? .1 + t * .82 : .16 + (1 - (1 - t) ** 3) * .7
          const y = drawing
            ? .2 + t * .55 + Math.sin(t * Math.PI * 4) * .1 * Math.sin(t * Math.PI)
            : .3 + t * .45 + Math.sin(t * Math.PI) * .12
          movePointer(r.left + r.width * x, r.top + r.height * y)
        })
        await play(el, keyframes, duration, drawing ? 'linear' : undefined)
        stopPointer()
        worker.cursor.style.transform = transform(pointer)
        if (!disposed && !skipped) {
          const opacity = el.style.opacity
          const restoreOpacity = () => { el.style.opacity = opacity; restorations.delete(restoreOpacity) }
          restorations.add(restoreOpacity)
          el.style.opacity = '1'
          await sleep(180)
          restoreOpacity()
        }
      }
      unfollow()
      delete worker.cursor.dataset.action
      selection.style.opacity = '0'
      if (disposed || skipped) return
      complete(el)
      delete el.dataset.building
      await sleep(110)
      worker.busy = false
      worker.cursor.style.opacity = '0'
      pump()
    }
    function pump() {
      if (disposed || skipped) return
      for (const worker of workers) {
        if (!worker.busy && queue.length) void work(worker, queue.shift()!)
      }
      const busy = queue.length > 0 || workers.some(w => w.busy)
      setActive(busy)
      if (!busy && observed.size === scenes.length) host!.dataset.motion = 'complete'
    }
    const revealAll = () => {
      skipped = true
      observer?.disconnect()
      animations.forEach(a => a.cancel())
      frames.forEach(cancelAnimationFrame)
      restorations.forEach(restore => restore())
      cursors.forEach(c => { c.style.opacity = '0'; delete c.dataset.action })
      workers.forEach(w => { w.frame.style.opacity = '0' })
      parts.forEach(el => { complete(el); delete el.dataset.building })
      host.dataset.motion = 'complete'
      setActive(false)
    }
    let observer: IntersectionObserver | undefined
    stop.current = revealAll
    parts.forEach(el => { delete el.dataset.built; delete el.dataset.building; el.inert = true })
    host.dataset.motion = 'building'
    if (motion.matches || !('IntersectionObserver' in window)) revealAll()
    else {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting || observed.has(entry.target)) continue
          observed.add(entry.target)
          queue.push(...[...entry.target.querySelectorAll<HTMLElement>('[data-build]')].sort((a, b) => Number(a.dataset.priority ?? 10) - Number(b.dataset.priority ?? 10)))
          observer?.unobserve(entry.target)
        }
        pump()
      }, { threshold: .08, rootMargin: '0px 0px -20px 0px' })
      scenes.forEach(scene => observer!.observe(scene))
    }
    // Changing the OS preference during construction reveals a usable static page.
    const onMotion = () => { if (motion.matches) revealAll() }
    motion.addEventListener('change', onMotion)
    // Text construction temporarily reserves pixel widths. Release them before
    // a different breakpoint reflows the page, including split-screen resizing.
    const viewportWidth = innerWidth
    const onResize = () => { if (innerWidth !== viewportWidth) revealAll() }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') revealAll()
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      disposed = true
      observer?.disconnect()
      timers.forEach(clearTimeout)
      animations.forEach(a => a.cancel())
      frames.forEach(cancelAnimationFrame)
      restorations.forEach(restore => restore())
      motion.removeEventListener('change', onMotion)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return { root, ready, active, skip: () => {
    stop.current()
    root.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
  } }
}
