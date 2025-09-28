import { StyleSheet, Pressable, View } from 'react-native'
import { Fragment, useState } from 'react'
import Txt from './text'
import { formatDate } from '../functions/formatted-date'
import tw from '../tw'
import Button from './button'
import { Ellipsis, ChevronDown, ChevronUp, Tag } from 'lucide-react-native'
import useTheme from '../app/hooks/theme'
import Colors from '../constants/colors'
import MyModal from './modal'
import { Workout, WorkoutMinimal } from '../context/workout-context'
import WorkoutOptions from './workout-options'
import { capString } from '../functions/cap-string'

const WorkoutView = ({ workout }: { workout: WorkoutMinimal }) => {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const { theme } = useTheme()
  const { date, tags, name, location, exercises } = workout

  const renderedTags = tags.map((tag) => {
    return (
      <Txt
        key={tag}
        twcn="text-xs text-primary"
      >
        #{tag}
      </Txt>
    )
  })

  const renderedExercises = exercises.map(
    ({ name, sets, lowRepRange, highRepRange }) => {
      return (
        <View
          style={tw`flex-row items-center justify-between gap-2`}
          key={name}
        >
          <Txt twcn="text-light-grayText dark:text-dark-grayText text-xs">
            {name}
          </Txt>
          <Txt twcn="text-light-grayText dark:text-dark-grayText text-xs">
            {sets} x {lowRepRange}-{highRepRange}
          </Txt>
        </View>
      )
    }
  )

  return (
    <Fragment>
      <View
        style={tw`p-4 rounded-2xl bg-white dark:bg-dark-grayPrimary relative overflow-hidden`}
      >
        <View style={tw`flex-row justify-between flex-1 items-center`}>
          <View>
            <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText ">
              {capString(
                `${formatDate(date)}${location ? ` @ ${location}` : ''}`,
                40
              )}
            </Txt>
          </View>
          <Button
            hitSlop={12}
            onPress={() => setIsOptionsOpen(true)}
          >
            <Ellipsis
              size={20}
              color={theme.grayText}
            />
          </Button>
        </View>

        <View>
          <Txt twcn="font-poppinsMedium">{name}</Txt>
          <View style={tw`mt-2 gap-1`}>{renderedExercises}</View>
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
        />
      </MyModal>
    </Fragment>
  )
}

export default WorkoutView

const styles = StyleSheet.create({})
