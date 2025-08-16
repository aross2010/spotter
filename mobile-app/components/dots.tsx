import React from 'react'
import { View, LayoutChangeEvent } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
} from 'react-native-reanimated'

// animate them in

type BackgroundDotsProps = {
  numDots?: number
  minSize?: number
  maxSize?: number
  boundsPadding?: number
  minGap?: number
  colorClass?: string
  regenKey?: number | string
  /** speed range in px/sec */
  speedMin?: number
  speedMax?: number
}

type Dot = { size: number; x: number; y: number } // x,y are top-left

function generateDots(
  count: number,
  w: number,
  h: number,
  minSize: number,
  maxSize: number,
  pad: number,
  minGap: number,
  triesPerDot = 150
): Dot[] {
  const dots: Dot[] = []
  let attempts = 0

  while (dots.length < count && attempts < count * triesPerDot) {
    attempts++
    const size = Math.round(minSize + Math.random() * (maxSize - minSize))
    const r = size / 2
    // candidate center
    const cx = pad + r + Math.random() * Math.max(0, w - 2 * (pad + r))
    const cy = pad + r + Math.random() * Math.max(0, h - 2 * (pad + r))

    const ok = dots.every((e) => {
      const ex = e.x + e.size / 2
      const ey = e.y + e.size / 2
      const dx = cx - ex
      const dy = cy - ey
      const minCenter = r + e.size / 2 + minGap
      return dx * dx + dy * dy >= minCenter * minCenter
    })

    if (ok) dots.push({ size, x: cx - r, y: cy - r })
  }

  return dots
}

function BouncingDot({
  d,
  w,
  h,
  pad,
  colorClass,
  speedMin,
  speedMax,
}: {
  d: Dot
  w: number
  h: number
  pad: number
  colorClass: string
  speedMin: number
  speedMax: number
}) {
  // position (top-left)
  const x = useSharedValue(d.x)
  const y = useSharedValue(d.y)

  // random velocity vector (pixels per second)
  const angle = Math.random() * Math.PI * 2
  const speed = speedMin + Math.random() * Math.max(0, speedMax - speedMin || 0)
  const vx = useSharedValue(Math.cos(angle) * speed)
  const vy = useSharedValue(Math.sin(angle) * speed)

  // per-frame physics
  const cb = useFrameCallback(({ timeSincePreviousFrame }) => {
    const dt = (timeSincePreviousFrame || 16.67) / 1000 // seconds

    // advance
    x.value += vx.value * dt
    y.value += vy.value * dt

    // bounds
    // left
    if (x.value <= pad) {
      x.value = pad
      vx.value = Math.abs(vx.value)
    }
    // right
    if (x.value + d.size >= w - pad) {
      x.value = w - pad - d.size
      vx.value = -Math.abs(vx.value)
    }
    // top
    if (y.value <= pad) {
      y.value = pad
      vy.value = Math.abs(vy.value)
    }
    // bottom
    if (y.value + d.size >= h - pad) {
      y.value = h - pad - d.size
      vy.value = -Math.abs(vy.value)
    }
  }, true)

  React.useEffect(() => () => cb.setActive(false), [])

  const style = useAnimatedStyle(() => ({
    left: x.value,
    top: y.value,
  }))

  return (
    <Animated.View
      pointerEvents="none"
      className={`absolute rounded-full ${colorClass}`}
      style={[
        {
          width: d.size,
          height: d.size,
          borderRadius: d.size / 2,
        },
        style,
      ]}
    />
  )
}

export function BackgroundDots({
  numDots = 25,
  minSize = 14,
  maxSize = 48,
  boundsPadding = 8,
  minGap = 8,
  colorClass = 'bg-primary/20',
  regenKey,
  speedMin = 20, // ~slow walk
  speedMax = 60, // a bit faster
}: BackgroundDotsProps) {
  const [layout, setLayout] = React.useState({ w: 0, h: 0 })
  const [dots, setDots] = React.useState<Dot[]>([])

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setLayout({ w: width, h: height })
  }

  React.useEffect(() => {
    const { w, h } = layout
    if (!w || !h) return
    setDots(
      generateDots(numDots, w, h, minSize, maxSize, boundsPadding, minGap)
    )
  }, [layout, numDots, minSize, maxSize, boundsPadding, minGap, regenKey])

  return (
    <View
      className="absolute inset-0"
      pointerEvents="none"
      onLayout={onLayout}
    >
      {layout.w > 0 &&
        dots.map((d, i) => (
          <BouncingDot
            key={i}
            d={d}
            w={layout.w}
            h={layout.h}
            pad={boundsPadding}
            colorClass={colorClass}
            speedMin={speedMin}
            speedMax={speedMax}
          />
        ))}
    </View>
  )
}
