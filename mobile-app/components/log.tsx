import { View } from 'react-native'
import Txt from './text'
import { BookOpen, Calendar } from 'lucide-react-native'
import Colors from '../constants/colors'
import Button from './button'
import { router } from 'expo-router'
import tw from '../tw'

type LogProps = {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const thingsToLog = [
  {
    title: 'Workout',
    icon: Calendar,
    description:
      'Plan a future workout or log your in-progress/finished workout.',
    href: '/workout-form',
  },
  {
    title: 'Notebook Entry',
    icon: BookOpen,
    description:
      'Record how you feel on off days, diets, injuries, warmup routines, and anything else.',
    href: '/notebook-entry-form',
  },
] as const

const Log = ({ setIsOpen }: LogProps) => {
  const renderedElements = thingsToLog.map(
    ({ title, description, href, icon: Icon }, index) => {
      return (
        <Button
          onPress={() => {
            router.push(href)
            setTimeout(() => {
              setIsOpen(false)
            }, 250)
          }}
          key={index}
        >
          <View
            key={index}
            style={tw`bg-light-grayPrimary dark:bg-dark-grayPrimary rounded-xl p-4 flex-row gap-6 items-center`}
          >
            <Icon
              color={Colors.primary}
              size={24}
            />

            <View style={tw`flex-1`}>
              <Txt twcn="font-poppinsMedium text-base mb-0.5">{title}</Txt>
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
      <Txt twcn="text-xl text-center font-poppinsSemiBold">
        What would you like to log?
      </Txt>
      <View style={tw`flex-col gap-3`}>{renderedElements}</View>
    </>
  )
}

export default Log
