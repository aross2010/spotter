import { View } from 'react-native'
import tw from '../tw'
import Txt from './text'
import Button from './button'
import { useWorkoutForm } from '../context/workout-form-context'
import { SquareStack } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import Selector from './selector'

type ExerciseOptionsProps = {
  closeModal: () => void
}

const ExerciseOptions = ({ closeModal }: ExerciseOptionsProps) => {
  const { workoutData, setWorkoutData } = useWorkoutForm()
  const router = useRouter()
  const exerciseOptions = [
    {
      title: 'Supersets',
      description: 'Sets performed back-to-back, different exercises.',
      icon: SquareStack,
      href: '/workout-form/supersets',
    },
    {
      title: 'Drop Sets',
      description:
        'Sets performed back-to-back, same exercise, decreasing weight.',
      icon: SquareStack,
      href: '/workout-form/dropsets',
    },
  ]

  const canCreateSuperset =
    workoutData.exercises.length >= 2 &&
    workoutData.exercises.filter(
      (ex) => ex.name.trim() !== '' && ex.sets.length >= 1
    ).length >= 2

  const canCreateDropset =
    workoutData.exercises.length >= 1 &&
    workoutData.exercises.some((ex) => {
      const setsWithData = ex.sets.filter((set) => {
        const hasWeight =
          (set.weightLbs !== null && set.weightLbs !== undefined) ||
          (set.weightKg !== null && set.weightKg !== undefined)
        const hasReps =
          (set.reps !== null && set.reps !== undefined) ||
          (set.leftReps !== null && set.leftReps !== undefined) ||
          (set.rightReps !== null && set.rightReps !== undefined)
        return hasWeight || hasReps
      })
      return setsWithData.length >= 2
    })

  const renderedOptions = exerciseOptions.map(
    ({ title, description, icon: Icon, href }, index) => {
      const isDisabled =
        (title === 'Supersets' && !canCreateSuperset) ||
        (title === 'Drop Sets' && !canCreateDropset)

      return (
        <Button
          onPress={() => {
            // close the modal, use passed function
            closeModal()
            router.push(href)
          }}
          disabled={isDisabled}
          key={title}
        >
          <View
            key={index}
            style={tw`flex-row gap-6 p-3 items-center rounded-xl ${isDisabled ? 'opacity-40' : ''}`}
          >
            <View style={tw`flex-1`}>
              <Txt twcn="mb-0.5">{title}</Txt>
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
    <>
      <View style={tw`flex-row items-center justify-between`}>
        <Txt twcn=" font-poppinsMedium">Exercises Options</Txt>
        <View style={tw`flex-row items-center gap-2`}>
          <Selector
            selectedValue={workoutData.weightUnit}
            onSelect={(value: string) =>
              setWorkoutData({
                ...workoutData,
                weightUnit: value as 'kgs' | 'lbs',
              })
            }
            options={[
              { label: 'Kg', value: 'kgs' },
              { label: 'Lbs', value: 'lbs' },
            ]}
          />
        </View>
      </View>
      <View style={tw``}>{renderedOptions}</View>
    </>
  )
}

export default ExerciseOptions
