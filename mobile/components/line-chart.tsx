import React, {
  ReactNode,
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from 'react'
import { View, Dimensions } from 'react-native'
import {
  CartesianChart,
  useLinePath,
  useAreaPath,
  useChartPressState,
  type PointsArray,
} from 'victory-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useFont, Path, Circle, Group, rect } from '@shopify/react-native-skia'
import Colors from '../constants/colors'
import useTheme from '../app/hooks/theme'
import tw from '../tw'
import { Poppins_400Regular } from '@expo-google-fonts/poppins'
import { useIsFocused } from '@react-navigation/native'
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  useDerivedValue,
  SharedValue,
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'

type DataPoint = Record<string, any>

type LineChartProps = {
  data: DataPoint[] // if data greater than 100, make it scrollable
  xKey: string
  yKey: string
  chartHeight?: number
  formatXLabel?: (value: any, index: number) => string
  formatYLabel?: (value: number) => string
  maxXLabels?: number // kept for compatibility; we'll force 5 regardless
  toolTips?: ReactNode[] // match len of data
  longPressMs?: number // how long to hold before activating tooltip (default 150ms)
  onScrollEnabledChange?: (enabled: boolean) => void
}

const ANIMATION_DURATION = 2000

// Animated Line component with draw effect
function AnimatedLine({
  points,
  progress,
}: {
  points: PointsArray
  progress: SharedValue<number>
}) {
  const { path } = useLinePath(points, { curveType: 'linear' })

  // Animate the stroke end to create a "drawing" effect
  const end = useDerivedValue(() => progress.value)

  return (
    <Path
      path={path}
      style="stroke"
      color={Colors.primary}
      strokeWidth={1.5}
      start={0}
      end={end}
    />
  )
}

// Animated Area component - reveals as line draws using clip rect synced to points
function AnimatedArea({
  points,
  y0,
  progress,
}: {
  points: PointsArray
  y0: number
  progress: SharedValue<number>
}) {
  const { path } = useAreaPath(points, y0, { curveType: 'linear' })

  // Calculate clip rect based on actual point positions
  const clip = useDerivedValue(() => {
    if (points.length === 0) return rect(0, 0, 0, 0)

    const firstX = points[0]?.x ?? 0
    const lastX = points[points.length - 1]?.x ?? 0
    const totalWidth = lastX - firstX
    const currentWidth = totalWidth * progress.value

    // Clip from the start of the first point to the current progress position
    return rect(firstX, 0, currentWidth, y0 + 100)
  })

  return (
    <Group clip={clip}>
      <Path
        path={path}
        style="fill"
        color={Colors.primary}
        opacity={0.1}
      />
    </Group>
  )
}

function ActivePoint({
  points,
  currentIndex,
  radius,
}: {
  points: PointsArray
  currentIndex: number | null
  radius: number
}) {
  const animatedX = useSharedValue(0)
  const animatedY = useSharedValue(0)
  const isFirstTouch = useSharedValue(true)
  const isReady = useSharedValue(false)

  // When index changes, update position
  useAnimatedReaction(
    () => currentIndex,
    (index, prevIndex) => {
      if (index == null || !points[index]) {
        isReady.value = false
        return
      }

      const p = points[index]
      if (p.x == null || p.y == null) {
        isReady.value = false
        return
      }

      // First update of a gesture: jump instantly AND only then mark ready
      if (isFirstTouch.value || prevIndex == null) {
        animatedX.value = p.x
        animatedY.value = p.y
        isFirstTouch.value = false
        isReady.value = true
      } else {
        // Subsequent moves: keep it visible and animate
        isReady.value = true
        animatedX.value = withTiming(p.x, {
          duration: 350,
          easing: Easing.out(Easing.cubic),
        })
        animatedY.value = withTiming(p.y, {
          duration: 350,
          easing: Easing.out(Easing.cubic),
        })
      }
    },
    [points],
  )

  // Reset on finger lift
  useAnimatedReaction(
    () => currentIndex,
    (index) => {
      if (index == null) {
        isFirstTouch.value = true
        isReady.value = false
      }
    },
    [],
  )

  const cx = useDerivedValue(() => animatedX.value)
  const cy = useDerivedValue(() => animatedY.value)

  // IMPORTANT: gate render on isReady so it can't flash old coords
  if (currentIndex == null || !points[currentIndex]) return null
  if (!isReady.value) return null // <- prevents the 1-frame flash

  return (
    <Circle
      cx={cx}
      cy={cy}
      r={radius}
      color={Colors.primary}
    />
  )
}

const LineChart = ({
  data,
  xKey,
  yKey,
  chartHeight = 225,
  formatXLabel,
  formatYLabel,
  toolTips,
  longPressMs = 150,
  onScrollEnabledChange,
}: LineChartProps) => {
  const { theme } = useTheme()
  const isFocused = useIsFocused()
  const font = useFont(Poppins_400Regular, 10)
  const { state: press, isActive } = useChartPressState({ x: 0, y: { y: 0 } })
  const chartWidth = useSharedValue(0)

  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const tooltipX = useSharedValue<number | null>(null)
  const tooltipY = useSharedValue<number | null>(null)
  const xPositions = useSharedValue<number[]>([])
  const yPositions = useSharedValue<number[]>([])
  const nPoints = useSharedValue(0)
  const xRangeMin = useSharedValue(0)
  const activeIdx = useSharedValue(-1)

  const dotX = useSharedValue(0)
  const dotY = useSharedValue(0)
  const dotVisible = useSharedValue(0) // 0/1
  const dotWasActive = useSharedValue(false)
  const wasActive = useSharedValue(false)
  const chartViewRef = useRef<View>(null)
  const chartViewLeft = useSharedValue(0) // Screen X position of the chart view
  const screenHeight = Dimensions.get('window').height
  const [hasBeenViewed, setHasBeenViewed] = useState(false)
  const [chartReady, setChartReady] = useState(false)
  const pointsRef = useRef<PointsArray>([])
  const boundsLeft = useSharedValue(0)
  const boundsTop = useSharedValue(0)
  const rawTouchX = useSharedValue(0) // Raw touch X from our gesture handler
  const isGestureActive = useSharedValue(false)
  const dotCx = useDerivedValue(() => dotX.value)
  const dotCy = useDerivedValue(() => dotY.value)
  const dotR = useDerivedValue(() => (dotVisible.value ? 8 : 0))

  // Animation progress for drawing the line (0 to 1)
  const drawProgress = useSharedValue(0)

  // Check if chart is visible on screen and trigger animation
  const checkVisibilityAndAnimate = useCallback(() => {
    if (hasBeenViewed || !chartViewRef.current) return

    chartViewRef.current.measureInWindow((x, y, width, height) => {
      // Store the chart's screen X position for touch coordinate adjustment
      chartViewLeft.value = x
      // Trigger animation when chart is at least 15% up from the bottom of the screen
      const visibilityThreshold = screenHeight * 0.85
      const isVisible = y < visibilityThreshold && y + height > 0
      if (isVisible) {
        setHasBeenViewed(true)
      }
    })
  }, [hasBeenViewed, screenHeight])

  // Check visibility periodically while focused
  useEffect(() => {
    if (!isFocused || hasBeenViewed || !chartReady) return

    // Check immediately
    checkVisibilityAndAnimate()

    // Also set up an interval to check periodically (handles scroll into view)
    const interval = setInterval(checkVisibilityAndAnimate, 100)

    return () => clearInterval(interval)
  }, [isFocused, hasBeenViewed, chartReady, checkVisibilityAndAnimate])

  // Trigger draw animation when visibility is confirmed
  useEffect(() => {
    if (hasBeenViewed && data.length > 0) {
      drawProgress.value = 0
      drawProgress.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    }
  }, [hasBeenViewed, data])

  // Measure chart view position when chart is ready (for touch coordinate adjustment)
  useEffect(() => {
    if (!chartReady || !chartViewRef.current) return

    // Small delay to ensure layout is complete
    const timer = setTimeout(() => {
      chartViewRef.current?.measureInWindow((x) => {
        chartViewLeft.value = x
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [chartReady])

  // Find nearest point index based on touch pixel position (JS thread)
  const handleFindNearestIndex = useCallback((touchX: number) => {
    const points = pointsRef.current
    if (points.length === 0) {
      setCurrentIndex(null)
      return
    }

    let nearestIndex = 0
    let minDistance = Infinity

    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      if (point.x == null) continue
      const distance = Math.abs(point.x - touchX)
      if (distance < minDistance) {
        minDistance = distance
        nearestIndex = i
      }
    }

    setCurrentIndex(nearestIndex)
  }, [])

  // Simple: Pan gesture that only activates after holding for longPressMs
  // If user scrolls before that, gesture never activates and scroll works
  const hasActivated = useSharedValue(false)

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(longPressMs)
    .onStart((e) => {
      'worklet'
      hasActivated.value = true
      isGestureActive.value = true
      rawTouchX.value = e.x
    })
    .onUpdate((e) => {
      'worklet'
      if (hasActivated.value) {
        rawTouchX.value = e.x
      }
    })
    .onEnd(() => {
      'worklet'
      hasActivated.value = false
      isGestureActive.value = false
    })
    .onFinalize(() => {
      'worklet'
      hasActivated.value = false
      isGestureActive.value = false
    })

  // Use our raw touch position to find the nearest point
  useAnimatedReaction(
    () => ({
      active: isGestureActive.value,
      touchX: rawTouchX.value,
    }),
    ({ active, touchX }) => {
      if (!active || nPoints.value === 0) {
        dotVisible.value = 0
        dotWasActive.value = false
        activeIdx.value = -1
        runOnJS(setShowTooltip)(false)
        runOnJS(setCurrentIndex)(null)
        return
      }

      dotVisible.value = 1
      runOnJS(setShowTooltip)(true)

      const xs = xPositions.value
      const ys = yPositions.value

      // Find nearest point by comparing raw touch X to rendered point positions
      // Both are in the same coordinate space (relative to chart view)
      let idx = 0
      let minDist = Infinity
      for (let i = 0; i < xs.length; i++) {
        const dist = Math.abs(xs[i] - touchX)
        if (dist < minDist) {
          minDist = dist
          idx = i
        }
      }

      activeIdx.value = idx
      runOnJS(setCurrentIndex)(idx)

      const targetX = xs[idx]
      const targetY = ys[idx]

      if (!dotWasActive.value) {
        dotX.value = targetX
        dotY.value = targetY
        dotWasActive.value = true
      } else {
        dotX.value = withTiming(targetX, {
          duration: 350,
          easing: Easing.out(Easing.cubic),
        })
        dotY.value = withTiming(targetY, {
          duration: 350,
          easing: Easing.out(Easing.cubic),
        })
      }
    },
    [],
  )

  useAnimatedReaction(
    () => ({
      visible: dotVisible.value,
      x: dotX.value,
      y: dotY.value,
    }),
    ({ visible, x, y }) => {
      if (!visible) {
        tooltipX.value = null
        tooltipY.value = null
        return
      }

      // Tooltip follows the snapped dot exactly
      tooltipX.value = x
      tooltipY.value = y
    },
    [],
  )

  const currentIndexSV = useSharedValue(-1)

  useEffect(() => {
    currentIndexSV.value = currentIndex ?? -1
  }, [currentIndex])

  // Control parent scroll when tooltip is showing
  useEffect(() => {
    onScrollEnabledChange?.(!showTooltip)
  }, [showTooltip, onScrollEnabledChange])

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

  const chartData = useMemo(() => {
    if (data.length === 0) return []

    // Convert x values to timestamps for time-proportional spacing
    const timestamps = data.map((point) => {
      const xValue = point[xKey]
      // Handle various date formats
      if (xValue instanceof Date) return xValue.getTime()
      if (typeof xValue === 'number') return xValue
      // Try parsing as date string
      const parsed = new Date(xValue)
      return isNaN(parsed.getTime()) ? 0 : parsed.getTime()
    })

    const minTime = Math.min(...timestamps)
    const maxTime = Math.max(...timestamps)
    const timeRange = maxTime - minTime

    return data.map((point, index) => {
      // Normalize timestamp to 0-1 range for proportional positioning
      const normalizedX =
        timeRange === 0 ? 0.5 : (timestamps[index] - minTime) / timeRange

      return {
        x: normalizedX,
        y: point[yKey],
        reps: point.reps ?? 1,
        original: point,
        originalIndex: index, // Keep track of original index for tooltip lookup
      }
    })
  }, [data, xKey, yKey])

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
    if (n === 1) return [0.5] // Single point centered

    // Get all normalized x positions
    const positions = chartData.map((d) => d.x)

    // Minimum spacing between labels (as fraction of chart width)
    // ~0.15 means labels need to be at least 15% of chart width apart
    const minSpacing = 0.15

    // Always include first and last
    const selectedTicks: number[] = [positions[0]]
    let lastSelectedX = positions[0]

    // Go through middle points and select those with enough spacing
    for (let i = 1; i < positions.length - 1; i++) {
      const x = positions[i]
      // Check spacing from last selected tick
      if (x - lastSelectedX >= minSpacing) {
        // Also check spacing to the last point (we want to include it)
        const spacingToEnd = positions[positions.length - 1] - x
        if (spacingToEnd >= minSpacing) {
          selectedTicks.push(x)
          lastSelectedX = x
        }
      }
    }

    // Always include the last point if it has enough spacing
    const lastX = positions[positions.length - 1]
    if (lastX - lastSelectedX >= minSpacing || selectedTicks.length === 1) {
      selectedTicks.push(lastX)
    }

    // Limit to max 5 labels to avoid clutter
    if (selectedTicks.length > 5) {
      // Keep first, last, and evenly distributed middle points
      const result = [selectedTicks[0]]
      const step = (selectedTicks.length - 1) / 4
      for (let i = 1; i < 4; i++) {
        result.push(selectedTicks[Math.round(i * step)])
      }
      result.push(selectedTicks[selectedTicks.length - 1])
      return result
    }

    return selectedTicks
  }

  const xFormatter = (value: number) => {
    // Find the data point closest to this normalized x value
    let closestIndex = 0
    let minDist = Infinity

    for (let i = 0; i < chartData.length; i++) {
      const dist = Math.abs(chartData[i].x - value)
      if (dist < minDist) {
        minDist = dist
        closestIndex = i
      }
    }

    // For evenly spaced ticks (0, 0.25, 0.5, 0.75, 1), interpolate the date
    // if no data point is close enough
    if (minDist > 0.05 && data.length > 1) {
      // Interpolate the date based on the normalized position
      const timestamps = data.map((point) => {
        const xValue = point[xKey]
        if (xValue instanceof Date) return xValue.getTime()
        if (typeof xValue === 'number') return xValue
        const parsed = new Date(xValue)
        return isNaN(parsed.getTime()) ? 0 : parsed.getTime()
      })
      const minTime = Math.min(...timestamps)
      const maxTime = Math.max(...timestamps)
      const interpolatedTime = minTime + value * (maxTime - minTime)
      const interpolatedDate = new Date(interpolatedTime)

      if (formatXLabel) {
        // Format the interpolated date
        return formatXLabel(interpolatedDate.toISOString().slice(0, 10), -1)
      }
      return interpolatedDate.toLocaleDateString()
    }

    const raw = data[closestIndex]?.[xKey]
    return formatXLabel ? formatXLabel(raw, closestIndex) : String(raw ?? '')
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

  return (
    <GestureDetector gesture={panGesture}>
      <View
        ref={chartViewRef}
        style={tw`w-full h-[${chartHeight}px]`}
      >
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['y']}
          domain={{ x: [0, 1], y: yDomain }}
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
          onScaleChange={(xScale) => {
            // if this is negative, you get the padded-container offset bug
            xRangeMin.value = xScale.range()[0] ?? 0
          }}
          onChartBoundsChange={(b) => {
            boundsLeft.value = b.left
            boundsTop.value = b.top
            chartWidth.value = b.right - b.left
            if (!chartReady) setChartReady(true)
          }}
        >
          {({ points, chartBounds }) => {
            // Store points for tooltip positioning
            const xs = points.y.map((p) => p.x ?? 0)
            const ys = points.y.map((p) => p.y ?? 0)

            xPositions.value = xs
            yPositions.value = ys
            nPoints.value = xs.length
            pointsRef.current = points.y
            return (
              <>
                <AnimatedArea
                  points={points.y}
                  y0={chartBounds.bottom}
                  progress={drawProgress}
                />
                <AnimatedLine
                  points={points.y}
                  progress={drawProgress}
                />
                <Circle
                  cx={dotCx}
                  cy={dotCy}
                  r={dotR}
                  color={Colors.primary}
                />
              </>
            )
          }}
        </CartesianChart>
        {showTooltip && currentIndex != null && currentIndex < data.length && (
          <Animated.View
            pointerEvents="none"
            style={[{ zIndex: 10 }, tooltipStyle]}
          >
            {toolTips?.[currentIndex] ?? null}
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  )
}

export default LineChart
