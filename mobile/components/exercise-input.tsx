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
import { BlurView } from 'expo-blur'
import tw from '../tw'
import Txt from './text'
import Input from './input'
import {
  ChevronsLeftRightEllipsis,
  Info,
  Plus,
  Redo,
  SquareSplitHorizontal,
  Trash,
} from 'lucide-react-native'
import Button from './button'
import Colors from '../constants/colors'
import { useState, useEffect, useRef, use } from 'react'
import React from 'react'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import useTheme from '../app/hooks/theme'
import MyModal from './modal'
import ExerciseMiniHistory from './exercise-mini-history'
import { useUserStore } from '../stores/user-store'
import { ExerciseName } from '../utils/types'

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
  const [isExerciseInfoOpen, setIsExerciseInfoOpen] = useState(false)
  const [isExerciseNameSelectorOpen, setIsExerciseNameSelectorOpen] =
    useState(false)
  const [exerciseNameResults, setExerciseNameResults] = useState<
    ExerciseName[]
  >([])
  const exerciseNameInputRef = useRef<TextInput>(null)
  const [newlyAddedSetId, setNewlyAddedSetId] = useState<string | null>(null)
  const weightInputRefs = useRef<Map<string, TextInput>>(new Map())
  const leftWeightInputRefs = useRef<Map<string, TextInput>>(new Map())
  const [isEditingExerciseNumber, setIsEditingExerciseNumber] = useState(false)
  const [exerciseNumberInput, setExerciseNumberInput] = useState(
    exerciseNumber.toString()
  )
  const exerciseNumberInputRef = useRef<TextInput>(null)
  const {
    workoutData,
    setWorkoutData,
    exerciseNames,
    newlyAddedExerciseNumber,
    setNewlyAddedExerciseNumber,
  } = useWorkoutForm()
  const { preferences } = useUserStore()
  const [isSynced, setIsSynced] = useState(
    preferences?.unilateralLogging === 'sync'
  )
  const { exercises } = workoutData
  const { theme } = useTheme()
  const exercise = exercises[exerciseNumber - 1]
  const sets = exercise?.sets
  const weightUnit = workoutData.weightUnit || 'lbs'
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
      }, 100)

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

  const isInSuperset = workoutData.setGroupings.some(
    (grouping) =>
      grouping.groupingType === 'superset' &&
      grouping.groupSets.some((set) => set.exerciseNumber === exerciseNumber)
  )

  // Check if the next exercise is in the same superset group
  const isNextExerciseInSameSuperset = workoutData.setGroupings.some(
    (grouping) =>
      grouping.groupingType === 'superset' &&
      grouping.groupSets.some((set) => set.exerciseNumber === exerciseNumber) &&
      grouping.groupSets.some(
        (set) => set.exerciseNumber === exerciseNumber + 1
      )
  )

  const isSetInDropset = (setNumber: number) => {
    return workoutData.setGroupings.some(
      (grouping) =>
        grouping.groupingType === 'dropset' &&
        grouping.groupSets.some(
          (set) =>
            set.exerciseNumber === exerciseNumber && set.setNumber === setNumber
        )
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
      label: 'RPE',
      value: 'rpe',
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
    setIsExerciseInfoOpen(true)
  }

  const handleAddNewSet = () => {
    const updatedExercises = [...workoutData.exercises]
    const currentExercise = updatedExercises[exerciseNumber - 1]
    if (!currentExercise) return
    if (currentExercise.sets.length >= MAX_SETS) {
      Alert.alert(
        'Limit Reached',
        'You can only add up to 20 sets per exercise.'
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
      (_, index) => index !== setIndex
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
            )
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
        'You can only add up to 20 sets per exercise.'
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
        <View
          style={tw`bg-green dark:bg-green flex-row justify-start items-center w-1/5`}
        >
          <Button
            onPress={() => {
              handleCopySet(setIndex)
              swipeable.close()
            }}
            twcn="p-2 w-full items-center justify-center"
          >
            <Redo
              size={16}
              color="white"
              strokeWidth={2}
            />
          </Button>
        </View>
      )
    }

  const renderRightAction =
    (setIndex: number) => (progress: any, dragX: any, swipeable: any) => {
      return (
        <View
          style={tw`bg-red dark:bg-red flex-row justify-end items-center w-1/5`}
        >
          <Button
            onPress={() => {
              handleDeleteSet(setIndex)
              swipeable.close()
            }}
            twcn="p-2 w-full items-center justify-center"
          >
            <Trash
              size={16}
              color="white"
              strokeWidth={2}
            />
          </Button>
        </View>
      )
    }

  const handleInputChange = (
    setIndex: number,
    fieldValue: string,
    text: string,
    inputMode: 'numeric' | 'decimal',
    isLeftSide?: boolean
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
    const finalValue =
      s === ''
        ? undefined
        : inputMode === 'decimal' && s.endsWith('.')
          ? s // keep as string if it ends with decimal
          : inputMode === 'decimal'
            ? parseFloat(s)
            : parseInt(s, 10)

    const updatedExercises = [...workoutData.exercises]
    const updatedSets = [...(updatedExercises[exerciseNumber - 1]?.sets || [])]

    let fieldToUpdate: string = fieldValue
    if (isUnilateral && isLeftSide !== undefined) {
      if (fieldValue === 'reps')
        fieldToUpdate = isLeftSide ? 'leftReps' : 'rightReps'
      else if (fieldValue === 'partials')
        fieldToUpdate = isLeftSide ? 'leftPartialReps' : 'rightPartialReps'
      else if (fieldValue === 'rpe')
        fieldToUpdate = isLeftSide ? 'leftRpe' : 'rightRpe'
    } else {
      // For non-unilateral exercises, map 'partials' to 'partialReps'
      if (fieldValue === 'partials') fieldToUpdate = 'partialReps'
    }

    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      [fieldToUpdate]: isNaN(finalValue as number) ? undefined : finalValue,
    } as any

    // If in sync mode and editing left side, also update right side
    if (isUnilateral && isSynced && isLeftSide === true) {
      if (fieldValue === 'reps') {
        updatedSets[setIndex].rightReps = updatedSets[setIndex].leftReps
      } else if (fieldValue === 'partials') {
        updatedSets[setIndex].rightPartialReps =
          updatedSets[setIndex].leftPartialReps
      } else if (fieldValue === 'rpe') {
        updatedSets[setIndex].rightRpe = updatedSets[setIndex].leftRpe
      }
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
                  (gs) => gs.exerciseNumber !== exerciseNumber
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
      ]
    )
  }

  const handleToggleSync = () => {
    setIsSynced(!isSynced)
  }

  const buttons = [
    {
      name: 'isUnilateral', // IF NOT EXISTS BEFORE, else HIDE
      icon: ChevronsLeftRightEllipsis,
      onPress: handleMakeUnilateral,
    },
    {
      name: 'toggleSync',
      icon: SquareSplitHorizontal,
      onPress: handleToggleSync,
    },
    {
      name: 'View Information', // history & exercise notes, IF EXISTS BEFORE, else HIDE
      icon: Info,
      onPress: handleDisplayExerciseInfo,
    },
    {
      name: 'Delete Exercise',
      icon: Trash,
      onPress: handleDeleteExercise,
    },
  ]

  const setButtons = [
    {
      name: 'Add New Set',
      icon: Plus,
      onPress: handleAddNewSet,
    },
  ]

  const handleSelectExistingExercise = (
    id: string,
    name: string,
    used: number
  ) => {
    setWorkoutData((prev) => {
      const updatedExercises = [...prev.exercises]
      if (exerciseNumber) {
        updatedExercises[exerciseNumber - 1] = {
          ...updatedExercises[exerciseNumber - 1],
          id,
          name,
          isUnilateral:
            exerciseNames.find((ex) => ex.name === name)?.isUnilateral || false,
          existing: true,
          used,
        }
      }
      return {
        ...prev,
        exercises: updatedExercises,
      }
    })
    setIsExerciseNameSelectorOpen(false)
    Keyboard.dismiss()
  }

  const renderedExerciseNames = exerciseNameResults.map(
    ({ id, name, used }, index) => {
      return (
        <Button
          key={name}
          onPress={() => handleSelectExistingExercise(id, name, used)}
          style={tw`flex-row items-center justify-between p-3 w-full bg-transparent ${
            index === exerciseNameResults.length - 1
              ? ''
              : 'border-b border-light-grayBorder dark:border-dark-grayBorder'
          }`}
        >
          <Txt>{name}</Txt>
          {used > 0 && <Txt>{used}</Txt>}
        </Button>
      )
    }
  )

  const handleChange = (text: string) => {
    const updatedExercises = [...workoutData.exercises]
    const exerciseIndex = exerciseNumber ? exerciseNumber - 1 : 0
    const currentExercise = updatedExercises[exerciseIndex]

    // Check if there's a matching exercise (trimmed comparison)
    const matchingExercise = exerciseNames.find(
      (ex) => ex.name.toLowerCase() === text.toLowerCase().trim()
    )

    const isEditing =
      currentExercise.name !== text && currentExercise.name !== ''

    // Only mark as non-existing if trimmed text doesn't match an existing exercise
    updatedExercises[exerciseIndex] = {
      ...currentExercise,
      name: text,
      existing: matchingExercise ? true : false,
    }

    if (isEditing && currentExercise.existing && !matchingExercise) {
      // Only reset sets if we're breaking away from an existing exercise
      updatedExercises[exerciseIndex].sets = [
        {
          setNumber: 1,
          id: nanoid(),
        },
      ]
    }

    if (matchingExercise && text.trim() !== '') {
      // Update with matching exercise data
      updatedExercises[exerciseIndex] = {
        ...updatedExercises[exerciseIndex],
        id: matchingExercise.id,
        name: text, // Keep the user's typed text (may have trailing spaces)
        isUnilateral: matchingExercise.isUnilateral || false,
        existing: true,
      }

      setWorkoutData({
        ...workoutData,
        exercises: updatedExercises,
      })

      setIsExerciseNameSelectorOpen(false)
      // Don't dismiss keyboard - allow user to continue typing if they want
      return
    }

    setWorkoutData({
      ...workoutData,
      exercises: updatedExercises,
    })

    const filtered = exerciseNames.filter((workout) =>
      workout.name.toLowerCase().includes(text.toLowerCase())
    )
    setExerciseNameResults(filtered)

    if (text.trim() === '') {
      setIsExerciseNameSelectorOpen(false)
    } else if (!isExerciseNameSelectorOpen) {
      setIsExerciseNameSelectorOpen(true)
    }
  }

  const handleExerciseNumberEdit = () => {
    setIsEditingExerciseNumber(true)
    setExerciseNumberInput(exerciseNumber.toString())
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
      return
    }

    // Clamp to valid range
    const maxNumber = totalExercises || workoutData.exercises.length
    const clampedNumber = Math.min(newNumber, maxNumber)

    if (clampedNumber !== exerciseNumber && onReorderExercises) {
      // Calculate the target index (0-based)
      const currentIndex = exerciseNumber - 1
      const targetIndex = clampedNumber - 1

      // Reorder the exercises
      onReorderExercises(currentIndex, targetIndex)
    }

    setIsEditingExerciseNumber(false)
  }

  const handleExerciseNumberCancel = () => {
    setExerciseNumberInput(exerciseNumber.toString())
    setIsEditingExerciseNumber(false)
  }

  // Update input value when exerciseNumber prop changes
  React.useEffect(() => {
    if (!isEditingExerciseNumber) {
      setExerciseNumberInput(exerciseNumber.toString())
    }
  }, [exerciseNumber, isEditingExerciseNumber])

  const renderedExerciseButtons = buttons.map(
    ({ name, icon: Icon, onPress }) => {
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
          twcn={`p-1.5 rounded-lg border border-light-grayBorder dark:border-dark-grayBorder ${isActive ? 'bg-primary/10 border-primary' : 'bg-light-grayPrimary dark:bg-dark-grayPrimary '}`}
        >
          <Icon
            size={16}
            color={isActive ? Colors.primary : theme.grayText}
          />
        </Button>
      )
    }
  )

  const renderedSetButtons = setButtons.map(({ name, icon: Icon, onPress }) => {
    return (
      <Button
        key={name}
        onPress={onPress}
        text="Add Set"
        hitSlop={12}
        twcnText="text-primary dark:text-primary font-poppinsSemiBold"
        twcn="px-2"
      />
    )
  })

  const renderedSetLabels = SetInputs.map(({ label, value }, index) => {
    return (
      <View
        key={value}
        style={tw`flex-1 items-center`}
      >
        <Txt twcn="text-xs font-poppinsMedium text-light-grayText dark:text-dark-grayText">
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
                    : set.leftReps?.toString() || ''
              } else if (value === 'partials') {
                displayValue =
                  typeof set.leftPartialReps === 'string'
                    ? set.leftPartialReps
                    : set.leftPartialReps?.toString() || ''
              } else if (value === 'rpe') {
                displayValue =
                  typeof set.leftRpe === 'string'
                    ? set.leftRpe
                    : set.leftRpe?.toString() || ''
              } else {
                const fieldValue = set[value as keyof typeof set]
                displayValue =
                  typeof fieldValue === 'string'
                    ? fieldValue
                    : fieldValue?.toString() || ''
              }

              return (
                <Input
                  ref={(ref) => {
                    if (
                      ref &&
                      (value === 'weightLbs' || value === 'weightKg')
                    ) {
                      leftWeightInputRefs.current.set(set.id, ref)
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
                  key={`${set.id}-${value}-left`}
                  placeholder="-"
                  twcnInput="w-1/5 text-center py-1 text-light-text dark:text-dark-text"
                  value={displayValue}
                  onChangeText={(text) => {
                    handleInputChange(setIndex, value, text, inputMode, true)
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
                    : set.rightReps?.toString() || ''
              } else if (value === 'partials') {
                displayValue =
                  typeof set.rightPartialReps === 'string'
                    ? set.rightPartialReps
                    : set.rightPartialReps?.toString() || ''
              } else if (value === 'rpe') {
                displayValue =
                  typeof set.rightRpe === 'string'
                    ? set.rightRpe
                    : set.rightRpe?.toString() || ''
              } else {
                const fieldValue = set[value as keyof typeof set]
                displayValue =
                  typeof fieldValue === 'string'
                    ? fieldValue
                    : fieldValue?.toString() || ''
              }

              return (
                <Input
                  ref={(ref) => {
                    if (
                      ref &&
                      (value === 'weightLbs' || value === 'weightKg')
                    ) {
                      weightInputRefs.current.set(set.id, ref)
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
                  key={`${set.id}-${value}-right`}
                  placeholder="-"
                  twcnInput="w-1/5 text-center py-1 text-light-text dark:text-dark-text"
                  value={displayValue}
                  onChangeText={(text) => {
                    handleInputChange(setIndex, value, text, inputMode, false)
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
            const displayValue = set[displayField as keyof typeof set]

            return (
              <Input
                ref={(ref) => {
                  if (ref && (value === 'weightLbs' || value === 'weightKg')) {
                    weightInputRefs.current.set(set.id, ref)
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
                value={
                  typeof displayValue === 'string'
                    ? displayValue
                    : displayValue?.toString() || ''
                }
                onChangeText={(text) => {
                  handleInputChange(setIndex, value, text, inputMode)
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
        style={tw`${exerciseNumber != 1 ? 'mt-1' : ''} w-7 h-7 rounded-full ${isEditingExerciseNumber ? `${isInSuperset ? 'bg-secondary/80 border border-secondary' : 'bg-primary/80 border border-primary'}` : `${isInSuperset ? 'bg-secondary' : 'bg-primary'}`} items-center justify-center`}
      >
        {isEditingExerciseNumber ? (
          <TextInput
            ref={exerciseNumberInputRef}
            style={tw`text-sm text-dark-text font-poppinsSemiBold w-full h-full`}
            textAlign="center"
            textAlignVertical="center"
            value={exerciseNumberInput}
            onChangeText={setExerciseNumberInput}
            onSubmitEditing={handleExerciseNumberSubmit}
            onBlur={handleExerciseNumberCancel}
            keyboardType="numeric"
            maxLength={2}
            selectTextOnFocus={false}
          />
        ) : (
          <Button onPress={handleExerciseNumberEdit}>
            <Txt twcn="text-sm text-dark-text font-poppinsSemiBold">
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
              onFocus={() => setIsExerciseNameSelectorOpen(true)}
              onBlur={() => setIsExerciseNameSelectorOpen(false)}
              {...rest}
            />
            {isExerciseNameSelectorOpen && exerciseNameResults.length > 0 && (
              <BlurView
                intensity={50}
                tint="default"
                style={[
                  tw`absolute top-full bg-light-grayPrimary/25 dark:bg-dark-grayPrimary/25 left-0 right-0 mt-1 rounded-xl overflow-hidden z-10 border border-light-grayBorder dark:border-dark-grayBorder`,
                ]}
              >
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  style={tw`max-h-44`}
                >
                  {renderedExerciseNames}
                </ScrollView>
              </BlurView>
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
    <View style={tw`flex-row gap-2 items-start`}>
      {timelineComponent}
      {formComponent}
      <MyModal
        isOpen={isExerciseInfoOpen}
        setIsOpen={setIsExerciseInfoOpen}
      >
        <ExerciseMiniHistory id={exercise.id as string} />
      </MyModal>
    </View>
  )
}

export default ExerciseInput
