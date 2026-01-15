import { StyleSheet, View, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { useNavigation } from 'expo-router'
import Button from '../../../components/button'
import { useWorkoutForm } from '../../../context/workout-form-context'
import { SetGroupingType } from '../../../utils/types'
import { capString } from '../../../functions/cap-string'
import useTheme from '../../hooks/theme'
import tw from '../../../tw'
import { ContextMenu, Host, Button as SwiftButton } from '@expo/ui/swift-ui'
import SFIcon from '../../../components/sf-icon'
import Colors from '../../../constants/colors'

const Dropsets = () => {
  const navigation = useNavigation()
  const { workoutData, setWorkoutData } = useWorkoutForm()
  const { theme } = useTheme()
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(
    new Set()
  )
  const [selectedSets, setSelectedSets] = useState<Set<string>>(new Set())
  const createDropset = () => {
    const validation = validateDropset()
    if (!validation.valid) {
      Alert.alert('Invalid Dropset', validation.message)
      return
    }

    const setGroupings = {
      groupingType: 'dropset' as SetGroupingType,
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
          onPress={createDropset}
          hitSlop={12}
          accessibilityLabel="Create Dropset"
          disabled={selectedSets.size < 2}
          twcn="w-9 flex-row items-center justify-center h-full"
        >
          <SFIcon
            name="checkmark"
            size={26}
            color={selectedSets.size >= 2 ? Colors.primary : theme.grayText}
          />
        </Button>
      ),
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

  const areSetsConsecutive = (exerciseIndex: number) => {
    const setIndices = Array.from(selectedSets)
      .filter((setId) => parseInt(setId.split('-')[0]) === exerciseIndex)
      .map((setId) => parseInt(setId.split('-')[1]))
      .sort((a, b) => a - b)

    if (setIndices.length <= 1) return true

    for (let i = 1; i < setIndices.length; i++) {
      if (setIndices[i] - setIndices[i - 1] !== 1) {
        return false
      }
    }
    return true
  }

  const validateDropset = () => {
    const exerciseIndices = getExercisesWithSelectedSets()

    if (selectedSets.size === 0) {
      return {
        valid: false,
        message: 'Select sets to create a dropset',
      }
    }

    if (selectedSets.size < 2) {
      return {
        valid: false,
        message: 'Dropsets must include at least 2 consecutive sets',
      }
    }

    if (exerciseIndices.length > 1) {
      return {
        valid: false,
        message: 'Dropsets must only include sets from the same exercise',
      }
    }

    const exerciseIndex = exerciseIndices[0]
    if (!areSetsConsecutive(exerciseIndex)) {
      return {
        valid: false,
        message:
          'Sets in a dropset must be consecutive (e.g., Set 1, Set 2, Set 3)',
      }
    }

    return {
      valid: true,
      message: `Valid dropset selection (${selectedSets.size} consecutive sets)`,
    }
  }

  const toggleSet = (exerciseIndex: number, setIndex: number) => {
    const setId = `${exerciseIndex}-${setIndex}`
    const newSelected = new Set(selectedSets)

    if (selectedSets.has(setId)) {
      newSelected.delete(setId)
    } else {
      newSelected.add(setId)

      // Check if all selected sets are from the same exercise
      const exerciseIndices = new Set<number>()
      newSelected.forEach((tempSetId) => {
        const tempExerciseIndex = parseInt(tempSetId.split('-')[0])
        exerciseIndices.add(tempExerciseIndex)
      })

      if (exerciseIndices.size > 1) {
        return // Don't allow sets from different exercises
      }

      // Check if sets are consecutive
      if (!areSetsConsecutive(exerciseIndex)) {
        return // Don't allow non-consecutive sets
      }
    }

    setSelectedSets(newSelected)
  }

  const isExerciseDisabled = (exerciseIndex: number) => {
    const exerciseIndices = getExercisesWithSelectedSets()
    if (exerciseIndices.length === 0) return false
    if (exerciseIndices.includes(exerciseIndex)) return false

    // If sets are selected from another exercise, disable this exercise
    return (
      exerciseIndices.length > 0 && !exerciseIndices.includes(exerciseIndex)
    )
  }

  const renderedExercises = workoutData.exercises.map((ex, exerciseIndex) => {
    if (!ex.name) return null
    return (
      <View
        key={exerciseIndex}
        style={tw`flex-row flex-wrap gap-4 px-4 py-2`}
      >
        <Txt twcn="w-full text-sm text-base font-semibold">
          {exerciseIndex + 1} — {capString(ex.name, 30)}
        </Txt>
        <View style={tw`w-full flex-row flex-wrap items-center mb-4 gap-2`}>
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
            const isPartOfAnotherDropset = workoutData.setGroupings.some(
              (grouping) =>
                grouping.groupingType === 'dropset' &&
                grouping.groupSets.some(
                  (s) =>
                    s.exerciseNumber === exerciseIndex + 1 &&
                    s.setNumber === setIndex + 1
                )
            )

            // Check if this set is part of a superset
            const isPartOfASuperset = workoutData.setGroupings.some(
              (grouping) =>
                grouping.groupingType === 'superset' &&
                grouping.groupSets.some(
                  (s) =>
                    s.exerciseNumber === exerciseIndex + 1 &&
                    s.setNumber === setIndex + 1
                )
            )

            const isSetDisabled =
              exerciseDisabled || isPartOfAnotherDropset || isPartOfASuperset

            return (
              <Button
                key={setIndex}
                onPress={() =>
                  !isSetDisabled && toggleSet(exerciseIndex, setIndex)
                }
                twcn={`relative px-3 py-1.5 rounded-full border ${isSelected ? 'bg-primary/25 dark:bg-primary/25 border-primary' : 'border-light-grayBorder dark:border-dark-grayBorder  dark:bg-dark-grayPrimary'}`}
                disabled={isSetDisabled}
              >
                <Txt
                  twcn={`text-xs text-light-grayText dark:text-dark-grayText ${
                    isSetDisabled
                      ? 'text-light-grayText/50 dark:text-dark-grayText/50'
                      : ''
                  } ${isSelected ? 'text-primary dark:text-primary' : ''}`}
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
      if (grouping.groupingType === 'dropset') {
        // Create a key based on the exercise involved
        const exerciseData = grouping.groupSets
          .map((set) => ({
            name: workoutData.exercises[set.exerciseNumber - 1]?.name,
            exerciseNumber: set.exerciseNumber,
          }))
          .filter((ex) => ex.name)

        const exerciseName = exerciseData[0]?.name || 'Unknown Exercise'

        if (!groupings.has(exerciseName)) {
          groupings.set(exerciseName, [])
        }

        groupings.get(exerciseName)!.push({
          ...grouping,
          dropsetIndex: groupIndex + 1,
        })
      }
    })

    return groupings
  }

  const exerciseGroupings = getExerciseGroupings()

  const renderedDropsets = Array.from(exerciseGroupings.entries()).map(
    ([exerciseName, dropsets], groupIndex) => {
      const handleDeleteDropset = () => {
        const updatedGroupings = workoutData.setGroupings.filter((grouping) => {
          if (grouping.groupingType !== 'dropset') return true

          const exerciseData = grouping.groupSets
            .map((set) => ({
              name: workoutData.exercises[set.exerciseNumber - 1]?.name,
              exerciseNumber: set.exerciseNumber,
            }))
            .filter((ex) => ex.name)

          const name = exerciseData[0]?.name

          return name !== exerciseName
        })

        setWorkoutData({
          ...workoutData,
          setGroupings: updatedGroupings,
        })
      }

      return (
        <View
          key={exerciseName}
          style={tw`bg-white dark:bg-dark-grayPrimary rounded-xl p-4`}
        >
          <View style={tw`flex-row items-start justify-between gap-4 mb-4`}>
            <Txt twcn="text-sm flex-1 text-light-text dark:text-dark-text font-semibold">
              {exerciseName}
            </Txt>
            <Host style={{ width: 26, height: 26 }}>
              <ContextMenu>
                <ContextMenu.Items>
                  <SwiftButton
                    systemImage="trash"
                    onPress={handleDeleteDropset}
                  >
                    Delete Dropset
                  </SwiftButton>
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                  <SFIcon
                    name="ellipsis"
                    color={theme.text}
                    size={26}
                  />
                </ContextMenu.Trigger>
              </ContextMenu>
            </Host>
          </View>

          {dropsets.map((dropset, index) => (
            <View
              key={index}
              style={tw`flex-row items-start gap-3`}
            >
              <View style={tw`flex-row items-center flex-wrap`}>
                {dropset.groupSets.map((set: any, setIndex: number) => {
                  return (
                    <View
                      key={setIndex}
                      style={tw`flex-row items-center`}
                    >
                      <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText">
                        {set.setNumber}{' '}
                      </Txt>

                      {setIndex < dropset.groupSets.length - 1 && (
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
    <SafeView twcnContentView="px-0">
      {workoutData.setGroupings.some((g) => g.groupingType === 'dropset') && (
        <View style={tw`mb-6 w-full px-4`}>
          <View style={tw`gap-2`}>{renderedDropsets}</View>
        </View>
      )}
      <View style={tw`w-full flex-1`}>{renderedExercises}</View>
    </SafeView>
  )
}

export default Dropsets

const styles = StyleSheet.create({})
