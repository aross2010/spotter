import { StyleSheet, View } from 'react-native'
import Txt from './text'
import { Copy } from 'lucide-react-native'
import { Info, Pencil, Trash } from 'lucide-react-native'
import Button from './button'
import tw from '../tw'
import { Fragment } from 'react'
import useTheme from '../app/hooks/theme'
import { router } from 'expo-router'
import { useWorkout } from '../context/workout-context'
import { WorkoutMinimal } from '../utils/types'
import { useHomeDataStore } from '../stores/workout-store'

type WorkoutOptionsProps = {
  workout: WorkoutMinimal
  isHome?: boolean
  setIsOptionsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const WorkoutOptions = ({
  workout,
  setIsOptionsOpen,
  isHome,
}: WorkoutOptionsProps) => {
  const { pinned, id, name, date, location } = workout
  const { deleteWorkout } = useWorkout()
  const { theme } = useTheme()
  const { triggerRefresh } = useHomeDataStore()

  const handleViewDetails = () => {
    setIsOptionsOpen(false)
    router.push({
      pathname: '/workout-details',
      params: {
        id: id,
      },
    })
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
    triggerRefresh()
  }

  const handleCloneWorkout = () => {
    // keep the location, workout name, tags, exercise names, sets, reps, setgroupings, rpe/rir, and weight unit
    // change to current date
    // leave out the weights
    setIsOptionsOpen(false)
    router.push({
      pathname: '/workout-form',
      params: {
        cloneId: id,
      },
    })
  }

  const options = [
    {
      title: 'View',
      onPress: handleViewDetails,
      icon: Info,
    },
    {
      title: 'Clone',
      onPress: handleCloneWorkout,
      icon: Copy,
    },
    {
      title: 'Edit',
      onPress: handleEdit,
      icon: Pencil,
    },
    ...(!isHome
      ? [
          {
            title: 'Delete',
            onPress: handleDeleteWorkout,
            icon: Trash,
          },
        ]
      : []),
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
            style={tw`flex-row gap-6 p-3 items-center`}
          >
            <Icon
              size={22}
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
      <View>{renderedOptions}</View>
    </Fragment>
  )
}

export default WorkoutOptions

const styles = StyleSheet.create({})
