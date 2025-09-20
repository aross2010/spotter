import { StyleSheet, View, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { useNavigation } from 'expo-router'
import Button from '../../../components/button'
import {
  SetGroupingType,
  useWorkoutForm,
} from '../../../context/workout-form-context'
import { capString } from '../../../functions/cap-string'
import useTheme from '../../../hooks/theme'
import tw from '../../../tw'
import { Ellipsis, Trash } from 'lucide-react-native'
import Colors from '../../../constants/colors'
import DropdownMenu from '../../../components/dropdown-menu'

const Supersets = () => {
  const navigation = useNavigation()
  const { workoutData, setWorkoutData } = useWorkoutForm()
  const { theme } = useTheme()
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(
    new Set()
  )
  const [selectedSets, setSelectedSets] = useState<Set<string>>(new Set())

  // delete supersets for the exercise grouping
  const deleteSuperset = (supersetIndex: number) => {
    if (supersetIndex !== null) {
      const selectedGrouping = workoutData.setGroupings[supersetIndex]

      const selectedExerciseData = selectedGrouping.groupSets
        .map((set) => ({
          name: workoutData.exercises[set.exerciseNumber - 1]?.name,
          exerciseNumber: set.exerciseNumber,
        }))
        .filter((ex) => ex.name)
        .sort((a, b) => a.exerciseNumber - b.exerciseNumber)

      const selectedNames = selectedExerciseData
        .map((ex) => ex.name)
        .join(' → ')

      const updatedGroupings = workoutData.setGroupings.filter((grouping) => {
        if (grouping.groupingType !== 'superset') return true

        const exerciseData = grouping.groupSets
          .map((set) => ({
            name: workoutData.exercises[set.exerciseNumber - 1]?.name,
            exerciseNumber: set.exerciseNumber,
          }))
          .filter((ex) => ex.name)
          .sort((a, b) => a.exerciseNumber - b.exerciseNumber)

        const names = exerciseData.map((ex) => ex.name).join(' → ')

        return names !== selectedNames
      })

      setWorkoutData({
        ...workoutData,
        setGroupings: updatedGroupings,
      })
    }
  }

  const createSuperSet = () => {
    const validation = validateSuperset()
    if (!validation.valid) {
      Alert.alert('Invalid Superset', validation.message)
      return
    }

    const setGroupings = {
      groupingType: 'superset' as SetGroupingType,
      groupSets: Array.from(selectedSets).map((set) => {
        return {
          exerciseNumber: parseInt(set.split('-')[0]) + 1,
          setNumber: parseInt(set.split('-')[1]) + 1,
        }
      }),
    }

    setWorkoutData({
      ...workoutData,
      setGroupings: [...workoutData.setGroupings, setGroupings],
    })

    setSelectedSets(new Set())
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={createSuperSet}
          hitSlop={12}
          accessibilityLabel="create superset"
          twcnText="font-semibold text-primary dark:text-primary"
          text="Create"
          disabled={selectedSets.size < 2}
        />
      ),
      headerBackTitle: workoutData.name
        ? capString(workoutData.name, 15)
        : 'Workout',
    })
  }, [navigation, workoutData.name, selectedSets])

  useEffect(() => {
    const newExpanded = new Set(expandedExercises)
    let hasChanges = false

    expandedExercises.forEach((exerciseIndex) => {
      if (isExerciseDisabled(exerciseIndex)) {
        newExpanded.delete(exerciseIndex)
        hasChanges = true
      }
    })

    if (hasChanges) {
      setExpandedExercises(newExpanded)
    }
  }, [selectedSets, expandedExercises])

  const formatSetDisplay = (set: any, weightUnit: string) => {
    const parts = []

    const weight = weightUnit === 'lbs' ? set.weightLbs : set.weightKg
    if (weight) {
      parts.push(`${weight}${weightUnit === 'lbs' ? 'lbs' : 'kg'}`)
    }

    if (set.leftReps && set.rightReps) {
      if (set.leftReps === set.rightReps) {
        parts.push(`${set.leftReps} reps`)
      } else {
        parts.push(
          `${Math.min(set.leftReps, set.rightReps)}-${Math.max(set.leftReps, set.rightReps)} reps`
        )
      }
    } else if (set.reps) {
      parts.push(`${set.reps} reps`)
    } else if (set.lowReps && set.highReps) {
      parts.push(`${set.lowReps}-${set.highReps} reps`)
    }
    return parts.join(' • ')
  }

  const getExerciseSetCounts = () => {
    const exerciseCounts = new Map<number, number>()
    selectedSets.forEach((setId) => {
      const exerciseIndex = parseInt(setId.split('-')[0])
      exerciseCounts.set(
        exerciseIndex,
        (exerciseCounts.get(exerciseIndex) || 0) + 1
      )
    })
    return exerciseCounts
  }

  const getExercisesWithSelectedSets = () => {
    const exerciseIndices = new Set<number>()
    selectedSets.forEach((setId) => {
      const exerciseIndex = parseInt(setId.split('-')[0])
      exerciseIndices.add(exerciseIndex)
    })
    return Array.from(exerciseIndices).sort((a, b) => a - b)
  }

  const areExercisesAdjacent = (exerciseIndices: number[]) => {
    if (exerciseIndices.length <= 1) return true

    for (let i = 1; i < exerciseIndices.length; i++) {
      if (exerciseIndices[i] - exerciseIndices[i - 1] !== 1) {
        return false
      }
    }
    return true
  }

  const isValidSetProgression = () => {
    const setData = Array.from(selectedSets).map((setId) => {
      const [exerciseIndex, setNumber] = setId.split('-').map(Number)
      return { exerciseIndex, setNumber }
    })

    setData.sort((a, b) => a.exerciseIndex - b.exerciseIndex)

    for (let i = 1; i < setData.length; i++) {
      if (setData[i].setNumber > setData[i - 1].setNumber) {
        return false
      }
    }

    return true
  }

  const validateSuperset = () => {
    const exerciseIndices = getExercisesWithSelectedSets()
    const exerciseCounts = getExerciseSetCounts()

    if (selectedSets.size === 0) {
      return {
        valid: false,
        message: 'Select sets to create a superset',
      }
    }

    if (exerciseIndices.length < 2) {
      return {
        valid: false,
        message:
          'Supersets must include sets from at least 2 different exercises',
      }
    }

    if (!areExercisesAdjacent(exerciseIndices)) {
      return {
        valid: false,
        message: 'Sets in a superset must come from adjacent exercises',
      }
    }

    if (!isValidSetProgression()) {
      return {
        valid: false,
        message:
          'Set numbers in a superset cannot increase (e.g., Set 2 → Set 1 is valid, but Set 1 → Set 2 is not)',
      }
    }

    return {
      valid: true,
      message: `Valid superset selection (${selectedSets.size} sets from ${exerciseIndices.length} exercises)`,
    }
  }

  const toggleSet = (exerciseIndex: number, setIndex: number) => {
    const setId = `${exerciseIndex}-${setIndex}`
    const newSelected = new Set(selectedSets)

    if (selectedSets.has(setId)) {
      newSelected.delete(setId)
    } else {
      newSelected.add(setId)

      const tempExerciseCounts = new Map<number, number>()
      newSelected.forEach((tempSetId) => {
        const tempExerciseIndex = parseInt(tempSetId.split('-')[0])
        tempExerciseCounts.set(
          tempExerciseIndex,
          (tempExerciseCounts.get(tempExerciseIndex) || 0) + 1
        )
      })

      const tempExerciseIndices = Array.from(tempExerciseCounts.keys()).sort(
        (a, b) => a - b
      )

      if (tempExerciseIndices.length > 1) {
        if (!areExercisesAdjacent(tempExerciseIndices)) {
          return
        }
      }
    }

    setSelectedSets(newSelected)
  }

  const isExerciseDisabled = (exerciseIndex: number) => {
    const exerciseIndices = getExercisesWithSelectedSets()
    if (exerciseIndices.length === 0) return false
    if (exerciseIndices.includes(exerciseIndex)) return false

    if (exerciseIndices.length === 1) {
      const selectedExercise = exerciseIndices[0]
      return Math.abs(selectedExercise - exerciseIndex) !== 1
    }

    const allExercises = [...exerciseIndices, exerciseIndex].sort(
      (a, b) => a - b
    )
    return !areExercisesAdjacent(allExercises)
  }

  const renderedExercises = workoutData.exercises.map((ex, exerciseIndex) => {
    if (!ex.name) return null
    return (
      <View
        key={exerciseIndex}
        style={tw`flex-row flex-wrap gap-4 py-3 border-b border-light-graySecondary dark:border-dark-graySecondary`}
      >
        <Txt twcn="w-full text-sm">
          {exerciseIndex + 1}. {capString(ex.name, 30)}
        </Txt>
        <View style={tw`w-full flex-row items-center mb-2 gap-3`}>
          {ex.sets.map((set: any, setIndex: number) => {
            const hasRepsOrWeight =
              set.reps ||
              set.leftReps ||
              set.rightReps ||
              set.weightLbs ||
              set.weightKg
            if (!hasRepsOrWeight) return null
            const setId = `${exerciseIndex}-${setIndex}`
            const isSelected = selectedSets.has(setId)
            const exerciseDisabled = isExerciseDisabled(exerciseIndex)
            const isPartOfAnotherSuperset = workoutData.setGroupings.some(
              (grouping) =>
                grouping.groupingType === 'superset' &&
                grouping.groupSets.some(
                  (s) =>
                    s.exerciseNumber === exerciseIndex + 1 &&
                    s.setNumber === setIndex + 1
                )
            )

            const isPartOfADropset = workoutData.setGroupings.some(
              (grouping) =>
                grouping.groupingType === 'drop set' &&
                grouping.groupSets.some(
                  (s) =>
                    s.exerciseNumber === exerciseIndex + 1 &&
                    s.setNumber === setIndex + 1
                )
            )

            const hasOtherSetSelected = Array.from(selectedSets).some(
              (selectedSetId) => {
                const [selectedExerciseIndex] = selectedSetId
                  .split('-')
                  .map(Number)
                return (
                  selectedExerciseIndex === exerciseIndex &&
                  selectedSetId !== setId
                )
              }
            )

            const isSetDisabled =
              exerciseDisabled ||
              (!isSelected && hasOtherSetSelected) ||
              isPartOfAnotherSuperset ||
              isPartOfADropset

            return (
              <Button
                key={setIndex}
                onPress={() =>
                  !isSetDisabled && toggleSet(exerciseIndex, setIndex)
                }
                twcn={`relative flex-row items-center gap-2 p-1 rounded-lg ${isSelected ? 'bg-primary/25 border-primary' : 'bg-light-grayPrimary dark:bg-dark-graySecondary border-light-grayTertiary dark:border-dark-grayTertiary'} border`}
                disabled={isSetDisabled}
              >
                <Txt
                  twcn={`text-xs uppercase tracking-wider ${
                    isSetDisabled
                      ? 'text-light-graySecondary dark:text-dark-graySecondary'
                      : 'text-light-grayText dark:text-dark-grayText'
                  } ${isSelected ? 'text-primary' : ''}`}
                >
                  {formatSetDisplay(set, workoutData.weightUnit || 'lbs')}
                </Txt>
              </Button>
            )
          })}
        </View>
      </View>
    )
  })

  const getExerciseGroupings = () => {
    const groupings = new Map<string, any[]>()

    workoutData.setGroupings.forEach((grouping, groupIndex) => {
      if (grouping.groupingType === 'superset') {
        // Create a key based on the exercises involved, sorted by exercise number (not alphabetically)
        const exerciseData = grouping.groupSets
          .map((set) => ({
            name: workoutData.exercises[set.exerciseNumber - 1]?.name,
            exerciseNumber: set.exerciseNumber,
          }))
          .filter((ex) => ex.name)
          .sort((a, b) => a.exerciseNumber - b.exerciseNumber) // Sort by exercise number

        const exerciseNames = exerciseData.map((ex) => ex.name).join(' → ')

        if (!groupings.has(exerciseNames)) {
          groupings.set(exerciseNames, [])
        }

        groupings.get(exerciseNames)!.push({
          ...grouping,
          supersetIndex: groupIndex + 1,
        })
      }
    })

    return groupings
  }

  const exerciseGroupings = getExerciseGroupings()

  const renderedSuperSets = Array.from(exerciseGroupings.entries()).map(
    ([exerciseCombo, supersets]) => {
      return (
        <View
          key={exerciseCombo}
          style={tw`bg-white dark:bg-dark-grayPrimary rounded-xl p-4`}
        >
          <View style={tw`flex-row items-start justify-between gap-4 mb-4`}>
            <Txt twcn="text-sm flex-1 text-light-text dark:text-dark-text">
              {exerciseCombo}
            </Txt>
            <DropdownMenu
              options={[
                {
                  label: 'Delete Superset',
                  icon: Trash,
                  onPress: () => deleteSuperset(supersets[0].supersetIndex - 1),
                  type: 'button',
                  destructive: true,
                },
              ]}
              triggerIcon={Ellipsis}
            />
          </View>

          {supersets.map((superset, index) => (
            <View
              key={index}
              style={tw`flex-row items-start gap-3`}
            >
              <View style={tw`flex-row items-center flex-wrap`}>
                {superset.groupSets.map((set: any, setIndex: number) => {
                  return (
                    <View
                      key={setIndex}
                      style={tw`flex-row items-center`}
                    >
                      <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText">
                        {set.setNumber}{' '}
                      </Txt>

                      {setIndex < superset.groupSets.length - 1 && (
                        <Txt twcn="text-light-grayText dark:text-dark-grayText mx-2">
                          →
                        </Txt>
                      )}
                    </View>
                  )
                })}
              </View>
            </View>
          ))}
        </View>
      )
    }
  )

  return (
    <SafeView scroll={false}>
      {workoutData.setGroupings.length > 0 && (
        <View style={tw`mb-4 w-full`}>
          <Txt twcn="mb-3 text-light-grayText dark:text-dark-grayText uppercase text-xs font-medium tracking-wider">
            Supersets
          </Txt>
          <View style={tw`gap-2`}>{renderedSuperSets}</View>
        </View>
      )}
      <View style={tw`w-full flex-1`}>
        <Txt twcn="mb-1 text-light-grayText dark:text-dark-grayText uppercase text-xs font-medium tracking-wider">
          Exercises
        </Txt>
        {renderedExercises}
      </View>
    </SafeView>
  )
}

export default Supersets

const styles = StyleSheet.create({})
