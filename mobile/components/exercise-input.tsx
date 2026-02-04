import {
  View,
  ScrollView,
  Alert,
  Keyboard,
  TextInputProps,
  TextInput,
} from 'react-native'
import { nanoid } from 'nanoid/non-secure'
import { useWorkoutForm } from '../context/workout-form-context'
import tw from '../tw'
import Txt from './text'
import Input from './input'
import Button from './button'
import Colors from '../constants/colors'
import { useState, useEffect, useRef } from 'react'
import React from 'react'
import { useAuth } from '../context/auth-context'
import { BASE_URL } from '../constants/auth'
import { ExerciseDetailsMini } from '../utils/types'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import useTheme from '../app/hooks/theme'
import ExerciseMiniHistory from './exercise-mini-history'
import { useUserStore } from '../stores/user-store'
import { ExerciseName } from '../utils/types'
import { GlassView } from 'expo-glass-effect'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import MyBottomSheet from './bottom-sheet'
import SFIcon from './sf-icon'
import { SFSymbol } from 'expo-symbols'

const MAX_SETS = 20

type ExerciseInputProps = {
  exerciseNumber: number
  totalExercises?: number
  onReorderExercises?: (fromIndex: number, toIndex: number) => void
} & TextInputProps

const ExerciseInput = ({
  exerciseNumber,
  totalExercises,
  onReorderExercises,
  ...rest
}: ExerciseInputProps) => {
  type FocusedInputMeta = {
    exerciseIndex: number
    setIndex: number
    field: string
    isLeftSide?: boolean
  } | null

  const [isExerciseNameSelectorOpen, setIsExerciseNameSelectorOpen] =
    useState(false)
  const [exerciseNameResults, setExerciseNameResults] = useState<
    ExerciseName[]
  >([])
  const exerciseNameInputRef = useRef<TextInput>(null)
  const lastFocusedInputRef = useRef<TextInput | null>(null)
  const lastFocusedInputMetaRef = useRef<FocusedInputMeta>(null)
  const [newlyAddedSetId, setNewlyAddedSetId] = useState<string | null>(null)
  const [shouldFocusFirstSetWeight, setShouldFocusFirstSetWeight] =
    useState(false)
  const weightInputRefs = useRef<Map<string, TextInput>>(new Map())
  const leftWeightInputRefs = useRef<Map<string, TextInput>>(new Map())
  const repsInputRefs = useRef<Map<string, TextInput>>(new Map())
  const leftRepsInputRefs = useRef<Map<string, TextInput>>(new Map())
  const rightRepsInputRefs = useRef<Map<string, TextInput>>(new Map())
  const partialsInputRefs = useRef<Map<string, TextInput>>(new Map())
  const leftPartialsInputRefs = useRef<Map<string, TextInput>>(new Map())
  const rightPartialsInputRefs = useRef<Map<string, TextInput>>(new Map())
  const rpeInputRefs = useRef<Map<string, TextInput>>(new Map())
  const leftRpeInputRefs = useRef<Map<string, TextInput>>(new Map())
  const rightRpeInputRefs = useRef<Map<string, TextInput>>(new Map())
  const [isEditingExerciseNumber, setIsEditingExerciseNumber] = useState(false)
  const [exerciseNumberInput, setExerciseNumberInput] = useState(
    exerciseNumber.toString(),
  )
  const exerciseNumberInputRef = useRef<TextInput>(null)
  const {
    workoutData,
    setWorkoutData,
    exerciseNames,
    newlyAddedExerciseNumber,
    setNewlyAddedExerciseNumber,
    focusedInput,
    setFocusedInput,
    exerciseNumberInputValue,
    setExerciseNumberInputValue,
    handleExerciseNumberSubmitRef,
    updateExerciseDetails,
  } = useWorkoutForm()
  const { preferences } = useUserStore()
  const { fetchWithAuth } = useAuth()
  const { exercises } = workoutData
  const { theme, colorScheme } = useTheme()
  const ref = useRef<BottomSheetModal | null>(null)
  const exercise = exercises[exerciseNumber - 1]
  const [isSynced, setIsSynced] = useState(
    exercise?.isSynced ?? preferences?.unilateralLogging === 'sync',
  )

  useEffect(() => {
    if (focusedInput) {
      lastFocusedInputMetaRef.current = focusedInput
    }
  }, [focusedInput])

  // Sync local isSynced state with exercise data when exercise changes
  useEffect(() => {
    if (exercise?.isSynced !== undefined) {
      setIsSynced(exercise.isSynced)
    }
  }, [exercise?.isSynced])

  const sets = exercise?.sets
  const weightUnit = workoutData.weightUnit || 'lbs'
  const intensityMetric = preferences?.intensityMetric || 'rir'
  const isUnilateral = exercise?.isUnilateral || false

  useEffect(() => {
    setExerciseNameResults(exerciseNames)
  }, [exerciseNames])

  // Auto-focus the exercise name input if this is the newly added exercise
  useEffect(() => {
    if (
      newlyAddedExerciseNumber === exerciseNumber &&
      exerciseNameInputRef.current
    ) {
      // Use a small timeout to ensure the component is fully rendered
      const timeoutId = setTimeout(() => {
        exerciseNameInputRef.current?.focus()
        setNewlyAddedExerciseNumber(null) // Clear the flag after focusing
      }, 50)
      return () => clearTimeout(timeoutId)
    }
  }, [newlyAddedExerciseNumber, exerciseNumber, setNewlyAddedExerciseNumber])

  useEffect(() => {
    if (newlyAddedSetId) {
      // Use requestAnimationFrame to ensure the DOM is updated before focusing
      const focusInput = () => {
        // For unilateral exercises, focus the left weight input first
        if (isUnilateral) {
          const leftWeightInput =
            leftWeightInputRefs.current.get(newlyAddedSetId)
          if (leftWeightInput) {
            leftWeightInput.focus()
            setNewlyAddedSetId(null) // Clear the flag after focusing
            return
          }
        }

        // For bilateral exercises, focus the regular weight input
        const weightInput = weightInputRefs.current.get(newlyAddedSetId)
        if (weightInput) {
          weightInput.focus()
          setNewlyAddedSetId(null) // Clear the flag after focusing
        }
      }

      // Use requestAnimationFrame to ensure the component is rendered
      requestAnimationFrame(focusInput)
    }
  }, [newlyAddedSetId, isUnilateral])

  // Autofocus the first set's weight input after selecting an exercise name
  useEffect(() => {
    if (shouldFocusFirstSetWeight && sets.length > 0) {
      const firstSetId = sets[0].id

      const focusInput = () => {
        // For unilateral exercises, focus the left weight input first
        if (isUnilateral) {
          const leftWeightInput = leftWeightInputRefs.current.get(firstSetId)
          if (leftWeightInput) {
            leftWeightInput.focus()
            setShouldFocusFirstSetWeight(false)
            return
          }
        }

        // For bilateral exercises, focus the regular weight input
        const weightInput = weightInputRefs.current.get(firstSetId)
        if (weightInput) {
          weightInput.focus()
          setShouldFocusFirstSetWeight(false)
        }
      }

      // Use setTimeout to ensure refs are ready
      setTimeout(focusInput, 50)
    }
  }, [shouldFocusFirstSetWeight, sets, isUnilateral])

  const isInSuperset = workoutData.setGroupings.some(
    (grouping) =>
      grouping.groupingType === 'superset' &&
      grouping.groupSets.some((set) => set.exerciseNumber === exerciseNumber),
  )

  // Check if the next exercise is in the same superset group
  const isNextExerciseInSameSuperset = workoutData.setGroupings.some(
    (grouping) =>
      grouping.groupingType === 'superset' &&
      grouping.groupSets.some((set) => set.exerciseNumber === exerciseNumber) &&
      grouping.groupSets.some(
        (set) => set.exerciseNumber === exerciseNumber + 1,
      ),
  )

  const isSetInDropset = (setNumber: number) => {
    return workoutData.setGroupings.some(
      (grouping) =>
        grouping.groupingType === 'dropset' &&
        grouping.groupSets.some(
          (set) =>
            set.exerciseNumber === exerciseNumber &&
            set.setNumber === setNumber,
        ),
    )
  }

  const SetInputs = [
    {
      label: 'Set',
      value: 'setNumber',
      inputMode: 'numeric',
    },
    {
      label: weightUnit === 'lbs' ? 'Lbs.' : 'Kg.',
      value: weightUnit === 'lbs' ? 'weightLbs' : 'weightKg',
      inputMode: 'decimal',
    },
    {
      label: 'Reps',
      value: 'reps',
      inputMode: 'numeric',
    },
    {
      label: 'Part.',
      value: 'partials',
      inputMode: 'numeric',
    },
    {
      label: intensityMetric === 'rir' ? 'RIR' : 'RPE',
      value: intensityMetric === 'rir' ? 'rir' : 'rpe',
      inputMode: 'decimal',
    },
  ] as const

  const handleMakeUnilateral = () => {
    const updatedExercises = [...workoutData.exercises]
    if (exerciseNumber) {
      const currentValue =
        updatedExercises[exerciseNumber - 1]?.isUnilateral || false

      if (currentValue) {
        // Switching from unilateral to bilateral
        const updatedSets =
          updatedExercises[exerciseNumber - 1]?.sets.map((set) => {
            const newSet = { ...set }

            // Convert leftReps/rightReps to reps (use leftReps as the main reps value)
            if (set.leftReps !== undefined) {
              newSet.reps = set.leftReps
              delete newSet.leftReps
              delete newSet.rightReps
            }

            // Convert leftRpe/rightRpe to rpe
            if (set.leftRpe !== undefined) {
              newSet.rpe = set.leftRpe
              delete newSet.leftRpe
              delete newSet.rightRpe
            }

            // Convert leftRir/rightRir to rir
            if (set.leftRir !== undefined) {
              newSet.rir = set.leftRir
              delete newSet.leftRir
              delete newSet.rightRir
            }

            // Convert leftPartialReps/rightPartialReps to partialReps
            if (set.leftPartialReps !== undefined) {
              newSet.partialReps = set.leftPartialReps
              delete newSet.leftPartialReps
              delete newSet.rightPartialReps
            }

            return newSet
          }) || []

        updatedExercises[exerciseNumber - 1] = {
          ...updatedExercises[exerciseNumber - 1],
          isUnilateral: false,
          sets: updatedSets,
        }
      } else {
        // Switching from bilateral to unilateral
        const updatedSets =
          updatedExercises[exerciseNumber - 1]?.sets.map((set) => {
            const newSet = { ...set }

            // Convert reps to leftReps/rightReps
            if (set.reps !== undefined) {
              newSet.leftReps = set.reps
              newSet.rightReps = set.reps
              delete newSet.reps
            }

            // Convert rpe to leftRpe/rightRpe
            if (set.rpe !== undefined) {
              newSet.leftRpe = set.rpe
              newSet.rightRpe = set.rpe
              delete newSet.rpe
            }

            // Convert rir to leftRir/rightRir
            if (set.rir !== undefined) {
              newSet.leftRir = set.rir
              newSet.rightRir = set.rir
              delete newSet.rir
            }

            // Convert partialReps to leftPartialReps/rightPartialReps
            if (set.partialReps !== undefined) {
              newSet.leftPartialReps = set.partialReps
              newSet.rightPartialReps = set.partialReps
              delete newSet.partialReps
            }

            return newSet
          }) || []

        updatedExercises[exerciseNumber - 1] = {
          ...updatedExercises[exerciseNumber - 1],
          isUnilateral: true,
          sets: updatedSets,
        }
      }

      setWorkoutData({
        ...workoutData,
        exercises: updatedExercises,
      })
    }
  }

  const handleDisplayExerciseInfo = () => {
    // Store currently focused input
    const currentlyFocused = TextInput.State.currentlyFocusedInput()
    if (currentlyFocused) {
      lastFocusedInputRef.current = currentlyFocused as any
    }
    setFocusedInput(null)
    ref.current?.present()
    Keyboard.dismiss()
  }

  const prefetchExerciseHistory = async (exerciseId: string) => {
    const weightMetric = preferences?.weightMetric || 'lbs'
    const intensityMetric = preferences?.intensityMetric || 'rpe'
    const workoutDate = workoutData.date.toISOString().slice(0, 10)

    // Mark as loading
    updateExerciseDetails(exerciseNumber - 1, null, true)

    try {
      const res = await fetchWithAuth(
        `${BASE_URL}/api/exercises/mini/${exerciseId}?weight=${weightMetric}&intensity=${intensityMetric}&date=${workoutDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      const data = (await res.json()) as ExerciseDetailsMini
      updateExerciseDetails(exerciseNumber - 1, data, false)
    } catch (error) {
      console.error('Error pre-fetching exercise history:', error)
      updateExerciseDetails(exerciseNumber - 1, null, false)
    }
  }

  const handleAddNewSet = () => {
    const updatedExercises = [...workoutData.exercises]
    const currentExercise = updatedExercises[exerciseNumber - 1]
    if (!currentExercise) return
    if (currentExercise.sets.length >= MAX_SETS) {
      Alert.alert(
        'Limit Reached',
        'You can only add up to 20 sets per exercise.',
      )
      return
    }

    const currentSets = currentExercise.sets || []
    const newSetNumber = currentSets.length + 1

    const newSet = {
      id: nanoid(),
      setNumber: newSetNumber,
    }

    updatedExercises[exerciseNumber - 1] = {
      ...currentExercise,
      sets: [...currentSets, newSet],
    }

    setWorkoutData({
      ...workoutData,
      exercises: updatedExercises,
    })

    // Set the newly added set ID for autofocus
    setNewlyAddedSetId(newSet.id)
  }

  const handleDeleteSet = (setIndex: number) => {
    const updatedExercises = [...workoutData.exercises]
    const currentExercise = updatedExercises[exerciseNumber - 1]
    if (!currentExercise || !currentExercise.sets) return

    const setToDelete = currentExercise.sets[setIndex]
    const deletedSetNumber = setToDelete.setNumber

    const updatedSets = currentExercise.sets.filter(
      (_, index) => index !== setIndex,
    )

    const renumberedSets = updatedSets.map((set, index) => ({
      ...set,
      setNumber: index + 1,
    }))

    updatedExercises[exerciseNumber - 1] = {
      ...currentExercise,
      sets: renumberedSets,
    }

    // Remove any set groupings that reference the deleted set
    const updatedSetGroupings = workoutData.setGroupings
      .map((grouping) => ({
        ...grouping,
        groupSets: grouping.groupSets.filter(
          (gs) =>
            !(
              gs.exerciseNumber === exerciseNumber &&
              gs.setNumber === deletedSetNumber
            ),
        ),
      }))
      .filter((grouping) => grouping.groupSets.length > 1) // Remove groupings with less than 2 sets

    // Update set numbers in remaining groupings for this exercise
    const finalSetGroupings = updatedSetGroupings.map((grouping) => ({
      ...grouping,
      groupSets: grouping.groupSets.map((gs) => {
        if (
          gs.exerciseNumber === exerciseNumber &&
          gs.setNumber > deletedSetNumber
        ) {
          return { ...gs, setNumber: gs.setNumber - 1 }
        }
        return gs
      }),
    }))

    setWorkoutData({
      ...workoutData,
      exercises: updatedExercises,
      setGroupings: finalSetGroupings,
    })
  }

  const handleCopySet = (setIndex: number) => {
    const updatedExercises = [...workoutData.exercises]
    const currentExercise = updatedExercises[exerciseNumber - 1]
    if (!currentExercise || !currentExercise.sets) return
    if (currentExercise.sets.length >= 20) {
      Alert.alert(
        'Limit Reached',
        'You can only add up to 20 sets per exercise.',
      )
      return
    }

    const setToCopy = currentExercise.sets[setIndex]
    const currentSets = currentExercise.sets
    const newSetNumber = currentSets.length + 1

    const newSet = {
      ...setToCopy,
      setNumber: newSetNumber,
      id: nanoid(),
    }

    updatedExercises[exerciseNumber - 1] = {
      ...currentExercise,
      sets: [...currentSets, newSet],
    }

    setWorkoutData({
      ...workoutData,
      exercises: updatedExercises,
    })
  }

  const renderLeftAction =
    (setIndex: number) => (progress: any, dragX: any, swipeable: any) => {
      return (
        <Button
          onPress={() => {
            handleCopySet(setIndex)
            swipeable.close()
          }}
          twcn="bg-green dark:bg-green flex-row justify-center items-center w-1/5 border-b border-light-grayBorder dark:border-dark-grayBorder"
        >
          <SFIcon
            name="arrow.uturn.forward"
            size={16}
            color="white"
          />
        </Button>
      )
    }

  const renderRightAction =
    (setIndex: number) => (progress: any, dragX: any, swipeable: any) => {
      return (
        <Button
          onPress={() => {
            handleDeleteSet(setIndex)
            swipeable.close()
          }}
          twcn="bg-red dark:bg-red flex-row justify-center items-center w-1/5 border-b border-light-grayBorder dark:border-dark-grayBorder"
        >
          <SFIcon
            name="trash"
            size={16}
            color="white"
          />
        </Button>
      )
    }

  const handleInputChange = (
    setIndex: number,
    fieldValue: string,
    text: string,
    inputMode: 'numeric' | 'decimal',
    isLeftSide?: boolean,
  ) => {
    if (fieldValue === 'setNumber') return

    let s = text
    if (inputMode === 'decimal') {
      s = s.replace(/[^0-9.]/g, '')
      s = s.replace(/(\..*)\./g, '$1')
    } else {
      s = s.replace(/[^0-9]/g, '')
    }

    // convert to number immediately (or keep as undefined if empty)
    // but avoid converting incomplete decimals that end with '.'
    let finalValue: number | string | undefined
    if (s === '') {
      finalValue = undefined
    } else if (inputMode === 'decimal' && s.endsWith('.')) {
      finalValue = s // keep as string if it ends with decimal
    } else {
      const numValue = inputMode === 'decimal' ? parseFloat(s) : parseInt(s, 10)

      // Cap numeric fields at 99 (reps, partials, rpe, rir have database precision of 2,0)
      if (inputMode === 'numeric' && numValue > 99) {
        return
      }

      // Cap RPE/RIR at 10
      if ((fieldValue === 'rpe' || fieldValue === 'rir') && numValue > 10) {
        finalValue = 10
      } else if (fieldValue === 'rpe' || fieldValue === 'rir') {
        // For RPE/RIR, 0 is a valid value (max effort)
        finalValue = numValue
      } else {
        // Treat 0 as undefined (empty state) for other fields
        finalValue = numValue === 0 ? undefined : numValue
      }
    }

    const updatedExercises = [...workoutData.exercises]
    const updatedSets = [...(updatedExercises[exerciseNumber - 1]?.sets || [])]

    let fieldToUpdate: string = fieldValue
    let leftFieldToUpdate: string | undefined
    let rightFieldToUpdate: string | undefined

    if (isUnilateral && isLeftSide !== undefined) {
      if (fieldValue === 'reps') {
        fieldToUpdate = isLeftSide ? 'leftReps' : 'rightReps'
        leftFieldToUpdate = 'leftReps'
        rightFieldToUpdate = 'rightReps'
      } else if (fieldValue === 'partials') {
        fieldToUpdate = isLeftSide ? 'leftPartialReps' : 'rightPartialReps'
        leftFieldToUpdate = 'leftPartialReps'
        rightFieldToUpdate = 'rightPartialReps'
      } else if (fieldValue === 'rpe') {
        fieldToUpdate = isLeftSide ? 'leftRpe' : 'rightRpe'
        leftFieldToUpdate = 'leftRpe'
        rightFieldToUpdate = 'rightRpe'
      } else if (fieldValue === 'rir') {
        fieldToUpdate = isLeftSide ? 'leftRir' : 'rightRir'
        leftFieldToUpdate = 'leftRir'
        rightFieldToUpdate = 'rightRir'
      }
    } else {
      // For non-unilateral exercises, map 'partials' to 'partialReps'
      if (fieldValue === 'partials') fieldToUpdate = 'partialReps'
    }

    const finalValueToSet = isNaN(finalValue as number) ? undefined : finalValue

    // Update both left and right at the same time for sync mode
    if (isUnilateral && isSynced && leftFieldToUpdate && rightFieldToUpdate) {
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [leftFieldToUpdate]: finalValueToSet,
        [rightFieldToUpdate]: finalValueToSet,
      } as any

      // Immediately update the opposite side input's displayed text using ref
      const currentSet = updatedSets[setIndex]
      const setId = currentSet.id
      const displayText =
        finalValueToSet === undefined ? '' : finalValueToSet.toString()

      if (isLeftSide === true) {
        // Left side changed, update right side input
        if (fieldValue === 'reps') {
          const rightRef = rightRepsInputRefs.current.get(setId)
          if (rightRef) rightRef.setNativeProps({ text: displayText })
        } else if (fieldValue === 'partials') {
          const rightRef = rightPartialsInputRefs.current.get(setId)
          if (rightRef) rightRef.setNativeProps({ text: displayText })
        } else if (fieldValue === 'rpe' || fieldValue === 'rir') {
          const rightRef = rightRpeInputRefs.current.get(setId)
          if (rightRef) rightRef.setNativeProps({ text: displayText })
        }
      } else if (isLeftSide === false) {
        // Right side changed, update left side input
        if (fieldValue === 'reps') {
          const leftRef = leftRepsInputRefs.current.get(setId)
          if (leftRef) leftRef.setNativeProps({ text: displayText })
        } else if (fieldValue === 'partials') {
          const leftRef = leftPartialsInputRefs.current.get(setId)
          if (leftRef) leftRef.setNativeProps({ text: displayText })
        } else if (fieldValue === 'rpe' || fieldValue === 'rir') {
          const leftRef = leftRpeInputRefs.current.get(setId)
          if (leftRef) leftRef.setNativeProps({ text: displayText })
        }
      }
    } else {
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [fieldToUpdate]: finalValueToSet,
      } as any
    }

    updatedExercises[exerciseNumber - 1] = {
      ...updatedExercises[exerciseNumber - 1],
      sets: updatedSets,
    }
    setWorkoutData({
      ...workoutData,
      exercises: updatedExercises,
    })
  }

  const handleDeleteExercise = () => {
    // if exercise has exercise name, delete immediately without confirmation
    if (exercise.name.trim() == '') {
      const updatedExercises = [...workoutData.exercises]
      updatedExercises.splice(exerciseNumber - 1, 1)
      setWorkoutData({
        ...workoutData,
        exercises: updatedExercises,
      })
      return
    }
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedExercises = [...workoutData.exercises]
            updatedExercises.splice(exerciseNumber - 1, 1)

            // Remove any set groupings that reference this exercise
            const updatedSetGroupings = workoutData.setGroupings
              .map((grouping) => ({
                ...grouping,
                groupSets: grouping.groupSets.filter(
                  (gs) => gs.exerciseNumber !== exerciseNumber,
                ),
              }))
              .filter((grouping) => grouping.groupSets.length > 1) // Remove groupings with less than 2 sets

            // Update exercise numbers in remaining groupings for exercises after this one
            const finalSetGroupings = updatedSetGroupings.map((grouping) => ({
              ...grouping,
              groupSets: grouping.groupSets.map((gs) => {
                if (gs.exerciseNumber > exerciseNumber) {
                  return { ...gs, exerciseNumber: gs.exerciseNumber - 1 }
                }
                return gs
              }),
            }))

            setWorkoutData({
              ...workoutData,
              exercises: updatedExercises,
              setGroupings: finalSetGroupings,
            })
          },
        },
      ],
    )
  }

  const handleToggleSync = () => {
    const newSyncState = !isSynced
    setIsSynced(newSyncState)

    // Update the exercise's isSynced property in workout data
    setWorkoutData((prev) => {
      const updatedExercises = [...prev.exercises]
      if (exerciseNumber && updatedExercises[exerciseNumber - 1]) {
        updatedExercises[exerciseNumber - 1] = {
          ...updatedExercises[exerciseNumber - 1],
          isSynced: newSyncState,
        }
      }
      return {
        ...prev,
        exercises: updatedExercises,
      }
    })
  }

  const buttons = [
    {
      name: 'isUnilateral', // IF NOT EXISTS BEFORE, else HIDE
      iconName: 'square.on.square',
      onPress: handleMakeUnilateral,
    },
    {
      name: 'toggleSync',
      iconName: 'rectangle.split.2x1',
      onPress: handleToggleSync,
    },
    {
      name: 'View Information', // history & exercise notes, IF EXISTS BEFORE, else HIDE
      iconName: 'info.circle',
      onPress: handleDisplayExerciseInfo,
    },
    {
      name: 'Delete Exercise',
      iconName: 'trash',
      onPress: handleDeleteExercise,
    },
  ]

  const setButtons = [
    {
      name: 'Add New Set',
      iconName: 'plus',
      onPress: handleAddNewSet,
    },
  ]

  const handleSelectExistingExercise = (
    id: string,
    name: string,
    used: number,
  ) => {
    setWorkoutData((prev) => {
      const updatedExercises = [...prev.exercises]
      if (exerciseNumber) {
        const currentExercise = updatedExercises[exerciseNumber - 1]
        const selectedExercise = exerciseNames.find((ex) => ex.name === name)
        const wasUnilateral = currentExercise.isUnilateral || false
        const willBeUnilateral = selectedExercise?.isUnilateral || false

        let convertedSets = currentExercise.sets

        if (wasUnilateral !== willBeUnilateral) {
          // Convert sets when switching between unilateral and bilateral
          convertedSets = currentExercise.sets.map((set) => {
            const newSet = { ...set }

            if (willBeUnilateral && !wasUnilateral) {
              // Converting bilateral → unilateral: copy values to both sides
              if (set.reps !== undefined) {
                newSet.leftReps = set.reps
                newSet.rightReps = set.reps
                delete newSet.reps
              }
              if (set.rpe !== undefined) {
                newSet.leftRpe = set.rpe
                newSet.rightRpe = set.rpe
                delete newSet.rpe
              }
              if (set.rir !== undefined) {
                newSet.leftRir = set.rir
                newSet.rightRir = set.rir
                delete newSet.rir
              }
              if (set.partialReps !== undefined) {
                newSet.leftPartialReps = set.partialReps
                newSet.rightPartialReps = set.partialReps
                delete newSet.partialReps
              }
            } else if (!willBeUnilateral && wasUnilateral) {
              // Converting unilateral → bilateral: use the lesser value (or left if equal)
              if (set.leftReps !== undefined || set.rightReps !== undefined) {
                const leftReps = set.leftReps || 0
                const rightReps = set.rightReps || 0
                newSet.reps =
                  leftReps === 0
                    ? rightReps
                    : rightReps === 0
                      ? leftReps
                      : Math.min(leftReps, rightReps)
                delete newSet.leftReps
                delete newSet.rightReps
              }
              if (set.leftRpe !== undefined || set.rightRpe !== undefined) {
                const leftRpe = set.leftRpe || 0
                const rightRpe = set.rightRpe || 0
                newSet.rpe =
                  leftRpe === 0
                    ? rightRpe
                    : rightRpe === 0
                      ? leftRpe
                      : Math.min(leftRpe, rightRpe)
                delete newSet.leftRpe
                delete newSet.rightRpe
              }
              if (set.leftRir !== undefined || set.rightRir !== undefined) {
                const leftRir = set.leftRir || 0
                const rightRir = set.rightRir || 0
                newSet.rir =
                  leftRir === 0
                    ? rightRir
                    : rightRir === 0
                      ? leftRir
                      : Math.min(leftRir, rightRir)
                delete newSet.leftRir
                delete newSet.rightRir
              }
              if (
                set.leftPartialReps !== undefined ||
                set.rightPartialReps !== undefined
              ) {
                const leftPartials = set.leftPartialReps || 0
                const rightPartials = set.rightPartialReps || 0
                newSet.partialReps =
                  leftPartials === 0
                    ? rightPartials
                    : rightPartials === 0
                      ? leftPartials
                      : Math.min(leftPartials, rightPartials)
                delete newSet.leftPartialReps
                delete newSet.rightPartialReps
              }
            }

            return newSet
          })
        }

        updatedExercises[exerciseNumber - 1] = {
          ...currentExercise,
          id,
          name,
          isUnilateral: willBeUnilateral,
          existing: true,
          used,
          sets: convertedSets,
        }
      }
      return {
        ...prev,
        exercises: updatedExercises,
      }
    })
    setIsExerciseNameSelectorOpen(false)

    // Pre-fetch exercise history
    prefetchExerciseHistory(id)

    // Trigger autofocus on the first set's weight input
    setShouldFocusFirstSetWeight(true)
  }

  const renderedExerciseNames = exerciseNameResults.map(
    ({ id, name, used }, index) => {
      return (
        <Button
          key={name}
          onPress={() => handleSelectExistingExercise(id, name, used)}
          style={tw`flex-row items-center justify-between p-4 w-full ${
            index === exerciseNameResults.length - 1
              ? ''
              : 'border-b border-light-grayBorder dark:border-dark-grayBorder'
          }`}
        >
          <Txt style={tw`text-xs`}>{name}</Txt>
          {used > 0 && <Txt style={tw`text-xs`}>{used}</Txt>}
        </Button>
      )
    },
  )

  const handleChange = (text: string) => {
    const updatedExercises = [...workoutData.exercises]
    const exerciseIndex = exerciseNumber ? exerciseNumber - 1 : 0
    const currentExercise = updatedExercises[exerciseIndex]

    // Check if there's a matching exercise (trimmed comparison)
    const matchingExercise = exerciseNames.find(
      (ex) => ex.name.toLowerCase() === text.toLowerCase().trim(),
    )

    // Only mark as non-existing if trimmed text doesn't match an existing exercise
    updatedExercises[exerciseIndex] = {
      ...currentExercise,
      name: text,
      existing: matchingExercise ? true : false,
    }

    if (matchingExercise && text.trim() !== '') {
      // Check if we need to convert sets due to unilateral change
      const wasUnilateral = currentExercise.isUnilateral || false
      const willBeUnilateral = matchingExercise.isUnilateral || false

      let convertedSets = currentExercise.sets

      if (wasUnilateral !== willBeUnilateral) {
        // Convert sets when switching between unilateral and bilateral
        convertedSets = currentExercise.sets.map((set) => {
          const newSet = { ...set }

          if (willBeUnilateral && !wasUnilateral) {
            // Converting bilateral → unilateral: copy values to both sides
            if (set.reps !== undefined) {
              newSet.leftReps = set.reps
              newSet.rightReps = set.reps
              delete newSet.reps
            }
            if (set.rpe !== undefined) {
              newSet.leftRpe = set.rpe
              newSet.rightRpe = set.rpe
              delete newSet.rpe
            }
            if (set.rir !== undefined) {
              newSet.leftRir = set.rir
              newSet.rightRir = set.rir
              delete newSet.rir
            }
            if (set.partialReps !== undefined) {
              newSet.leftPartialReps = set.partialReps
              newSet.rightPartialReps = set.partialReps
              delete newSet.partialReps
            }
          } else if (!willBeUnilateral && wasUnilateral) {
            // Converting unilateral → bilateral: use the lesser value (or left if equal)
            if (set.leftReps !== undefined || set.rightReps !== undefined) {
              const leftReps = set.leftReps || 0
              const rightReps = set.rightReps || 0
              newSet.reps =
                leftReps === 0
                  ? rightReps
                  : rightReps === 0
                    ? leftReps
                    : Math.min(leftReps, rightReps)
              delete newSet.leftReps
              delete newSet.rightReps
            }
            if (set.leftRpe !== undefined || set.rightRpe !== undefined) {
              const leftRpe = set.leftRpe || 0
              const rightRpe = set.rightRpe || 0
              newSet.rpe =
                leftRpe === 0
                  ? rightRpe
                  : rightRpe === 0
                    ? leftRpe
                    : Math.min(leftRpe, rightRpe)
              delete newSet.leftRpe
              delete newSet.rightRpe
            }
            if (set.leftRir !== undefined || set.rightRir !== undefined) {
              const leftRir = set.leftRir || 0
              const rightRir = set.rightRir || 0
              newSet.rir =
                leftRir === 0
                  ? rightRir
                  : rightRir === 0
                    ? leftRir
                    : Math.min(leftRir, rightRir)
              delete newSet.leftRir
              delete newSet.rightRir
            }
            if (
              set.leftPartialReps !== undefined ||
              set.rightPartialReps !== undefined
            ) {
              const leftPartials = set.leftPartialReps || 0
              const rightPartials = set.rightPartialReps || 0
              newSet.partialReps =
                leftPartials === 0
                  ? rightPartials
                  : rightPartials === 0
                    ? leftPartials
                    : Math.min(leftPartials, rightPartials)
              delete newSet.leftPartialReps
              delete newSet.rightPartialReps
            }
          }

          return newSet
        })
      }

      // Update with matching exercise data and converted sets
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        id: matchingExercise.id,
        name: text, // Keep the user's typed text (may have trailing spaces)
        isUnilateral: matchingExercise.isUnilateral || false,
        existing: true,
        sets: convertedSets,
      }

      setWorkoutData({
        ...workoutData,
        exercises: updatedExercises,
      })

      // Pre-fetch exercise history
      prefetchExerciseHistory(matchingExercise.id)

      setIsExerciseNameSelectorOpen(false)
      // Don't dismiss keyboard - allow user to continue typing if they want
      return
    }

    setWorkoutData({
      ...workoutData,
      exercises: updatedExercises,
    })

    const filtered = exerciseNames.filter(
      (ex) =>
        ex.name.toLowerCase().includes(text.toLowerCase()) &&
        ex.name.toLowerCase().trim() !== text.toLowerCase().trim(),
    )
    setExerciseNameResults(filtered)

    if (text.trim() === '' || filtered.length === 0) {
      setIsExerciseNameSelectorOpen(false)
    } else if (!isExerciseNameSelectorOpen) {
      setIsExerciseNameSelectorOpen(true)
    }
  }

  const handleExerciseNumberEdit = () => {
    setIsEditingExerciseNumber(true)
    setExerciseNumberInput(exerciseNumber.toString())
    setExerciseNumberInputValue(exerciseNumber.toString())
    setFocusedInput({
      exerciseIndex: exerciseNumber - 1,
      setIndex: -1,
      field: 'exerciseNumber',
    })
    // Focus the input after a small delay to ensure it's rendered
    setTimeout(() => {
      exerciseNumberInputRef.current?.focus()
    }, 100)
  }

  const handleExerciseNumberSubmit = () => {
    const newNumber = parseInt(exerciseNumberInput, 10)

    // Validate input
    if (isNaN(newNumber) || newNumber < 1) {
      // Reset to current number if invalid
      setExerciseNumberInput(exerciseNumber.toString())
      setIsEditingExerciseNumber(false)
      // Don't clear focusedInput - let the next focused input handle it
      return
    }

    // Clamp to valid range
    const maxNumber = totalExercises || workoutData.exercises.length
    const clampedNumber = Math.min(newNumber, maxNumber)

    if (clampedNumber !== exerciseNumber) {
      // Calculate the target index (0-based)
      const currentIndex = exerciseNumber - 1
      const targetIndex = clampedNumber - 1

      // Reorder the exercises
      if (onReorderExercises) {
        onReorderExercises(currentIndex, targetIndex)
      }

      // Update set groupings to reflect the new exercise numbers
      const updatedSetGroupings = workoutData.setGroupings
        .map((grouping) => ({
          ...grouping,
          groupSets: grouping.groupSets.map((gs) => {
            // If this is the exercise being moved
            if (gs.exerciseNumber === exerciseNumber) {
              return { ...gs, exerciseNumber: clampedNumber }
            }
            // If moving down (currentIndex < targetIndex), shift exercises between down by 1
            else if (
              currentIndex < targetIndex &&
              gs.exerciseNumber > currentIndex + 1 &&
              gs.exerciseNumber <= targetIndex + 1
            ) {
              return { ...gs, exerciseNumber: gs.exerciseNumber - 1 }
            }
            // If moving up (currentIndex > targetIndex), shift exercises between up by 1
            else if (
              currentIndex > targetIndex &&
              gs.exerciseNumber >= targetIndex + 1 &&
              gs.exerciseNumber < currentIndex + 1
            ) {
              return { ...gs, exerciseNumber: gs.exerciseNumber + 1 }
            }
            return gs
          }),
        }))
        .filter((grouping) => {
          // Remove supersets where exercises are no longer sequential
          if (grouping.groupingType === 'superset') {
            const exerciseNumbers = grouping.groupSets.map(
              (gs) => gs.exerciseNumber,
            )
            const sortedNumbers = [...exerciseNumbers].sort((a, b) => a - b)
            // Check if exercises are sequential
            for (let i = 0; i < sortedNumbers.length - 1; i++) {
              if (sortedNumbers[i + 1] - sortedNumbers[i] !== 1) {
                return false // Not sequential, remove this superset
              }
            }
          }
          // Keep dropsets and valid supersets
          return grouping.groupSets.length > 1
        })

      setWorkoutData((prev) => ({
        ...prev,
        setGroupings: updatedSetGroupings,
      }))
    }

    setIsEditingExerciseNumber(false)
    // Don't set focusedInput to null or dismiss keyboard here
    // This allows smooth transition to other inputs without toolbar flickering
    // The next focused input will set its own focusedInput state
  }
  // Update input value when exerciseNumber prop changes
  useEffect(() => {
    if (!isEditingExerciseNumber) {
      setExerciseNumberInput(exerciseNumber.toString())
    }
  }, [exerciseNumber, isEditingExerciseNumber])

  // Sync context value changes back to local input
  useEffect(() => {
    if (isEditingExerciseNumber) {
      setExerciseNumberInput(exerciseNumberInputValue)
    }
  }, [exerciseNumberInputValue, isEditingExerciseNumber])

  // Override context's handleExerciseNumberSubmit with local implementation
  useEffect(() => {
    if (isEditingExerciseNumber) {
      handleExerciseNumberSubmitRef.current = handleExerciseNumberSubmit
    }
  }, [
    isEditingExerciseNumber,
    handleExerciseNumberSubmit,
    handleExerciseNumberSubmitRef,
  ])

  const renderedExerciseButtons = buttons.map(({ name, iconName, onPress }) => {
    const isActive =
      name === 'isUnilateral' && exerciseNumber
        ? workoutData.exercises[exerciseNumber - 1]?.isUnilateral
        : name === 'toggleSync'
          ? !isSynced
          : false
    if (name === 'Delete Exercise' && exercises.length <= 1) {
      return null
    }

    if (name === 'isUnilateral' && exercise.existing) {
      return null
    }

    if (name === 'toggleSync' && !isUnilateral) {
      return null
    }

    if (name === 'View Information' && !exercise.existing) {
      return null
    }

    return (
      <Button
        key={name}
        onPress={onPress}
      >
        <GlassView
          style={tw`p-1.5 rounded-lg border border-light-grayBorder dark:border-dark-grayBorder ${isActive ? 'bg-primary/10 border-primary' : 'bg-light-grayPrimary dark:bg-dark-grayPrimary '}`}
        >
          <SFIcon
            name={iconName as SFSymbol}
            size={18}
            color={isActive ? Colors.primary : theme.grayText}
          />
        </GlassView>
      </Button>
    )
  })

  const renderedSetButtons = setButtons.map(({ name, iconName, onPress }) => {
    return (
      <Button
        key={name}
        onPress={onPress}
      >
        <GlassView
          style={tw`py-1.5 px-6 rounded-lg  flex-row items-center gap-2 bg-light-grayPrimary dark:bg-dark-grayPrimary`}
        >
          <Txt twcn="text-xs font-semibold dark:text-white text-white">
            Add Set
          </Txt>
          <SFIcon
            name={iconName as SFSymbol}
            size={16}
            color={theme.text}
          />
        </GlassView>
      </Button>
    )
  })

  const renderedSetLabels = SetInputs.map(({ label, value }, index) => {
    return (
      <View
        key={value}
        style={tw`flex-1 items-center`}
      >
        <Txt twcn="text-xs font-medium text-light-grayText dark:text-dark-grayText">
          {label}
        </Txt>
      </View>
    )
  })

  const renderedSetInputs = sets.map((set, setIndex) => {
    if (isUnilateral) {
      const setContent = (
        <View>
          <View
            style={tw`flex-row flex-wrap border-b ${isSetInDropset(set.setNumber) ? 'bg-secondary/10' : 'bg-light-background dark:bg-dark-background'} border-light-grayBorder dark:border-dark-grayBorder py-0.5`}
          >
            {SetInputs.map(({ label, value, inputMode }, inputIndex) => {
              let displayValue = ''

              if (value === 'setNumber') {
                displayValue = `${set.setNumber}L.`
              } else if (value === 'reps') {
                displayValue =
                  typeof set.leftReps === 'string'
                    ? set.leftReps
                    : set.leftReps && set.leftReps !== 0
                      ? set.leftReps.toString()
                      : ''
              } else if (value === 'partials') {
                displayValue =
                  typeof set.leftPartialReps === 'string'
                    ? set.leftPartialReps
                    : set.leftPartialReps && set.leftPartialReps !== 0
                      ? set.leftPartialReps.toString()
                      : ''
              } else if (value === 'rpe') {
                displayValue =
                  typeof set.leftRpe === 'string'
                    ? set.leftRpe
                    : set.leftRpe !== undefined && set.leftRpe !== null
                      ? set.leftRpe.toString()
                      : ''
              } else if (value === 'rir') {
                displayValue =
                  typeof set.leftRir === 'string'
                    ? set.leftRir
                    : set.leftRir !== undefined && set.leftRir !== null
                      ? set.leftRir.toString()
                      : ''
              } else {
                const fieldValue = set[value as keyof typeof set]
                displayValue =
                  typeof fieldValue === 'string'
                    ? fieldValue
                    : fieldValue && fieldValue !== 0
                      ? fieldValue.toString()
                      : ''
              }

              return (
                <Input
                  ref={(ref) => {
                    if (ref) {
                      if (value === 'weightLbs' || value === 'weightKg') {
                        leftWeightInputRefs.current.set(set.id, ref)
                      } else if (value === 'reps') {
                        leftRepsInputRefs.current.set(set.id, ref)
                      } else if (value === 'partials') {
                        leftPartialsInputRefs.current.set(set.id, ref)
                      } else if (value === 'rpe') {
                        leftRpeInputRefs.current.set(set.id, ref)
                      } else if (value === 'rir') {
                        leftRpeInputRefs.current.set(set.id, ref)
                      }
                    }
                  }}
                  editable={value !== 'setNumber'}
                  keyboardType={
                    value === 'rpe' ||
                    value === 'rir' ||
                    value === 'weightLbs' ||
                    value === 'weightKg'
                      ? 'decimal-pad'
                      : 'numeric'
                  }
                  inputMode={inputMode}
                  maxLength={value === 'rpe' || value === 'rir' ? 4 : 5}
                  key={`${set.id}-${value}-left`}
                  placeholder="-"
                  twcnInput="w-1/5 text-center py-1 text-light-text dark:text-dark-text"
                  value={displayValue}
                  onChangeText={(text) => {
                    handleInputChange(setIndex, value, text, inputMode, true)
                  }}
                  onFocus={() => {
                    if (value !== 'setNumber') {
                      setFocusedInput({
                        exerciseIndex: exerciseNumber - 1,
                        setIndex,
                        field: value,
                        isLeftSide: true,
                      })
                    }
                  }}
                />
              )
            })}
          </View>
          <View
            style={tw`flex-row flex-wrap border-b ${isSetInDropset(set.setNumber) ? 'bg-secondary/10' : 'bg-light-background dark:bg-dark-background'} border-light-grayBorder dark:border-dark-grayBorder py-1`}
          >
            {SetInputs.map(({ label, value, inputMode }, inputIndex) => {
              let displayValue = ''

              if (value === 'setNumber') {
                displayValue = `${set.setNumber}R.`
              } else if (value === 'reps') {
                displayValue =
                  typeof set.rightReps === 'string'
                    ? set.rightReps
                    : set.rightReps && set.rightReps !== 0
                      ? set.rightReps.toString()
                      : ''
              } else if (value === 'partials') {
                displayValue =
                  typeof set.rightPartialReps === 'string'
                    ? set.rightPartialReps
                    : set.rightPartialReps && set.rightPartialReps !== 0
                      ? set.rightPartialReps.toString()
                      : ''
              } else if (value === 'rpe') {
                displayValue =
                  typeof set.rightRpe === 'string'
                    ? set.rightRpe
                    : set.rightRpe !== undefined && set.rightRpe !== null
                      ? set.rightRpe.toString()
                      : ''
              } else if (value === 'rir') {
                displayValue =
                  typeof set.rightRir === 'string'
                    ? set.rightRir
                    : set.rightRir !== undefined && set.rightRir !== null
                      ? set.rightRir.toString()
                      : ''
              } else {
                const fieldValue = set[value as keyof typeof set]
                displayValue =
                  typeof fieldValue === 'string'
                    ? fieldValue
                    : fieldValue && fieldValue !== 0
                      ? fieldValue.toString()
                      : ''
              }

              return (
                <Input
                  ref={(ref) => {
                    if (ref) {
                      if (value === 'weightLbs' || value === 'weightKg') {
                        weightInputRefs.current.set(set.id, ref)
                      } else if (value === 'reps') {
                        rightRepsInputRefs.current.set(set.id, ref)
                      } else if (value === 'partials') {
                        rightPartialsInputRefs.current.set(set.id, ref)
                      } else if (value === 'rpe') {
                        rightRpeInputRefs.current.set(set.id, ref)
                      } else if (value === 'rir') {
                        rightRpeInputRefs.current.set(set.id, ref)
                      }
                    }
                  }}
                  editable={value !== 'setNumber'}
                  keyboardType={
                    value === 'rpe' ||
                    value === 'rir' ||
                    value === 'weightLbs' ||
                    value === 'weightKg'
                      ? 'decimal-pad'
                      : 'numeric'
                  }
                  inputMode={inputMode}
                  maxLength={value === 'rpe' || value === 'rir' ? 4 : 5}
                  key={`${set.id}-${value}-right`}
                  placeholder="-"
                  twcnInput="w-1/5 text-center py-1 text-light-text dark:text-dark-text"
                  value={displayValue}
                  onChangeText={(text) => {
                    handleInputChange(setIndex, value, text, inputMode, false)
                  }}
                  onFocus={() => {
                    if (value !== 'setNumber') {
                      setFocusedInput({
                        exerciseIndex: exerciseNumber - 1,
                        setIndex,
                        field: value,
                        isLeftSide: false,
                      })
                    }
                  }}
                />
              )
            })}
          </View>
        </View>
      )

      return (
        <Swipeable
          key={set.id}
          renderLeftActions={renderLeftAction(setIndex)}
          renderRightActions={
            setIndex === 0 && sets.length === 1
              ? undefined
              : renderRightAction(setIndex)
          }
          leftThreshold={12}
          rightThreshold={setIndex === 0 ? undefined : 12}
          overshootLeft={false}
          overshootRight={false}
          friction={2}
        >
          {setContent}
        </Swipeable>
      )
    } else {
      // For regular exercises, wrap single row
      const setContent = (
        <View
          style={tw`flex-row flex-wrap ${isSetInDropset(set.setNumber) ? 'bg-secondary/10' : 'bg-light-background dark:bg-dark-background'} border-b border-light-grayBorder dark:border-dark-grayBorder py-1`}
        >
          {SetInputs.map(({ label, value, inputMode }, inputIndex) => {
            // Map 'partials' to 'partialReps' for display
            const displayField = value === 'partials' ? 'partialReps' : value
            const rawValue = set[displayField as keyof typeof set]

            // Special handling for RPE/RIR to allow 0 values
            let displayValue = ''
            if (value === 'rpe' || value === 'rir') {
              displayValue =
                typeof rawValue === 'string'
                  ? rawValue
                  : rawValue !== undefined && rawValue !== null
                    ? rawValue.toString()
                    : ''
            } else {
              displayValue =
                typeof rawValue === 'string'
                  ? rawValue
                  : rawValue && rawValue !== 0
                    ? rawValue.toString()
                    : ''
            }

            return (
              <Input
                ref={(ref) => {
                  if (ref) {
                    if (value === 'weightLbs' || value === 'weightKg') {
                      weightInputRefs.current.set(set.id, ref)
                    } else if (value === 'reps') {
                      repsInputRefs.current.set(set.id, ref)
                    } else if (value === 'partials') {
                      partialsInputRefs.current.set(set.id, ref)
                    } else if (value === 'rpe') {
                      rpeInputRefs.current.set(set.id, ref)
                    }
                  }
                }}
                editable={value !== 'setNumber'}
                keyboardType={
                  value === 'rpe' ||
                  value === 'weightLbs' ||
                  value === 'weightKg'
                    ? 'decimal-pad'
                    : 'numeric'
                }
                inputMode={inputMode}
                maxLength={value === 'rpe' ? 4 : 5}
                key={`${set.id}-${value}-base`}
                placeholder="-"
                twcnInput="w-1/5 text-center py-1 text-light-text dark:text-dark-text"
                value={displayValue}
                onChangeText={(text) => {
                  handleInputChange(setIndex, value, text, inputMode)
                }}
                onFocus={() => {
                  if (value !== 'setNumber') {
                    setFocusedInput({
                      exerciseIndex: exerciseNumber - 1,
                      setIndex,
                      field: value,
                    })
                  }
                }}
              />
            )
          })}
        </View>
      )

      return (
        <Swipeable
          key={set.id}
          renderLeftActions={renderLeftAction(setIndex)}
          renderRightActions={
            setIndex === 0 && sets.length === 1
              ? undefined
              : renderRightAction(setIndex)
          }
          leftThreshold={12}
          rightThreshold={setIndex === 0 ? undefined : 12}
          overshootLeft={false}
          overshootRight={false}
          friction={2}
        >
          {setContent}
        </Swipeable>
      )
    }
  })

  const timelineComponent = (
    <View style={tw`gap-1 justify-center items-center`}>
      <View
        style={tw`${exerciseNumber != 1 ? 'mt-0.5' : '-mt-0.5'} w-8 h-8 rounded-full ${isEditingExerciseNumber ? `${isInSuperset ? 'bg-secondary/80 border border-secondary' : 'bg-primary/80 border border-primary'}` : `${isInSuperset ? 'bg-secondary' : 'bg-primary'}`} items-center justify-center`}
      >
        {isEditingExerciseNumber ? (
          <TextInput
            ref={exerciseNumberInputRef}
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: tw.color('dark-text'),
              textAlign: 'center',
              width: '100%',
              height: '100%',
              padding: 0,
              margin: 0,
              includeFontPadding: false,
            }}
            value={exerciseNumberInput}
            onChangeText={setExerciseNumberInput}
            onSubmitEditing={handleExerciseNumberSubmit}
            onBlur={handleExerciseNumberSubmit}
            keyboardType="numeric"
            maxLength={2}
            selectTextOnFocus
          />
        ) : (
          <Button onPress={handleExerciseNumberEdit}>
            <Txt twcn="text-base text-dark-text font-semibold">
              {exerciseNumber ?? '+'}
            </Txt>
          </Button>
        )}
      </View>
      <View
        style={tw`flex-1 w-1 ${isNextExerciseInSameSuperset ? 'bg-secondary' : 'bg-primary'} rounded-full`}
      />
    </View>
  )

  const formComponent = (
    <View style={tw`flex-1 mb-4 ${exerciseNumber != 1 ? 'mt-1' : ''}`}>
      <View style={tw`flex-row flex-1`}>
        <View style={tw`flex-row gap-2 items-center flex-1 -mt-1.5`}>
          <View
            style={tw`flex-1 shrink border-b border-light-grayBorder dark:border-dark-grayBorder`}
          >
            <Input
              ref={exerciseNameInputRef}
              placeholder={`${`Exercise ${exerciseNumber}`}`}
              maxLength={50}
              value={
                workoutData.exercises[exerciseNumber ? exerciseNumber - 1 : 0]
                  ?.name
              }
              onPress={() => {
                setIsExerciseNameSelectorOpen(!isExerciseNameSelectorOpen)
              }}
              onChange={(e) => handleChange(e.nativeEvent.text)}
              onFocus={() => {
                // Clear results on focus - they'll populate when user types
                setExerciseNameResults([])
                setIsExerciseNameSelectorOpen(false)
                setFocusedInput({
                  exerciseIndex: exerciseNumber - 1,
                  setIndex: -1,
                  field: 'exerciseName',
                })
              }}
              onBlur={() => {
                setIsExerciseNameSelectorOpen(false)
                // Don't clear focusedInput here - let the next focused input handle it
              }}
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="words"
              twcnInput="pb-1"
              {...rest}
            />
            {isExerciseNameSelectorOpen &&
              exerciseNameResults.length > 0 &&
              exercise.name.trim().length > 0 && (
                <GlassView
                  style={tw`absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10`}
                >
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    style={tw`max-h-37 bg-transparent`}
                  >
                    {renderedExerciseNames}
                  </ScrollView>
                </GlassView>
              )}
          </View>
          <View style={tw`flex-row gap-1 items-center`}>
            {renderedExerciseButtons}
          </View>
        </View>
      </View>
      <View style={tw`mt-3`}>
        <View style={tw`flex-row flex-wrap`}>{renderedSetLabels}</View>
        <View style={tw`mt-1`}>{renderedSetInputs}</View>
        <View style={tw`mt-2 flex-row items-center gap-2`}>
          {renderedSetButtons}
        </View>
      </View>
    </View>
  )

  return (
    <View style={tw`flex-row gap-4 items-start`}>
      {timelineComponent}
      {formComponent}
      <MyBottomSheet
        ref={ref}
        onDismiss={() => {
          if (lastFocusedInputMetaRef.current) {
            setFocusedInput(lastFocusedInputMetaRef.current)
          }
          if (lastFocusedInputRef.current) {
            requestAnimationFrame(() => {
              lastFocusedInputRef.current?.focus()
            })
          }
        }}
      >
        <ExerciseMiniHistory
          id={exercise.id as string}
          exerciseIndex={exerciseNumber - 1}
          workoutDate={workoutData.date.toISOString().slice(0, 10)}
        />
      </MyBottomSheet>
    </View>
  )
}

export default ExerciseInput
