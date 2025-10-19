import { StyleSheet, View } from 'react-native'
import React, { useCallback, useEffect } from 'react'
import {
  Link,
  router,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from 'expo-router'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { useState } from 'react'
import { MuscleGroup } from '../../../utils/types'
import { useAuth } from '../../../context/auth-context'
import { BASE_URL } from '../../../constants/auth'
import Spinner from '../../../components/activity-indicator'
import { capString } from '../../../functions/cap-string'
import useTheme from '../../hooks/theme'
import tw from '../../../tw'
import Button from '../../../components/button'
import { useUserStore } from '../../../stores/user-store'
import LineChart from '../../../components/line-chart'
import { BlurView } from 'expo-blur'
import {
  ChevronsLeftRight,
  ChevronsLeftRightEllipsis,
  Pencil,
  Share,
} from 'lucide-react-native'
import Colors from '../../../constants/colors'
import { handleShareExercise } from '../../../functions/share'
import { useExerciseStore } from '../../../stores/exercise-store'
import { ExerciseDetails as ExerciseDetailsType } from '../../../utils/types'
import { estimate1RM } from '../../../functions/one-rm'

const ExerciseDetails = () => {
  const { id } = useLocalSearchParams()
  const { fetchWithAuth } = useAuth()
  const { theme } = useTheme()
  const { preferences } = useUserStore()
  const [exercise, setExercise] = useState<ExerciseDetailsType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const weightMetric = preferences?.weightMetric || 'lbs'
  const intensityMetric = preferences?.intensityMetric || 'rpe'
  const navigation = useNavigation()
  const { shouldRefresh, clearRefresh } = useExerciseStore()

  const getExerciseDetails = async () => {
    setIsLoading(true)
    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/exercises/${id}?weight=${weightMetric}&intensity=${intensityMetric}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      const data = (await res.json()) as ExerciseDetailsType
      setExercise(data)
    } catch (error: any) {
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToEdit = () => {
    if (!exercise) return
    router.push({
      pathname: '/exercise-details/form',
      params: {
        id: exercise.id,
        name: exercise.name,
        description: exercise.description || '',
        primaryMuscleGroup: exercise.primaryMuscleGroup,
        secondaryMuscleGroups: JSON.stringify(exercise.secondaryMuscleGroups),
        isUnilateral: exercise.isUnilateral ? 'true' : 'false',
      },
    })
  }

  useEffect(() => {
    if (!exercise) return
    navigation.setOptions({
      headerTitle: exercise ? capString(exercise.name, 35) : 'Exercise Details',
      headerTitleStyle: {
        fontSize:
          exercise.name.length > 30 ? 16 : exercise.name.length > 20 ? 18 : 20,
        fontFamily: 'Poppins-SemiBold',
        color: theme.text,
      },
      headerRight: () => (
        <View style={tw`flex-row items-center gap-2`}>
          <Button
            twcn="bg-primary/10 rounded-2xl p-2"
            onPress={() => {
              navigateToEdit()
            }}
          >
            <Pencil
              size={20}
              color={Colors.primary}
            />
          </Button>

          <Button
            onPress={() =>
              handleShareExercise(exercise, weightMetric, intensityMetric)
            }
            twcn="bg-primary/10 rounded-2xl p-2"
          >
            <Share
              size={20}
              color={Colors.primary}
            />
          </Button>
        </View>
      ),
    })
  }, [exercise])

  useEffect(() => {
    getExerciseDetails()
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (shouldRefresh) {
        getExerciseDetails()
        clearRefresh()
      }
      return () => {}
    }, [shouldRefresh])
  )

  const stats = [
    {
      label: '🏆 PR',
      value:
        exercise?.stats.pr === 0
          ? 'N/A'
          : weightMetric === 'kgs'
            ? `${exercise?.stats.pr.toFixed(1)} kg`
            : `${exercise?.stats.pr} lbs`,
    },
    {
      label: '🎯 Est. 1RM',
      value: exercise ? estimate1RM(exercise, weightMetric) : 0,
    },
    {
      label: 'Sets',
      value: exercise?.stats.totalSets,
    },
    {
      label: 'Reps',
      value: exercise?.stats.totalReps,
    },
    {
      label: 'Workouts',
      value: exercise?.stats.totalWorkouts,
    },
    {
      label: 'Sets/Workout',
      value: Number(
        Math.round(
          (exercise?.stats.totalSets as number) /
            (exercise?.stats.totalWorkouts as number)
        )
      ).toFixed(1),
    },
    {
      label: 'Reps/Set',
      value: Number(
        Math.round(
          (exercise?.stats.totalReps as number) /
            (exercise?.stats.totalSets as number)
        )
      ).toFixed(1),
    },
    {
      label: 'Frequency',
      value:
        exercise && exercise.totalUserWorkouts > 0
          ? (
              (exercise.stats.totalWorkouts / exercise.totalUserWorkouts) *
              100
            ).toFixed(1) + '%'
          : '0%',
    },
  ] as const

  const muscleGroups = exercise?.secondaryMuscleGroups
    .concat(exercise.primaryMuscleGroup)
    .reverse()

  const renderedMuscleGroups = muscleGroups?.map((muscle, index) => {
    let isPrimary = false
    if (index === 0) isPrimary = true
    return (
      <View
        key={muscle}
        style={tw`px-3 py-1 rounded-lg border border-primary bg-primary/10`}
      >
        <Txt twcn={`text-xs text-primary`}>
          {muscle
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')}
        </Txt>
      </View>
    )
  })

  const renderedStats = stats.map((s, index) => {
    return (
      <View
        key={s.label}
        style={tw`flex-1 p-2.5 rounded-xl bg-white dark:bg-dark-grayPrimary`}
      >
        <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
          {s.label}
        </Txt>
        <Txt twcn="font-poppinsSemiBold text-base">{s.value}</Txt>
      </View>
    )
  })

  const description = exercise?.description && (
    <Txt twcn="text-light-grayText dark:text-dark-grayText">
      {exercise.description}
    </Txt>
  )

  const keyStats = (
    <View>
      <Txt twcn="font-poppinsMedium mb-4">Key Stats</Txt>
      <View style={tw`gap-1`}>
        <View style={tw`flex-row gap-1`}>{renderedStats.slice(0, 2)}</View>
        <View style={tw`flex-row gap-1`}>{renderedStats.slice(2, 5)}</View>
        <View style={tw`flex-row gap-1`}>{renderedStats.slice(5)}</View>
      </View>
    </View>
  )

  const musclesWorked = exercise && (
    <View>
      <View style={tw`flex-row justify-between items-center mb-4`}>
        <Txt twcn="font-poppinsMedium">
          Muscle{muscleGroups && muscleGroups.length > 1 ? 's' : ''} Worked
        </Txt>
        <Button onPress={() => navigateToEdit()}>
          <Txt twcn="font-poppinsSemiBold text-primary">Edit</Txt>
        </Button>
      </View>
      <View style={tw`flex-row flex-wrap gap-2 items-center`}>
        {renderedMuscleGroups}
        <View
          style={tw`px-3 py-1 rounded-lg border border-secondary bg-secondary/10 flex-row items-center gap-2`}
        >
          {exercise.isUnilateral ? (
            <>
              <Txt twcn={`text-xs text-secondary`}>Unilateral</Txt>
              <ChevronsLeftRightEllipsis
                size={16}
                color={Colors.secondary}
              />
            </>
          ) : (
            <>
              <Txt twcn={`text-xs text-secondary`}>Bilateral</Txt>
              <ChevronsLeftRight
                size={16}
                color={Colors.secondary}
              />
            </>
          )}
        </View>
      </View>
    </View>
  )

  const renderedToolTips = exercise?.stats.progressionChart.map((point) => {
    const { data, date } = point
    const hasIntensity = data.rpe || data.rir
    // Parse as UTC to avoid timezone shifting
    const dateObj = new Date(date)
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getUTCDate()).padStart(2, '0')
    const year = String(dateObj.getUTCFullYear()).slice(-2)
    const formattedDate = `${month}/${day}/${year}`
    return (
      <BlurView
        key={date}
        intensity={50}
        style={tw`p-2 w-[150px] overflow-hidden rounded-2xl border border-light-grayTertiary dark:border-dark-grayTertiary shadow-md`}
      >
        <Txt twcn="text-light-grayText dark:text-dark-grayText text-xs mb-1">
          {formattedDate}
        </Txt>
        <Txt twcn="text-xs">
          {weightMetric === 'kgs' ? data.weight.toFixed(1) : data.weight}{' '}
          {weightMetric} x {data.reps}
          {hasIntensity &&
            `@ ${data.rir ? `RIR ${data.rir}` : `RPE ${data.rpe}`}`}
        </Txt>
      </BlurView>
    )
  })

  const progressionChart =
    exercise &&
    (() => {
      // Add 50 random test data points
      const allData = [
        ...exercise.stats.progressionChart.map((point) => ({
          weight: point.data.weight,
          date: point.date,
        })),
      ]

      return (
        <View style={tw`overflow-visible`}>
          <Txt twcn="font-poppinsMedium mb-4">Progression </Txt>
          <LineChart
            data={allData}
            xKey="date"
            yKey="weight"
            maxXLabels={5}
            formatXLabel={(dateStr) => {
              try {
                // Parse as UTC to avoid timezone shifting
                const date = new Date(dateStr)
                const month = String(date.getUTCMonth() + 1).padStart(2, '0')
                const day = String(date.getUTCDate()).padStart(2, '0')
                const year = String(date.getUTCFullYear()).slice(-2)
                return `${month}/${day}/${year}`
              } catch {
                return ''
              }
            }}
            formatYLabel={(val) =>
              `${weightMetric === 'kgs' ? val.toFixed(1) : Math.round(val)} ${weightMetric}`
            }
            toolTips={renderedToolTips}
          />
        </View>
      )
    })()

  const renderedHistory = exercise?.history.map((entry) => {
    let previousDate = null as string | null
    let needsDate = true

    // Convert date from yyyy-mm-dd to mm/dd/yy
    const formatDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-')
      return `${month}/${day}/${year.slice(2)}`
    }

    return (
      <Link
        href={`/workout-details?id=${entry.workoutId}&from=exercise`}
        key={entry.workoutId}
        style={tw`border-b border-light-grayTertiary dark:border-dark-grayTertiary py-1`}
      >
        {entry.sets.map((set, index) => {
          if (entry.date === previousDate) needsDate = false
          previousDate = entry.date

          // For unilateral exercises, determine if this is L or R
          const isUnilateral = exercise.isUnilateral
          const setLabel = isUnilateral
            ? `${set.setNumber}${index % 2 === 0 ? 'L' : 'R'}`
            : set.setNumber.toString()

          return (
            <View
              key={`${entry.workoutId}-${set.setNumber}-${index}`}
              style={tw`flex-row items-center py-0.5`}
            >
              <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText flex-1">
                {needsDate ? formatDate(entry.date) : ' '}
              </Txt>
              {isUnilateral && (
                <Txt twcn="text-xs flex-1 text-center">{setLabel}</Txt>
              )}
              <Txt twcn="text-xs flex-1 text-center">
                {weightMetric === 'kgs' ? set.weight.toFixed(1) : set.weight}
              </Txt>
              <Txt twcn="text-xs flex-1 text-center">{set.reps}</Txt>
              <Txt twcn="text-xs flex-1 text-center">
                {set.partials ? set.partials : ' '}
              </Txt>
              <Txt twcn="text-xs flex-1 text-center">
                {set.intensity ? set.intensity : ' '}
              </Txt>
            </View>
          )
        })}
      </Link>
    )
  })

  const history = (
    <View>
      <Txt twcn="font-poppinsMedium mb-4">History</Txt>
      <View
        style={tw`flex-row items-center border-b border-light-grayTertiary dark:border-dark-grayTertiary `}
      >
        <Txt twcn="uppercase text-light-grayText dark:text-dark-grayText text-xs flex-1">
          Date
        </Txt>
        {exercise?.isUnilateral && (
          <Txt twcn="uppercase text-light-grayText dark:text-dark-grayText text-xs flex-1 text-center">
            Set
          </Txt>
        )}
        <Txt twcn="uppercase text-light-grayText dark:text-dark-grayText text-xs flex-1 text-center">
          {weightMetric}
          {weightMetric === 'lbs' && '.'}
        </Txt>
        <Txt twcn="uppercase text-light-grayText dark:text-dark-grayText text-xs flex-1 text-center">
          Reps
        </Txt>
        <Txt twcn="uppercase text-light-grayText dark:text-dark-grayText text-xs flex-1 text-center">
          Part.
        </Txt>
        <Txt twcn="uppercase text-light-grayText dark:text-dark-grayText text-xs flex-1 text-center">
          {intensityMetric}
        </Txt>
      </View>
      {renderedHistory}
    </View>
  )

  return isLoading ? (
    <Spinner text="Gathering data..." />
  ) : (
    <SafeView twcnContentView="gap-6">
      {description}
      {keyStats}
      {musclesWorked}
      {progressionChart}
      {history}
    </SafeView>
  )
}

export default ExerciseDetails

const styles = StyleSheet.create({})
