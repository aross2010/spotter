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
      transform: [{ translateX: tx + offsetX }, { translateY: ty - 80 }],
    }
  }, [])

  const chartData = useMemo(
    () =>
      data.map((point, index) => ({
        x: index,
        y: point[yKey],
        reps: point.reps ?? 1, // Include reps in chartData
        original: point,
      })),
    [data, yKey]
  )

  // Calculate min and max reps for radius scaling
  const { minReps, maxReps } = useMemo(() => {
    if (chartData.length === 0) return { minReps: 1, maxReps: 1 }
    const repsValues = chartData.map((d) => d.reps)
    const min = Math.min(...repsValues)
    const max = Math.max(...repsValues)
    return { minReps: min, maxReps: max }
  }, [chartData])

  // Calculate radius based on reps, capping the range at 12
  const getRadius = (reps: number) => {
    const range = Math.min(maxReps - minReps, 12)
    if (range === 0) return 8 // If all reps are the same, use middle size

    // Clamp the reps to minReps + 12 range
    const clampedReps = Math.min(reps, minReps + 12)

    // Scale from minReps to minReps+12 (or maxReps if smaller) to radius 4-12
    const normalizedReps = (clampedReps - minReps) / range
    return 4 + normalizedReps * 8 // maps to 4-12 range
  }

  const xTickValues = () => {
    const n = data.length
    if (n === 0) return []
    if (n === 1) return [0]
    if (n <= 5) return Array.from({ length: n }, (_, i) => i)
    let ticks
    const last = n - 1
    const mid = Math.round(last / 2) // centered middle

    if (n % 2 == 0) {
      // even number of 4 data points,
      const q1 = Math.floor(last / 4)
      const q3 = Math.floor((3 * last) / 4)
      // 1 2 3 4 5 6 7 8
      // Desired 5 ticks: first, quarter, middle, three-quarters, last
      ticks = [0, q1, q3, last]
    } else {
      const q1 = Math.ceil(last / 4) // bias inward (e.g., 1.5 -> 2)
      const q3 = Math.floor((3 * last) / 4) // bias inward (e.g., 4.5 -> 4)
      // 1 2 3 4 5 6 7 8 9 10
      // Desired 5 ticks: first, quarter, middle, three-quarters, last
      ticks = [0, q1, mid, q3, last]
    }

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

  const yTickValues = () => {
    if (chartData.length === 0) return []

    // Find min and max Y values
    const yValues = chartData.map((d) => d.y)
    const minY = Math.min(...yValues)
    const maxY = Math.max(...yValues)
    const range = maxY - minY

    // Determine step size to have max 6 ticks with minimum 2.5 step
    // Calculate what step would give us ~5-6 ticks
    const idealSteps = 5 // We want 5 intervals = 6 ticks
    let step = Math.ceil(range / idealSteps / 2.5) * 2.5 // Round up to nearest 2.5

    // Ensure minimum step of 2.5
    step = Math.max(2.5, step)

    // Determine rounding factor (use step for rounding)
    const roundingFactor = step

    // Round down to nearest step for min, round up for max
    const minTick = Math.floor(minY / roundingFactor) * roundingFactor
    const maxTick = Math.ceil(maxY / roundingFactor) * roundingFactor

    // Generate ticks in increments
    const ticks: number[] = []
    for (let tick = minTick; tick <= maxTick; tick += step) {
      ticks.push(tick)
    }

    // Ensure we don't exceed 6 ticks
    return ticks.slice(0, 6)
  }

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100] as [number, number]

    const yValues = chartData.map((d) => d.y)
    const minY = Math.min(...yValues)
    const maxY = Math.max(...yValues)
    const range = maxY - minY

    // Use same logic as yTickValues for consistency
    const idealSteps = 5
    const step = Math.max(2.5, Math.ceil(range / idealSteps / 2.5) * 2.5)

    // Round down to nearest step for min, round up for max
    const minDomain = Math.floor(minY / step) * step
    const maxDomain = Math.ceil(maxY / step) * step

    return [minDomain, maxDomain] as [number, number]
  }, [chartData])

  const yFormatter = (value: number) => {
    if (formatYLabel) return formatYLabel(value)

    // Check the step size to determine if we should show decimals
    const yValues = chartData.map((d) => d.y)
    const minY = Math.min(...yValues)
    const maxY = Math.max(...yValues)
    const range = maxY - minY
    const idealSteps = 5
    const step = Math.max(2.5, Math.ceil(range / idealSteps / 2.5) * 2.5)

    // Show decimals only if step is 2.5 and value has decimal
    if (step === 2.5 && value % 1 !== 0) {
      return value.toFixed(1)
    } else {
      return `${Math.round(value)}`
    }
  }

  const boundsLeft = useSharedValue(0)
  const boundsTop = useSharedValue(0)

  return (
    <View style={tw`w-full h-[${CHART_HEIGHT}px]`}>
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={['y']}
        domain={{ x: [0, Math.max(0, data.length - 1)], y: yDomain }}
        domainPadding={{ left: 5, right: 25, top: 20, bottom: 10 }}
        padding={{ left: 0, right: 0, top: 0, bottom: 0 }}
        xAxis={{
          font,
          tickValues: xTickValues(),
          formatXLabel: (v: number) => xFormatter(v),
          labelColor: theme.grayText,
          lineColor: theme.grayBorder,
        }}
        yAxis={[
          {
            font,
            tickValues: yTickValues(),
            formatYLabel: (v: number) => yFormatter(v),
            labelColor: theme.grayText,
            lineColor: theme.grayBorder,
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
              radius={0}
              color={Colors.primary}
              animate={{ type: 'timing', duration: 350 }}
            />
            {currentIndex != null && points.y[currentIndex] ? (
              <Scatter
                points={[points.y[currentIndex]]} // only the active point
                radius={(point) => {
                  // Get reps from chartData for the current index
                  const reps = chartData[currentIndex]?.reps ?? 1
                  return getRadius(reps)
                }}
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
