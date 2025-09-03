import SafeView from '../../components/safe-view'
import { View } from 'react-native'
import Button from '../../components/button'
import tw from '../../tw'
import { formatDate } from '../../functions/formatted-date'
import { useEffect, useState } from 'react'
import Input from '../../components/input'
import { Calendar, MapPin } from 'lucide-react-native'
import Colors from '../../constants/colors'
import { useNavigation } from 'expo-router'
import DatePicker from 'react-native-date-picker'

const WorkoutForm = () => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [data, setData] = useState({
    title: '',
    date: new Date(),
    location: 'Vim',
  })
  const navigation = useNavigation()

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
  }, [data])

  const handleSubmitWorkout = () => {}

  return (
    <SafeView inModal>
      <View style={tw`flex-1`}>
        <View style={tw`items-start gap-3 mb-2`}>
          <Button
            text={formatDate(data.date)}
            onPress={() => {
              setIsDatePickerOpen(true)
            }}
            hitSlop={12}
            twcn="flex-row flex-row-reverse items-center gap-2"
            twcnText="text-xs font-poppinsMedium text-primary w-full uppercase"
          >
            <Calendar
              size={16}
              color={Colors.primary}
              strokeWidth={2}
            />
          </Button>
        </View>

        <View style={tw`mb-4`}>
          <View style={tw`flex-col gap-2 w-full`}>
            <Input
              editable={!isSaving}
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.nativeEvent.text })}
              placeholder="Workout Name"
              noBorder
              twcnInput="text-base font-poppinsMedium h-10 w-full"
            />
            <Input
              editable={!isSaving}
              value={data.location}
              onChange={(e) =>
                setData({ ...data, location: e.nativeEvent.text })
              }
              placeholder="Location (optional)"
              noBorder
              twcnInput="text-base font-poppinsMedium h-10 w-full"
            />
          </View>
        </View>
      </View>
      <DatePicker
        modal
        open={isDatePickerOpen}
        date={data.date}
        onConfirm={(date) => {
          setIsDatePickerOpen(false)
          setData({ ...data, date })
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
