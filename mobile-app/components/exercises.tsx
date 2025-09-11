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

const Exercises = () => {
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false)
  const [isSupersetModalOpen, setIsSupersetModalOpen] = useState(false)
  const [isDropSetModalOpen, setIsDropSetModalOpen] = useState(false)
  const { workoutData, setWorkoutData } = useWorkoutForm()
  const { theme } = useTheme()
  const { weightUnit } = workoutData

  const exerciseOptions = [
    {
      title: 'Create Superset',
      description:
        'Sets performed back-to-back with minimal to no rest (different exercises)',
      icon: SquareStack,
      onPress: () => setIsSupersetModalOpen(true),
    },
    {
      title: 'Create Drop Set',
      description:
        'Sets performed back-to-back with minimal to no rest (same exercise, reducing weight)',
      icon: SquareStack,
      onPress: () => setIsDropSetModalOpen(true),
    },
  ]

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

  const renderedOptions = exerciseOptions.map(
    ({ title, description, icon: Icon }, index) => {
      return (
        <Button
          onPress={() => {}}
          key={title}
          style={tw`flex-row items-center justify-between gap-4 py-3`}
        >
          <View
            style={tw`w-10 h-10 rounded-xl bg-light-grayPrimary dark:bg-dark-grayPrimary items-center justify-center`}
          >
            <Icon
              color={Colors.primary}
              strokeWidth={1.5}
            />
          </View>
          <View style={tw`flex-1`}>
            <Txt twcn="font-poppinsMedium">{title}</Txt>
            <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
              {description}
            </Txt>
          </View>
        </Button>
      )
    }
  )

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
        <View style={tw`flex-row items-center justify-between`}>
          <Txt twcn="text-base font-poppinsMedium">Exercise Options</Txt>
          <View style={tw`flex-row items-center gap-2`}>
            <Txt
              twcn={`${weightUnit === 'kg' ? 'text-primary' : 'text-light-grayText dark:text-dark-grayText'} font-poppinsSemiBold uppercase text-xs tracking-wide`}
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
                thumbColor={Colors.primary}
                trackColor={{
                  false: theme.grayPrimary,
                  true: theme.grayPrimary,
                }}
              />
            </View>
            <Txt
              twcn={`${weightUnit === 'lbs' ? 'text-primary' : 'text-light-grayText dark:text-dark-grayText'} font-poppinsSemiBold uppercase text-xs tracking-wide`}
            >
              Lbs.
            </Txt>
          </View>
        </View>
        <View style={tw``}>{renderedOptions}</View>
      </MyModal>
    </View>
  )
}

export default Exercises

const styles = StyleSheet.create({})
