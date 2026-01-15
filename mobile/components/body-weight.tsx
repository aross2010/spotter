// for home page, prompt to add weight if no entries, else
// display graph, button to add, and low, high, avg, and difference

import { Alert, View } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { BodyWeightData } from '../utils/types'
import { useUserStore } from '../stores/user-store'
import tw from '../tw'
import Txt from './text'
import LineChart from './line-chart'
import Button from './button'
import { GlassView } from 'expo-glass-effect'
import SFIcon from './sf-icon'
import { formatDate } from '../functions/formatted-date'
import Spinner from './activity-indicator'
import { useBodyWeightStore } from '../stores/body-weight-store'
import { useAuth } from '../context/auth-context'
import { BASE_URL } from '../constants/auth'

type BodyWeightProps = {
  data: BodyWeightData | null
  setData: (data: BodyWeightData) => void
  openForm?: () => void
  onScrollEnabledChange?: (enabled: boolean) => void
}

const BodyWeight = ({
  data,
  setData,
  openForm,
  onScrollEnabledChange,
}: BodyWeightProps) => {
  const [loading, setLoading] = useState(false)
  const { preferences } = useUserStore()
  const { fetchWithAuth, authUser } = useAuth()
  const weightUnit = preferences?.weightMetric || 'lbs'
  const { shouldRefresh, clearRefresh } = useBodyWeightStore()

  const hasMultipleEntries = (data?.bodyWeightProgression.length ?? 0) > 1
  const hasSingleEntry = (data?.bodyWeightProgression.length ?? 0) === 1
  const hasNoEntries = (data?.bodyWeightProgression.length ?? 0) === 0

  const getBodyWeightData = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/weightEntries/${authUser?.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      const bodyWeightData: BodyWeightData = await res.json()
      setData(bodyWeightData)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
      clearRefresh()
    }
  }

  useEffect(() => {
    if (!shouldRefresh) return
    getBodyWeightData()
  }, [shouldRefresh])

  // Transform data for line chart
  const chartData = useMemo(() => {
    if (!data?.bodyWeightProgression || data.bodyWeightProgression.length <= 1)
      return []

    return data.bodyWeightProgression.map((entry, index) => ({
      x: index,
      y: entry.bodyWeight,
      date: entry.date,
    }))
  }, [data?.bodyWeightProgression])

  // Generate tooltips for each data point
  const tooltips = useMemo(() => {
    return chartData.map((point) => {
      const dateObj = new Date(point.date)
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getUTCDate()).padStart(2, '0')
      const year = dateObj.getUTCFullYear()
      const formattedDate = `${month}/${day}/${year}`
      return (
        <GlassView
          key={point.date}
          style={tw`p-2 w-[120px] overflow-hidden rounded-2xl shadow-md`}
        >
          <Txt twcn="text-light-grayText dark:text-dark-grayText text-xs mb-1">
            {formattedDate}
          </Txt>
          <Txt twcn="text-sm font-semibold">
            {point.y} {weightUnit}
          </Txt>
        </GlassView>
      )
    })
  }, [chartData, weightUnit])

  // Format X axis labels
  const formatXLabel = (_: any, index: number) => {
    const item = chartData[index]
    if (!item) return ''
    const date = new Date(item.date)
    const month = date.getUTCMonth() + 1
    const day = date.getUTCDate()
    const year = String(date.getUTCFullYear()).slice(-2)
    return `${month}/${day}/${year}`
  }

  // Format Y axis labels
  const formatYLabel = (value: number) => {
    return `${Math.round(value)} ${weightUnit}`
  }

  const noEntries = (
    <View style={tw`items-center py-4 gap-3`}>
      <Txt twcn="text-light-grayText dark:text-dark-grayText text-center">
        Track your body weight to monitor your body composition over time.
      </Txt>
      <Button
        twcn="bg-primary py-3 px-6 rounded-full mt-2 gap-2 flex-row items-center"
        onPress={openForm}
      >
        <Txt twcn="text-white font-medium">Add Body Weight</Txt>
        <SFIcon
          name="arrow.right"
          size={16}
          color="white"
        />
      </Button>
    </View>
  )

  const entry = data!.bodyWeightProgression[0]
  const sameDayAsToday = formatDate(entry.date) == formatDate(new Date())

  const singleEntry = (
    <View style={tw`items-center py-4 gap-3`}>
      <Txt twcn="text-3xl font-semibold">
        {entry.bodyWeight} {weightUnit}
      </Txt>
      <Txt twcn="text-light-grayText dark:text-dark-grayText text-center">
        {sameDayAsToday
          ? 'Come back tomorrow to log another entry and view your progress graph!'
          : `Logged on ${formatDate(entry.date)}. Log another entry to unlock your progress graph.`}
      </Txt>
      {!sameDayAsToday && (
        <Button
          twcn="bg-primary py-3 px-6 rounded-full mt-2 gap-2 flex-row items-center"
          onPress={openForm}
        >
          <Txt twcn="text-white font-medium">Log Weight</Txt>
          <SFIcon
            name="arrow.right"
            size={16}
            color="white"
          />
        </Button>
      )}
    </View>
  )

  const multipleEntries = (
    <>
      <LineChart
        data={chartData}
        xKey="x"
        yKey="y"
        formatXLabel={formatXLabel}
        formatYLabel={formatYLabel}
        toolTips={tooltips}
        onScrollEnabledChange={onScrollEnabledChange}
        chartHeight={150}
      />

      {/* Stats row */}
      <View style={tw`flex-row justify-between mt-2`}>
        <View style={tw`items-center flex-1`}>
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
            Low
          </Txt>
          <Txt twcn="font-semibold">
            {data?.lowestBodyWeight ?? '-'}{' '}
            {data?.lowestBodyWeight ? weightUnit : ''}
          </Txt>
        </View>
        <View style={tw`items-center flex-1`}>
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
            High
          </Txt>
          <Txt twcn="font-semibold">
            {data?.highestBodyWeight ?? '-'}{' '}
            {data?.highestBodyWeight ? weightUnit : ''}
          </Txt>
        </View>
        <View style={tw`items-center flex-1`}>
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
            Change
          </Txt>
          <Txt
            twcn={`font-semibold ${data?.overallDifference && data.overallDifference > 0 ? 'text-green dark:text-green' : data?.overallDifference && data.overallDifference < 0 ? 'text-red dark:text-red' : ''}`}
          >
            {data?.overallDifference !== null &&
            data?.overallDifference !== undefined
              ? `${data.overallDifference > 0 ? '+' : ''}${data.overallDifference.toFixed(2)} ${weightUnit}`
              : '-'}
          </Txt>
        </View>
      </View>
    </>
  )

  return (
    <View
      style={tw`p-4 bg-white dark:bg-dark-grayPrimary rounded-2xl min-h-32`}
    >
      {loading ? (
        <Spinner overlay />
      ) : hasNoEntries ? (
        noEntries
      ) : hasSingleEntry ? (
        singleEntry
      ) : (
        multipleEntries
      )}
    </View>
  )
}

export default BodyWeight
