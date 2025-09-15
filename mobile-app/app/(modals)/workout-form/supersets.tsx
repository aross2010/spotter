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
import useTheme from '../../hooks/theme'
import tw from '../../../tw'
import { Circle, CheckCircle } from 'lucide-react-native'
import Colors from '../../../constants/colors'
import Accordion from '../../../components/accordion'

// when create is pressed, gray out sets/exercises that are already in a superset
// show at the top an accordion with the current superset sets – swipe left to delete it. (no editing, yet)
// in the create superset, use the selected sets to add to the setGroupings array in workoutData
// on the exercise screen, change the color of the timeline for superseted exercises, in the normal view, specifiy which exact sets are supersetted
// only show exercises that have a name
// leave all accordion expanded by default (maybe dont use them at all?)
// scroll down to new exercise after adding it

const Supersets = () => {
  const navigation = useNavigation()
  const { workoutData, setWorkoutData } = useWorkoutForm()
  const { theme } = useTheme()
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(
    new Set()
  )
  const [selectedSets, setSelectedSets] = useState<Set<string>>(new Set())

  const createSuperSet = () => {
    const validation = validateSuperset()
    if (!validation.valid) {
      Alert.alert('Invalid Superset', validation.message)
      return
    }

    console.log('Creating superset with sets:', Array.from(selectedSets))

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
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={createSuperSet}
          hitSlop={12}
          accessibilityLabel="create superset"
          twcnText="font-poppinsSemiBold text-primary dark:text-primary"
          text="Create"
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
    let display = `Set ${set.setNumber}`

    const weight = weightUnit === 'lbs' ? set.weightLbs : set.weightKg
    if (weight) {
      display += ` • ${weight}${weightUnit === 'lbs' ? 'lbs' : 'kg'}`
    }

    if (set.leftReps && set.rightReps) {
      if (set.leftReps === set.rightReps) {
        display += ` • ${set.leftReps} reps`
      } else {
        display += ` • ${Math.min(set.leftReps, set.rightReps)}-${Math.max(set.leftReps, set.rightReps)} reps`
      }
    } else if (set.reps) {
      display += ` • ${set.reps} reps`
    } else if (set.lowReps && set.highReps) {
      display += ` • ${set.lowReps}-${set.highReps} reps`
    }

    return display
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

  const haveEqualSetCounts = (exerciseCounts: Map<number, number>) => {
    const counts = Array.from(exerciseCounts.values())
    if (counts.length <= 1) return true

    const firstCount = counts[0]
    return counts.every((count) => count === firstCount)
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

  const toggleExercise = (exerciseIndex: number) => {
    const newExpanded = new Set(expandedExercises)

    if (expandedExercises.has(exerciseIndex)) {
      newExpanded.delete(exerciseIndex)
    } else {
      newExpanded.add(exerciseIndex)
    }

    setExpandedExercises(newExpanded)
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

    console.log('Selected sets: ', Array.from(newSelected))

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

  const renderedExercises = workoutData.exercises.map((ex, exerciseIndex) => (
    <Accordion
      key={exerciseIndex}
      title={ex.name || `Exercise ${exerciseIndex + 1}`}
      isExpanded={expandedExercises.has(exerciseIndex)}
      onToggle={() => toggleExercise(exerciseIndex)}
      disabled={isExerciseDisabled(exerciseIndex)}
      twcn="border-b border-light-grayTertiary dark:border-dark-grayTertiary"
    >
      <View style={tw`pb-2 px-2`}>
        {ex.sets.map((set: any, setIndex: number) => {
          const setId = `${exerciseIndex}-${setIndex}`
          const isSelected = selectedSets.has(setId)
          const exerciseDisabled = isExerciseDisabled(exerciseIndex)

          // Check if another set from this exercise is already selected
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
            exerciseDisabled || (!isSelected && hasOtherSetSelected)

          return (
            <Button
              key={setIndex}
              onPress={() =>
                !isSetDisabled && toggleSet(exerciseIndex, setIndex)
              }
              twcn={`flex-row items-center gap-2 p-2 rounded-lg ${
                isSetDisabled ? 'opacity-40' : ''
              }`}
              disabled={isSetDisabled}
            >
              {isSelected ? (
                <CheckCircle
                  size={15}
                  color={isSetDisabled ? theme.graySecondary : Colors.primary}
                />
              ) : (
                <Circle
                  size={15}
                  color={isSetDisabled ? theme.graySecondary : theme.grayText}
                />
              )}
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
    </Accordion>
  ))

  return (
    <SafeView scroll={false}>
      <View style={tw`gap-2 w-full flex-1`}>{renderedExercises}</View>
    </SafeView>
  )
}

export default Supersets

const styles = StyleSheet.create({})
