import { StyleSheet, View, Alert, Keyboard } from 'react-native'
import React, { useRef, useState } from 'react'
import { useWorkoutForm } from '../context/workout-form-context'
import tw from '../tw'
import Txt from './text'
import Button from './button'
import useTheme from '../app/hooks/theme'
import ExerciseInput from './exercise-input'
import Colors from '../constants/colors'
import { nanoid } from 'nanoid/non-secure'
import {
  ContextMenu,
  Host,
  Picker,
  Button as SwiftButton,
} from '@expo/ui/swift-ui'
import SFIcon from './sf-icon'
import { router } from 'expo-router'
import MyBottomSheet from './bottom-sheet'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { SFSymbol } from 'expo-symbols'

const MAX_EXERCISES = 25

const Exercises = () => {
  const { workoutData, setWorkoutData, setNewlyAddedExerciseNumber } =
    useWorkoutForm()
  const ref = useRef<BottomSheetModal | null>(null)
  const { theme } = useTheme()

  const handleAddEmptyExercise = () => {
    if (workoutData.exercises.length >= MAX_EXERCISES) {
      Alert.alert(
        'Limit Reached',
        'You can only add up to 25 exercises per workout.',
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
      iconName: 'square.on.square',
      title: 'Unilateral',
      description:
        'Toggle between unilateral (left/right) and bilateral modes for custom exercises',
    },
    {
      iconName: 'rectangle.split.2x1',
      title: 'Sync/Separate',
      description:
        'For unilateral exercises: sync left/right values together or log them separately',
    },
    {
      iconName: 'info.circle',
      title: 'Exercise Info',
      description: 'View exercise history and notes',
    },
    {
      iconName: 'trash',
      title: 'Delete Exercise',
      description: 'Remove this exercise from the workout',
    },
  ]

  const renderedGuide = guideItems.map(({ iconName, title, description }) => (
    <View
      key={title}
      style={tw`flex-row items-start gap-3`}
    >
      <View
        style={tw`p-1.5 rounded-lg border border-light-grayBorder dark:border-dark-grayBorder bg-light-grayPrimary dark:bg-dark-grayPrimary`}
      >
        <SFIcon
          name={iconName as SFSymbol}
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
          <Txt twcn="font-semibold text-lg">Exercises</Txt>
          <Button
            onPress={() => {
              Keyboard.dismiss()
              ref.current?.present()
            }}
          >
            <SFIcon
              name="questionmark.circle"
              size={16}
              color={theme.grayText}
            />
          </Button>
        </View>
      </View>
      <View style={tw`mt-6`}>{renderedExercises}</View>
      <View
        style={tw`w-8 h-8 mt-1 rounded-full bg-primary items-center justify-center`}
      >
        <Button
          onPress={handleAddEmptyExercise}
          twcn="w-full h-full items-center justify-center"
        >
          <SFIcon
            name="plus"
            size={22}
            color={Colors.dark.text}
          />
        </Button>
      </View>
      <MyBottomSheet ref={ref}>
        <Txt twcn="font-semibold text-lg mb-4">Exercises Guide</Txt>
        <View style={tw`gap-6`}>{renderedGuide}</View>
      </MyBottomSheet>
    </View>
  )
}

export default Exercises

const styles = StyleSheet.create({})
