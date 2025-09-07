import { View, Keyboard } from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { useWorkout, WorkoutName } from '../context/workout-context'
import tw from '../tw'
import Txt from './text'
import Input from './input'
import Button from './button'
import { Key } from 'lucide-react-native'

type WorkoutNameInputProps = {
  name: string
  setName: (name: string) => void
}

const WorkoutNameInput = ({ name, setName }: WorkoutNameInputProps) => {
  const [isWorkoutNameSelectorOpen, setIsWorkoutNameSelectorOpen] =
    useState(false)
  const [workoutNames, setWorkoutNames] = useState<WorkoutName[]>([])
  const [workoutNamesResults, setWorkoutNamesResults] =
    useState<WorkoutName[]>(workoutNames)
  const { fetchWorkoutNames } = useWorkout()

  useEffect(() => {
    const getWorkoutNames = async () => {
      const names = await fetchWorkoutNames()
      setWorkoutNames(names)
      setWorkoutNamesResults(names)
    }
    getWorkoutNames()
  }, [])

  const renderedWorkoutNames = workoutNamesResults
    .slice(0, 5)
    .map(({ name, used }, index) => {
      return (
        <Button
          key={name}
          onPress={() => {
            setName(name)
            setIsWorkoutNameSelectorOpen(false)
            Keyboard.dismiss()
          }}
          style={tw`flex-1 bg-light-grayPrimary flex-row items-center justify-between p-3 w-full ${index === workoutNames.length - 1 ? '' : 'border-b border-light-grayTertiary dark:border-dark-grayTertiary'}`}
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
    <View style={tw`relative`}>
      <Input
        editable
        value={name}
        onPress={() => {
          console.log('pressed', isWorkoutNameSelectorOpen, workoutNamesResults)
          setIsWorkoutNameSelectorOpen(!isWorkoutNameSelectorOpen)
        }}
        onChange={(e) => handleChange(e.nativeEvent.text)}
        onBlur={(e) => {
          setIsWorkoutNameSelectorOpen(false)
        }}
        label="Workout Name"
        placeholder="Legs, Push, Pull, Upper Body, etc..."
        twcnInput="w-full"
        returnKeyType="done"
        onSubmitEditing={(e) => {
          setIsWorkoutNameSelectorOpen(false)
          setName(e.nativeEvent.text)
        }}
      />
      {isWorkoutNameSelectorOpen && (
        <View
          style={tw`absolute top-full left-0 right-0 z-10 rounded-xl overflow-hidden mt-1`}
        >
          {renderedWorkoutNames}
        </View>
      )}
    </View>
  )
}

export default WorkoutNameInput
