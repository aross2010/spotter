import { View, Keyboard } from 'react-native'
import { useState, useEffect } from 'react'
import { WorkoutName } from '../context/workout-context'
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
  const { workoutNames, setWorkoutData, workoutData } = useWorkoutForm()

  useEffect(() => {
    setWorkoutNamesResults(workoutNames)
  }, [workoutNames])

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
            : 'border-b border-light-grayTertiary dark:border-dark-grayTertiary'
        }`}
      >
        <Txt>{name}</Txt>
        <Txt>{used}</Txt>
      </Button>
    ))

  const handleChange = (text: string) => {
    setWorkoutData((prev) => ({ ...prev, name: text }))
    const filtered = workoutNames.filter((workout) =>
      workout.name.toLowerCase().includes(text.toLowerCase())
    )
    setWorkoutNamesResults(filtered)
    if (!isWorkoutNameSelectorOpen) {
      setIsWorkoutNameSelectorOpen(true)
    }
  }

  return (
    <View
      style={tw`relative border-b border-light-grayTertiary dark:border-dark-grayTertiary py-1`}
    >
      <Input
        editable
        value={workoutData.name}
        onPress={() => {
          setIsWorkoutNameSelectorOpen(!isWorkoutNameSelectorOpen)
        }}
        onChange={(e) => handleChange(e.nativeEvent.text)}
        onBlur={(e) => {
          setIsWorkoutNameSelectorOpen(false)
        }}
        noBorder
        label="Name"
        placeholder="Legs, Push, Pull, Upper Body, etc..."
        twcnContainer="px-0"
        twcnInput="px-0"
        twcnLabel="uppercase text-xs tracking-wide font-poppinsMedium text-light-grayText dark:text-dark-grayText"
        returnKeyType="done"
        onSubmitEditing={(e) => handleSelectWorkoutName(e.nativeEvent.text)}
        onFocus={() => setIsWorkoutNameSelectorOpen(true)}
      />

      {isWorkoutNameSelectorOpen && (
        <BlurView
          intensity={50}
          tint="default"
          style={[
            tw`absolute top-full bg-light-grayPrimary/25 dark:bg-dark-grayPrimary/25 left-0 right-0 mt-3 rounded-xl overflow-hidden z-10 border border-light-grayTertiary dark:border-dark-grayTertiary`,
          ]}
        >
          {renderedWorkoutNames}
        </BlurView>
      )}
    </View>
  )
}

export default WorkoutNameInput
