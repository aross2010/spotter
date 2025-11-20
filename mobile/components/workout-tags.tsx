import { View } from 'react-native'
import { TagIcon, ArrowRight, Tag } from 'lucide-react-native'
import { router, useLocalSearchParams } from 'expo-router'
import Colors from '../constants/colors'
import Button from './button'
import TagView from './tag'
import tw from '../tw'
import { useWorkoutForm } from '../context/workout-form-context'
import Txt from './text'

const WorkoutTags = () => {
  const { workoutData, setWorkoutData } = useWorkoutForm()

  const handleAddTags = () => {
    router.push({
      pathname: '/tag-selector',
      params: {
        type: 'workout',
      },
    })
  }

  const renderedTags = workoutData.tags.map(({ id, name, userId }, index) => {
    return (
      <TagView
        onRemove={() => {
          // Remove the tag from the workout data
          const updatedTags = workoutData.tags.filter((tag) => tag.id !== id)
          setWorkoutData({ ...workoutData, tags: updatedTags })
        }}
        key={id}
        tag={{ id, name, userId }}
      />
    )
  })

  return (
    <View>
      {workoutData.tags.length > 0 ? (
        <>
          <View style={tw`flex-row items-center w-full justify-between mb-4`}>
            <Txt twcn="font-poppinsSemiBold">Tags</Txt>
            <Button
              onPress={handleAddTags}
              twcnText="font-poppinsSemiBold text-primary dark:text-primary text-sm"
              text="Add More"
            />
          </View>
          <View style={tw`flex-row items-center gap-2 flex-wrap`}>
            {renderedTags}
          </View>
        </>
      ) : (
        <Button
          onPress={handleAddTags}
          twcnText="font-poppinsSemiBold text-primary dark:text-primary"
          twcn="flex-row-reverse mr-auto items-center gap-1"
          text="Add tags"
        >
          <Tag
            color={Colors.primary}
            size={16}
          />
        </Button>
      )}
    </View>
  )
}

export default WorkoutTags
