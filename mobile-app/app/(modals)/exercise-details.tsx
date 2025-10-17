import { StyleSheet, View } from 'react-native'
import React, { useEffect } from 'react'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import { useState } from 'react'
import { MuscleGroup } from '../../utils/types'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import Spinner from '../../components/activity-indicator'
import { capString } from '../../functions/cap-string'
import useTheme from '../hooks/theme'
import tw from '../../tw'
import Button from '../../components/button'
import { useUserStore } from '../../stores/user-store'
import LineChart from '../../components/line-chart'
import { BlurView } from 'expo-blur'

type ExerciseDetails = {
  id: string
  name: string
  primaryMuscleGroup: MuscleGroup
  secondaryMuscleGroups: MuscleGroup[]
  isUnilateral: boolean
  description?: string
  totalUserWorkouts: number
  history: {
    workoutId: string
    workoutName: string
    date: string
    sets: {
      // unilateral exercises will have 2x sets
      setNumber: number
      weight: number
      reps: number
      partials?: number
      intensity?: number // RPE or RIR based on user preference
    }[]
  }[]
  stats: {
    pr: number // weight in user pref
    totalSets: number
    totalReps: number
    totalWorkouts: number
    progressionChart: {
      // best set per workout, start with all time, can change to 1m, 3m, 6m, 1y
      date: string
      data: {
        workoutId: string
        weight: number // in user pref, y-axis value
        reps: number
        rpe?: number
        rir?: number
      }
    }[]
  }
}

const calculate1RM = (
  weight: number,
  unit: 'lbs' | 'kgs',
  reps: number,
  rpe: number | null = null,
  rir: number | null = null
) => {
  if (!weight || reps <= 0) return 'N/A'

  // Derive RIR if only RPE is provided
  let effectiveRIR: number
  if (rir !== null) {
    effectiveRIR = Math.max(0, Math.min(4, rir))
  } else if (rpe !== null) {
    effectiveRIR = Math.max(0, Math.min(4, 10 - rpe)) // RPE 9 → 1 RIR
  } else {
    effectiveRIR = 0 // assume max effort if neither provided
  }

  // Approximate % of 1RM from RPE chart (Mike Tuchscherer)
  const rpeTable: Record<number, number[]> = {
    1: [1.0, 0.98, 0.96, 0.94, 0.92],
    2: [0.955, 0.935, 0.92, 0.9, 0.89],
    3: [0.92, 0.9, 0.88, 0.86, 0.84],
    4: [0.89, 0.86, 0.84, 0.82, 0.8],
    5: [0.86, 0.83, 0.81, 0.79, 0.77],
    6: [0.83, 0.81, 0.78, 0.76, 0.74],
    7: [0.81, 0.79, 0.76, 0.74, 0.72],
    8: [0.79, 0.76, 0.74, 0.72, 0.7],
    9: [0.76, 0.74, 0.72, 0.7, 0.68],
    10: [0.74, 0.72, 0.7, 0.68, 0.66],
  }

  const repsKey = Math.min(10, Math.max(1, Math.round(reps)))
  const rirIndex = Math.round(effectiveRIR)

  // Lookup %1RM or fallback to Epley if out of range
  const percent = rpeTable[repsKey]?.[rirIndex] ?? 1 / (1.0278 - 0.0278 * reps)

  const oneRepMax = weight / percent

  return `${Number(oneRepMax.toFixed(1))} ${unit}`
}

const ExerciseDetails = () => {
  const { id } = useLocalSearchParams()
  const { fetchWithAuth } = useAuth()
  const { theme } = useTheme()
  const { preferences } = useUserStore()
  const [exercise, setExercise] = useState<ExerciseDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const prefersKg = preferences?.weightMetric === 'kgs'
  const weightMetric = preferences?.weightMetric || 'lbs'
  const intensityMetric = preferences?.intensityMetric || 'rpe'

  const navigation = useNavigation()

  const estimate1RM = () => {
    const lastThreeWorkouts = exercise?.stats.progressionChart.slice(-3) || []
    if (lastThreeWorkouts.length === 0) return 'N/A'

    const maxWeightSet = lastThreeWorkouts.reduce((max, workout) => {
      return workout.data.weight > max.data.weight ? workout : max
    }, lastThreeWorkouts[0])

    return calculate1RM(
      maxWeightSet.data.weight,
      weightMetric,
      maxWeightSet.data.reps,
      maxWeightSet.data.rpe || null,
      maxWeightSet.data.rir || null
    )
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
    })
  }, [exercise])

  useEffect(() => {
    const getExerciseDetails = async () => {
      setIsLoading(true)
      console.log(weightMetric, intensityMetric)
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
        const data = (await res.json()) as ExerciseDetails
        setExercise(data)
      } catch (error: any) {
      } finally {
        setIsLoading(false)
      }
    }
    getExerciseDetails()
  }, [id])

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
      value: estimate1RM(),
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
        style={tw`px-3 py-1 rounded-lg border ${
          isPrimary
            ? 'border-primary bg-primary/10'
            : 'border-light-grayTertiary dark:border-dark-grayTertiary'
        }`}
      >
        <Txt
          twcn={`text-xs ${
            isPrimary
              ? 'text-primary'
              : 'text-light-grayText dark:text-dark-grayText'
          }`}
        >
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
        style={tw`flex-1 p-2.5 rounded-2xl bg-white dark:bg-dark-grayPrimary`}
      >
        <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
          {s.label}
        </Txt>
        <Txt twcn="font-poppinsSemiBold text-base">{s.value}</Txt>
      </View>
    )
  })

  const description = exercise?.description ? (
    <Txt twcn="mb-6 font-poppinsItalic">{exercise.description}</Txt>
  ) : (
    <Button
      onPress={() => {
        router.push({
          pathname: '/exercise-form',
          params: {
            exerciseId: id,
          },
        })
      }}
    >
      <Txt twcn="font-poppinsSemiBold text-primary">Add Description</Txt>
    </Button>
  )

  const keyStats = (
    <View>
      <Txt twcn="font-poppinsMedium mb-4">Key Stats</Txt>
      <View style={tw`gap-2`}>
        <View style={tw`flex-row gap-2`}>{renderedStats.slice(0, 2)}</View>
        <View style={tw`flex-row gap-2`}>{renderedStats.slice(2, 5)}</View>
        <View style={tw`flex-row gap-2`}>{renderedStats.slice(5)}</View>
      </View>
    </View>
  )

  const musclesWorked = exercise && (
    <View>
      <View style={tw`flex-row justify-between items-center mb-4`}>
        <Txt twcn="font-poppinsMedium">Muscles Worked</Txt>
        <Button
          onPress={() => {
            router.push({
              pathname: '/exercise-form',
              params: {
                exerciseId: id,
              },
            })
          }}
        >
          <Txt twcn="font-poppinsSemiBold text-primary">Edit</Txt>
        </Button>
      </View>
      <View style={tw`flex-row flex-wrap gap-2 items-center`}>
        {renderedMuscleGroups}
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

  // header: date, exnum, setnum, reps, part. rpe/rir
  // make history be consistent in weight.

  const renderedHistory = exercise?.history.map((entry) => {
    let previousDate = null as string | null
    let needsDate = true

    return (
      <View
        key={entry.workoutId}
        style={tw`border-b border-light-grayTertiary dark:border-dark-grayTertiary py-1`}
      >
        {entry.sets.map((set) => {
          if (entry.date === previousDate) needsDate = false
          previousDate = entry.date

          return (
            <View
              key={set.setNumber}
              style={tw`flex-row items-center py-0.5`}
            >
              <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText flex-1">
                {needsDate ? entry.date : ' '}
              </Txt>
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
      </View>
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
