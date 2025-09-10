import { StyleSheet, Text, View } from 'react-native'
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
} from 'lucide-react-native'
import Button from './button'
import Colors from '../constants/colors'
import { useState } from 'react'

type ExerciseInputProps = {
  exerciseNumber: number
}

const SetInputs = [
  {
    label: 'Set',
    value: 'setNumber',
    inputMode: 'numeric',
  },
  {
    label: 'Lbs',
    value: 'weight',
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

const ExerciseInput = ({ exerciseNumber }: ExerciseInputProps) => {
  const [isExerciseHistoryOpen, setIsExerciseHistoryOpen] = useState(false)
  const { workoutData, setWorkoutData } = useWorkoutForm()
  const { exercises } = workoutData
  const exercise = exercises[exerciseNumber - 1]
  const sets = exercise?.sets

  console.log('exercise sets: ', sets)

  const handleMakeUnilateral = () => {
    const updatedExercises = [...workoutData.exercises]
    if (exerciseNumber) {
      const currentValue =
        updatedExercises[exerciseNumber - 1]?.isUnilateral || false
      updatedExercises[exerciseNumber - 1] = {
        ...updatedExercises[exerciseNumber - 1],
        isUnilateral: !currentValue,
      }
      setWorkoutData({
        ...workoutData,
        exercises: updatedExercises,
      })
    }
  }

  const handleDisplayExerciseHistory = () => {}

  const handleAddNewSet = () => {}

  const handleCopyLastSet = () => {}

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
  ]

  const setButtons = [
    {
      name: 'Copy Last Set',
      icon: Redo,
      onPress: handleCopyLastSet,
    },
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
        twcn={`p-2 rounded-xl bg-light-grayPrimary dark:bg-dark-grayPrimary`}
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

  const renderedSetInputs = sets.map((set, setIndex) => {
    return (
      <View
        key={setIndex}
        style={tw`flex-row flex-wrap border-b border-light-grayTertiary dark:border-dark-grayTertiary py-1`}
      >
        {SetInputs.map(({ label, value, inputMode }, inputIndex) => {
          return (
            <Input
              editable={value !== 'setNumber'}
              noBorder
              keyboardType={'numeric'}
              inputMode={inputMode}
              maxLength={value === 'rpe' ? 4 : 5}
              key={value}
              placeholder="-"
              twcnInput="w-1/5 text-center py-1 text-light-text dark:text-dark-text"
              value={set[value as keyof typeof set]?.toString() || ''}
              onChangeText={(text) => {
                let s = text
                if (inputMode === 'decimal') {
                  s = s.replace(/[^0-9.]/g, '')
                  s = s.replace(/(\..*)\./g, '$1')
                } else {
                  s = s.replace(/[^0-9]/g, '')
                }
                const updatedExercises = [...workoutData.exercises]
                const updatedSets = [
                  ...(updatedExercises[exerciseNumber - 1]?.sets || []),
                ]

                updatedSets[setIndex] = {
                  ...updatedSets[setIndex],
                  [value]: s,
                }
                updatedExercises[exerciseNumber - 1] = {
                  ...updatedExercises[exerciseNumber - 1],
                  sets: updatedSets,
                }
                setWorkoutData({
                  ...workoutData,
                  exercises: updatedExercises,
                })
              }}
              onEndEditing={(e) => {
                // On commit, coerce to number (keep '' if empty)
                const t = e.nativeEvent.text
                if (t === '') return
                const n =
                  inputMode === 'decimal' ? parseFloat(t) : parseInt(t, 10)
                const updatedExercises = [...workoutData.exercises]
                const updatedSets = [
                  ...(updatedExercises[exerciseNumber - 1]?.sets || []),
                ]
                updatedSets[setIndex] = {
                  ...updatedSets[setIndex],
                  [value]: isNaN(n) ? '' : n,
                }
                updatedExercises[exerciseNumber - 1] = {
                  ...updatedExercises[exerciseNumber - 1],
                  sets: updatedSets,
                }
                setWorkoutData({
                  ...workoutData,
                  exercises: updatedExercises,
                })
              }}
            />
          )
        })}
      </View>
    )
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
    <View style={tw`flex-1 mb-2 ${exerciseNumber != 1 ? 'mt-1' : ''}`}>
      <View style={tw`flex-row flex-1`}>
        <View style={tw`flex-row gap-4 items-center flex-1`}>
          <View
            style={tw`flex-1 shrink pb-2 border-b border-light-grayTertiary dark:border-dark-grayTertiary`}
          >
            <Input
              placeholder="Squat, Bench Press, etc..."
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

const styles = StyleSheet.create({})
