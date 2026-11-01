import { useEffect, useRef, useState } from 'react'
import { mountPitMotion } from '../assets/animations/pitMotion'

/** Width in CSS pixels (or a CSS length); the original 540:357 ratio is retained. */
export default function PitLoading({ size = 180, speed = 1, paused = false,
  label = '불러오는 중', className, style, onError }) {
  const canvasRef = useRef(null)
  const motionRef = useRef(null)
  const errorRef = useRef(onError)
  const [failed, setFailed] = useState(false)
  errorRef.current = onError
  const playbackSpeed = Number.isFinite(speed) && speed > 0 ? speed : 1
  useEffect(() => {
    setFailed(false)
    const dispose = mountPitMotion(canvasRef.current, {
      speed: playbackSpeed, paused,
      onError: () => { setFailed(true); errorRef.current?.() },
    })
    motionRef.current = dispose
    return dispose
  }, [])
  useEffect(() => {
    motionRef.current?.update({ speed: playbackSpeed, paused })
  }, [playbackSpeed, paused])
  return <span role="status" aria-label={label} className={className}
    style={{ display: 'inline-block', width: size, maxWidth: '100%', verticalAlign: 'middle', ...style }}>
    <canvas ref={canvasRef} width={540} height={357} aria-hidden="true"
      style={{ display: failed ? 'none' : 'block', width: '100%', height: 'auto' }} />
    {failed && <span aria-hidden="true">{label}</span>}
  </span>
}
