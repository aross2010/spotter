import { StyleSheet, ScrollView, View, Switch } from 'react-native'
import React, { useState } from 'react'
import { useWorkoutForm } from '../context/workout-form-context'
import tw from '../tw'
import Txt from './text'
import Button from './button'
import { Ellipsis, Plus, SquareStack } from 'lucide-react-native'
import useTheme from '../hooks/theme'
import ExerciseInput from './exercise-input'
import Colors from '../constants/colors'
import { nanoid } from 'nanoid/non-secure'
import DropdownMenu from './dropdown-menu'
import { router } from 'expo-router'
import { useUserStore } from '../stores/user-store'

const Exercises = () => {
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false)
  const { workoutData, setWorkoutData, setNewlyAddedExerciseNumber } =
    useWorkoutForm()
  const { theme } = useTheme()
  const { weightUnit } = workoutData

  const handleAddEmptyExercise = () => {
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

    // Mark this exercise as newly added so it can be auto-focused
    setNewlyAddedExerciseNumber(newExerciseNumber)
  }

  const renderedExercises = workoutData.exercises.map((exercise, index) => {
    return (
      <ExerciseInput
        key={index}
        exerciseNumber={index + 1}
      />
    )
  })

  return (
    <View>
      <View style={tw`flex-row justify-between items-center`}>
        <Txt twcn="text-xs uppercase tracking-wide font-medium text-light-grayText dark:text-dark-grayText">
          Exercises
        </Txt>
        <View style={tw`flex-row items-center gap-4`}>
          <View style={tw`flex-row items-center gap-1`}>
            <Txt
              twcn={`${weightUnit === 'kg' ? 'text-primary' : 'text-light-grayText dark:text-dark-grayText'} font-semibold uppercase text-xs tracking-wide`}
            >
              Kg.
            </Txt>
            <View style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}>
              <Switch
                onChange={() => {
                  setWorkoutData({
                    ...workoutData,
                    weightUnit: workoutData.weightUnit === 'lbs' ? 'kg' : 'lbs',
                  })
                }}
                value={workoutData.weightUnit === 'lbs'}
                trackColor={{
                  false: theme.grayPrimary,
                  true: Colors.primary,
                }}
              />
            </View>
            <Txt
              twcn={`${weightUnit === 'lbs' ? 'text-primary' : 'text-light-grayText dark:text-dark-grayText'} font-semibold uppercase text-xs tracking-wide`}
            >
              Lbs.
            </Txt>
          </View>
          <DropdownMenu
            options={[
              {
                label: 'Supersets',
                icon: SquareStack,
                onPress: () => router.push('/workout-form/supersets'),
                type: 'button',
              },
              {
                label: 'Dropsets',
                icon: SquareStack,
                onPress: () => router.push('/workout-form/dropsets'),
                type: 'button',
              },
            ]}
            triggerIcon={Ellipsis}
          />
        </View>
      </View>
      <View style={tw`mt-4`}>{renderedExercises}</View>
      <View
        style={tw`w-7 h-7 mt-1 rounded-full bg-primary items-center justify-center`}
      >
        <Button
          onPress={handleAddEmptyExercise}
          twcn="w-full h-full items-center justify-center"
        >
          <Plus
            strokeWidth={2.5}
            size={18}
            color={Colors.dark.text}
          />
        </Button>
      </View>
    </View>
  )
}

export default Exercises

const styles = StyleSheet.create({})
