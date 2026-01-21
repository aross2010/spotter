import { View, Keyboard } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { WorkoutName } from '../utils/types'
import tw from '../tw'
import Txt from './text'
import Input from './input'
import Button from './button'
import { useWorkoutForm } from '../context/workout-form-context'
import { GlassView } from 'expo-glass-effect'

const WorkoutNameInput = () => {
  const [isWorkoutNameSelectorOpen, setIsWorkoutNameSelectorOpen] =
    useState(false)
  const [workoutNamesResults, setWorkoutNamesResults] = useState<WorkoutName[]>(
    [],
  )
  const { workoutNames, setWorkoutData, workoutData, setFocusedInput } =
    useWorkoutForm()
  const [localValue, setLocalValue] = useState(workoutData.name)

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
        style={tw`flex-row items-center justify-between p-4 w-full bg-transparent ${
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
          workout.name.toLowerCase().trim() !== text.toLowerCase().trim(),
      )
      setWorkoutNamesResults(filtered)
      if (filtered.length === 0) {
        setIsWorkoutNameSelectorOpen(false)
      } else if (!isWorkoutNameSelectorOpen) {
        setIsWorkoutNameSelectorOpen(true)
      }
    },
    [workoutNames, isWorkoutNameSelectorOpen],
  )

  const handleTextChange = useCallback(
    (e: { nativeEvent: { text: string } }) => {
      handleChange(e.nativeEvent.text)
    },
    [handleChange],
  )

  return (
    <View
      style={tw`flex-1 shrink border-b border-light-grayBorder dark:border-dark-grayBorder`}
    >
      <Input
        editable
        value={localValue}
        onPress={() => {
          setIsWorkoutNameSelectorOpen(!isWorkoutNameSelectorOpen)
        }}
        onChange={(e) => handleTextChange(e)}
        onBlur={(e) => {
          setWorkoutData((prev) => ({ ...prev, name: localValue }))
          setIsWorkoutNameSelectorOpen(false)
          setFocusedInput(null)
        }}
        placeholder="Workout Name"
        maxLength={50}
        returnKeyType="done"
        twcnInput="font-semibold text-xl h-12 leading-6 pb-0"
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
        <GlassView
          style={[
            tw`absolute top-full left-0 max-h-37 right-0 mt-1 rounded-xl overflow-hidden z-10 border border-light-grayBorder dark:border-dark-grayBorder`,
          ]}
        >
          {renderedWorkoutNames}
        </GlassView>
      )}
    </View>
  )
}

export default WorkoutNameInput
