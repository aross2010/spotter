import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { InsightsData } from '../../../utils/types'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import Spinner from '../../../components/activity-indicator'
import { Alert } from 'react-native'
import { useAuth } from '../../../context/auth-context'
import { BASE_URL } from '../../../constants/auth'
import { useUserStore } from '../../../stores/user-store'
import tw from '../../../tw'
import { Link } from 'expo-router'
import ParallaxCarousel from '../../../components/parallax-carousel'
import { GlassView } from 'expo-glass-effect'
import SFIcon from '../../../components/sf-icon'
import { SFSymbol } from 'expo-symbols'
import Colors from '../../../constants/colors'
import { formatDate } from '../../../functions/formatted-date'
import { formatNumber } from '../../../functions/format-number'
import Button from '../../../components/button'
import LineChartMultiple from '../../../components/line-chart-multiple'

const Insights = () => {
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const { fetchWithAuth, authUser } = useAuth()
  const { preferences } = useUserStore()
  const weightUnit = preferences?.weightMetric ?? 'lbs' // 'lbs' or 'kgs'

  const fetchInsightsData = async () => {
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/insights/${authUser?.id}?weightUnit=${weightUnit}`,
        {
          method: 'GET',
        }
      )
      const data = await res.json()
      setInsightsData(data)
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'An error occurred while fetching insights data.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsightsData()
  }, [])

  const summaryData = [
    {
      title: 'Most Popular Workout',
      value: insightsData?.core?.summary.mostPopularWorkoutType.name || 'N/A',
      subtitle: `${insightsData?.core?.summary.mostPopularWorkoutType.numWorkouts || 0} workouts`,
      iconName: 'figure.strengthtraining.traditional',
    },
    {
      title: 'Most Popular Location',
      value: insightsData?.core?.summary.mostPopularLocation.name || 'N/A',
      subtitle: `${insightsData?.core?.summary.mostPopularLocation.numWorkouts || 0} workouts`,
      iconName: 'mappin',
    },
    {
      title: 'Most Popular Exercise',
      value: insightsData?.core?.summary.mostPopularExercise.name || 'N/A',
      subtitle: `${insightsData?.core?.summary.mostPopularExercise.numWorkouts || 0} workouts`,
      link: `/exercise-details?id=${insightsData?.core?.summary.mostPopularExercise.exerciseId}`,
      iconName: 'dumbbell.fill',
    },
    {
      title: 'Heaviest All-Time Lift',
      value: insightsData?.core?.summary.heaviestExercisePR.name,
      subtitle: `Lifted ${insightsData?.core?.summary.heaviestExercisePR.weight} ${weightUnit} on ${insightsData?.core?.summary.heaviestExercisePR.date ? formatDate(insightsData.core.summary.heaviestExercisePR.date) : 'N/A'}`,
      link: `/exercise-details?id=${insightsData?.core?.summary.heaviestExercisePR.exerciseId}`,
      iconName: 'trophy.fill',
    },
    {
      title: 'G.O.A.T. Workout',
      value: insightsData?.core?.summary.heaviestWorkout.workoutName,
      subtitle: `${formatNumber(insightsData?.core?.summary.heaviestWorkout.totalWeight ?? 0)} ${weightUnit} lifted on ${insightsData?.core?.summary.heaviestWorkout.date ? formatDate(insightsData.core.summary.heaviestWorkout.date) : 'N/A'}`,
      link: `/workout-details?id=${insightsData?.core?.summary.heaviestWorkout.workoutId}`,
      iconName: 'crown.fill',
    },
  ]

  const summaryItems = summaryData.map((item, index) => {
    const content = (
      <GlassView
        key={index}
        style={tw`px-4 py-2 h-[150] rounded-2xl bg-white dark:bg-dark-grayPrimary w-full flex-1 justify-center`}
      >
        {/* Header */}
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center`}>
            <View
              style={tw`w-10 h-10 rounded-xl items-center justify-center bg-primary/12 mr-4`}
            >
              <SFIcon
                name={item.iconName as SFSymbol}
                size={24}
                color={Colors.primary}
              />
            </View>

            <Txt
              twcn="text-base text-light-grayText dark:text-dark-grayText"
              numberOfLines={1}
            >
              {item.title}
            </Txt>
          </View>

          {item.link ? (
            <SFIcon
              name={'chevron.right' as SFSymbol}
              size={14}
              color="rgba(140,140,140,0.9)"
            />
          ) : null}
        </View>

        {/* Value */}
        <Txt
          twcn="text-2xl font-semibold tracking-tight"
          numberOfLines={1}
        >
          {item.value}
        </Txt>

        {/* Subtitle */}
        {item.subtitle ? (
          <Txt
            twcn="text-light-grayText dark:text-dark-grayText mt-2"
            numberOfLines={2}
          >
            {item.subtitle}
          </Txt>
        ) : null}
      </GlassView>
    )

    return content
  })

  const renderedSummary = (
    <View>
      <ParallaxCarousel
        data={summaryItems}
        items={summaryItems}
      />
    </View>
  )

  const renderedExercises = (
    <View style={tw`px-4`}>
      <View style={tw`flex-row justify-between items-center mb-2`}>
        <Txt twcn="font-semibold text-lg">Exercise Trends</Txt>
      </View>
      <LineChartMultiple
        dataSets={insightsData?.core?.exercises.exerciseComparisonGraph || []}
      />
    </View>
  )

  if (loading) return <Spinner text="Gathering data..." />
  return (
    <SafeView twcnContentView="px-0 gap-6">
      {renderedSummary}
      {renderedExercises}
    </SafeView>
  )
}

export default Insights

const styles = StyleSheet.create({})
