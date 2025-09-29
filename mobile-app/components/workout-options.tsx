import { StyleSheet, View } from 'react-native'
import Txt from './text'
import { WorkoutMinimal } from '../context/workout-context'
import { MapPin, PinOff, Share } from 'lucide-react-native'
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

  const handleShareWorkout = async () => {}

  const options = [
    {
      title: 'Details',
      onPress: handleViewDetails,
      icon: Info,
    },
    {
      title: 'Share',
      onPress: handleShareWorkout,
      icon: Share,
    },
    {
      title: pinned ? 'Unpin' : 'Pin',
      onPress: handlePinToggle,
      icon: pinned ? PinOff : Pin,
    },
    {
      title: 'Edit',
      onPress: handleEdit,
      icon: Pencil,
    },
    {
      title: 'Delete',
      onPress: handleDeleteWorkout,
      icon: Trash,
    },
  ]

  const renderedOptions = options.map(
    ({ title, onPress, icon: Icon }, index) => {
      return (
        <Button
          onPress={onPress}
          key={index}
        >
          <View
            key={index}
            style={tw`flex-row gap-4 p-3 items-center`}
          >
            <Icon
              size={18}
              color={theme.grayText}
              strokeWidth={1.5}
            />

            <View style={tw`flex-1`}>
              <Txt>{title}</Txt>
            </View>
          </View>
        </Button>
      )
    }
  )

  return (
    <Fragment>
      <View style={tw`rounded-3xl bg-white dark:bg-dark-grayPrimary p-2`}>
        {renderedOptions}
      </View>
    </Fragment>
  )
}

export default WorkoutOptions

const styles = StyleSheet.create({})
