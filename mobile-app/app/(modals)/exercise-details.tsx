import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { Link, router, useLocalSearchParams, useNavigation } from 'expo-router'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import { useState } from 'react'
import { MUSCLE_GROUPS } from '../../constants/data'
import { MuscleGroup } from '../../utils/types'
import { Set } from '../../context/workout-form-context'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import Spinner from '../../components/activity-indicator'
import { capString } from '../../functions/cap-string'
import useTheme from '../hooks/theme'
import tw from '../../tw'
import Button from '../../components/button'
import { useUserStore } from '../../stores/user-store'
import LineChart from '../../components/line-chart'

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
    exerciseNumber: number
    sets: Set[]
  }
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

function estimate1RM(weight: number, reps: number, rpe: number) {
  const rir = 10 - rpe
  const fatigueFactor = 0.025 * reps + 0.01 * rir
  return weight / (1 - fatigueFactor)
}

const ExerciseDetails = () => {
  const { id } = useLocalSearchParams()
  const { fetchWithAuth } = useAuth()
  const { theme } = useTheme()
  const { preferences } = useUserStore()
  const [exercise, setExercise] = useState<ExerciseDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const navigation = useNavigation()

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
      try {
        const res = await fetchWithAuth(`${BASE_URL}/api/exercises/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const data = await res.json()
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
        preferences?.weightMetric === 'lbs'
          ? `${exercise?.stats.pr} lbs`
          : `${Math.round((exercise?.stats.pr as number) * 0.453592)} kg`,
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
      label: '🎯 Est. 1RM',
      value: '330 lbs',
    },
    {
      label: 'Avg. Sets',
      value: Number(
        Math.round(
          (exercise?.stats.totalSets as number) /
            (exercise?.stats.totalWorkouts as number)
        )
      ).toFixed(1),
    },
    {
      label: 'Avg. Reps',
      value: Number(
        Math.round(
          (exercise?.stats.totalReps as number) /
            (exercise?.stats.totalSets as number)
        )
      ).toFixed(1),
    },
    {
      label: 'Freq.',
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
        style={tw`px-3 py-1 rounded-xl border ${
          isPrimary
            ? 'border-primary bg-primary/10'
            : 'border-light-grayTertiary dark:border-dark-grayTertiary'
        }`}
      >
        <Txt
          twcn={`${
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

  const renderedStats = stats.map((s) => {
    return (
      <View
        key={s.label}
        style={tw`justify-center items-center flex-1`}
      >
        <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-poppinsMedium">
          {s.label}
        </Txt>
        <Txt twcn="font-poppinsSemiBold text-lg">{s.value}</Txt>
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
    <View style={tw`rounded-2xl bg-white p-4`}>
      <View style={tw`flex-row justify-between gap-0 mb-4`}>
        {renderedStats.slice(0, 4)}
      </View>
      <View style={tw`flex-row justify-between gap-0`}>
        {renderedStats.slice(4)}
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

  const progressionChart =
    exercise &&
    (() => {
      const allData = [
        ...exercise.stats.progressionChart.map((point) => ({
          value: point.data.weight,
          date: point.date,
        })),
        // Temporary extra data points for testing
        ...Array.from({ length: 50 }, (_, i) => ({
          value: 135 + Math.random() * 50,
          date: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
        })),
      ]

      // Determine how many labels to show based on dataset size
      const totalPoints = allData.length
      const maxLabels = 10 // Maximum number of labels to display
      const labelInterval = Math.ceil(totalPoints / maxLabels)

      return (
        <View>
          <Txt twcn="font-poppinsMedium mb-4">Progress</Txt>
          <LineChart
            data={allData.map((point, index) => ({
              value: point.value,
              // Only show label at intervals
              label:
                index % labelInterval === 0 || index === totalPoints - 1
                  ? new Date(point.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : undefined,
            }))}
          />
        </View>
      )
    })()

  return isLoading ? (
    <Spinner text="Gathering data..." />
  ) : (
    <SafeView twcnContentView="gap-6">
      {description}
      {keyStats}
      {musclesWorked}
      {progressionChart}
    </SafeView>
  )
}

export default ExerciseDetails

const styles = StyleSheet.create({})
