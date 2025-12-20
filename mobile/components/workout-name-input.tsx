import { View, Keyboard } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { WorkoutName } from '../utils/types'
import tw from '../tw'
import Txt from './text'
import Input from './input'
import Button from './button'
import { useWorkoutForm } from '../context/workout-form-context'
import { BlurView } from 'expo-blur'

const WorkoutNameInput = () => {
  const [isWorkoutNameSelectorOpen, setIsWorkoutNameSelectorOpen] =
    useState(false)
  const [workoutNamesResults, setWorkoutNamesResults] = useState<WorkoutName[]>(
    []
  )
  const [localValue, setLocalValue] = useState('')
  const { workoutNames, setWorkoutData, workoutData, setFocusedInput } =
    useWorkoutForm()

  useEffect(() => {
    setWorkoutNamesResults(workoutNames)
  }, [workoutNames])

  useEffect(() => {
    setLocalValue(workoutData.name)
  }, [workoutData.name])

  const handleSelectWorkoutName = (name: string) => {
    setWorkoutData((prev) => ({ ...prev, name }))
    setIsWorkoutNameSelectorOpen(false)
    Keyboard.dismiss()
  }

  const renderedWorkoutNames = workoutNamesResults
    .slice(0, 6)
    .map(({ name, used }, index) => (
      <Button
        key={name}
        onPress={() => handleSelectWorkoutName(name)}
        style={tw`flex-row items-center justify-between p-3 w-full bg-transparent ${
          index === workoutNamesResults.length - 1
            ? ''
            : 'border-b border-light-grayBorder dark:border-dark-grayBorder'
        }`}
      >
        <Txt>{name}</Txt>
        <Txt>{used}</Txt>
      </Button>
    ))

  const handleChange = useCallback(
    (text: string) => {
      setLocalValue(text)
      const filtered = workoutNames.filter(
        (workout) =>
          workout.name.toLowerCase().includes(text.toLowerCase()) &&
          workout.name.toLowerCase().trim() !== text.toLowerCase().trim()
      )
      setWorkoutNamesResults(filtered)
      if (filtered.length === 0) {
        setIsWorkoutNameSelectorOpen(false)
      } else if (!isWorkoutNameSelectorOpen) {
        setIsWorkoutNameSelectorOpen(true)
      }
    },
    [workoutNames, isWorkoutNameSelectorOpen]
  )

  const handleTextChange = useCallback(
    (e: { nativeEvent: { text: string } }) => {
      handleChange(e.nativeEvent.text)
    },
    [handleChange]
  )

  return (
    <View style={tw`relative`}>
      <Input
        editable
        value={localValue}
        onPress={() => {
          setIsWorkoutNameSelectorOpen(!isWorkoutNameSelectorOpen)
        }}
        onChange={handleTextChange}
        onBlur={(e) => {
          setWorkoutData((prev) => ({ ...prev, name: localValue }))
          setIsWorkoutNameSelectorOpen(false)
          setFocusedInput(null)
        }}
        placeholder="Workout Name (e.g. Legs, Push, Pull)"
        maxLength={50}
        returnKeyType="done"
        twcnInput="text-light-text border-b border-light-grayBorder/50 dark:border-dark-grayBorder/50 dark:text-dark-text font-medium text-base w-full h-12"
        onSubmitEditing={(e) => handleSelectWorkoutName(e.nativeEvent.text)}
        onFocus={() => {
          // Clear results on focus - they'll populate when user types
          setWorkoutNamesResults([])
          setIsWorkoutNameSelectorOpen(false)
          setFocusedInput({
            exerciseIndex: -1,
            setIndex: -1,
            field: 'workoutName',
          })
        }}
        autoComplete="off"
        autoCorrect={false}
        autoCapitalize="words"
      />

      {isWorkoutNameSelectorOpen && workoutNamesResults.length > 0 && (
        <BlurView
          intensity={25}
          tint="default"
          style={[
            tw`absolute top-full bg-white dark:bg-dark-grayPrimary left-0 right-0 mt-1 rounded-xl overflow-hidden z-10 border border-light-grayBorder dark:border-dark-grayBorder`,
          ]}
        >
          {renderedWorkoutNames}
        </BlurView>
      )}
    </View>
  )
}

export default WorkoutNameInput
