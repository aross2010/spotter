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
        noBorder
        twcnLabel="uppercase text-xs tracking-wide font-poppinsMedium text-light-grayText dark:text-dark-grayText"
        twcnInput="mt-2 text-sm border border-light-grayTertiary dark:border-dark-grayTertiary p-3"
      />
    </View>
  )
}

export default WorkoutNotes
