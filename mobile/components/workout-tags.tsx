import { View } from 'react-native'
import { TagIcon, ArrowRight, Tag } from 'lucide-react-native'
import { router, useLocalSearchParams } from 'expo-router'
import Colors from '../constants/colors'
import Button from './button'
import TagView from './tag'
import tw from '../tw'
import { useWorkoutForm } from '../context/workout-form-context'

const WorkoutTags = () => {
  const { workoutData } = useWorkoutForm()

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
        key={id}
        tag={{ id, name, userId }}
      />
    )
  })

  return (
    <View>
      {workoutData.tags.length > 0 ? (
        <Button
          hitSlop={16}
          onPress={handleAddTags}
          twcn="w-full"
        >
          <View style={tw`flex-row items-center gap-2 flex-wrap`}>
            <TagIcon
              color={Colors.primary}
              size={16}
            />
            {renderedTags}
          </View>
        </Button>
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
