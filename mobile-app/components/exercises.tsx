import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useWorkoutForm } from '../context/workout-form-context'
import tw from '../tw'
import Txt from './text'
import Button from './button'
import { Ellipsis, Plus } from 'lucide-react-native'
import useTheme from '../app/hooks/theme'
import ExerciseInput from './exercise-input'
import Colors from '../constants/colors'

const Exercises = () => {
  const { workoutData, setWorkoutData } = useWorkoutForm()
  const { theme } = useTheme()

  const handleExerciseOptions = () => {}

  const handleAddEmptyExercise = () => {
    const exerciseToAddNumber = workoutData.exercises.length + 1
    const starterExercise = {
      name: '',
      isUnilateral: false,
      sets: [
        {
          setNumber: exerciseToAddNumber,
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
    <View style={tw`flex-1`}>
      <View style={tw`flex-row justify-between items-center`}>
        <Txt twcn="text-xs uppercase tracking-wide font-poppinsMedium text-light-grayText dark:text-dark-grayText">
          Exercises
        </Txt>
        <Button>
          <Ellipsis
            onPress={handleExerciseOptions}
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
    </View>
  )
}

export default Exercises

const styles = StyleSheet.create({})
