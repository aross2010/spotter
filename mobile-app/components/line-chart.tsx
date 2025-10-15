import React, { useMemo } from 'react'
import { View } from 'react-native'
import { Area, CartesianChart, Line, Scatter } from 'victory-native'
import { Circle, useFont } from '@shopify/react-native-skia'
import Colors from '../constants/colors'
import useTheme from '../app/hooks/theme'
import tw from '../tw'
import { Poppins_400Regular } from '@expo-google-fonts/poppins'

type DataPoint = Record<string, any>

type LineChartProps = {
  data: DataPoint[]
  xKey: string
  yKey: string
  formatXLabel?: (value: any, index: number) => string
  formatYLabel?: (value: number) => string
  maxXLabels?: number // kept for compatibility; we’ll force 5 regardless
}

const CHART_HEIGHT = 225

const LineChart = ({
  data,
  xKey,
  yKey,
  formatXLabel,
  formatYLabel,
}: LineChartProps) => {
  const { theme } = useTheme()
  const font = useFont(Poppins_400Regular, 10)

  // Map data to numeric x = index (0..N-1)
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
      >
        {({ points, yScale }) => (
          <>
            <Area
              points={points.y}
              color={Colors.primary}
              opacity={0.18}
              curveType="catmullRom"
              animate={{ type: 'timing', duration: 400 }}
              y0={CHART_HEIGHT}
            />
            <Line
              points={points.y}
              color={Colors.primary}
              strokeWidth={1.5}
              curveType="catmullRom"
              animate={{
                type: 'timing',
                duration: 400,
              }}
            />
            <Scatter
              points={points.y}
              radius={2}
              color={Colors.primary}
              animate={{ type: 'timing', duration: 400 }}
            />
          </>
        )}
      </CartesianChart>
    </View>
  )
}

export default LineChart
