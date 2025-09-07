import SafeView from '../../../components/safe-view'
import { View } from 'react-native'
import Button from '../../../components/button'
import tw from '../../../tw'
import { formatDate } from '../../../functions/formatted-date'
import { useEffect, useState } from 'react'
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

const WorkoutForm = () => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [workoutData, setWorkoutData] = useState({
    name: '',
    date: new Date(),
    location: '', // auto insert the most used location
    tags: [],
    notes: '',
  })
  const [exercises, setExercises] = useState([])
  const navigation = useNavigation()
  const { theme } = useTheme()
  const { location } = useLocalSearchParams()

  useEffect(() => {
    if (location) {
      setWorkoutData((prev) => ({ ...prev, location: location as string }))
    }
  }, [location])

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
    <SafeView
      inModal
      twcn="h-full"
    >
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
            router.push({
              pathname: '/workout-form/location',
              params: {
                name: workoutData.name,
              },
            })
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

      <View style={tw`mt-4 flex-1 gap-4`}>
        <WorkoutNameInput
          name={workoutData.name}
          setName={(name) => setWorkoutData({ ...workoutData, name })}
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
        <Button
          onPress={() => {
            router.push({
              pathname: '/workout-form/exercises',
              params: {
                name: workoutData.name,
                exercises: exercises,
              },
            })
          }}
          text="Add Exercises"
          twcn="rounded-xl border p-4 h-28 items-center justify-center flex-row gap-2 border-light-grayTertiary dark:border-dark-grayTertiary"
          twcnText="text-light-grayText dark:text-dark-grayText"
        >
          <ArrowRight
            size={16}
            color={theme.grayText}
            strokeWidth={1.5}
          />
        </Button>
        <Txt>Notes</Txt>
        <Button
          onPress={() => {
            router.push({
              pathname: '/workout-form/notes',
              params: {
                name: workoutData.name,
              },
            })
          }}
          text="Add Notes"
          twcn="rounded-xl border p-4 h-28 items-center justify-center flex-row gap-2 border-light-grayTertiary dark:border-dark-grayTertiary"
          twcnText="text-light-grayText dark:text-dark-grayText"
        >
          <ArrowRight
            size={16}
            color={theme.grayText}
            strokeWidth={1.5}
          />
        </Button>
        <Txt>Tags</Txt>
        <Button
          onPress={() => {
            router.push({
              pathname: '/tag-selector',
              params: {
                existingTags: workoutData.tags,
              },
            })
          }}
          text="Add Tags"
          twcn="rounded-xl border p-4 h-28 items-center justify-center flex-row gap-2 border-light-grayTertiary dark:border-dark-grayTertiary"
          twcnText="text-light-grayText dark:text-dark-grayText"
        >
          <ArrowRight
            size={16}
            color={theme.grayText}
            strokeWidth={1.5}
          />
        </Button>
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
