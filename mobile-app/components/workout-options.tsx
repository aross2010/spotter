import { StyleSheet, View } from 'react-native'
import Txt from './text'
import { WorkoutMinimal } from '../context/workout-context'
import { MapPin, PinOff } from 'lucide-react-native'
import { Info, Pin, Pencil, Trash } from 'lucide-react-native'
import Button from './button'
import tw from '../tw'
import Colors from '../constants/colors'
import { Fragment } from 'react'
import { Calendar } from 'lucide-react-native'
import { formatDate } from '../functions/formatted-date'
import useTheme from '../app/hooks/theme'
import { router } from 'expo-router'
import { useWorkout } from '../context/workout-context'

type WorkoutOptionsProps = {
  workout: WorkoutMinimal
  setIsOptionsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const WorkoutOptions = ({ workout, setIsOptionsOpen }: WorkoutOptionsProps) => {
  const { pinned, id, name, date, location } = workout
  const { unpinWorkout, pinWorkout, deleteWorkout } = useWorkout()
  const { theme } = useTheme()

  const handleViewDetails = () => {
    router.push({
      pathname: '/workout-details',
      params: {
        id: id,
      },
    })
  }

  const handlePinToggle = async () => {
    if (pinned) await unpinWorkout(id)
    else await pinWorkout(id)
    setIsOptionsOpen(false)
  }

  const handleEdit = () => {
    setIsOptionsOpen(false)
    router.push({
      pathname: '/workout-form',
      params: {
        id: id,
      },
    })
  }

  const handleDeleteWorkout = async () => {
    await deleteWorkout(id)
    setIsOptionsOpen(false)
  }

  const options = [
    {
      title: 'Details',
      description: 'View workout details & analysis',
      onPress: handleViewDetails,
      icon: Info,
    },
    {
      title: pinned ? 'Unpin' : 'Pin',
      description: pinned
        ? 'Remove this workout from the top'
        : 'Keep this workout at the top',
      onPress: handlePinToggle,
      icon: pinned ? PinOff : Pin,
    },
    {
      title: 'Edit',
      description: 'Modify workout details',
      onPress: handleEdit,
      icon: Pencil,
    },
    {
      title: 'Delete',
      description: 'Remove this workout permanently',
      onPress: handleDeleteWorkout,
      icon: Trash,
    },
  ]

  const renderedOptions = options.map(
    ({ title, description, onPress, icon: Icon }, index) => {
      return (
        <Button
          onPress={onPress}
          key={index}
        >
          <View
            key={index}
            style={tw`flex-row gap-6 p-3 items-center rounded-xl`}
          >
            <View style={tw`bg-primary/10 rounded-xl p-2`}>
              <Icon
                size={20}
                color={Colors.primary}
                strokeWidth={1.5}
              />
            </View>
            <View style={tw`flex-1`}>
              <Txt twcn="text-base mb-0.5">{title}</Txt>
              <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
                {description}
              </Txt>
            </View>
          </View>
        </Button>
      )
    }
  )

  return (
    <Fragment>
      <View
        style={tw`px-2 pb-4 border-b border-light-graySecondary dark:border-dark-graySecondary`}
      >
        <View style={tw`flex-row items-center gap-2 mb-1`}>
          <Calendar
            size={14}
            color={theme.grayText}
          />
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-poppinsMedium">
            {formatDate(date)}
          </Txt>
        </View>
        {location && (
          <View style={tw`flex-row items-center gap-2`}>
            <MapPin
              size={14}
              color={theme.grayText}
            />
            <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-poppinsMedium">
              {location}
            </Txt>
          </View>
        )}

        <Txt twcn="text-lg font-poppinsMedium text-light-text dark:text-dark-text mt-2">
          {name}
        </Txt>
      </View>

      <View>
        <Txt twcn="text-xs uppercase font-poppinsMedium text-light-grayText dark:text-dark-grayText mb-3 px-2 tracking-wide">
          Actions
        </Txt>
        <View style={tw``}>{renderedOptions}</View>
      </View>
    </Fragment>
  )
}

export default WorkoutOptions

const styles = StyleSheet.create({})
