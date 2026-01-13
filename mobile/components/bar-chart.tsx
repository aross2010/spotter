import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { View, LayoutChangeEvent, PanResponder, Dimensions } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import { GlassView } from 'expo-glass-effect'
import Colors from '../constants/colors'
import useTheme from '../app/hooks/theme'
import tw from '../tw'
import Txt from './text'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withDelay,
} from 'react-native-reanimated'

type BarChartDataItem = { label: string; value: number }

type BarChartProps = {
  data: { [key: string]: number } | BarChartDataItem[]
  barColor?: string
  activeBarColor?: string
  showValues?: boolean
  onScrollEnabledChange?: (enabled: boolean) => void
}

const CHART_HEIGHT = 180
const ANIMATION_DURATION = 1000
const ROUNDED_CORNER = 4
const Y_AXIS_WIDTH = 32
const X_AXIS_HEIGHT = 20
const MIN_BAR_WIDTH = 8
const MAX_BAR_WIDTH = 36
const BAR_GAP = 2
const LONG_PRESS_DELAY = 150
const HORIZONTAL_PADDING = 8

// Animated bar component
function AnimatedBar({
  height,
  width,
  barColor,
  animationDelay = 0,
  shouldAnimate,
  isSelected = false,
}: {
  height: number
  width: number
  barColor: string
  animationDelay?: number
  shouldAnimate: boolean
  isSelected?: boolean
}) {
  // Start at 0 and animate to target height when shouldAnimate becomes true
  const heightAnim = useSharedValue(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (shouldAnimate && !hasAnimated.current) {
      hasAnimated.current = true
      heightAnim.value = withDelay(
        animationDelay,
        withTiming(height, {
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
        })
      )
    }
  }, [shouldAnimate, height, animationDelay])

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightAnim.value,
  }))

  return (
    <Animated.View
      style={[
        {
          width,
          backgroundColor: barColor,
          borderTopLeftRadius: ROUNDED_CORNER,
          borderTopRightRadius: ROUNDED_CORNER,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          opacity: isSelected ? 1 : 0.85,
          transform: [{ scaleX: isSelected ? 1.05 : 1 }],
        },
        animatedStyle,
      ]}
    />
  )
}

const BarChart = ({
  data,
  barColor = Colors.primary,
  activeBarColor = Colors.secondary,
  showValues = true,
  onScrollEnabledChange,
}: BarChartProps) => {
  const { colorScheme, theme } = useTheme()
  const isFocused = useIsFocused()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [chartWidth, setChartWidth] = useState(0)
  const [hasBeenViewed, setHasBeenViewed] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isLongPressActive = useRef(false)
  const barsContainerRef = useRef<View>(null)
  const barsContainerX = useRef<number>(0)
  const chartViewRef = useRef<View>(null)
  const screenHeight = Dimensions.get('window').height
  const tooltipLeft = useSharedValue(0)
  const tooltipOpacity = useSharedValue(0)

  // Convert data to array - if already array, use as-is, otherwise convert object
  const dataArray = useMemo(() => {
    if (Array.isArray(data)) {
      return data
    }
    return Object.entries(data).map(([label, value]) => ({ label, value }))
  }, [data])

  // Calculate dynamic bar width to span full chart width (minus padding)
  const barWidth = useMemo(() => {
    if (chartWidth === 0 || dataArray.length === 0) return MAX_BAR_WIDTH
    // Calculate width so bars + gaps fill the chart width minus horizontal padding
    const totalGaps = (dataArray.length - 1) * BAR_GAP
    const availableForBars = chartWidth - totalGaps - HORIZONTAL_PADDING * 2
    const calculatedWidth = availableForBars / dataArray.length
    return Math.max(MIN_BAR_WIDTH, calculatedWidth)
  }, [chartWidth, dataArray.length])

  // Check if chart is visible on screen and trigger animation
  const checkVisibilityAndAnimate = useCallback(() => {
    if (hasBeenViewed || !chartViewRef.current) return

    chartViewRef.current.measureInWindow((x, y, width, height) => {
      // Trigger animation when chart is at least 30% up from the bottom of the screen
      // This ensures users see the animation as they naturally scroll
      const visibilityThreshold = screenHeight * 0.7
      const isVisible = y < visibilityThreshold && y + height > 0
      if (isVisible) {
        setHasBeenViewed(true)
      }
    })
  }, [hasBeenViewed, screenHeight])

  // Check visibility when layout happens or periodically while focused
  useEffect(() => {
    if (!isFocused || hasBeenViewed || chartWidth === 0) return

    // Check immediately
    checkVisibilityAndAnimate()

    // Also set up an interval to check periodically (handles scroll into view)
    const interval = setInterval(checkVisibilityAndAnimate, 100)

    return () => clearInterval(interval)
  }, [isFocused, hasBeenViewed, chartWidth, checkVisibilityAndAnimate])

  // Calculate which bar index is at a given pageX position
  const getBarIndexAtPosition = useCallback(
    (pageX: number) => {
      if (chartWidth === 0 || dataArray.length === 0) return null

      // Calculate x position relative to the bars container
      // barsContainerX is the left edge of the bars container (which has padding)
      // Inside the container, bars start immediately (padding is part of container)
      const relativeX = pageX - barsContainerX.current - HORIZONTAL_PADDING

      if (relativeX < 0) return 0

      // Each bar takes barWidth, and gaps are between bars (not after the last one)
      const barPlusGap = barWidth + BAR_GAP
      const index = Math.floor(relativeX / barPlusGap)

      if (index < 0) return 0
      if (index >= dataArray.length) return dataArray.length - 1
      return index
    },
    [chartWidth, barWidth, dataArray.length]
  )

  // Store the initial touch position for accurate tracking
  const initialTouchX = useRef<number>(0)

  // Pan responder for continuous touch tracking
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Always want to handle touches in this area
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => isLongPressActive.current,
        // Capture moves when long press is active to prevent scroll from taking over
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: () => isLongPressActive.current,
        // Don't let go of the gesture once we have it during long press
        onPanResponderTerminationRequest: () => !isLongPressActive.current,
        onPanResponderGrant: (evt) => {
          // Store initial touch position (use pageX for absolute positioning)
          initialTouchX.current = evt.nativeEvent.pageX
          // Start long press timer
          longPressTimer.current = setTimeout(() => {
            isLongPressActive.current = true
            onScrollEnabledChange?.(false) // Disable parent scroll
            const index = getBarIndexAtPosition(initialTouchX.current)
            setSelectedIndex(index)
          }, LONG_PRESS_DELAY)
        },
        onPanResponderMove: (evt) => {
          // If long press is active, update the selected bar as finger moves
          if (isLongPressActive.current) {
            const pageX = evt.nativeEvent.pageX
            const index = getBarIndexAtPosition(pageX)
            setSelectedIndex(index)
          } else {
            // If moved before long press activated, cancel the timer to allow scroll
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current)
              longPressTimer.current = null
            }
          }
        },
        onPanResponderRelease: () => {
          // Clear timer and reset state
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
          }
          if (isLongPressActive.current) {
            onScrollEnabledChange?.(true) // Re-enable parent scroll
          }
          isLongPressActive.current = false
          setSelectedIndex(null)
        },
        onPanResponderTerminate: () => {
          // Clear timer and reset state
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
          }
          if (isLongPressActive.current) {
            onScrollEnabledChange?.(true) // Re-enable parent scroll
          }
          isLongPressActive.current = false
          setSelectedIndex(null)
        },
      }),
    [getBarIndexAtPosition, onScrollEnabledChange]
  )

  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    const max = Math.max(...dataArray.map((d) => d.value))
    return max || 1
  }, [dataArray])

  // Generate Y-axis labels (4-5 nice round numbers)
  const yAxisLabels = useMemo(() => {
    if (maxValue === 0) return [0]

    // Find a nice step size
    const rawStep = maxValue / 4
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
    const normalizedStep = rawStep / magnitude

    let step: number
    if (normalizedStep <= 1) step = magnitude
    else if (normalizedStep <= 2) step = 2 * magnitude
    else if (normalizedStep <= 5) step = 5 * magnitude
    else step = 10 * magnitude

    const labels: number[] = []
    for (let i = 0; i <= Math.ceil(maxValue / step); i++) {
      labels.push(i * step)
    }

    return labels
  }, [maxValue])

  const yAxisMax = yAxisLabels[yAxisLabels.length - 1] || maxValue

  // Format Y-axis label to be compact
  const formatYLabel = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
    }
    return value.toString()
  }

  const handleLayout = (e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width)
    // Check visibility when layout happens
    checkVisibilityAndAnimate()
  }

  // Measure the bars container position when it mounts
  const handleBarsLayout = useCallback(() => {
    if (barsContainerRef.current) {
      barsContainerRef.current.measureInWindow((x) => {
        barsContainerX.current = x
      })
    }
  }, [])

  const selectedItem = selectedIndex !== null ? dataArray[selectedIndex] : null

  // Calculate tooltip position based on selected bar
  const getTooltipPosition = useCallback(
    (index: number) => {
      // Account for horizontal padding when calculating bar center
      const barCenterX =
        HORIZONTAL_PADDING + index * (barWidth + BAR_GAP) + barWidth / 2

      // Position tooltip centered above bar, but keep within bounds
      const tooltipWidth = 80
      let left = barCenterX - tooltipWidth / 2

      // Keep tooltip within chart bounds
      if (left < 0) left = 0
      if (left + tooltipWidth > chartWidth) left = chartWidth - tooltipWidth

      return left
    },
    [chartWidth, barWidth]
  )

  // Animate tooltip position when selectedIndex changes
  useEffect(() => {
    if (selectedIndex !== null) {
      const targetLeft = getTooltipPosition(selectedIndex)
      if (!showTooltip) {
        // First selection - jump immediately and fade in
        tooltipLeft.value = targetLeft
        tooltipOpacity.value = withTiming(1, { duration: 150 })
        setShowTooltip(true)
      } else {
        // Subsequent selections - animate position
        tooltipLeft.value = withTiming(targetLeft, {
          duration: 150,
          easing: Easing.out(Easing.cubic),
        })
      }
    } else {
      // Deselected - fade out
      tooltipOpacity.value = withTiming(0, { duration: 150 })
      setShowTooltip(false)
    }
  }, [selectedIndex, getTooltipPosition, showTooltip])

  // Animated style for tooltip
  const tooltipAnimatedStyle = useAnimatedStyle(() => ({
    left: tooltipLeft.value,
    opacity: tooltipOpacity.value,
  }))

  return (
    <View
      ref={chartViewRef}
      style={tw`w-full`}
    >
      {/* Chart container */}
      <View style={tw`flex-row`}>
        {/* Y-axis labels */}
        <View
          style={[
            { width: Y_AXIS_WIDTH, height: CHART_HEIGHT },
            tw`justify-between items-end pr-1`,
          ]}
        >
          {[...yAxisLabels].reverse().map((label, index) => (
            <Txt
              key={index}
              twcn="text-[10px] text-light-grayText dark:text-dark-grayText"
            >
              {formatYLabel(label)}
            </Txt>
          ))}
        </View>

        {/* Chart area with pan responder for continuous touch tracking */}
        <View
          style={tw`flex-1 relative`}
          onLayout={handleLayout}
          {...panResponder.panHandlers}
        >
          {/* Horizontal grid lines */}
          <View style={[tw`absolute inset-0`, { height: CHART_HEIGHT }]}>
            {yAxisLabels.map((_, index) => {
              const position = (index / (yAxisLabels.length - 1)) * CHART_HEIGHT
              return (
                <View
                  key={index}
                  style={{
                    position: 'absolute',
                    bottom: position,
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: Colors[colorScheme].grayBorder,
                    opacity: 0.5,
                  }}
                />
              )
            })}
          </View>

          {/* Bars */}
          <View
            ref={barsContainerRef}
            onLayout={handleBarsLayout}
            style={[
              tw`flex-row items-end`,
              {
                height: CHART_HEIGHT,
                gap: BAR_GAP,
                paddingHorizontal: HORIZONTAL_PADDING,
              },
            ]}
          >
            {dataArray.map((item, index) => {
              const barHeight =
                item.value > 0 ? (item.value / yAxisMax) * CHART_HEIGHT : 0
              const isSelected = selectedIndex === index

              return (
                <View
                  key={item.label}
                  style={[tw`items-center`, { width: barWidth }]}
                >
                  {item.value > 0 ? (
                    <AnimatedBar
                      height={barHeight}
                      width={barWidth}
                      barColor={isSelected ? activeBarColor : barColor}
                      animationDelay={index * 30}
                      shouldAnimate={hasBeenViewed}
                      isSelected={isSelected}
                    />
                  ) : (
                    <View
                      style={[
                        {
                          width: barWidth,
                          height: 4,
                          backgroundColor: isSelected
                            ? activeBarColor
                            : Colors[colorScheme].grayBorder,
                          borderRadius: 2,
                          opacity: isSelected ? 1 : 0.3,
                        },
                      ]}
                    />
                  )}
                </View>
              )
            })}
          </View>

          {/* Tooltip */}
          {showTooltip && selectedItem && (
            <Animated.View
              style={[
                tw`absolute`,
                {
                  top: 8,
                  zIndex: 10,
                },
                tooltipAnimatedStyle,
              ]}
            >
              <GlassView
                style={[
                  tw`p-2 rounded-2xl shadow-md`,
                  {
                    minWidth: 80,
                  },
                ]}
              >
                <Txt twcn="text-light-grayText dark:text-dark-grayText text-xs text-center">
                  {selectedItem.label}
                </Txt>
                <View
                  style={tw`flex-row items-center justify-center gap-1 mt-1`}
                >
                  <View
                    style={[
                      tw`w-2 h-2 rounded-full`,
                      { backgroundColor: activeBarColor },
                    ]}
                  />
                  <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
                    {selectedItem.value}
                  </Txt>
                </View>
              </GlassView>
            </Animated.View>
          )}
        </View>
      </View>

      {/* X-axis labels */}
      <View style={tw`flex-row`}>
        {/* Spacer for Y-axis */}
        <View style={{ width: Y_AXIS_WIDTH }} />

        {/* X-axis label area */}
        <View
          style={[
            tw`flex-1 flex-row`,
            {
              height: X_AXIS_HEIGHT,
              gap: BAR_GAP,
              paddingHorizontal: HORIZONTAL_PADDING,
            },
          ]}
        >
          {dataArray.map((item, index) => {
            // Show every label if few items, otherwise show every nth label
            const showLabel =
              dataArray.length <= 12 ||
              index === 0 ||
              index === dataArray.length - 1 ||
              index % Math.ceil(dataArray.length / 10) === 0

            return (
              <View
                key={item.label}
                style={[tw`items-center justify-start`, { width: barWidth }]}
              >
                <Txt
                  twcn="text-[10px] text-light-grayText dark:text-dark-grayText"
                  numberOfLines={1}
                >
                  {showLabel ? item.label.substring(0, 3) : ''}
                </Txt>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

export default BarChart
