import SafeView from '../../../components/safe-view'
import { View } from 'react-native'
import Button from '../../../components/button'
import tw from '../../../tw'
import { formatDate } from '../../../functions/formatted-date'
import { useEffect, useState } from 'react'
import { Calendar, MapPin } from 'lucide-react-native'
import { router, useNavigation } from 'expo-router'
import DatePicker from 'react-native-date-picker'
import useTheme from '../../hooks/theme'
import WorkoutNameInput from '../../../components/workout-name-input'
import { useWorkoutForm } from '../../../context/workout-form-context'
import Exercises from '../../../components/exercises'
import WorkoutNotes from '../../../components/workout-notes'
import WorkoutTags from '../../../components/workout-tags'

const WorkoutForm = () => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const navigation = useNavigation()
  const { theme } = useTheme()
  const { workoutData, setWorkoutData } = useWorkoutForm()

  useEffect(() => {
    const saveEnabled = true

    navigation.setOptions({
      headerTitle: 'New Workout',
      headerRight: () => (
        <Button
          onPress={handleSubmitWorkout}
          hitSlop={12}
          accessibilityLabel="Save Workout"
          twcnText={`font-poppinsSemiBold ${saveEnabled ? 'text-primary dark:text-primary' : 'text-light-grayText dark:text-dark-grayText'}`}
          text="Save"
          disabled={!saveEnabled}
        />
      ),
    })
  }, [workoutData])

  const handleSubmitWorkout = () => {}

  return (
    <SafeView
      keyboardAvoiding
      bottomOffset={200}
    >
      <View style={tw`flex-row gap-2`}>
        <Button
          text={formatDate(workoutData.date)}
          onPress={() => {
            setIsDatePickerOpen(true)
          }}
          hitSlop={12}
          twcn="flex-1 bg-light-grayPrimary dark:bg-dark-grayPrimary border border-light-grayTertiary dark:border-dark-grayTertiary rounded-xl py-2.5 px-3 flex-row flex-row-reverse justify-center items-center gap-2"
          twcnText="text-xs font-poppinsMedium uppercase text-light-text dark:text-dark-text"
        >
          <Calendar
            size={16}
            color={theme.text}
          />
        </Button>
        <Button
          text={
            workoutData.location.length > 0
              ? workoutData.location
              : 'Location (optional)'
          }
          onPress={() => {
            router.push('/workout-form/location')
          }}
          hitSlop={12}
          twcn="flex-1 bg-light-grayPrimary dark:bg-dark-grayPrimary border border-light-grayTertiary dark:border-dark-grayTertiary rounded-xl py-2.5 px-3 flex-row flex-row-reverse justify-center items-center gap-2"
          twcnText={`text-xs font-poppinsMedium uppercase ${
            workoutData.location.length > 0
              ? 'text-light-text dark:text-dark-text'
              : 'text-light-grayText dark:text-dark-grayText'
          }`}
        >
          <MapPin
            size={16}
            color={
              workoutData.location.length > 0 ? theme.text : theme.grayText
            }
          />
        </Button>
      </View>

      <View style={tw`mt-4 flex-1 gap-6 justify-between`}>
        <WorkoutNameInput />
        <Exercises />
        <WorkoutNotes />
        <WorkoutTags />
      </View>

      <DatePicker
        modal
        open={isDatePickerOpen}
        date={workoutData.date}
        onConfirm={(date) => {
          setIsDatePickerOpen(false)
          setWorkoutData({ ...workoutData, date })
        }}
        mode="date"
        onCancel={() => {
          setIsDatePickerOpen(false)
        }}
      />
    </SafeView>
  )
}

export default WorkoutForm
