import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useRef } from 'react'
import Txt from '../../components/text'
import SafeView from '../../components/safe-view'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import Button from '../../components/button'
import SFIcon from '../../components/sf-icon'
import useTheme from '../hooks/theme'
import { useBodyWeightStore } from '../../stores/body-weight-store'
import { BodyWeightData } from '../../utils/types'
import Colors from '../../constants/colors'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import MyBottomSheet from '../../components/bottom-sheet'
import WeightEntryForm from '../../components/weight-entry-form'
import tw from '../../tw'
import { useUserStore } from '../../stores/user-store'
import { toTitleCase } from '../../functions/utils'
import BodyWeight from '../../components/body-weight'

const BodyWeightOverview = () => {
  const { theme } = useTheme()
  const { preferences } = useUserStore()
  const weightMetric = preferences?.weightMetric || 'lbs'
  const { shouldRefresh, clearRefresh, triggerRefresh } = useBodyWeightStore()
  const { bodyWeightData: bodyWeightDataString } = useLocalSearchParams() as {
    bodyWeightData?: string
  }

  const bodyWeightData: BodyWeightData | null = bodyWeightDataString
    ? JSON.parse(bodyWeightDataString)
    : null
  const ref = useRef<BottomSheetModal>(null)
  const [data, setData] = React.useState<BodyWeightData | null>(bodyWeightData)

  const handleOpenForm = () => {
    ref.current?.present()
  }

  // Calculate stats
  const calculateAverageChangePerWeek = () => {
    if (!data || data.bodyWeightProgression.length < 2) return 'N/A'

    const sorted = data.bodyWeightProgression
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const firstDate = new Date(sorted[0].date)
    const lastDate = new Date(sorted[sorted.length - 1].date)
    const totalDays =
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    const totalWeeks = totalDays / 7

    if (totalWeeks < 1) return 'N/A'

    const totalChange =
      sorted[sorted.length - 1].bodyWeight - sorted[0].bodyWeight
    const avgPerWeek = totalChange / totalWeeks

    return `${avgPerWeek > 0 ? '+' : ''}${avgPerWeek.toFixed(1)}`
  }

  const calculateAverageChangePerMonth = () => {
    if (!data || data.bodyWeightProgression.length < 2) return 'N/A'

    const sorted = data.bodyWeightProgression
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const firstDate = new Date(sorted[0].date)
    const lastDate = new Date(sorted[sorted.length - 1].date)
    const totalDays =
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    const totalMonths = totalDays / 30

    if (totalMonths < 1) return 'N/A'

    const totalChange =
      sorted[sorted.length - 1].bodyWeight - sorted[0].bodyWeight
    const avgPerMonth = totalChange / totalMonths

    return `${avgPerMonth > 0 ? '+' : ''}${avgPerMonth.toFixed(1)}`
  }

  const stats = [
    {
      label: '📈 High',
      value: data?.highestBodyWeight
        ? `${data.highestBodyWeight.toFixed(1)} ${weightMetric}`
        : 'N/A',
    },
    {
      label: '📉 Low',
      value: data?.lowestBodyWeight
        ? `${data.lowestBodyWeight.toFixed(1)} ${weightMetric}`
        : 'N/A',
    },
    {
      label: 'Overall Change',
      value:
        data?.overallDifference !== null &&
        data?.overallDifference !== undefined
          ? `${data.overallDifference > 0 ? '+' : ''}${data.overallDifference.toFixed(1)} ${weightMetric}`
          : 'N/A',
    },
    {
      label: 'Avg/Week',
      value:
        calculateAverageChangePerWeek() !== 'N/A'
          ? `${calculateAverageChangePerWeek()} ${weightMetric}`
          : 'N/A',
    },
    {
      label: 'Avg/Month',
      value:
        calculateAverageChangePerMonth() !== 'N/A'
          ? `${calculateAverageChangePerMonth()} ${weightMetric}`
          : 'N/A',
    },
  ]

  const renderedStats = stats.map((s, index) => {
    return (
      <View
        key={s.label}
        style={tw`flex-1 p-2.5 ${index === 0 ? 'rounded-tl-xl' : index == 1 ? 'rounded-tr-xl' : index == 2 ? 'rounded-bl-xl' : index == 4 ? 'rounded-br-xl' : ''} bg-white dark:bg-dark-grayPrimary`}
      >
        <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
          {s.label}
        </Txt>
        <Txt twcn="font-semibold text-base">{s.value}</Txt>
      </View>
    )
  })

  const keyStats = data && (
    <View>
      <Txt twcn="font-semibold text-lg mb-2">Key Stats</Txt>
      <View style={tw`gap-1`}>
        <View style={tw`flex-row gap-1`}>{renderedStats.slice(0, 2)}</View>
        <View style={tw`flex-row gap-1`}>{renderedStats.slice(2)}</View>
      </View>
    </View>
  )

  const navigation = useNavigation()
  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Body Weight',
      headerLeft: () => (
        <Button
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="close workout form"
          twcn="w-9 flex-row items-center justify-center h-full"
        >
          <SFIcon
            name="xmark"
            size={26}
            color={theme.text}
          />
        </Button>
      ),
      headerRight: () => (
        <Button
          onPress={handleOpenForm}
          hitSlop={12}
          accessibilityLabel="Open Body Weight Form"
          twcn="w-9 flex-row items-center justify-center h-full"
        >
          <SFIcon
            name="plus"
            size={26}
            color={Colors.primary}
          />
        </Button>
      ),
    })
  }, [])

  const history = data && data.bodyWeightProgression.length > 0 && (
    <View>
      <Txt twcn="font-semibold text-lg mb-2">History</Txt>
      <View
        style={tw`flex-row items-center border-b border-light-grayBorder dark:border-dark-grayBorder`}
      >
        <Txt twcn="text-light-grayText dark:text-dark-grayText text-sm flex-1 text-center">
          Date
        </Txt>
        <Txt twcn="text-light-grayText dark:text-dark-grayText text-sm flex-1 text-center">
          {toTitleCase(weightMetric)}
          {weightMetric === 'lbs' && '.'}
        </Txt>
        <Txt twcn="text-light-grayText dark:text-dark-grayText text-sm flex-1 text-center">
          Since Last
        </Txt>
        <Txt twcn="text-light-grayText dark:text-dark-grayText text-sm flex-1 text-center">
          Change
        </Txt>
      </View>
      {data.bodyWeightProgression
        .slice()
        .reverse()
        .map((entry, index, arr) => {
          const formatDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split('-')
            return `${month}/${day}/${year.slice(2)}`
          }

          const getTimeSince = (currentDate: string, previousDate: string) => {
            const current = new Date(currentDate)
            const previous = new Date(previousDate)
            const diffMs = current.getTime() - previous.getTime()
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

            if (diffDays === 0) return 'Same day'
            if (diffDays === 1) return '1 day'
            if (diffDays < 60) return `${diffDays} days`

            const diffMonths = diffDays / 30
            if (diffMonths < 12) return `${diffMonths.toFixed(1)} mo`

            const diffYears = diffDays / 365
            return `${diffYears.toFixed(1)} yr`
          }

          const previousEntry = index < arr.length - 1 ? arr[index + 1] : null
          const timeSince = previousEntry
            ? getTimeSince(entry.date, previousEntry.date)
            : '-'

          const weightChange = previousEntry
            ? entry.bodyWeight - previousEntry.bodyWeight
            : 0
          const isIncrease = weightChange > 0
          const isDecrease = weightChange < 0
          const changeColor = isIncrease
            ? 'text-red'
            : isDecrease
              ? 'text-green'
              : 'text-light-grayText dark:text-dark-grayText'

          return (
            <View
              key={entry.date}
              style={tw`flex-row items-center border-b border-light-grayBorder dark:border-dark-grayBorder py-2`}
            >
              <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText flex-1 text-center">
                {formatDate(entry.date)}
              </Txt>
              <Txt twcn="text-xs flex-1 text-center">
                {entry.bodyWeight.toFixed(1)}
              </Txt>
              <Txt twcn="text-xs flex-1 text-center text-light-grayText dark:text-dark-grayText">
                {timeSince}
              </Txt>
              <View
                style={tw`flex-1 flex-row items-center justify-center gap-0.5`}
              >
                {previousEntry && weightChange !== 0 && (
                  <SFIcon
                    name={isIncrease ? 'arrow.up' : 'arrow.down'}
                    size={10}
                    color={isIncrease ? Colors.red : Colors.green}
                  />
                )}
                <Txt
                  twcn={`text-xs text-center ${changeColor} dark:${changeColor}`}
                >
                  {previousEntry
                    ? weightChange !== 0
                      ? Math.abs(weightChange).toFixed(1)
                      : '-'
                    : '-'}
                </Txt>
              </View>
            </View>
          )
        })}
    </View>
  )

  const progessionChart = data && data.bodyWeightProgression.length > 0 && (
    <View>
      <Txt twcn="font-semibold text-lg mb-2">Progression</Txt>
      <BodyWeight
        data={data}
        setData={setData}
        inOverview
      />
    </View>
  )

  return (
    <>
      <SafeView twcnContentView="gap-6">
        {keyStats}
        {progessionChart}
        {history}
      </SafeView>
      <MyBottomSheet
        ref={ref}
        usesKeyboard
      >
        <WeightEntryForm closeModal={() => ref.current?.dismiss()} />
      </MyBottomSheet>
    </>
  )
}

export default BodyWeightOverview

const styles = StyleSheet.create({})
