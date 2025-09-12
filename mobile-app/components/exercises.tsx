import { StyleSheet, Switch, Text, View } from 'react-native'
import React, { useState } from 'react'
import { useWorkoutForm } from '../context/workout-form-context'
import tw from '../tw'
import Txt from './text'
import Button from './button'
import { Ellipsis, Plus, SquareStack } from 'lucide-react-native'
import useTheme from '../app/hooks/theme'
import ExerciseInput from './exercise-input'
import Colors from '../constants/colors'
import { nanoid } from 'nanoid/non-secure'
import MyModal from './modal'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { ScrollView } from 'react-native-gesture-handler'
import ExerciseOptions from './exercise-options'

const Exercises = () => {
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false)
  const { workoutData, setWorkoutData } = useWorkoutForm()
  const { theme } = useTheme()

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
    setWorkoutData({
      ...workoutData,
      exercises: [...workoutData.exercises, starterExercise],
    })
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
        <Txt twcn="text-xs uppercase tracking-wide font-poppinsMedium text-light-grayText dark:text-dark-grayText">
          Exercises
        </Txt>
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
      <MyModal
        isOpen={isOptionsModalOpen}
        setIsOpen={setIsOptionsModalOpen}
      >
        <ExerciseOptions />
      </MyModal>
    </View>
  )
}

export default Exercises

const styles = StyleSheet.create({})
