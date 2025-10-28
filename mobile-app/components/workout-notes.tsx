import { View } from 'react-native'
import React from 'react'
import tw from '../tw'
import Txt from './text'
import Input from './input'
import { useWorkoutForm } from '../context/workout-form-context'

const WorkoutNotes = () => {
  const { workoutData, setWorkoutData } = useWorkoutForm()
  return (
    <View>
      <Input
        value={workoutData.notes}
        onChange={(e) =>
          setWorkoutData({ ...workoutData, notes: e.nativeEvent.text })
        }
        placeholder="Add your notes here..."
        multiline
        label="Notes"
        numberOfLines={6}
        textAlignVertical="top"
        fullBorder
        twcnInput="mt-2 text-sm border border-light-grayBorder dark:border-dark-grayBorder p-3"
      />
    </View>
  )
}

export default WorkoutNotes
