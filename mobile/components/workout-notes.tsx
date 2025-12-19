import { View } from 'react-native'
import React, { useEffect, useRef } from 'react'
import Input from './input'
import { useWorkoutForm } from '../context/workout-form-context'
import Button from './button'
import { NotebookPen, Pencil } from 'lucide-react-native'
import Colors from '../constants/colors'
type WorkoutNotesProps = {
  isNotesActive: boolean
  setIsNotesActive: React.Dispatch<React.SetStateAction<boolean>>
}

const WorkoutNotes = ({
  isNotesActive,
  setIsNotesActive,
}: WorkoutNotesProps) => {
  const { workoutData, setWorkoutData } = useWorkoutForm()
  const inputRef = useRef<any>(null)

  useEffect(() => {
    if (isNotesActive) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isNotesActive])

  return isNotesActive || workoutData.notes ? (
    <View>
      <Input
        ref={inputRef}
        value={workoutData.notes}
        onChange={(e) =>
          setWorkoutData({ ...workoutData, notes: e.nativeEvent.text })
        }
        placeholder="Add your notes here..."
        twcnLabel="font-semibold"
        multiline
        label="Notes"
        numberOfLines={6}
        textAlignVertical="top"
        fullBorder
        twcnInput="text-sm border border-light-grayBorder dark:border-dark-grayBorder p-3"
      />
    </View>
  ) : (
    <Button
      onPress={() => setIsNotesActive(true)}
      twcnText="font-semibold text-primary dark:text-primary"
      twcn="flex-row-reverse items-center gap-1"
      text="Add Notes"
    >
      <NotebookPen
        color={Colors.primary}
        size={16}
      />
    </Button>
  )
}

export default WorkoutNotes
