import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { View, Pressable, LayoutChangeEvent } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import { GlassView } from 'expo-glass-effect'
import Colors from '../constants/colors'
import useTheme from '../app/hooks/theme'
import tw from '../tw'
import Txt from './text'
import Button from './button'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withDelay,
} from 'react-native-reanimated'
import SFIcon from './sf-icon'

type StackedBarDataPoint = {
  label: string
  primary: number
  secondary: number
}

type StackedBarChartProps = {
  data: StackedBarDataPoint[]
  primaryColor?: string
  secondaryColor?: string
  primaryLabel?: string
  secondaryLabel?: string
  initialVisibleCount?: number
  onExpand?: (expanded: boolean) => void
}

const BAR_HEIGHT = 20
const BAR_GAP = 6
const LABEL_WIDTH = 85
const ANIMATION_DURATION = 1000
const ROUNDED_CORNER = 6
const EMPTY_BAR_WIDTH = 10

// Helper to capitalize first letter of each word
const capitalizeLabel = (label: string) => {
  return label
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Animated bar using React Native Views
function AnimatedStackedBar({
  primaryWidth,
  secondaryWidth,
  primaryColor,
  secondaryColor,
  hasPrimary,
  hasSecondary,
  emptyColor,
  animationDelay = 0,
  shouldAnimate,
}: {
  primaryWidth: number
  secondaryWidth: number
  primaryColor: string
  secondaryColor: string
  hasPrimary: boolean
  hasSecondary: boolean
  emptyColor: string
  animationDelay?: number
  shouldAnimate: boolean
}) {
  const primaryAnim = useSharedValue(shouldAnimate ? 0 : primaryWidth)
  const secondaryAnim = useSharedValue(shouldAnimate ? 0 : secondaryWidth)
  const hasAnimated = useRef(false)

  useEffect(() => {
    // Only animate once when shouldAnimate becomes true
    if (shouldAnimate && !hasAnimated.current) {
      hasAnimated.current = true

      // Animate primary first
      if (hasPrimary) {
        primaryAnim.value = withDelay(
          animationDelay,
          withTiming(primaryWidth, {
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic),
          })
        )
      }

      // Secondary flows from primary
      if (hasSecondary) {
        const delay = hasPrimary
          ? animationDelay + ANIMATION_DURATION * 0.6
          : animationDelay
        secondaryAnim.value = withDelay(
          delay,
          withTiming(secondaryWidth, {
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic),
          })
        )
      }
    }
  }, [shouldAnimate])

  const primaryStyle = useAnimatedStyle(() => ({
    width: primaryAnim.value,
  }))

  const secondaryStyle = useAnimatedStyle(() => ({
    width: secondaryAnim.value,
  }))

  // Empty state
  if (!hasPrimary && !hasSecondary) {
    return (
      <View
        style={[
          tw`h-full rounded-md`,
          { width: EMPTY_BAR_WIDTH, backgroundColor: emptyColor, opacity: 0.3 },
        ]}
      />
    )
  }

  // Only primary - fully rounded on right side only
  if (hasPrimary && !hasSecondary) {
    return (
      <Animated.View
        style={[
          tw`h-full`,
          {
            backgroundColor: primaryColor,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderTopRightRadius: ROUNDED_CORNER,
            borderBottomRightRadius: ROUNDED_CORNER,
          },
          primaryStyle,
        ]}
      />
    )
  }

  // Only secondary - rounded on right side only
  if (!hasPrimary && hasSecondary) {
    return (
      <Animated.View
        style={[
          tw`h-full`,
          {
            backgroundColor: secondaryColor,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderTopRightRadius: ROUNDED_CORNER,
            borderBottomRightRadius: ROUNDED_CORNER,
          },
          secondaryStyle,
        ]}
      />
    )
  }

  // Both primary and secondary
  return (
    <View style={tw`flex-row h-full`}>
      {/* Primary - no rounded corners (flat on both sides) */}
      <Animated.View
        style={[
          tw`h-full`,
          {
            backgroundColor: primaryColor,
            borderRadius: 0,
          },
          primaryStyle,
        ]}
      />
      {/* Secondary - right rounded only */}
      <Animated.View
        style={[
          tw`h-full`,
          {
            backgroundColor: secondaryColor,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderTopRightRadius: ROUNDED_CORNER,
            borderBottomRightRadius: ROUNDED_CORNER,
          },
          secondaryStyle,
        ]}
      />
    </View>
  )
}

const StackedBarChart = ({
  data,
  primaryColor = Colors.primary,
  secondaryColor = Colors.secondary,
  primaryLabel = 'Primary',
  secondaryLabel = 'Secondary',
  initialVisibleCount = 5,
  onExpand,
}: StackedBarChartProps) => {
  const { colorScheme, theme } = useTheme()
  const isFocused = useIsFocused()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [chartWidth, setChartWidth] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [hasBeenViewed, setHasBeenViewed] = useState(false)
  const expandAnimation = useSharedValue(0)

  // Track when the screen is first focused (actually viewed)
  useEffect(() => {
    if (isFocused && chartWidth > 0 && !hasBeenViewed) {
      setHasBeenViewed(true)
    }
  }, [isFocused, chartWidth, hasBeenViewed])

  // Sort data by total (primary + secondary) descending
  const sortedData = useMemo(() => {
    return [...data].sort(
      (a, b) => b.primary + b.secondary - (a.primary + a.secondary)
    )
  }, [data])

  const hasMoreData = sortedData.length > initialVisibleCount

  // Calculate heights
  const collapsedHeight =
    Math.min(sortedData.length, initialVisibleCount) * (BAR_HEIGHT + BAR_GAP) -
    BAR_GAP
  const expandedHeight = sortedData.length * (BAR_HEIGHT + BAR_GAP) - BAR_GAP

  // Calculate max value for scaling (use all data for consistent scaling)
  const maxValue = useMemo(() => {
    const max = Math.max(...sortedData.map((d) => d.primary + d.secondary))
    return max || 1
  }, [sortedData])

  const handleLayout = (e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width)
  }

  const handleBarPress = (index: number) => {
    // Only allow selection of visible bars
    const visibleCount = expanded ? sortedData.length : initialVisibleCount
    if (index >= visibleCount) return

    if (selectedIndex === index) {
      setSelectedIndex(null)
    } else {
      setSelectedIndex(index)
    }
  }

  const handleExpandToggle = () => {
    const newExpanded = !expanded
    setExpanded(newExpanded)
    expandAnimation.value = withTiming(newExpanded ? 1 : 0, {
      duration: 400,
      easing: Easing.inOut(Easing.cubic),
    })
    // Clear selection when collapsing if selected item will be hidden
    if (
      !newExpanded &&
      selectedIndex !== null &&
      selectedIndex >= initialVisibleCount
    ) {
      setSelectedIndex(null)
    }
    // Notify parent of expand state change
    onExpand?.(newExpanded)
  }

  const selectedItem = selectedIndex !== null ? sortedData[selectedIndex] : null

  // Animated container style
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const height =
      collapsedHeight +
      (expandedHeight - collapsedHeight) * expandAnimation.value
    return {
      height,
      overflow: 'hidden',
    }
  })

  // Tooltip height is approximately 48px
  const TOOLTIP_HEIGHT = 48

  // Calculate tooltip position based on selected bar
  // For first couple bars, show below; for rest, show above
  const getTooltipPosition = useCallback((index: number) => {
    const barTop = index * (BAR_HEIGHT + BAR_GAP)
    const positionAbove = barTop - TOOLTIP_HEIGHT - 4 // 4px gap above bar

    // If not enough space above, position below the bar
    if (positionAbove < 0) {
      return barTop + BAR_HEIGHT + 4 // 4px gap below bar
    }
    return positionAbove
  }, [])

  return (
    <View style={tw`w-full`}>
      {/* Chart with labels */}
      <View style={tw`flex-row`}>
        {/* Y-axis labels (muscle group names) */}
        <Animated.View style={[{ width: LABEL_WIDTH }, containerAnimatedStyle]}>
          {sortedData.map((item, index) => (
            <Pressable
              key={item.label}
              onLongPress={() => handleBarPress(index)}
              delayLongPress={150}
              style={[
                tw`justify-center pr-1`,
                {
                  height: BAR_HEIGHT,
                  marginBottom: index < sortedData.length - 1 ? BAR_GAP : 0,
                },
              ]}
            >
              <Txt
                twcn="text-xs text-light-grayText dark:text-dark-grayText"
                numberOfLines={1}
              >
                {capitalizeLabel(item.label)}
              </Txt>
            </Pressable>
          ))}
        </Animated.View>

        {/* Bars and tooltips container */}
        <View
          style={tw`flex-1 relative`}
          onLayout={handleLayout}
        >
          {/* Horizontal grid lines behind bars */}
          <Animated.View style={[tw`absolute inset-0`, containerAnimatedStyle]}>
            {sortedData.map((item, index) => (
              <View
                key={`grid-${item.label}`}
                style={{
                  height: BAR_HEIGHT,
                  marginBottom: index < sortedData.length - 1 ? BAR_GAP : 0,
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    height: 1,
                    backgroundColor: Colors[colorScheme].grayBorder,
                    opacity: 0.5,
                  }}
                />
              </View>
            ))}
          </Animated.View>

          <Animated.View style={containerAnimatedStyle}>
            {sortedData.map((item, index) => {
              const total = item.primary + item.secondary
              const primaryWidth =
                total > 0 ? (item.primary / maxValue) * chartWidth : 0
              const secondaryWidth =
                total > 0 ? (item.secondary / maxValue) * chartWidth : 0

              // Determine if this bar should animate
              // Initial bars animate when chart is first viewed (focused)
              // Hidden bars animate when expanded
              const isInitiallyVisible = index < initialVisibleCount
              const shouldAnimate = isInitiallyVisible
                ? hasBeenViewed
                : expanded

              return (
                <Pressable
                  key={item.label}
                  onLongPress={() => handleBarPress(index)}
                  onPressOut={() => setSelectedIndex(null)}
                  delayLongPress={150}
                  style={{
                    height: BAR_HEIGHT,
                    marginBottom: index < sortedData.length - 1 ? BAR_GAP : 0,
                  }}
                >
                  <AnimatedStackedBar
                    primaryWidth={primaryWidth}
                    secondaryWidth={secondaryWidth}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    hasPrimary={item.primary > 0}
                    hasSecondary={item.secondary > 0}
                    emptyColor={Colors[colorScheme].grayBorder}
                    animationDelay={
                      isInitiallyVisible
                        ? index * 40
                        : (index - initialVisibleCount) * 40
                    }
                    shouldAnimate={shouldAnimate}
                  />
                </Pressable>
              )
            })}
          </Animated.View>

          {/* Tooltip - positioned above or below the bar */}
          {selectedItem && selectedIndex !== null && (
            <GlassView
              style={[
                tw`absolute left-2 p-2 rounded-2xl shadow-md`,
                {
                  top: getTooltipPosition(selectedIndex),
                  zIndex: 10,
                  minWidth: 120,
                },
              ]}
            >
              <Txt twcn="text-light-grayText dark:text-dark-grayText text-xs">
                {capitalizeLabel(selectedItem.label)}
              </Txt>
              <View style={tw`gap-1 mt-2`}>
                <View style={tw`flex-row items-center gap-1`}>
                  <View
                    style={[
                      tw`w-2 h-2 rounded-full`,
                      { backgroundColor: primaryColor },
                    ]}
                  />
                  <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
                    {selectedItem.primary} sets as primary
                  </Txt>
                </View>
                <View style={tw`flex-row items-center gap-1`}>
                  <View
                    style={[
                      tw`w-2 h-2 rounded-full`,
                      { backgroundColor: secondaryColor },
                    ]}
                  />
                  <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
                    {selectedItem.secondary} sets as secondary
                  </Txt>
                </View>
              </View>
            </GlassView>
          )}
        </View>
      </View>

      {/* Show more/less button */}
      {hasMoreData && (
        <Button
          onPress={handleExpandToggle}
          twcn="mt-4 self-center w-full flex-row items-center justify-center"
        >
          <SFIcon
            name={expanded ? 'chevron.up' : 'chevron.down'}
            size={18}
            color={theme.grayText}
          />
        </Button>
      )}
    </View>
  )
}

export default StackedBarChart
