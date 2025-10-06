import { View, Switch } from 'react-native'
import tw from '../tw'
import Txt from './text'
import useTheme from '../app/hooks/theme'
import Colors from '../constants/colors'
import Button from './button'
import { useWorkoutForm } from '../context/workout-form-context'
import { SquareStack } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import Selector from './selector'

type ExerciseOptionsProps = {
  closeModal: () => void
}

const ExerciseOptions = ({ closeModal }: ExerciseOptionsProps) => {
  const { theme } = useTheme()
  const { workoutData, setWorkoutData } = useWorkoutForm()
  const { weightUnit } = workoutData
  const router = useRouter()
  const exerciseOptions = [
    {
      title: 'Superset',
      description: 'Sets performed back-to-back, different exercises.',
      icon: SquareStack,
      href: '/workout-form/supersets',
    },
    {
      title: 'Drop Set',
      description:
        'Sets performed back-to-back, same exercise, decreasing weight.',
      icon: SquareStack,
      href: '/workout-form/dropsets',
    },
  ]

  const canCreateSuperset = workoutData.exercises.length >= 2
  const canCreateDropset =
    workoutData.exercises.length >= 1 &&
    workoutData.exercises.some((ex) => ex.sets.length >= 2)

  const renderedOptions = exerciseOptions.map(
    ({ title, description, icon: Icon, href }, index) => {
      return (
        <Button
          onPress={() => {
            // close the modal, use passed function
            closeModal()
            router.push(href)
          }}
          disabled={
            (title === 'Superset' && !canCreateSuperset) ||
            (title === 'Drop Set' && !canCreateDropset)
          }
          key={title}
        >
          <View
            key={index}
            style={tw`flex-row gap-6 p-3 items-center rounded-xl`}
          >
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
  console.log('weight metric, ', workoutData.weightUnit)
  return (
    <>
      <View style={tw`flex-row items-center justify-between`}>
        <Txt twcn="text-base font-poppinsMedium">Exercises Options</Txt>
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
