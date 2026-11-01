import type { CSSProperties, ReactElement } from 'react'
export interface PitLoadingProps {
  /** Canvas width; height follows the original 540:357 aspect ratio. */
  size?: number | string
  /** Playback multiplier; 1 is the original 2.67-second cycle. */
  speed?: number
  paused?: boolean
  label?: string
  className?: string
  style?: CSSProperties
  onError?: () => void
}
export default function PitLoading(props: PitLoadingProps): ReactElement
