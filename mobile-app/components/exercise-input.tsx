import { StyleSheet, Text, View, Animated, Alert } from 'react-native'
import { nanoid } from 'nanoid/non-secure'
import { useWorkoutForm } from '../context/workout-form-context'
import tw from '../tw'
import Txt from './text'
import Input from './input'
import {
  Hand,
  History,
  Plus,
  Redo,
  SquareSplitHorizontal,
  Trash,
} from 'lucide-react-native'
import Button from './button'
import Colors from '../constants/colors'
import { useState } from 'react'
import React from 'react'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'

type ExerciseInputProps = {
  exerciseNumber: number
}

const ExerciseInput = ({ exerciseNumber }: ExerciseInputProps) => {
  const [isExerciseHistoryOpen, setIsExerciseHistoryOpen] = useState(false)
  const { workoutData, setWorkoutData } = useWorkoutForm()
  const { exercises } = workoutData
  const exercise = exercises[exerciseNumber - 1]
  const sets = exercise?.sets
  const weightUnit = workoutData.weightUnit || 'lbs'

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

  console.log('exercise sets: ', sets)

  const handleMakeUnilateral = () => {
    const updatedExercises = [...workoutData.exercises]
    if (exerciseNumber) {
      const currentValue =
        updatedExercises[exerciseNumber - 1]?.isUnilateral || false

      if (currentValue) {
        const resetSets =
          updatedExercises[exerciseNumber - 1]?.sets.map((set, index) => ({
            id: set.id ?? nanoid(),
            setNumber: index + 1,
          })) || []

        updatedExercises[exerciseNumber - 1] = {
          ...updatedExercises[exerciseNumber - 1],
          isUnilateral: false,
          sets: resetSets,
        }
      } else {
        updatedExercises[exerciseNumber - 1] = {
          ...updatedExercises[exerciseNumber - 1],
          isUnilateral: true,
        }
      }

      setWorkoutData({
        ...workoutData,
        exercises: updatedExercises,
      })
    }
  }

  const handleDisplayExerciseHistory = () => {}

  const handleAddNewSet = () => {
    const updatedExercises = [...workoutData.exercises]
    const currentExercise = updatedExercises[exerciseNumber - 1]
    if (!currentExercise) return

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
  }

  const handleDeleteSet = (setIndex: number) => {
    const updatedExercises = [...workoutData.exercises]
    const currentExercise = updatedExercises[exerciseNumber - 1]
    if (!currentExercise || !currentExercise.sets) return

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

    setWorkoutData({
      ...workoutData,
      exercises: updatedExercises,
    })
  }

  const handleCopySet = (setIndex: number) => {
    const updatedExercises = [...workoutData.exercises]
    const currentExercise = updatedExercises[exerciseNumber - 1]
    if (!currentExercise || !currentExercise.sets) return

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
        <View style={tw`bg-primary flex-row justify-start items-center w-1/5`}>
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
        <View style={tw`bg-red-500 flex-row justify-end items-center w-1/5`}>
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
    const finalValue =
      s === ''
        ? undefined
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
    }

    updatedSets[setIndex] = {
      ...updatedSets[setIndex],
      [fieldToUpdate]: isNaN(finalValue as number) ? undefined : finalValue,
    } as any

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
            setWorkoutData({
              ...workoutData,
              exercises: updatedExercises,
            })
          },
        },
      ]
    )
  }

  const buttons = [
    {
      name: 'isUnilateral',
      icon: SquareSplitHorizontal,
      onPress: handleMakeUnilateral,
    },
    {
      name: 'View History',
      icon: History,
      onPress: handleDisplayExerciseHistory,
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

  const renderedExerciseButtons = buttons.map(
    ({ name, icon: Icon, onPress }) => {
      const isActive =
        name === 'isUnilateral' && exerciseNumber
          ? workoutData.exercises[exerciseNumber - 1]?.isUnilateral
          : false
      if (name === 'Delete Exercise' && exercises.length <= 1) {
        return null
      }
      return (
        <Button
          key={name}
          onPress={onPress}
          twcn={`p-2 rounded-xl ${isActive ? 'bg-primary/25' : 'bg-light-grayPrimary dark:bg-dark-grayPrimary'}`}
        >
          <Icon
            strokeWidth={1.5}
            size={16}
            color={Colors.primary}
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
        twcnText="text-xs uppercase text-primary"
        twcn={`p-2 flex-row flex-1 items-center justify-center gap-2 rounded-xl bg-light-grayPrimary dark:bg-dark-grayPrimary`}
      >
        <Icon
          strokeWidth={1.5}
          size={16}
          color={Colors.primary}
        />
      </Button>
    )
  })

  const renderedSetLabels = SetInputs.map(({ label, value }, index) => {
    return (
      <View
        key={value}
        style={tw`w-1/5 items-center`}
      >
        <Txt twcn="text-xs font-poppinsMedium uppercase tracking-wider text-light-grayText dark:text-dark-grayText">
          {label}
        </Txt>
      </View>
    )
  })

  const isUnilateral = exercise?.isUnilateral || false

  const renderedSetInputs = sets.map((set, setIndex) => {
    if (isUnilateral) {
      // For unilateral exercises, wrap both left and right rows together
      const setContent = (
        <View>
          <View
            style={tw`flex-row flex-wrap border-b bg-light-background dark:bg-dark-background border-light-grayTertiary dark:border-dark-grayTertiary py-1`}
          >
            {SetInputs.map(({ label, value, inputMode }, inputIndex) => {
              let displayValue = ''

              if (value === 'setNumber') {
                displayValue = `${set.setNumber}L.`
              } else if (value === 'reps') {
                displayValue = set.leftReps?.toString() || ''
              } else if (value === 'partials') {
                displayValue = set.leftPartialReps?.toString() || ''
              } else if (value === 'rpe') {
                displayValue = set.leftRpe?.toString() || ''
              } else {
                displayValue = set[value as keyof typeof set]?.toString() || ''
              }

              return (
                <Input
                  editable={value !== 'setNumber'}
                  noBorder
                  keyboardType={'numeric'}
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
            style={tw`flex-row flex-wrap border-b bg-light-background dark:bg-dark-background border-light-grayTertiary  dark:border-dark-grayTertiary py-1`}
          >
            {SetInputs.map(({ label, value, inputMode }, inputIndex) => {
              let displayValue = ''

              if (value === 'setNumber') {
                displayValue = `${set.setNumber}R.`
              } else if (value === 'reps') {
                displayValue = set.rightReps?.toString() || ''
              } else if (value === 'partials') {
                displayValue = set.rightPartialReps?.toString() || ''
              } else if (value === 'rpe') {
                displayValue = set.rightRpe?.toString() || ''
              } else {
                displayValue = set[value as keyof typeof set]?.toString() || ''
              }

              return (
                <Input
                  editable={value !== 'setNumber'}
                  noBorder
                  keyboardType={'numeric'}
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
          onSwipeableOpen={(direction) => {
            console.log(`Swipe opened: ${direction}`)
          }}
        >
          {setContent}
        </Swipeable>
      )
    } else {
      // For regular exercises, wrap single row
      const setContent = (
        <View
          style={tw`flex-row flex-wrap bg-light-background dark:bg-dark-background border-b border-light-grayTertiary dark:border-dark-grayTertiary py-1`}
        >
          {SetInputs.map(({ label, value, inputMode }, inputIndex) => {
            return (
              <Input
                editable={value !== 'setNumber'}
                noBorder
                keyboardType={'numeric'}
                inputMode={inputMode}
                maxLength={value === 'rpe' ? 4 : 5}
                key={`${set.id}-${value}-base`}
                placeholder="-"
                twcnInput="w-1/5 text-center py-1 text-light-text dark:text-dark-text"
                value={set[value as keyof typeof set]?.toString() || ''}
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
          onSwipeableOpen={(direction) => {
            console.log(`Swipe opened: ${direction}`)
          }}
        >
          {setContent}
        </Swipeable>
      )
    }
  })

  const timelineComponent = (
    <View style={tw`gap-1 justify-center items-center`}>
      <View
        style={tw`${exerciseNumber != 1 ? 'mt-1' : ''} w-7 h-7 rounded-full bg-primary items-center justify-center`}
      >
        <Txt twcn="text-sm text-dark-text font-poppinsSemiBold">
          {exerciseNumber ?? '+'}
        </Txt>
      </View>
      <View style={tw`flex-1 w-1 bg-primary rounded-full`} />
    </View>
  )

  const formComponent = (
    <View style={tw`flex-1 mb-4 ${exerciseNumber != 1 ? 'mt-1' : ''}`}>
      <View style={tw`flex-row flex-1`}>
        <View style={tw`flex-row gap-2 items-center flex-1`}>
          <View
            style={tw`flex-1 shrink pb-2 border-b border-light-grayTertiary dark:border-dark-grayTertiary`}
          >
            <Input
              placeholder={`${`Exercise ${exerciseNumber}`}`}
              noBorder
              twcnInput="py-0 flex-1"
              value={
                workoutData.exercises[exerciseNumber ? exerciseNumber - 1 : 0]
                  ?.name
              }
              onChange={(e) => {
                const updatedExercises = [...workoutData.exercises]
                updatedExercises[exerciseNumber ? exerciseNumber - 1 : 0] = {
                  ...updatedExercises[exerciseNumber ? exerciseNumber - 1 : 0],
                  name: e.nativeEvent.text,
                }
                setWorkoutData({
                  ...workoutData,
                  exercises: updatedExercises,
                })
              }}
            />
          </View>
          <View style={tw`flex-row gap-2 items-center`}>
            {renderedExerciseButtons}
          </View>
        </View>
      </View>
      <View style={tw`mt-4`}>
        <View style={tw`flex-row flex-wrap`}>{renderedSetLabels}</View>
        <View style={tw`mt-2`}>{renderedSetInputs}</View>
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
    </View>
  )
}

export default ExerciseInput
