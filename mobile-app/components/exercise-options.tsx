import { View, Switch } from 'react-native'
import tw from '../tw'
import Txt from './text'
import useTheme from '../app/hooks/theme'
import Colors from '../constants/colors'
import Button from './button'
import { useWorkoutForm } from '../context/workout-form-context'
import { ArrowLeft, SquareStack } from 'lucide-react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

const ExerciseOptions = () => {
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

  const renderedOptions = exerciseOptions.map(
    ({ title, description, icon: Icon, href }, index) => {
      return (
        <Button
          onPress={() => {
            // close the modal, use passed function
            router.push(href)
          }}
          key={title}
          style={tw`flex-row items-center justify-between gap-6 bg-light-grayPrimary dark:bg-dark-grayPrimary p-4 rounded-lg`}
        >
          <View
            style={tw`w-10 h-10 rounded-xl bg-light-grayPrimary dark:bg-dark-grayPrimary items-center justify-center`}
          >
            <Icon
              color={Colors.primary}
              size={24}
            />
          </View>
          <View style={tw`flex-1`}>
            <Txt twcn="font-poppinsMedium mb-0.5">{title}</Txt>
            <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
              {description}
            </Txt>
          </View>
        </Button>
      )
    }
  )

  return (
    <>
      <View style={tw`flex-row items-center justify-between`}>
        <Txt twcn="text-base font-poppinsMedium">Exercise Options</Txt>
        <View style={tw`flex-row items-center gap-2`}>
          <Txt
            twcn={`${weightUnit === 'kg' ? 'text-primary' : 'text-light-grayText dark:text-dark-grayText'} font-poppinsSemiBold uppercase text-xs tracking-wide`}
          >
            Kg.
          </Txt>
          <View style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}>
            <Switch
              onChange={() => {
                setWorkoutData({
                  ...workoutData,
                  weightUnit: workoutData.weightUnit === 'lbs' ? 'kg' : 'lbs',
                })
              }}
              value={workoutData.weightUnit === 'lbs'}
              thumbColor={Colors.primary}
              trackColor={{
                false: theme.grayPrimary,
                true: theme.grayPrimary,
              }}
            />
          </View>
          <Txt
            twcn={`${weightUnit === 'lbs' ? 'text-primary' : 'text-light-grayText dark:text-dark-grayText'} font-poppinsSemiBold uppercase text-xs tracking-wide`}
          >
            Lbs.
          </Txt>
        </View>
      </View>
      <View style={tw`gap-3`}>{renderedOptions}</View>
    </>
  )
}

export default ExerciseOptions
