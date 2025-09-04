import SafeView from '../../components/safe-view'
import { View } from 'react-native'
import Button from '../../components/button'
import tw from '../../tw'
import { formatDate } from '../../functions/formatted-date'
import { useEffect, useState } from 'react'
import Input from '../../components/input'
import { Calendar, Ellipsis, MapPin } from 'lucide-react-native'
import Colors from '../../constants/colors'
import { useNavigation } from 'expo-router'
import DatePicker from 'react-native-date-picker'
import useTheme from '../hooks/theme'
import MyModal from '../../components/modal'
import LocationSelector from '../../components/location-selector'
import { useWorkout, WorkoutName } from '../../context/workout-context'
import Txt from '../../components/text'

const WorkoutForm = () => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [workoutNames, setWorkoutNames] = useState<WorkoutName[]>([])
  const [workoutData, setWorkoutData] = useState({
    title: '',
    date: new Date(),
    location: '', // auto insert the most used location
  })
  const navigation = useNavigation()
  const { theme } = useTheme()
  const { fetchWorkoutNames } = useWorkout()

  useEffect(() => {
    const getWorkoutNames = async () => {
      const names = await fetchWorkoutNames()
      setWorkoutNames(names)
    }
    getWorkoutNames()
  }, [])

  useEffect(() => {
    const saveEnabled = true

    navigation.setOptions({
      headerTitle: 'New Workout',
      headerRight: () => (
        <Button
          onPress={handleSubmitWorkout}
          hitSlop={12}
          accessibilityLabel="submit notebook entry"
          twcnText={`font-poppinsSemiBold ${saveEnabled ? 'text-primary dark:text-primary' : 'text-light-grayText dark:text-dark-grayText'}`}
          text="Save"
          disabled={!saveEnabled}
        />
      ),
    })
  }, [workoutData])

  const handleSubmitWorkout = () => {}

  return (
    <SafeView inModal>
      <View style={tw`flex-row gap-2`}>
        <Button
          text={formatDate(workoutData.date)}
          onPress={() => {
            setIsDatePickerOpen(true)
          }}
          hitSlop={12}
          twcn="flex-1 bg-light-grayPrimary dark:bg-dark-grayPrimary rounded-xl py-2.5 px-3 flex-row flex-row-reverse justify-center items-center gap-2"
          twcnText="text-xs font-poppinsMedium uppercase text-light-text dark:text-dark-text line-clamp-1"
        >
          <Calendar
            size={16}
            color={theme.text}
          />
        </Button>
        <Button
          text={
            workoutData.location.length > 0 ? workoutData.location : 'Location'
          }
          onPress={() => {
            setIsLocationSelectorOpen(true)
          }}
          hitSlop={12}
          twcn="flex-1 bg-light-grayPrimary dark:bg-dark-grayPrimary rounded-xl py-2.5 px-3 flex-row flex-row-reverse justify-center items-center gap-2"
          twcnText={`text-xs font-poppinsMedium uppercase line-clamp-1 ${
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

      <View style={tw`mt-4`}>
        <Input
          editable={!isSaving}
          value={workoutData.title}
          onPress={() => {
            // bring up options
          }}
          onChange={(e) =>
            setWorkoutData({ ...workoutData, title: e.nativeEvent.text })
          }
          label="Workout Name"
          placeholder="Legs, Push, etc..."
          twcnInput="w-full mb-4"
        />
        <View style={tw`flex-row items-center justify-between`}>
          <Txt>Exercises</Txt>
          <Button hitSlop={12}>
            <Ellipsis
              size={20}
              color={theme.grayText}
            />
          </Button>
        </View>
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

      <MyModal
        isOpen={isLocationSelectorOpen}
        setIsOpen={setIsLocationSelectorOpen}
      >
        <LocationSelector
          setLocation={(location) => {
            setWorkoutData({ ...workoutData, location })
          }}
          closeModal={() => setIsLocationSelectorOpen(false)}
        />
      </MyModal>
    </SafeView>
  )
}

export default WorkoutForm
