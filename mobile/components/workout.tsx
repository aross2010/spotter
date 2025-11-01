import { StyleSheet, View } from 'react-native'
import { Fragment, useState } from 'react'
import Txt from './text'
import { formatDate } from '../functions/formatted-date'
import tw from '../tw'
import Button from './button'
import { Ellipsis, Tag } from 'lucide-react-native'
import useTheme from '../app/hooks/theme'
import Colors from '../constants/colors'
import MyModal from './modal'
import { useWorkout } from '../context/workout-context'
import WorkoutOptions from './workout-options'
import { WorkoutMinimal } from '../utils/types'

const WorkoutView = ({
  workout,
  roundTop,
  roundBottom,
  isHome = false,
}: {
  workout: WorkoutMinimal
  roundTop: boolean
  roundBottom: boolean
  isHome?: boolean
}) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const { theme } = useTheme()
  const { filters } = useWorkout()
  const { date, tags, name, location, exercises } = workout

  const isTagFiltered = (tag: string) =>
    filters.tags.some((t) => t === tag) || false
  const isWorkoutNameFiltered = filters.workoutNames.includes(name) || false
  const isLocationFiltered =
    (location && filters.locations.includes(location)) || false
  const isExerciseFiltered = (exerciseName: string) =>
    filters.exerciseNames.includes(exerciseName) || false

  const renderedTags = tags.map((tag) => {
    const isFiltered = isTagFiltered(tag)
    return (
      <View
        key={tag}
        style={tw`${isFiltered ? 'bg-primary/10 px-2 py-1 rounded-full' : ''}`}
      >
        <Txt twcn="text-xs text-primary">#{tag}</Txt>
      </View>
    )
  })

  const renderedExercises = exercises.map(
    ({ name, sets, lowRepRange, highRepRange }, index) => {
      const isFiltered = isExerciseFiltered(name)
      return (
        <View
          style={tw`flex-row items-center justify-between gap-2`}
          key={index}
        >
          <Txt twcn={`text-sm ${isFiltered ? 'text-primary' : ''}`}>{name}</Txt>
          <Txt twcn={`text-sm ${isFiltered ? 'text-primary' : ''}`}>
            {sets} x{' '}
            {lowRepRange === highRepRange
              ? lowRepRange
              : `${lowRepRange}-${highRepRange}`}
          </Txt>
        </View>
      )
    }
  )

  return (
    <Fragment>
      <View
        style={tw`p-4 ${roundTop ? 'rounded-t-2xl' : ''} ${roundBottom ? 'rounded-b-2xl' : ''} ${roundBottom ? '' : 'border-b border-light-grayBorder dark:border-dark-grayBorder'} bg-white dark:bg-dark-grayPrimary relative overflow-hidden`}
      >
        <View style={tw`flex-row justify-between flex-1 items-center`}>
          <View>
            <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-poppinsMedium tracking-wide">
              {formatDate(date)}
              {location && (
                <Txt
                  twcn={`text-xs uppercase font-poppinsMedium tracking-wide ${isLocationFiltered ? 'text-primary' : 'text-light-grayText dark:text-dark-grayText'}`}
                >
                  {' '}
                  @ {location}
                </Txt>
              )}
            </Txt>
          </View>
          <Button
            hitSlop={12}
            onPress={() => setIsOptionsOpen(true)}
          >
            <Ellipsis
              size={24}
              color={theme.grayText}
            />
          </Button>
        </View>

        <View>
          <View style={tw`flex-row items-center gap-1`}>
            <Txt
              numberOfLines={1}
              twcn={`font-poppinsSemiBold text-base -mt-1 ${isWorkoutNameFiltered ? 'text-primary' : ''}`}
            >
              {name}
            </Txt>
            {(workout.status === 'planned' || workout.status === 'active') && (
              <Txt
                numberOfLines={1}
                twcn={`text-xs ${workout.status === 'planned' ? 'text-secondary' : workout.status === 'active' ? 'text-blue' : 'text-light-grayText dark:text-dark-grayText '}`}
              >
                – {workout.status}
              </Txt>
            )}
          </View>

          <View style={tw`mt-4 gap-1.5`}>{renderedExercises}</View>
        </View>
        {tags.length > 0 && (
          <View style={tw`mt-4 flex-row flex-wrap items-center gap-2`}>
            <Tag
              color={Colors.primary}
              strokeWidth={1.5}
              size={12}
            />
            {renderedTags}
          </View>
        )}
      </View>
      <MyModal
        isOpen={isOptionsOpen}
        setIsOpen={setIsOptionsOpen}
      >
        <WorkoutOptions
          setIsOptionsOpen={setIsOptionsOpen}
          workout={workout}
          isHome={isHome}
        />
      </MyModal>
    </Fragment>
  )
}

export default WorkoutView

const styles = StyleSheet.create({})
