import { useWindowDimensions, View } from 'react-native'
import React, { useMemo } from 'react'
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts'
import useTheme from '../app/hooks/theme'
import tw from '../tw'
import Colors from '../constants/colors'

type DataPoint = {
  value: number
  label?: string
}

type LineChartProps = {
  data: DataPoint[]
}

const PAD_H = 32 // horizontal padding for the chart
const INITIAL = 10
const END = 10
const Y_AXIS_WIDTH = 20

const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const { theme } = useTheme()
  const { width: screenW } = useWindowDimensions()

  const chartWidth = screenW - PAD_H - Y_AXIS_WIDTH

  const spacing = useMemo(() => {
    const n = Math.max(data.length, 1)
    if (n <= 1) return 0
    return Math.max(0, (chartWidth - INITIAL - END) / (n - 1))
  }, [chartWidth, data.length])

  return (
    <View style={tw`rounded-2xl overflow-hidden`}>
      <GiftedLineChart
        data={data}
        height={150}
        width={chartWidth}
        spacing={spacing}
        color={Colors.primary}
        thickness={1.5}
        startFillColor={Colors.primary}
        endFillColor={theme.background}
        startOpacity={0.9}
        endOpacity={0.2}
        initialSpacing={INITIAL}
        endSpacing={END}
        showVerticalLines={false}
        xAxisIndicesHeight={0}
        yAxisIndicesWidth={0}
        hideDataPoints={false}
        dataPointsColor={Colors.primary}
        dataPointsRadius={data.length <= 20 ? 3 : data.length <= 50 ? 2 : 1}
        hideRules={true}
        yAxisColor={theme.grayTertiary}
        xAxisColor={theme.grayTertiary}
        yAxisThickness={1}
        xAxisThickness={1}
        rulesColor={theme.grayTertiary}
        yAxisTextStyle={{
          color: theme.grayText,
          fontSize: 9,
          fontFamily: 'Poppins-Regular',
        }}
        xAxisLabelTextStyle={{
          color: theme.grayText,
          fontSize: 9,
          fontFamily: 'Poppins-Regular',
          width: 50,
        }}
        curved={true}
        areaChart={true}
        noOfSections={6}
        yAxisLabelWidth={Y_AXIS_WIDTH}
        rotateLabel={true}
        xAxisTextNumberOfLines={1}
        isAnimated={true}
        disableScroll={true}
        animateOnDataChange={true}
      />
    </View>
  )
}

export default LineChart
