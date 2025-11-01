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

type ExerciseDetailsMini = {
  id: string
  name: string
  description?: string
  isUnilateral: boolean
  history?: {
    workoutId: string
    date: string
    exerciseNumber: number
    sets: {
      setNumber: number
      weight: number
      reps: number
      partials?: number
      intensity?: number
    }[]
  }[]
}

type ExerciseMiniHistoryProps = {
  id: string
}

const ExerciseMiniHistory = ({ id }: ExerciseMiniHistoryProps) => {
  const { preferences } = useUserStore()
  const { fetchWithAuth } = useAuth()
  const [exercise, setExercise] = useState<ExerciseDetailsMini | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const weightMetric = preferences?.weightMetric || 'lbs'
  const intensityMetric = preferences?.intensityMetric || 'rpe'

  useEffect(() => {
    const fetchExercise = async () => {
      setIsLoading(true)
      try {
        const res = await fetchWithAuth(
          `${BASE_URL}/api/exercises/mini/${id}?weight=${weightMetric}&intensity=${intensityMetric}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
        const data = (await res.json()) as ExerciseDetailsMini
        setExercise(data)
      } catch (error) {
        console.error('Error fetching exercise mini history:', error)
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
                  {set.partials ? set.partials : '-'}
                </Txt>
                <Txt twcn="text-xs flex-1 text-center">
                  {set.intensity || set.intensity === 0 ? set.intensity : '-'}
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
        <Spinner />
      ) : exercise ? (
        <>
          <Txt twcn={`font-poppinsMedium text-lg mb-2`}>{exercise.name}</Txt>
          {exercise.description && (
            <Txt twcn="text-light-grayText dark:text-dark-grayText mb-4">
              {exercise.description}
            </Txt>
          )}

          {exercise.history && exercise.history.length > 0 && (
            <View>
              <Txt twcn="font-poppinsMedium mb-4">Recent Sets</Txt>
              <View
                style={tw`flex-row items-center border-b border-light-grayBorder dark:border-dark-grayBorder`}
              >
                <Txt twcn="uppercase text-light-grayText dark:text-dark-grayText text-xs flex-1">
                  Date
                </Txt>
                {!exercise.isUnilateral && (
                  <Txt twcn="uppercase text-light-grayText dark:text-dark-grayText text-xs flex-1 text-center">
                    Ex.
                  </Txt>
                )}
                {exercise.isUnilateral && (
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
          )}

          {!exercise.history && (
            <>
              <Txt twcn="font-poppinsMedium mb-4">Recent Sets</Txt>
              <Txt twcn="text-light-grayText dark:text-dark-grayText flex-1">
                No Exercise History available.
              </Txt>
            </>
          )}
        </>
      ) : null}
    </>
  )

  return <ScrollView style={tw`gap-4 h-72`}>{content}</ScrollView>
}

export default ExerciseMiniHistory
