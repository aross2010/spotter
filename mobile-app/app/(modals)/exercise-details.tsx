import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import { useState } from 'react'
import { MUSCLE_GROUPS } from '../../constants/data'
import { MuscleGroup } from '../../utils/types'
import { Set } from '../../context/workout-form-context'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import Spinner from '../../components/activity-indicator'

type ExerciseDetails = {
  id: string
  name: string
  primaryMuscleGroup: MuscleGroup
  secondaryMuscleGroups: MuscleGroup[]
  isUnilateral: boolean
  notes?: string
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
    }
  }
}

const ExerciseDetails = () => {
  const { id } = useLocalSearchParams()
  const { fetchWithAuth } = useAuth()
  const [exercise, setExercise] = useState<ExerciseDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const navigation = useNavigation()

  useEffect(() => {
    console.log(exercise)
  }, [exercise])

  useEffect(() => {
    navigation.setOptions({
      headerTitle: exercise ? exercise.name : 'Exercise Details',
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

  return isLoading ? (
    <Spinner text="Gathering data..." />
  ) : (
    <SafeView>
      <Txt>{id}</Txt>
    </SafeView>
  )
}

export default ExerciseDetails

const styles = StyleSheet.create({})
