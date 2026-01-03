import { StyleSheet, View, Alert } from 'react-native'
import React, { useState } from 'react'
import { useWorkoutForm } from '../context/workout-form-context'
import tw from '../tw'
import Txt from './text'
import Button from './button'
import {
  ChevronsLeftRightEllipsis,
  Ellipsis,
  HelpCircle,
  Info,
  Plus,
  SquareSplitHorizontal,
  SquareStack,
  Trash,
} from 'lucide-react-native'
import useTheme from '../app/hooks/theme'
import ExerciseInput from './exercise-input'
import Colors from '../constants/colors'
import { nanoid } from 'nanoid/non-secure'
import MyModal from './modal'
import ExerciseOptions from './exercise-options'
import {
  ContextMenu,
  Host,
  Picker,
  Button as SwiftButton,
} from '@expo/ui/swift-ui'
import SFIcon from './sf-icon'
import { router } from 'expo-router'

const MAX_EXERCISES = 25

const Exercises = () => {
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const { workoutData, setWorkoutData, setNewlyAddedExerciseNumber } =
    useWorkoutForm()
  const { theme } = useTheme()

  const handleAddEmptyExercise = () => {
    if (workoutData.exercises.length >= MAX_EXERCISES) {
      Alert.alert(
        'Limit Reached',
        'You can only add up to 25 exercises per workout.'
      )
      return
    }
    const starterExercise = {
      name: '',
      isUnilateral: false,
      sets: [
        {
          setNumber: 1,
          id: nanoid(),
        },
      ],
      setGroupings: [],
      details: {
        loading: true,
        data: null,
      },
    }
    const newExerciseNumber = workoutData.exercises.length + 1
    setWorkoutData({
      ...workoutData,
      exercises: [...workoutData.exercises, starterExercise],
    })

    // for autofocus
    setNewlyAddedExerciseNumber(newExerciseNumber)
  }

  const handleReorderExercises = (fromIndex: number, toIndex: number) => {
    const updatedExercises = [...workoutData.exercises]
    const [movedExercise] = updatedExercises.splice(fromIndex, 1)
    updatedExercises.splice(toIndex, 0, movedExercise)

    setWorkoutData({
      ...workoutData,
      exercises: updatedExercises,
    })
  }

  const guideItems = [
    {
      icon: ChevronsLeftRightEllipsis,
      title: 'Unilateral',
      description:
        'Toggle between unilateral (left/right) and bilateral modes for custom exercises',
    },
    {
      icon: SquareSplitHorizontal,
      title: 'Sync/Separate',
      description:
        'For unilateral exercises: sync left/right values together or log them separately',
    },
    {
      icon: Info,
      title: 'Exercise Info',
      description: 'View exercise history and notes',
    },
    {
      icon: Trash,
      title: 'Delete Exercise',
      description: 'Remove this exercise from the workout',
    },
  ]

  const renderedGuide = guideItems.map(({ icon: Icon, title, description }) => (
    <View
      key={title}
      style={tw`flex-row items-start gap-3`}
    >
      <View
        style={tw`p-1.5 rounded-lg border border-light-grayBorder dark:border-dark-grayBorder bg-light-grayPrimary dark:bg-dark-grayPrimary`}
      >
        <Icon
          size={16}
          color={theme.grayText}
        />
      </View>
      <View style={tw`flex-1`}>
        <Txt twcn="font-medium text-sm">{title}</Txt>
        <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText mt-0.5">
          {description}
        </Txt>
      </View>
    </View>
  ))

  const renderedExercises = workoutData.exercises.map((exercise, index) => {
    return (
      <ExerciseInput
        key={index}
        exerciseNumber={index + 1}
        totalExercises={workoutData.exercises.length}
        onReorderExercises={handleReorderExercises}
      />
    )
  })

  const canCreateSuperset =
    workoutData.exercises.length >= 2 &&
    workoutData.exercises.filter(
      (ex) => ex.name.trim() !== '' && ex.sets.length >= 1
    ).length >= 2

  const canCreateDropset =
    workoutData.exercises.length >= 1 &&
    workoutData.exercises.some((ex) => {
      const setsWithData = ex.sets.filter((set) => {
        const hasWeight =
          (set.weightLbs !== null && set.weightLbs !== undefined) ||
          (set.weightKg !== null && set.weightKg !== undefined)
        const hasReps =
          (set.reps !== null && set.reps !== undefined) ||
          (set.leftReps !== null && set.leftReps !== undefined) ||
          (set.rightReps !== null && set.rightReps !== undefined)
        return hasWeight || hasReps
      })
      return setsWithData.length >= 2
    })

  return (
    <View>
      <View style={tw`flex-row justify-between items-center`}>
        <View style={tw`flex-row items-center gap-2`}>
          <Txt twcn="font-semibold text-lg">Exercises</Txt>
          <Button onPress={() => setIsHelpModalOpen(true)}>
            <HelpCircle
              size={16}
              color={theme.grayText}
            />
          </Button>
        </View>

        <Host style={{ width: 26, height: 26 }}>
          <ContextMenu>
            <ContextMenu.Items>
              <SwiftButton
                disabled={!canCreateSuperset}
                onPress={() => {
                  router.push('/workout-form/supersets')
                }}
              >
                Supersets
              </SwiftButton>
              <SwiftButton
                disabled={!canCreateDropset}
                onPress={() => {
                  router.push('/workout-form/dropsets')
                }}
              >
                Dropsets
              </SwiftButton>

              <Picker
                label="Weight Unit"
                options={['Lbs.', 'Kg.']}
                variant="menu"
                selectedIndex={workoutData.weightUnit === 'lbs' ? 0 : 1}
                onOptionSelected={({ nativeEvent: { index } }) =>
                  setWorkoutData({
                    ...workoutData,
                    weightUnit: index === 0 ? 'lbs' : 'kgs',
                  })
                }
              />
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
      <View style={tw`mt-6`}>{renderedExercises}</View>
      <View
        style={tw`w-8 h-8 mt-1 rounded-full bg-primary items-center justify-center`}
      >
        <Button
          onPress={handleAddEmptyExercise}
          twcn="w-full h-full items-center justify-center"
        >
          <Plus
            strokeWidth={2.5}
            size={22}
            color={Colors.dark.text}
          />
        </Button>
      </View>
      <MyModal
        isOpen={isHelpModalOpen}
        setIsOpen={setIsHelpModalOpen}
      >
        <Txt twcn="font-semibold text-base mb-2">Exercises Guide</Txt>
        <View style={tw`gap-4`}>{renderedGuide}</View>
      </MyModal>
    </View>
  )
}

export default Exercises

const styles = StyleSheet.create({})
