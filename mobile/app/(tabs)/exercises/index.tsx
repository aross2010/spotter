import { Alert, Keyboard, ScrollView, StyleSheet, View } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { router, useFocusEffect } from 'expo-router'
import Button from '../../../components/button'
import { ChevronRight, Dumbbell, Plus, Search, X } from 'lucide-react-native'
import Colors from '../../../constants/colors'
import tw from '../../../tw'
import { MUSCLE_GROUPS } from '../../../constants/data'
import { useAuth } from '../../../context/auth-context'
import { BASE_URL } from '../../../constants/auth'
import Spinner from '../../../components/activity-indicator'
import useTheme from '../../hooks/theme'
import Input from '../../../components/input'
import {
  useExerciseStore,
  useExerciseTabStore,
} from '../../../stores/exercise-store'
import { toTitleCase } from '../../../functions/utils'

type ExerciseMinimal = {
  id: string
  name: string
  primaryMuscleGroup: (typeof MUSCLE_GROUPS)[number] | null
  secondaryMuscleGroups: (typeof MUSCLE_GROUPS)[number][]
}

const Exercises = () => {
  const [exercises, setExercises] = useState<ExerciseMinimal[]>([])
  const [filteredExercises, setFilteredExercises] = useState<ExerciseMinimal[]>(
    []
  )
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { fetchWithAuth, authUser } = useAuth()
  const { theme } = useTheme()
  const { shouldRefresh, clearRefresh } = useExerciseTabStore()

  const getExercises = async () => {
    if (!authUser) return
    try {
      setIsLoading(true)
      const res = await fetchWithAuth(
        `${BASE_URL}/api/exercises/user/${authUser?.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      const data: ExerciseMinimal[] = await res.json()
      setExercises(data)
      setFilteredExercises(data)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (shouldRefresh) {
        getExercises()
        clearRefresh()
      }
      return () => {}
    }, [shouldRefresh])
  )

  useEffect(() => {
    getExercises()
  }, [])

  const handleSearchChange = (text: string) => {
    setSearchQuery(text)

    if (!text.trim()) {
      setFilteredExercises(exercises)
      return
    }

    const filtered = exercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(text.toLowerCase())
    )
    setFilteredExercises(filtered)
  }

  const renderedExercises = filteredExercises.map((exercise, index) => {
    const prevExercise = index > 0 ? filteredExercises[index - 1] : null
    const showMuscleGroupHeader =
      !prevExercise ||
      prevExercise.primaryMuscleGroup !== exercise.primaryMuscleGroup

    const nextExercise =
      index < filteredExercises.length - 1 ? filteredExercises[index + 1] : null
    const isLastInGroup =
      !nextExercise ||
      nextExercise.primaryMuscleGroup !== exercise.primaryMuscleGroup

    return (
      <View key={exercise.id}>
        {showMuscleGroupHeader && (
          <View style={tw`${index === 0 ? 'mb-4' : 'my-4'}`}>
            <Txt twcn="font-poppinsSemiBold text-base">
              {exercise.primaryMuscleGroup
                ? toTitleCase(exercise.primaryMuscleGroup as string)
                : 'Unknown'}
            </Txt>
          </View>
        )}
        <Button
          onPress={() => {
            router.push({
              pathname: '/exercise-details',
              params: {
                id: exercise.id,
              },
            })
          }}
          twcn={`p-4 bg-white dark:bg-dark-grayPrimary flex-row items-center justify-between ${
            showMuscleGroupHeader ? 'rounded-t-2xl' : ''
          } ${
            isLastInGroup
              ? 'rounded-b-2xl'
              : 'border-b border-light-grayBorder dark:border-dark-grayBorder'
          } ${index === filteredExercises.length - 1 ? 'mb-4' : ''}`}
        >
          <Txt twcn="text-sm">{exercise.name}</Txt>
          <ChevronRight
            size={20}
            color={theme.grayText}
          />
        </Button>
      </View>
    )
  })

  const exercisesPrompt = (
    <SafeView
      hasTabBar
      scroll={false}
    >
      <View style={tw`flex-1 items-center justify-center px-16`}>
        <Dumbbell
          color={Colors.primary}
          strokeWidth={1}
          size={64}
        />
        <Txt twcn="text-xl font-poppinsMedium text-center mt-6 mb-3">
          Your Exercises
        </Txt>
        <Txt twcn="text-center text-sm text-light-grayText dark:text-dark-grayText">
          View and manage your exercise library when you log workouts
        </Txt>
        <Button
          onPress={() => router.push('/workout-form')}
          text="Log your first workout"
          twcn="mt-6 py-4 w-full items-center flex-row justify-center rounded-full bg-primary"
          twcnText="font-poppinsMedium text-dark-text"
        >
          <Plus
            color={Colors.dark.text}
            size={16}
            style={tw`ml-2`}
          />
        </Button>
      </View>
    </SafeView>
  )

  const exercisesView = (
    <SafeView
      hasTabBar
      scroll
      twcnContentView="mb-0"
    >
      {renderedExercises}
    </SafeView>
  )

  return isLoading ? (
    <Spinner />
  ) : exercises.length > 0 ? (
    exercisesView
  ) : (
    exercisesPrompt
  )
}

export default Exercises

const styles = StyleSheet.create({})
