import SafeView from '../../../components/safe-view'
import { Alert, View } from 'react-native'
import Button from '../../../components/button'
import tw from '../../../tw'
import { formatDate } from '../../../functions/formatted-date'
import { useEffect, useState } from 'react'
import Input from '../../../components/input'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import {
  ArrowRight,
  Calendar,
  Ellipsis,
  MapPin,
  Pencil,
} from 'lucide-react-native'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import DatePicker from 'react-native-date-picker'
import useTheme from '../../hooks/theme'
import { useWorkout } from '../../../context/workout-context'
import Txt from '../../../components/text'
import WorkoutNameInput from '../../../components/workout-name-input'
import Colors from '../../../constants/colors'
import { useWorkoutForm } from '../../../context/workout-form-context'
import Exercises from '../../../components/exercises'

const WorkoutForm = () => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const navigation = useNavigation()
  const { theme } = useTheme()
  const { workoutData, updateWorkoutData } = useWorkoutForm()

  useEffect(() => {
    const saveEnabled = true

    navigation.setOptions({
      headerTitle: 'New Workout',
      headerRight: () => (
        <Button
          onPress={handleNextStep}
          hitSlop={12}
          accessibilityLabel="Save Workout"
          twcnText={`font-poppinsSemiBold ${saveEnabled ? 'text-primary dark:text-primary' : 'text-light-grayText dark:text-dark-grayText'}`}
          text="Save"
          disabled={!saveEnabled}
        />
      ),
    })
  }, [workoutData])

  const handleNextStep = () => {
    // if (!workoutData.name) {
    //   Alert.alert('Error', 'Please enter a workout name before proceeding.')
    //   return
    // }
    // router.push('/workout-form/exercises')
  }

  return (
    <SafeView
      keyboardAvoiding
      bottomOffset={125}
    >
      <View style={tw`flex-row gap-2`}>
        <Button
          text={formatDate(workoutData.date)}
          onPress={() => {
            setIsDatePickerOpen(true)
          }}
          hitSlop={12}
          twcn="flex-1 bg-light-grayPrimary dark:bg-dark-grayPrimary rounded-xl py-2.5 px-3 flex-row flex-row-reverse justify-center items-center gap-2"
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
          twcn="flex-1 bg-light-grayPrimary dark:bg-dark-grayPrimary rounded-xl py-2.5 px-3 flex-row flex-row-reverse justify-center items-center gap-2"
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
        <WorkoutNameInput
          name={workoutData.name}
          setName={(name) => updateWorkoutData({ name })}
        />
        <Exercises />
      </View>

      <DatePicker
        modal
        open={isDatePickerOpen}
        date={workoutData.date}
        onConfirm={(date) => {
          setIsDatePickerOpen(false)
          updateWorkoutData({ date })
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
