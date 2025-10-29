import { Alert, StyleSheet, View } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import { router, useFocusEffect, useNavigation } from 'expo-router'
import Button from '../../components/button'
import {
  ChevronRight,
  Dumbbell,
  ListFilter,
  Plus,
  Search,
  X,
} from 'lucide-react-native'
import Colors from '../../constants/colors'
import tw from '../../tw'
import MyModal from '../../components/modal'
import { MUSCLE_GROUPS } from '../../constants/data'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import Spinner from '../../components/activity-indicator'
import useTheme from '../hooks/theme'
import Input from '../../components/input'
import {
  useExerciseStore,
  useExerciseTabStore,
} from '../../stores/exercise-store'

type ExerciseMinimal = {
  id: string
  name: string
  primaryMuscleGroup: (typeof MUSCLE_GROUPS)[number]
  secondaryMuscleGroups: (typeof MUSCLE_GROUPS)[number][]
}

const Exercises = () => {
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false)
  const [exercises, setExercises] = useState<ExerciseMinimal[]>([])
  const [filteredExercises, setFilteredExercises] = useState<ExerciseMinimal[]>(
    []
  )
  const [muscleGroupFilters, setMuscleGroupFilters] = useState<
    (typeof MUSCLE_GROUPS)[number][]
  >([])
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
      const data = await res.json()
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

  const navigation = useNavigation()
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        if (exercises.length === 0) return
        return (
          <View style={tw`mr-4`}>
            <Button
              onPress={() => setIsFiltersModalOpen(true)}
              twcn="bg-primary/10 rounded-2xl p-2"
            >
              <ListFilter
                size={20}
                color={Colors.primary}
              />
            </Button>
          </View>
        )
      },
    })
  }, [navigation, exercises])

  const applyAllFilters = (
    searchText: string = searchQuery,
    muscleFilters: (typeof MUSCLE_GROUPS)[number][] = muscleGroupFilters
  ) => {
    const filtered = exercises.filter((exercise) => {
      // Search filter - must match if search text exists
      const matchesSearch =
        !searchText.trim() ||
        exercise.name.toLowerCase().includes(searchText.toLowerCase())

      // Muscle group filter - must match ALL selected muscle groups (AND logic)
      const allMuscleGroups = [
        exercise.primaryMuscleGroup,
        ...(exercise.secondaryMuscleGroups || []),
      ].map((mg) => mg?.toLowerCase())

      const matchesMuscleGroups =
        muscleFilters.length === 0 ||
        muscleFilters.every((filter) =>
          allMuscleGroups.includes(filter.toLowerCase())
        )

      return matchesSearch && matchesMuscleGroups
    })

    setFilteredExercises(filtered)
  }

  const handleSearchChange = (text: string) => {
    setSearchQuery(text)
    applyAllFilters(text, muscleGroupFilters)
  }

  const handleFilterMuscleGroup = (
    muscleGroup: (typeof MUSCLE_GROUPS)[number]
  ) => {
    let updatedFilters = [...muscleGroupFilters]
    if (muscleGroupFilters.includes(muscleGroup)) {
      updatedFilters = updatedFilters.filter((mg) => mg !== muscleGroup)
    } else {
      updatedFilters.push(muscleGroup)
    }
    setMuscleGroupFilters(updatedFilters)
    applyAllFilters(searchQuery, updatedFilters)
  }

  const renderedMuscleGroups = MUSCLE_GROUPS.map((m) => {
    const isSelected = muscleGroupFilters.includes(m)
    return (
      <Button
        key={m}
        onPress={() => handleFilterMuscleGroup(m)}
        style={tw`px-3 py-1.5 ${isSelected ? 'bg-primary/10 dark:bg-primary./10 border-primary' : 'border-light-grayBorder dark:border-dark-grayBorder'} rounded-lg border`}
      >
        <Txt
          twcn={`text-xs ${isSelected ? 'text-primary dark:text-primary' : 'text-light-grayText dark:text-dark-grayText'}`}
        >
          {m}
        </Txt>
      </Button>
    )
  })

  const renderedExercises =
    filteredExercises &&
    filteredExercises.map((exercises) => {
      return (
        <Button
          key={exercises.id}
          onPress={() => {
            router.push({
              pathname: '/exercise-details',
              params: {
                id: exercises.id,
              },
            })
          }}
          twcn="flex-row items-center justify-between p-4 border-b border-light-grayBorder dark:border-dark-grayBorder"
        >
          <View style={tw`gap-0`}>
            <Txt twcn="text-sm">{exercises.name}</Txt>
            {(exercises.primaryMuscleGroup ||
              exercises.secondaryMuscleGroups.length > 0) && (
              <>
                <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
                  {exercises.primaryMuscleGroup
                    ?.split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                  {exercises.secondaryMuscleGroups.length > 0
                    ? `${exercises.primaryMuscleGroup ? ' • ' : ''}${exercises.secondaryMuscleGroups
                        .map((mg) =>
                          mg
                            .split(' ')
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(' ')
                        )
                        .join(', ')}`
                    : ''}
                </Txt>
              </>
            )}
          </View>
          <ChevronRight
            size={20}
            color={theme.grayText}
          />
        </Button>
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
    <SafeView twcnContentView="px-0">
      <View
        style={tw`px-3 mx-4 mb-2 h-10 border border-light-grayBorder dark:border-dark-grayBorder rounded-xl flex-row items-center justify-between gap-2 bg-white dark:bg-dark-grayPrimary`}
      >
        <Search
          size={16}
          color={theme.grayText}
        />
        <Input
          twcnInput="flex-1"
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        <Button onPress={() => handleSearchChange('')}>
          <X
            size={16}
            color={theme.grayText}
          />
        </Button>
      </View>
      <View>{renderedExercises}</View>
      <MyModal
        isOpen={isFiltersModalOpen}
        setIsOpen={setIsFiltersModalOpen}
      >
        <Txt twcn="font-poppinsMedium text-xs uppercase tracking-wide text-light-grayText dark:text-dark-grayText">
          Filter by Muscle Groups
        </Txt>
        <View style={tw`flex-row flex-wrap gap-1.5`}>
          {renderedMuscleGroups}
        </View>
      </MyModal>
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
