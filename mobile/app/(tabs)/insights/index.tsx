import { ScrollView, StyleSheet, View } from 'react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InsightsData } from '../../../utils/types'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import Spinner from '../../../components/activity-indicator'
import { Alert } from 'react-native'
import { useAuth } from '../../../context/auth-context'
import { BASE_URL } from '../../../constants/auth'
import { useUserStore } from '../../../stores/user-store'
import tw from '../../../tw'
import ParallaxCarousel from '../../../components/parallax-carousel'
import { GlassView } from 'expo-glass-effect'
import SFIcon from '../../../components/sf-icon'
import { SFSymbol } from 'expo-symbols'
import Colors from '../../../constants/colors'
import { formatDate } from '../../../functions/formatted-date'
import { formatNumber } from '../../../functions/format-number'
import LineChartMultiple from '../../../components/line-chart-multiple'
import LineChart from '../../../components/line-chart'
import Button from '../../../components/button'
import MyBottomSheet from '../../../components/bottom-sheet'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import StackedBarChart from '../../../components/stacked-bar-chart'
import useTheme from '../../hooks/theme'
import BarChart from '../../../components/bar-chart'
import { Link, router } from 'expo-router'
import { useInsightsStore } from '../../../stores/insights-store'

const Insights = () => {
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [scrollEnabled, setScrollEnabled] = useState(true)
  const { fetchWithAuth, authUser } = useAuth()
  const { preferences } = useUserStore()
  const weightUnit = preferences?.weightMetric ?? 'lbs' // 'lbs' or 'kgs'
  const [exercisesToCompare, setExercisesToCompare] = useState<
    {
      exerciseId: string
      name: string
    }[]
  >([])
  const exerciseSelectionRef = useRef<BottomSheetModal>(null)
  const scrollRef = useRef<ScrollView>(null)
  const muscleGroupViewRef = useRef<View>(null)
  const { theme } = useTheme()
  const { shouldRefresh, clearRefresh } = useInsightsStore()

  const fetchInsightsData = async () => {
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/insights/${authUser?.id}?weightUnit=${weightUnit}`,
        {
          method: 'GET',
        },
      )
      const data = (await res.json()) as InsightsData
      setInsightsData(data)
      if (data.core?.exercises.exerciseComparisonGraph)
        setExercisesToCompare(
          data.core?.exercises.exerciseComparisonGraph?.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            name: exercise.name,
          })),
        )
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'An error occurred while fetching insights data.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!shouldRefresh) return
    fetchInsightsData()
    clearRefresh()
  }, [shouldRefresh])

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

    if (item.link) {
      return (
        <Button
          key={index}
          twcn="flex-1"
          onPress={() => router.push(item.link!)}
        >
          {content}
        </Button>
      )
    } else return content
  })

  const renderedSummary = (
    <View>
      <ParallaxCarousel
        data={summaryItems}
        items={summaryItems}
      />
    </View>
  )

  const renderedExerciseTrends = (
    <View style={tw`px-4`}>
      <View style={tw`flex-row justify-between items-center mb-2`}>
        <Txt twcn="font-semibold text-lg">Exercise Comparison</Txt>
        <Button
          onPress={() => exerciseSelectionRef.current?.present()}
          text={
            insightsData?.core?.exercises?.exerciseComparisonGraph.length
              ? `${insightsData.core.exercises.exerciseComparisonGraph.length} Exercises`
              : 'Select Exercises'
          }
          twcnText="font-semibold text-base text-primary dark:text-primary"
        />
      </View>
      <View
        style={tw`rounded-xl p-4 bg-white dark:bg-dark-grayPrimary relative`}
      >
        <View style={tw`${chartLoading ? 'opacity-50' : 'opacity-100'}`}>
          <LineChartMultiple
            dataSets={
              insightsData?.core?.exercises.exerciseComparisonGraph || []
            }
          />
        </View>
        {chartLoading && <Spinner overlay />}
      </View>
      <Txt twcn="mt-1 text-xs text-light-grayText dark:text-dark-grayText">
        Curves represent the one rep max progression for each exercise.
      </Txt>
    </View>
  )

  const changesMadeToTrends = () => {
    // compare exercisesToCompare with insightsData?.core?.exercises.exerciseComparisonGraph
    const currentExerciseIds =
      insightsData?.core?.exercises.exerciseComparisonGraph.map(
        (exercise) => exercise.exerciseId,
      )
    const selectedExerciseIds = exercisesToCompare.map(
      (exercise) => exercise.exerciseId,
    )

    if (currentExerciseIds?.length !== selectedExerciseIds.length) {
      return true
    }

    for (let id of selectedExerciseIds) {
      if (!currentExerciseIds?.includes(id)) {
        return true
      }
    }

    return false
  }

  const handleSelectExercises = async () => {
    try {
      if (!changesMadeToTrends()) return
      setChartLoading(true)
      if (exercisesToCompare.length < 2) {
        Alert.alert(
          'At Least 2 Exercises Required',
          'Please select 2-5 exercises to compare.',
        )
        // revert to previous state
        setExercisesToCompare(
          insightsData?.core?.exercises.exerciseComparisonGraph.map(
            (exercise) => ({
              exerciseId: exercise.exerciseId,
              name: exercise.name,
            }),
          ) || [],
        )
        return exercisesToCompare
      } else if (exercisesToCompare.length > 5) {
        Alert.alert(
          'Maximum of 5 Exercises Reached',
          'Please select 2-5 exercises to compare.',
        )
        // revert to previous state
        setExercisesToCompare(
          insightsData?.core?.exercises.exerciseComparisonGraph.map(
            (exercise) => ({
              exerciseId: exercise.exerciseId,
              name: exercise.name,
            }),
          ) || [],
        )
        return exercisesToCompare
      }

      // fetch data, then set the insights data state
      const exerciseIds = exercisesToCompare
        .map((ex) => ex.exerciseId)
        .join(',')
      const res = await fetchWithAuth(
        `${BASE_URL}/api/insights/exercises/${authUser?.id}?weightUnit=${weightUnit}&exerciseIds=${exerciseIds}`,
        {
          method: 'GET',
        },
      )
      const data = (await res.json()) as NonNullable<
        InsightsData['core']
      >['exercises']['exerciseComparisonGraph']

      setInsightsData((prev) => {
        if (!prev?.core) return prev
        return {
          ...prev,
          core: {
            ...prev.core,
            exercises: {
              ...prev.core.exercises,
              exerciseComparisonGraph: data,
            },
          },
        }
      })
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setChartLoading(false)
    }
  }

  const exerciseSelection = (
    <View style={tw`max-h-120`}>
      <View style={tw`mb-4`}>
        <Txt twcn="font-semibold text-lg">Select Exercises</Txt>
        <Txt twcn="text-light-grayText dark:text-dark-grayText">
          2-5 exercises can be compared at a time.
        </Txt>
      </View>
      <ScrollView contentContainerStyle={tw`gap-2 flex-row flex-wrap`}>
        {insightsData?.userExercises.map((exercise) => {
          const isSelected = exercisesToCompare.some(
            (ex) => ex.exerciseId === exercise.id,
          )

          return (
            <Button
              onPress={() => {
                setExercisesToCompare((prev) => {
                  if (isSelected) {
                    return prev.filter((ex) => ex.exerciseId !== exercise.id)
                  } else {
                    return [
                      ...prev,
                      { exerciseId: exercise.id, name: exercise.name },
                    ]
                  }
                })
              }}
              key={exercise.id}
              twcn={`px-3 py-1 rounded-lg border ${!isSelected ? 'border-light-grayBorder dark:border-dark-grayBorder' : 'border-primary bg-primary/10'} flex-row items-center gap-2`}
            >
              <Txt
                twcn={`text-xs ${!isSelected ? 'text-light-grayText dark:text-dark-grayText' : 'text-primary dark:text-primary'}`}
              >
                {exercise.name}
              </Txt>
              {!isSelected ? (
                <SFIcon
                  name="plus"
                  size={12}
                  color={theme.grayText}
                />
              ) : (
                <SFIcon
                  name="checkmark"
                  size={12}
                  color={Colors.primary}
                />
              )}
            </Button>
          )
        })}
      </ScrollView>
    </View>
  )

  // Transform muscleGroupsWorked data for StackedBarChart
  const muscleGroupChartData = useMemo(() => {
    const muscleGroups = insightsData?.core?.exercises.muscleGroupsWorked
    if (!muscleGroups) return []

    return Object.entries(muscleGroups).map(([label, data]) => ({
      label,
      primary: data.primary,
      secondary: data.secondary,
    }))
  }, [insightsData?.core?.exercises.muscleGroupsWorked])

  const renderedMuscleGroupAnalysis = (
    <View
      ref={muscleGroupViewRef}
      style={tw`px-4`}
    >
      <Txt twcn="font-semibold text-lg mb-2">Muscle Group Usage</Txt>
      <View
        style={tw`rounded-xl p-4 bg-white dark:bg-dark-grayPrimary relative`}
      >
        {muscleGroupChartData.length > 0 ? (
          <StackedBarChart
            data={muscleGroupChartData}
            primaryLabel="Primary"
            secondaryLabel="Secondary"
          />
        ) : (
          <Txt twcn="text-center text-light-grayText dark:text-dark-grayText py-8">
            No muscle group data available
          </Txt>
        )}
      </View>
      <Txt twcn="mt-1 text-xs text-light-grayText dark:text-dark-grayText">
        Bars represent the number of sets targeting each muscle group.
      </Txt>
    </View>
  )

  // Transform repsPerSet data for BarChart - API returns hardcoded range 1-19, 20+
  const repsPerSetChartData = useMemo(() => {
    const repsData = insightsData?.core?.workouts.repsPerSet?.data as
      | Record<string, number>
      | undefined
    if (!repsData) return []

    // Return array in correct order: 1-19, then 20+
    const ordered: { label: string; value: number }[] = []
    for (let i = 1; i <= 19; i++) {
      const key = i.toString()
      ordered.push({ label: key, value: repsData[key] ?? 0 })
    }
    ordered.push({ label: '20+', value: repsData['20+'] ?? 0 })
    return ordered
  }, [insightsData?.core?.workouts.repsPerSet])

  // Transform setsPerWorkout data for BarChart - API returns hardcoded range <5, 6-19, 20+
  const setsPerWorkoutChartData = useMemo(() => {
    const setsData = insightsData?.core?.workouts.setsPerWorkout as
      | Record<string, number>
      | undefined
    if (!setsData) return []

    // Return array in correct order: <5, then 6-19, then 20+
    const ordered: { label: string; value: number }[] = []
    ordered.push({ label: '<5', value: setsData['<5'] ?? 0 })
    for (let i = 6; i <= 19; i++) {
      const key = i.toString()
      ordered.push({ label: key, value: setsData[key] ?? 0 })
    }
    ordered.push({ label: '20+', value: setsData['20+'] ?? 0 })
    return ordered
  }, [insightsData?.core?.workouts.setsPerWorkout])

  // Transform weeklyVolume data for LineChart
  const weeklyVolumeChartData = useMemo(() => {
    const volumeData = insightsData?.core?.workouts.weeklyVolume
    if (!volumeData || volumeData.length === 0) return []

    return volumeData.map((week) => ({
      x: week.date, // Use date for time-proportional spacing
      y: week.totalVolume,
      date: week.date,
    }))
  }, [insightsData?.core?.workouts.weeklyVolume])

  // Tooltips for weekly volume chart
  const weeklyVolumeTooltips = useMemo(() => {
    return weeklyVolumeChartData.map((point) => {
      const dateObj = new Date(point.date)
      const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getUTCDate()).padStart(2, '0')
      const year = dateObj.getUTCFullYear()
      const formattedDate = `${month}/${day}/${year}`
      return (
        <GlassView
          key={point.date}
          style={tw`p-2 pr-4 max-w-[250px] overflow-hidden rounded-2xl shadow-md`}
        >
          <Txt twcn="text-light-grayText dark:text-dark-grayText text-xs mb-1">
            Week of {formattedDate}
          </Txt>
          <Txt twcn="text-sm font-semibold">
            {formatNumber(point.y)} {weightUnit}
          </Txt>
        </GlassView>
      )
    })
  }, [weeklyVolumeChartData, weightUnit])

  const renderedRepsPerSet = (
    <View style={tw`px-4`}>
      <Txt twcn="font-semibold text-lg mb-2">Reps Per Set</Txt>
      <View style={tw`rounded-xl p-4 bg-white dark:bg-dark-grayPrimary`}>
        {repsPerSetChartData.length > 0 ? (
          <BarChart
            data={repsPerSetChartData}
            barColor={Colors.primary}
            activeBarColor={Colors.secondary}
            onScrollEnabledChange={setScrollEnabled}
            renderTooltip={(item) => (
              <GlassView style={tw`p-2 rounded-2xl shadow-md`}>
                <Txt twcn="text-xs text-center text-light-grayText dark:text-dark-grayText">
                  {item.value} {item.value === 1 ? 'set' : 'sets'} at{' '}
                  {item.label} {item.label === '1' ? 'rep' : 'reps'}
                </Txt>
              </GlassView>
            )}
          />
        ) : (
          <Txt twcn="text-center text-light-grayText dark:text-dark-grayText py-8">
            No rep data available
          </Txt>
        )}
      </View>
      <Txt twcn="mt-1 text-xs text-light-grayText dark:text-dark-grayText">
        Distribution of rep counts across all sets.
      </Txt>
    </View>
  )

  const renderedSetsPerWorkout = (
    <View style={tw`px-4`}>
      <Txt twcn="font-semibold text-lg mb-2">Sets Per Workout</Txt>
      <View style={tw`rounded-xl p-4 bg-white dark:bg-dark-grayPrimary`}>
        {setsPerWorkoutChartData.length > 0 ? (
          <BarChart
            data={setsPerWorkoutChartData}
            barColor={Colors.primary}
            activeBarColor={Colors.secondary}
            onScrollEnabledChange={setScrollEnabled}
            renderTooltip={(item) => (
              <GlassView style={tw`p-2 rounded-2xl shadow-md`}>
                <Txt twcn="text-xs text-center text-light-grayText dark:text-dark-grayText">
                  {item.value} {item.value === 1 ? 'workout' : 'workouts'} at{' '}
                  {item.label} {item.label === '1' ? 'set' : 'sets'}
                </Txt>
              </GlassView>
            )}
          />
        ) : (
          <Txt twcn="text-center text-light-grayText dark:text-dark-grayText py-8">
            No sets data available
          </Txt>
        )}
      </View>
      <Txt twcn="mt-1 text-xs text-light-grayText dark:text-dark-grayText">
        Number of workouts grouped by total sets performed.
      </Txt>
    </View>
  )

  const renderedWeeklyVolume = (
    <View style={tw`px-4`}>
      <Txt twcn="font-semibold text-lg mb-2">Weekly Volume</Txt>
      <View
        style={tw`rounded-xl px-4 py-4 bg-white dark:bg-dark-grayPrimary relative`}
      >
        {weeklyVolumeChartData.length > 0 ? (
          <LineChart
            data={weeklyVolumeChartData}
            xKey="x"
            yKey="y"
            formatXLabel={(value, index) => {
              // value is the date string, or use index for actual data points
              let dateStr = value
              if (index >= 0 && index < weeklyVolumeChartData.length) {
                dateStr = weeklyVolumeChartData[index]?.date ?? value
              }
              const date = new Date(dateStr)
              if (isNaN(date.getTime())) return ''
              const month = date.getUTCMonth() + 1
              const day = date.getUTCDate()
              const year = String(date.getUTCFullYear()).slice(-2)
              return `${month}/${day}/${year}`
            }}
            formatYLabel={(value) => formatNumber(value)}
            toolTips={weeklyVolumeTooltips}
            onScrollEnabledChange={setScrollEnabled}
          />
        ) : (
          <Txt twcn="text-center text-light-grayText dark:text-dark-grayText py-8">
            No volume data available
          </Txt>
        )}
      </View>
      <Txt twcn="mt-1 text-xs text-light-grayText dark:text-dark-grayText">
        Total volume (reps × weight) lifted each week.
      </Txt>
    </View>
  )

  const insightsPrompt = (
    <SafeView
      hasTabBar
      scroll={false}
    >
      <View style={tw`flex-1 items-center justify-center px-16`}>
        <SFIcon
          name="chart.bar.fill"
          color={Colors.primary}
          size={64}
        />
        <Txt twcn="text-xl font-semibold text-center mt-6 mb-3">
          Training Insights
        </Txt>
        <Txt twcn="text-center text-sm text-light-grayText dark:text-dark-grayText">
          Log at least 5 workouts to gain insights into your training.
        </Txt>
        <Button
          onPress={() => router.push('/workout-form')}
          text="Log your first workout"
          twcn="mt-6 py-4 w-full items-center flex-row gap-2 justify-center rounded-full bg-primary"
          twcnText="font-semibold text-dark-text"
        >
          <SFIcon
            name="arrow.right"
            color={Colors.dark.text}
            size={20}
          />
        </Button>
      </View>
    </SafeView>
  )

  if (loading) return <Spinner text="Gathering data..." />

  if (!insightsData?.totalWorkouts || insightsData.totalWorkouts < 5)
    return insightsPrompt

  return (
    <>
      <SafeView
        ref={scrollRef}
        twcnContentView="px-0 gap-6"
        scrollEnabled={scrollEnabled}
      >
        {renderedSummary}
        {renderedWeeklyVolume}
        {renderedExerciseTrends}
        {renderedMuscleGroupAnalysis}
        {renderedRepsPerSet}
        {renderedSetsPerWorkout}
      </SafeView>
      <MyBottomSheet
        onDismiss={handleSelectExercises}
        ref={exerciseSelectionRef}
      >
        {exerciseSelection}
      </MyBottomSheet>
    </>
  )
}

export default Insights

const styles = StyleSheet.create({})
