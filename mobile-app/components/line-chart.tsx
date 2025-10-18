import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  Area,
  CartesianChart,
  Line,
  Scatter,
  useChartPressState,
} from 'victory-native'
import { useFont } from '@shopify/react-native-skia'
import Colors from '../constants/colors'
import useTheme from '../app/hooks/theme'
import tw from '../tw'
import { Poppins_400Regular } from '@expo-google-fonts/poppins'
import Animated, {
  runOnJS,
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

type DataPoint = Record<string, any>

type LineChartProps = {
  data: DataPoint[] // if data greater than 100, make it scrollable
  xKey: string
  yKey: string
  formatXLabel?: (value: any, index: number) => string
  formatYLabel?: (value: number) => string
  maxXLabels?: number // kept for compatibility; we’ll force 5 regardless
  toolTips?: ReactNode[] // match len of data
  longPressMs?: number // how long to hold before activating tooltip (default 150ms)
}

const CHART_HEIGHT = 225

const LineChart = ({
  data,
  xKey,
  yKey,
  formatXLabel,
  formatYLabel,
  toolTips,
  longPressMs = 150,
}: LineChartProps) => {
  const { theme } = useTheme()
  const font = useFont(Poppins_400Regular, 10)
  const { state: press, isActive } = useChartPressState({ x: 0, y: { y: 0 } })
  const chartWidth = useSharedValue(0)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const tooltipX = useSharedValue<number | null>(null)
  const tooltipY = useSharedValue<number | null>(null)
  const wasActive = useSharedValue(false)

  useAnimatedReaction(
    () => ({ active: press.isActive.value, dataX: press.x.value }),
    ({ active, dataX }) => {
      if (!active || data.length === 0) {
        runOnJS(setCurrentIndex)(null)
        return
      }
      const clamped = Math.max(
        0,
        Math.min(data.length - 1, Math.round(dataX.value))
      )
      runOnJS(setCurrentIndex)(clamped)
    },
    [data.length]
  )

  useAnimatedReaction(
    () => ({
      active: press.isActive.value,
      tx: press.x.position.value,
      ty: press.y.y.position.value,
    }),
    ({ active, tx, ty }) => {
      if (active) {
        if (
          !wasActive.value ||
          tooltipX.value == null ||
          tooltipY.value == null
        ) {
          // First touch this gesture: JUMP to correct position (no animation)
          tooltipX.value = tx
          tooltipY.value = ty
        } else {
          // Gesture is already active: ANIMATE between points
          tooltipX.value = withTiming(tx, {
            duration: 350,
            easing: Easing.out(Easing.cubic),
          })
          tooltipY.value = withTiming(ty, {
            duration: 350,
            easing: Easing.out(Easing.cubic),
          })
        }
      } else {
        // Gesture ended — clear so next first touch jumps again
        tooltipX.value = null
        tooltipY.value = null
      }
      wasActive.value = active
    }
  )

  const currentIndexSV = useSharedValue(-1)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    currentIndexSV.value = currentIndex ?? -1
  }, [currentIndex])

  useAnimatedReaction(
    () => {
      const hasPos =
        press.x.position.value !== 0 || press.y.y.position.value !== 0
      const isIdxZero = currentIndexSV.value === 0
      const hasWidth = chartWidth.value > 0
      return press.isActive.value && (hasPos || isIdxZero) && hasWidth
    },
    (ready) => {
      runOnJS(setShowTooltip)(ready)
    },
    [data.length]
  )

  const tooltipStyle = useAnimatedStyle(() => {
    const width = chartWidth.value
    const tx = tooltipX.value
    const ty = tooltipY.value

    // Don’t render until we have a real position
    if (tx == null || ty == null || width === 0) {
      return { position: 'absolute', opacity: 0 }
    }

    const offsetX = tx > width / 2 ? -150 : 0
    // Only the transforms animate (already handled in the reaction)
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 10,
      opacity: 1,
      transform: [{ translateX: tx + offsetX }, { translateY: ty - 60 }],
    }
  }, [])

  const chartData = useMemo(
    () =>
      data.map((point, index) => ({
        x: index,
        y: point[yKey],
        original: point,
      })),
    [data, yKey]
  )

  const xTickValues = () => {
    const n = data.length
    if (n === 0) return []
    if (n === 1) return [0]
    if (n <= 5) return Array.from({ length: n }, (_, i) => i)

    const last = n - 1
    const mid = Math.round(last / 2) // centered middle
    const q1 = Math.ceil(last / 4) // bias inward (e.g., 1.5 -> 2)
    const q3 = Math.floor((3 * last) / 4) // bias inward (e.g., 4.5 -> 4)

    // Desired 5 ticks: first, quarter, middle, three-quarters, last
    let ticks = [0, q1, mid, q3, last]

    // Dedupe + keep 5 by filling from neighbors toward center if needed
    const set = new Set<number>()
    for (const t of ticks) set.add(t)

    if (set.size < 5) {
      const candidates: number[] = []
      // prefer positions near the middle if we need to fill gaps
      for (let d = 1; d <= last; d++) {
        const L = mid - d
        const R = mid + d
        if (L > 0) candidates.push(L)
        if (R < last) candidates.push(R)
      }
      for (const c of candidates) {
        set.add(c)
        if (set.size === 5) break
      }
    }

    return Array.from(set).sort((a, b) => a - b)
  }

  const xFormatter = (value: number) => {
    const index = Math.round(value)
    if (index < 0 || index >= data.length) return ''
    const raw = data[index]?.[xKey]
    return formatXLabel ? formatXLabel(raw, index) : String(raw ?? '')
  }

  const yFormatter = (value: number) =>
    formatYLabel ? formatYLabel(value) : `${Math.round(value)}`

  const boundsLeft = useSharedValue(0)
  const boundsTop = useSharedValue(0)

  return (
    <View style={tw`w-full h-[${CHART_HEIGHT}px]`}>
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={['y']}
        domain={{ x: [0, Math.max(0, data.length - 1)] }}
        domainPadding={{ left: 5, right: 25, top: 20, bottom: 10 }}
        padding={{ left: 0, right: 0, top: 0, bottom: 0 }}
        xAxis={{
          font,
          tickValues: xTickValues(),
          formatXLabel: (v: number) => xFormatter(v),
          labelColor: theme.grayText,
          lineColor: theme.grayTertiary,
        }}
        yAxis={[
          {
            font,
            tickCount: 5,
            formatYLabel: (v: number) => yFormatter(v),
            labelColor: theme.grayText,
            lineColor: theme.grayTertiary,
          },
        ]}
        chartPressState={press}
        onChartBoundsChange={(b) => {
          boundsLeft.value = b.left
          boundsTop.value = b.top
          chartWidth.value = b.right - b.left
        }}

        // we only care about horizontal movement
      >
        {({ points, yScale, chartBounds }) => (
          <>
            <Area
              points={points.y}
              color={Colors.primary}
              opacity={0.1}
              curveType="linear"
              animate={{ type: 'timing', duration: 400 }}
              y0={CHART_HEIGHT}
            />
            <Line
              points={points.y}
              color={Colors.primary}
              strokeWidth={1.5}
              curveType="linear"
              animate={{
                type: 'timing',
                duration: 400,
              }}
            />
            <Scatter
              points={points.y}
              radius={2}
              color={Colors.primary}
              animate={{ type: 'timing', duration: 350 }}
            />
            {currentIndex != null && points.y[currentIndex] ? (
              <Scatter
                points={[points.y[currentIndex]]} // only the active point
                radius={6} // bigger radius
                color={Colors.primary}
                animate={{ type: 'timing', duration: 350 }}
              />
            ) : null}
          </>
        )}
      </CartesianChart>
      {showTooltip && currentIndex != null && currentIndex < data.length && (
        <Animated.View
          // NOTE: add these imports:
          // import { FadeInDown, FadeOutUp, LinearTransition, Easing } from 'react-native-reanimated'
          pointerEvents="none"
          style={[{ zIndex: 10 }, tooltipStyle]}
        >
          {toolTips?.[currentIndex] ?? null}
        </Animated.View>
      )}
    </View>
  )
}

export default LineChart
