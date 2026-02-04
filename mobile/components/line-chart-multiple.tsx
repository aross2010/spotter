import React, { useEffect, useMemo, useRef } from 'react'
import { View, ScrollView } from 'react-native'
import { CartesianChart, useLinePath, type PointsArray } from 'victory-native'
import { Path } from '@shopify/react-native-skia'
import { Link } from 'expo-router'
import { useIsFocused } from '@react-navigation/native'
import Colors from '../constants/colors'
import useTheme from '../app/hooks/theme'
import tw from '../tw'
import Txt from './text'
import {
  Easing,
  useSharedValue,
  withTiming,
  useDerivedValue,
  SharedValue,
} from 'react-native-reanimated'

// Predefined colors for up to 5 lines
const LINE_COLORS = [
  Colors.primary,
  Colors.secondary,
  Colors.blue,
  Colors.green,
  Colors.red,
]

type DataPoint = {
  date: string
  weight: number
}

type LineDataSet = {
  name: string
  exerciseId: string
  graphData: DataPoint[]
}

type LineChartMultipleProps = {
  dataSets: LineDataSet[] // 2-5 data sets
}

const CHART_HEIGHT = 160
const ANIMATION_DURATION = 2500

// Animated Line component with draw effect
function AnimatedLine({
  points,
  progress,
  color,
}: {
  points: PointsArray
  progress: SharedValue<number>
  color: string
}) {
  const { path } = useLinePath(points, { curveType: 'natural' })

  const end = useDerivedValue(() => progress.value)

  return (
    <Path
      path={path}
      style="stroke"
      color={color}
      strokeWidth={1.5}
      start={0}
      end={end}
    />
  )
}

// Normalize a dataset's y values to 0-100 range and x values based on time
function normalizeDataSet(data: DataPoint[]): { x: number; y: number }[] {
  if (data.length === 0) return []

  const yValues = data.map((d) => d.weight)
  const minY = Math.min(...yValues)
  const maxY = Math.max(...yValues)
  const yRange = maxY - minY

  // Convert dates to timestamps for time-proportional spacing
  const timestamps = data.map((d) => new Date(d.date).getTime())
  const minTime = Math.min(...timestamps)
  const maxTime = Math.max(...timestamps)
  const timeRange = maxTime - minTime

  return data.map((point, index) => {
    // Normalize x based on time (0-1 range)
    const normalizedX =
      timeRange === 0 ? 0.5 : (timestamps[index] - minTime) / timeRange

    // Normalize y to 0-100 range (or 50 if all values same)
    const normalizedY =
      yRange === 0 ? 50 : ((point.weight - minY) / yRange) * 100

    return {
      x: normalizedX,
      y: normalizedY,
    }
  })
}

const LineChartMultiple = ({ dataSets }: LineChartMultipleProps) => {
  const { theme } = useTheme()
  const isFocused = useIsFocused()
  const drawProgress = useSharedValue(0)
  const hasAnimated = useRef(false)

  // Build yKeys dynamically
  const yKeys = useMemo(
    () => dataSets.map((_, i) => `y${i}` as const),
    [dataSets.length],
  )

  // Reset animation when datasets change
  useEffect(() => {
    hasAnimated.current = false
  }, [dataSets])

  // Trigger draw animation only when tab is focused and hasn't animated yet
  useEffect(() => {
    if (isFocused && dataSets.length >= 2 && !hasAnimated.current) {
      hasAnimated.current = true
      drawProgress.value = 0
      drawProgress.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      })
    }
  }, [isFocused, dataSets])

  // Normalize all data sets and prepare chart data
  const { chartData, lineInfo } = useMemo(() => {
    // Create combined data array with normalized values for each line
    const maxPoints = Math.max(...dataSets.map((ds) => ds.graphData.length))

    // Normalize each dataset
    const normalizedSets = dataSets.map((ds, dsIndex) => ({
      ...ds,
      normalized: normalizeDataSet(ds.graphData),
      color: LINE_COLORS[dsIndex % LINE_COLORS.length],
    }))

    // Create chart data - sample at time-proportional x positions
    const chartData: Record<string, number>[] = []

    for (let i = 0; i < maxPoints; i++) {
      // Use time-proportional x from the first dataset's normalized values as reference
      // For unified x-axis, we sample all lines at these x positions
      const xPosition = i / (maxPoints - 1 || 1)
      const point: Record<string, number> = { x: i }

      normalizedSets.forEach((ds, dsIndex) => {
        // Find the two points surrounding this x position and interpolate
        const normalized = ds.normalized

        // Find where this xPosition falls in the normalized data
        let lowerIdx = 0
        let upperIdx = normalized.length - 1

        for (let j = 0; j < normalized.length - 1; j++) {
          if (
            normalized[j].x <= xPosition &&
            normalized[j + 1].x >= xPosition
          ) {
            lowerIdx = j
            upperIdx = j + 1
            break
          }
        }

        // Handle edge cases
        if (xPosition <= normalized[0].x) {
          point[`y${dsIndex}`] = normalized[0].y
        } else if (xPosition >= normalized[normalized.length - 1].x) {
          point[`y${dsIndex}`] = normalized[normalized.length - 1].y
        } else {
          // Linear interpolation based on time-proportional x
          const x1 = normalized[lowerIdx].x
          const x2 = normalized[upperIdx].x
          const y1 = normalized[lowerIdx].y
          const y2 = normalized[upperIdx].y
          const t = (xPosition - x1) / (x2 - x1 || 1)
          point[`y${dsIndex}`] = y1 + t * (y2 - y1)
        }
      })

      chartData.push(point)
    }

    const lineInfo = normalizedSets.map((ds) => ({
      name: ds.name,
      exerciseId: ds.exerciseId,
      color: ds.color,
    }))

    return { chartData, lineInfo }
  }, [dataSets])

  if (dataSets.length < 2) {
    return (
      <View style={tw`h-[${CHART_HEIGHT}px] items-center justify-center`}>
        <Txt style={tw`text-gray-500`}>
          Select at least 2 exercises to compare
        </Txt>
      </View>
    )
  }

  return (
    <>
      <View style={tw`h-[${CHART_HEIGHT}px]`}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={yKeys}
          domain={{ y: [0, 100] }}
          domainPadding={{ left: 10, right: 10, top: 20, bottom: 10 }}
          padding={{ left: 0, right: 0, top: 0, bottom: 0 }}
          xAxis={{
            lineColor: theme.grayBorder,
            tickCount: 4,
          }}
          yAxis={[
            {
              lineColor: theme.grayBorder,
              tickCount: 4,
            },
          ]}
        >
          {({ points }) => (
            <>
              {yKeys.map((yKey, index) => (
                <AnimatedLine
                  key={yKey}
                  points={points[yKey]}
                  progress={drawProgress}
                  color={lineInfo[index].color}
                />
              ))}
            </>
          )}
        </CartesianChart>
      </View>
      {/* Legend - Horizontal ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`flex-row items-center gap-3`}
      >
        {lineInfo.map((line, index) => (
          <Link
            key={line.exerciseId}
            href={`/exercise-details?id=${line.exerciseId}`}
          >
            <View style={tw`flex-row items-center`}>
              <View
                style={[
                  tw`w-3 h-3 rounded-full mr-1`,
                  { backgroundColor: line.color },
                ]}
              />
              <Txt
                twcn="text-xs text-light-grayText dark:text-dark-grayText"
                numberOfLines={1}
              >
                {line.name}
              </Txt>
            </View>
          </Link>
        ))}
      </ScrollView>
    </>
  )
}

export default LineChartMultiple
