import { View } from 'react-native'
import React, { useEffect, useState } from 'react'
import Txt from './text'
import tw from '../tw'
import { Link } from 'expo-router'
import { useUserStore } from '../stores/user-store'
import { useAuth } from '../context/auth-context'
import { BASE_URL } from '../constants/auth'
import Spinner from './activity-indicator'
import { ScrollView } from 'react-native-gesture-handler'
import { useWorkoutForm } from '../context/workout-form-context'
import { ExerciseDetailsMini } from '../utils/types'
import { toTitleCase } from '../functions/utils'

type ExerciseMiniHistoryProps = {
  id: string
  exerciseIndex: number
  workoutDate: string
}

const ExerciseMiniHistory = ({
  id,
  exerciseIndex,
  workoutDate,
}: ExerciseMiniHistoryProps) => {
  const { preferences } = useUserStore()
  const { fetchWithAuth } = useAuth()
  const { workoutData, updateExerciseDetails } = useWorkoutForm()

  const cachedDetails = workoutData.exercises[exerciseIndex]?.details
  const [isLoading, setIsLoading] = useState(cachedDetails?.loading ?? true)
  const [exercise, setExercise] = useState<ExerciseDetailsMini | null>(
    cachedDetails?.data ?? null,
  )

  const weightMetric = preferences?.weightMetric || 'lbs'
  const intensityMetric = preferences?.intensityMetric || 'rpe'

  useEffect(() => {
    // If we already have cached data, use it
    if (cachedDetails?.data && !cachedDetails?.loading) {
      setExercise(cachedDetails.data)
      setIsLoading(false)
      return
    }

    const fetchExercise = async () => {
      setIsLoading(true)
      updateExerciseDetails(exerciseIndex, null, true)

      try {
        const res = await fetchWithAuth(
          `${BASE_URL}/api/exercises/mini/${id}?weight=${weightMetric}&intensity=${intensityMetric}&date=${workoutDate}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
        const data = (await res.json()) as ExerciseDetailsMini
        setExercise(data)
        updateExerciseDetails(exerciseIndex, data, false)
      } catch (error) {
        console.error('Error fetching exercise mini history:', error)
        updateExerciseDetails(exerciseIndex, null, false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchExercise()
  }, [id, weightMetric, intensityMetric])

  // Convert date from yyyy-mm-dd to mm/dd/yy
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-')
    return `${month}/${day}/${year.slice(2)}`
  }

  const renderedHistory =
    exercise?.history &&
    exercise.history.map((entry) => {
      let previousDate = null as string | null
      let needsDate = true

      return (
        <Link
          href={`/workout-details?id=${entry.workoutId}&from=exercise`}
          key={entry.workoutId}
          style={tw`border-b border-light-grayBorder dark:border-dark-grayBorder py-1`}
        >
          {entry.sets.map((set, index) => {
            if (entry.date === previousDate) needsDate = false
            previousDate = entry.date

            // For unilateral exercises, determine if this is L or R
            const isUnilateral = exercise?.isUnilateral
            const setLabel = isUnilateral
              ? `${entry.exerciseNumber}.${set.setNumber}${index % 2 === 0 ? 'L' : 'R'}`
              : set.setNumber.toString()

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
                <Txt twcn="text-xs flex-1 text-center">{set.reps}</Txt>
                <Txt twcn="text-xs flex-1 text-center">
                  {set.partials ? set.partials : ''}
                </Txt>
                <Txt twcn="text-xs flex-1 text-center">
                  {set.intensity || set.intensity === 0 ? set.intensity : ''}
                </Txt>
              </View>
            )
          })}
        </Link>
      )
    })

  const content = (
    <>
      {isLoading ? (
        <Spinner fullScreen={false} />
      ) : exercise ? (
        <>
          <Txt twcn={`font-semibold text-lg mb-4`}>{exercise.name}</Txt>
          {exercise.description && (
            <Txt twcn="text-light-grayText dark:text-dark-grayText mb-4">
              {exercise.description}
            </Txt>
          )}

          {exercise.history && exercise.history.length > 0 && (
            <View>
              <Txt twcn="font-semibold mb-4">Recent Sets</Txt>
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
          )}

          {!exercise.history && (
            <>
              <Txt twcn="font-semibold mb-2">Recent Sets</Txt>
              <Txt twcn="text-light-grayText dark:text-dark-grayText flex-1">
                No Exercise History available.
              </Txt>
            </>
          )}
        </>
      ) : null}
    </>
  )

  return (
    <ScrollView
      showsHorizontalScrollIndicator={false}
      style={tw`gap-4 max-h-80`}
    >
      {content}
    </ScrollView>
  )
}

export default ExerciseMiniHistory
