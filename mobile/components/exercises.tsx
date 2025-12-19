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

  return (
    <View>
      <View style={tw`flex-row justify-between items-center`}>
        <View style={tw`flex-row items-center gap-2`}>
          <Txt twcn="font-semibold">Exercises</Txt>
          <Button onPress={() => setIsHelpModalOpen(true)}>
            <HelpCircle
              size={16}
              color={theme.grayText}
            />
          </Button>
        </View>

        <Button onPress={() => setIsOptionsModalOpen(true)}>
          <Ellipsis
            size={20}
            color={theme.grayText}
            hitSlop={12}
            strokeWidth={1.5}
          />
        </Button>
      </View>
      <View style={tw`mt-4`}>{renderedExercises}</View>
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
        isOpen={isOptionsModalOpen}
        setIsOpen={setIsOptionsModalOpen}
      >
        <ExerciseOptions closeModal={() => setIsOptionsModalOpen(false)} />
      </MyModal>
      <MyModal
        isOpen={isHelpModalOpen}
        setIsOpen={setIsHelpModalOpen}
      >
        <Txt twcn="font-medium mb-4">Exercises Guide</Txt>
        <View style={tw`gap-4`}>{renderedGuide}</View>
      </MyModal>
    </View>
  )
}

export default Exercises

const styles = StyleSheet.create({})
