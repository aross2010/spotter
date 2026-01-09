import React, { useEffect, useMemo } from 'react'
import { View, ScrollView } from 'react-native'
import { CartesianChart, useLinePath, type PointsArray } from 'victory-native'
import { Path } from '@shopify/react-native-skia'
import { Link } from 'expo-router'
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
  Colors.blue,
  Colors.green,
  Colors.red,
  Colors.orange,
  Colors.secondary,
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
const ANIMATION_DURATION = 5000

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

// Normalize a dataset's y values to 0-100 range
function normalizeDataSet(data: DataPoint[]): { x: number; y: number }[] {
  if (data.length === 0) return []

  const yValues = data.map((d) => d.weight)
  const minY = Math.min(...yValues)
  const maxY = Math.max(...yValues)
  const yRange = maxY - minY

  // If all values are the same (flat line), center it at 50%
  if (yRange === 0) {
    return data.map((point, index) => ({
      x: data.length === 1 ? 0.5 : index / (data.length - 1),
      y: 50,
    }))
  }

  return data.map((point, index) => ({
    x: data.length === 1 ? 0.5 : index / (data.length - 1), // normalize x to 0-1
    y: ((point.weight - minY) / yRange) * 100, // normalize y to 0-100
  }))
}

const LineChartMultiple = ({ dataSets }: LineChartMultipleProps) => {
  const { theme } = useTheme()
  const drawProgress = useSharedValue(0)

  // Build yKeys dynamically
  const yKeys = useMemo(
    () => dataSets.map((_, i) => `y${i}` as const),
    [dataSets.length]
  )

  // Trigger draw animation when data changes
  useEffect(() => {
    drawProgress.value = 0
    drawProgress.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    })
  }, [dataSets])

  // Normalize all data sets and prepare chart data
  const { chartData, lineInfo } = useMemo(() => {
    // Create combined data array with normalized values for each line
    // We need to create a unified x-axis, so we'll use indices 0 to maxPoints-1
    const maxPoints = Math.max(...dataSets.map((ds) => ds.graphData.length))

    // Normalize each dataset
    const normalizedSets = dataSets.map((ds, dsIndex) => ({
      ...ds,
      normalized: normalizeDataSet(ds.graphData),
      color: LINE_COLORS[dsIndex % LINE_COLORS.length],
    }))

    // Create chart data - each point has x and y values for each line
    const chartData: Record<string, number>[] = []

    for (let i = 0; i < maxPoints; i++) {
      const point: Record<string, number> = { x: i }

      normalizedSets.forEach((ds, dsIndex) => {
        // Interpolate if this dataset has fewer points
        const normalizedIndex =
          ds.normalized.length === 1
            ? 0
            : (i / (maxPoints - 1)) * (ds.normalized.length - 1)
        const lowerIndex = Math.floor(normalizedIndex)
        const upperIndex = Math.min(
          Math.ceil(normalizedIndex),
          ds.normalized.length - 1
        )
        const fraction = normalizedIndex - lowerIndex

        // Linear interpolation
        const yValue =
          lowerIndex === upperIndex
            ? (ds.normalized[lowerIndex]?.y ?? 0)
            : (ds.normalized[lowerIndex]?.y ?? 0) * (1 - fraction) +
              (ds.normalized[upperIndex]?.y ?? 0) * fraction

        point[`y${dsIndex}`] = yValue
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
            lineColor: theme.grayText,
            tickCount: 4,
          }}
          yAxis={[
            {
              lineColor: theme.grayText,
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
