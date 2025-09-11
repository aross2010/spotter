import { View, Keyboard } from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { useWorkout, WorkoutName } from '../context/workout-context'
import tw from '../tw'
import Txt from './text'
import Input from './input'
import Button from './button'
import { useWorkoutForm } from '../context/workout-form-context'

type WorkoutNameInputProps = {
  name: string
  setName: (name: string) => void
}

const WorkoutNameInput = ({ name, setName }: WorkoutNameInputProps) => {
  const [isWorkoutNameSelectorOpen, setIsWorkoutNameSelectorOpen] =
    useState(false)
  const [workoutNamesResults, setWorkoutNamesResults] = useState<WorkoutName[]>(
    []
  )
  const { workoutNames } = useWorkoutForm()

  useEffect(() => {
    setWorkoutNamesResults(workoutNames)
  }, [workoutNames])

  const renderedWorkoutNames = workoutNamesResults
    .slice(0, 6)
    .map(({ name, used }, index) => {
      return (
        <Button
          key={name}
          onPress={() => {
            setName(name)
            setIsWorkoutNameSelectorOpen(false)
            Keyboard.dismiss()
          }}
          style={tw`flex-1 bg-light-grayPrimary flex-row items-center justify-between p-3 w-full ${index === workoutNamesResults.length - 1 ? '' : 'border-b border-light-grayTertiary dark:border-dark-grayTertiary'}`}
        >
          <Txt>{name}</Txt>
          <Txt>{used}</Txt>
        </Button>
      )
    })

  const handleChange = (text: string) => {
    setName(text)
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
        value={name}
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
        twcnLabel="uppercase text-xs tracking-wider font-poppinsMedium text-light-grayText dark:text-dark-grayText"
        returnKeyType="done"
        onSubmitEditing={(e) => {
          setIsWorkoutNameSelectorOpen(false)
          setName(e.nativeEvent.text)
        }}
        onFocus={() => setIsWorkoutNameSelectorOpen(true)}
      />

      {isWorkoutNameSelectorOpen && (
        <View
          style={tw`absolute top-full left-0 right-0 z-10 rounded-xl overflow-hidden mt-3`}
        >
          {renderedWorkoutNames}
        </View>
      )}
    </View>
  )
}

export default WorkoutNameInput
