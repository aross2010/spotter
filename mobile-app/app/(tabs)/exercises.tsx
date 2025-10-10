import { Alert, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import { router, useNavigation } from 'expo-router'
import Button from '../../components/button'
import { ChevronRight, ListFilter, Search, X } from 'lucide-react-native'
import Colors from '../../constants/colors'
import tw from '../../tw'
import MyModal from '../../components/modal'
import { MUSCLE_GROUPS } from '../../constants/data'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import Spinner from '../../components/activity-indicator'
import useTheme from '../hooks/theme'
import Input from '../../components/input'

type ExerciseMinimal = {
  id: string
  name: string
  used: string
  primaryMuscleGroup: (typeof MUSCLE_GROUPS)[number]
  secondaryMuscleGroups: (typeof MUSCLE_GROUPS)[number][]
}

const Exercises = () => {
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false)
  const [exercises, setExercises] = useState<ExerciseMinimal[]>([])
  const [filteredExercises, setFilteredExercises] = useState<ExerciseMinimal[]>(
    []
  )
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { fetchWithAuth, authUser } = useAuth()
  const { theme } = useTheme()

  useEffect(() => {
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
    getExercises()
  }, [])

  const navigation = useNavigation()
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
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
  }, [navigation])

  const handleSearchChange = (text: string) => {
    setSearchQuery(text)
    const filtered = exercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(text.toLowerCase())
    )
    setFilteredExercises(filtered)
  }

  const renderedMuscleGroups = MUSCLE_GROUPS.map((m) => {
    return (
      <Button
        key={m}
        style={tw`px-3 py-1.5 bg-white dark:bg-dark-grayPrimary rounded-lg border border-light-grayTertiary/50 dark:border-dark-grayTertiary/50`}
      >
        <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
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
              pathname: '/exercise',
              params: {
                exerciseId: exercises.id,
              },
            })
          }}
          twcn="flex-row items-center justify-between p-4 border-b border-light-grayTertiary/50 dark:border-dark-grayTertiary/50"
        >
          <View style={tw`gap-0`}>
            <Txt>{exercises.name}</Txt>
            <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText">
              {exercises.primaryMuscleGroup
                ?.split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')}{' '}
              {exercises.secondaryMuscleGroups.length > 0
                ? `• ${exercises.secondaryMuscleGroups
                    .map((mg) =>
                      mg
                        .split(' ')
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(' ')
                    )
                    .join(', ')}`
                : ''}
            </Txt>
          </View>
          <ChevronRight
            size={20}
            color={theme.grayText}
          />
        </Button>
      )
    })

  return isLoading ? (
    <Spinner />
  ) : (
    <SafeView twcnContentView="px-0">
      <View
        style={tw`p-3 mx-4 my-2 h-10 border border-light-grayTertiary dark:border-dark-grayTertiary rounded-2xl flex-row items-center gap-2 bg-transparent`}
      >
        <Search
          size={16}
          color={theme.grayText}
        />
        <Input
          style={tw`flex-1`}
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
}

export default Exercises

const styles = StyleSheet.create({})
