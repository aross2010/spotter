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
import { useAuth } from '../../../context/auth-context'
import { BASE_URL } from '../../../constants/auth'
import Spinner from '../../../components/activity-indicator'
import tw from '../../../tw'
import Button from '../../../components/button'
import { useUserStore } from '../../../stores/user-store'
import LineChart from '../../../components/line-chart'
import { GlassView } from 'expo-glass-effect'
import Colors from '../../../constants/colors'
import { handleShareExercise } from '../../../functions/share'
import { useExerciseStore } from '../../../stores/exercise-store'
import { ExerciseDetails as ExerciseDetailsType } from '../../../utils/types'
import { estimate1RM } from '../../../functions/one-rm'
import SFIcon from '../../../components/sf-icon'
import { toTitleCase } from '../../../functions/utils'

const ExerciseDetails = () => {
  const { id } = useLocalSearchParams()
  const { fetchWithAuth } = useAuth()
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
        },
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
      title: exercise.name ?? 'Exercise Details',
      headerRight: () => (
        <View style={tw`flex-row items-center gap-6 px-2`}>
          <Button
            onPress={() => {
              navigateToEdit()
            }}
          >
            <SFIcon
              name="pencil"
              size={26}
              color={Colors.primary}
            />
          </Button>

          <Button
            onPress={() =>
              handleShareExercise(exercise, weightMetric, intensityMetric)
            }
          >
            <SFIcon
              name="square.and.arrow.up"
              size={26}
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
    }, [shouldRefresh]),
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
        (exercise?.stats.totalSets as number) /
          (exercise?.stats.totalWorkouts as number),
      ).toFixed(1),
    },
    {
      label: 'Reps/Set',
      value: Number(
        (exercise?.stats.totalReps as number) /
          (exercise?.stats.totalSets as number),
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
        <Txt twcn={`text-xs text-primary dark:text-primary`}>
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
        style={tw`flex-1 p-2.5 ${index === 0 ? 'rounded-tl-xl' : index == 1 ? 'rounded-tr-xl' : index == 5 ? 'rounded-bl-xl' : index == 7 ? 'rounded-br-xl' : ''} bg-white dark:bg-dark-grayPrimary`}
      >
        <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
          {s.label}
        </Txt>
        <Txt twcn="font-semibold text-base">{s.value}</Txt>
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
      <Txt twcn="font-semibold text-lg mb-2">Key Stats</Txt>
      <View style={tw`gap-1`}>
        <View style={tw`flex-row gap-1`}>{renderedStats.slice(0, 2)}</View>
        <View style={tw`flex-row gap-1`}>{renderedStats.slice(2, 5)}</View>
        <View style={tw`flex-row gap-1`}>{renderedStats.slice(5)}</View>
      </View>
    </View>
  )

  const musclesWorked = exercise &&
    (exercise.primaryMuscleGroup ||
      exercise?.secondaryMuscleGroups.length > 0) && (
      <View>
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <Txt twcn="font-semibold text-lg">
            Muscle{muscleGroups && muscleGroups.length > 1 ? 's' : ''} Worked
          </Txt>
          <Button onPress={() => navigateToEdit()}>
            <Txt twcn="font-semibold text-primary dark:text-primary">Edit</Txt>
          </Button>
        </View>
        <View style={tw`flex-row flex-wrap gap-2 items-center`}>
          {renderedMuscleGroups}
          <View
            style={tw`px-3 py-1 rounded-lg border border-secondary bg-secondary/10 flex-row items-center gap-2`}
          >
            {exercise.isUnilateral ? (
              <>
                <Txt twcn={`text-xs text-secondary dark:text-secondary`}>
                  Unilateral
                </Txt>
              </>
            ) : (
              <>
                <Txt twcn={`text-xs text-secondary dark:text-secondary`}>
                  Bilateral
                </Txt>
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
      <GlassView
        key={date}
        style={tw`p-2 pr-4 max-w-[250px] overflow-hidden rounded-2xl shadow-md`}
      >
        <Txt twcn="text-light-grayText dark:text-dark-grayText text-xs mb-1">
          {formattedDate} {point.data.location ? `- ${data.location}` : ''}
        </Txt>
        <Txt twcn="text-xs">
          {weightMetric === 'kgs' ? data.weight.toFixed(1) : data.weight}{' '}
          {weightMetric} x {data.reps}
          {hasIntensity &&
            ` @ ${data.rir ? `RIR ${data.rir}` : `RPE ${data.rpe}`}`}{' '}
          ({point.data.est1RM} {weightMetric})
        </Txt>
      </GlassView>
    )
  })

  const progressionChart =
    exercise &&
    (() => {
      // Add 50 random test data points
      const allData = [
        ...exercise.stats.progressionChart.map((point) => ({
          weight: point.data.weight,
          est1RM: point.data.est1RM,
          reps: point.data.reps,
          date: point.date,
          ...(point.data.location ? { location: point.data.location } : {}),
        })),
      ]

      return (
        <View style={tw`overflow-visible`}>
          <Txt twcn="font-semibold mb-2 text-lg">Progression (Est. 1RM)</Txt>
          {allData.length > 1 ? (
            <LineChart
              data={allData}
              xKey="date"
              yKey="est1RM"
              maxXLabels={5}
              formatXLabel={(dateStr) => {
                try {
                  // Parse as UTC to avoid timezone shifting
                  const date = new Date(dateStr)
                  const month = date.getUTCMonth() + 1
                  const day = date.getUTCDate()
                  const year = String(date.getUTCFullYear()).slice(-2)
                  return `${month}/${day}/${year}`
                } catch {
                  return ''
                }
              }}
              formatYLabel={(val) => {
                if (weightMetric === 'kgs') {
                  return `${val.toFixed(1)} ${weightMetric}`
                } else {
                  // For lbs, show decimal if it's a half value, otherwise whole number
                  return val % 1 === 0
                    ? `${val} ${weightMetric}`
                    : `${val.toFixed(1)} ${weightMetric}`
                }
              }}
              toolTips={renderedToolTips}
            />
          ) : (
            <Txt twcn="text-light-grayText dark:text-dark-grayText">
              Perform {exercise.name} in multiple workouts to see progression
              over time.
            </Txt>
          )}
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
        style={tw`border-b border-light-grayBorder dark:border-dark-grayBorder py-1`}
      >
        {entry.sets.map((set, index) => {
          if (entry.date === previousDate) needsDate = false
          previousDate = entry.date

          const isUnilateral = exercise.isUnilateral

          // For unilateral exercises, check if we should skip this set (if it's a right set that matches left)
          if (isUnilateral && index % 2 === 1) {
            const leftSet = entry.sets[index - 1]
            const rightSet = set

            // Check if left and right sets have matching values
            const sameWeight = leftSet.weight === rightSet.weight
            const sameReps = leftSet.reps === rightSet.reps
            const samePartials =
              (leftSet.partials || 0) === (rightSet.partials || 0)
            const sameIntensity =
              (leftSet.intensity || 0) === (rightSet.intensity || 0)

            if (sameWeight && sameReps && samePartials && sameIntensity) {
              return null // Skip right set when it matches left
            }
          }

          // Determine set label and values
          let setLabel: string
          let repsValue: string | number
          let partialsValue: string | number
          let intensityValue: string | number

          if (isUnilateral) {
            if (index % 2 === 0 && index + 1 < entry.sets.length) {
              const leftSet = set
              const rightSet = entry.sets[index + 1]

              const sameWeight = leftSet.weight === rightSet.weight
              const sameReps = leftSet.reps === rightSet.reps
              const samePartials =
                (leftSet.partials || 0) === (rightSet.partials || 0)
              const sameIntensity =
                (leftSet.intensity || 0) === (rightSet.intensity || 0)

              if (sameWeight && sameReps && samePartials && sameIntensity) {
                // Show combined L/R
                setLabel = `${set.setNumber} L/R`
                repsValue = set.reps
                partialsValue = set.partials || ' '
                intensityValue =
                  set.intensity || set.intensity === 0 ? set.intensity : ' '
              } else {
                // Show L
                setLabel = `${set.setNumber}L`
                repsValue = set.reps
                partialsValue = set.partials || ' '
                intensityValue =
                  set.intensity || set.intensity === 0 ? set.intensity : ' '
              }
            } else {
              // This is a right set that doesn't match left
              setLabel = `${set.setNumber}R`
              repsValue = set.reps
              partialsValue = set.partials || ' '
              intensityValue =
                set.intensity || set.intensity === 0 ? set.intensity : ' '
            }
          } else {
            setLabel = set.setNumber.toString()
            repsValue = set.reps
            partialsValue = set.partials || ' '
            intensityValue =
              set.intensity || set.intensity === 0 ? set.intensity : ' '
          }

          return (
            <View
              key={`${entry.workoutId}-${set.setNumber}-${index}`}
              style={tw`flex-row items-center py-0.5`}
            >
              <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText flex-1">
                {needsDate ? formatDate(entry.date) : ' '}
              </Txt>
              {!isUnilateral && (
                <Txt twcn="text-xs flex-1 text-center">
                  {entry.exerciseNumber}
                </Txt>
              )}
              {isUnilateral && (
                <Txt twcn="text-xs flex-1 text-center">{setLabel}</Txt>
              )}
              <Txt twcn="text-xs flex-1 text-center">
                {weightMetric === 'kgs' ? set.weight.toFixed(1) : set.weight}
              </Txt>
              <Txt twcn="text-xs flex-1 text-center">{repsValue}</Txt>
              <Txt twcn="text-xs flex-1 text-center">{partialsValue}</Txt>
              <Txt twcn="text-xs flex-1 text-center">{intensityValue}</Txt>
            </View>
          )
        })}
      </Link>
    )
  })

  const history = exercise && (
    <View>
      <Txt twcn="font-semibold mb-2 text-lg">History</Txt>
      <View
        style={tw`flex-row items-center border-b border-light-grayBorder dark:border-dark-grayBorder`}
      >
        <Txt twcn=" text-light-grayText dark:text-dark-grayText text-sm flex-1">
          Date
        </Txt>

        {!exercise.isUnilateral && (
          <Txt twcn=" text-light-grayText dark:text-dark-grayText text-sm flex-1 text-center">
            Ex.
          </Txt>
        )}
        {exercise.isUnilateral && (
          <Txt twcn=" text-light-grayText dark:text-dark-grayText text-sm flex-1 text-center">
            Set
          </Txt>
        )}
        <Txt twcn=" text-light-grayText dark:text-dark-grayText text-sm flex-1 text-center">
          {toTitleCase(weightMetric)}
          {weightMetric === 'lbs' && '.'}
        </Txt>
        <Txt twcn=" text-light-grayText dark:text-dark-grayText text-sm flex-1 text-center">
          Reps
        </Txt>
        <Txt twcn=" text-light-grayText dark:text-dark-grayText text-sm flex-1 text-center">
          Part.
        </Txt>
        <Txt twcn=" text-light-grayText dark:text-dark-grayText text-sm flex-1 text-center">
          {intensityMetric.toLocaleUpperCase()}
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
