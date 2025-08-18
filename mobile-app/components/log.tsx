import { StyleSheet, View } from 'react-native'
import React from 'react'
import Txt from './text'
import { BookOpen, Calendar, PersonStanding } from 'lucide-react-native'
import Colors from '../constants/colors'
import Button from './button'
import { router } from 'expo-router'

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
    title: 'Weight',
    icon: PersonStanding,
    description: 'Log your weight weekly (or daily) to track your progress.',
    href: '/weight-form',
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
            className="bg-light-grayPrimary dark:bg-dark-grayPrimary rounded-lg px-4 py-6 flex-row gap-6 items-center"
          >
            <Icon
              color={Colors.primary}
              height={28}
              width={28}
            />

            <View className="gap-1 flex-1">
              <Txt className="font-poppinsSemiBold text-lg">{title}</Txt>
              <Txt className="text-light-grayText dark:text-dark-grayText">
                {description}
              </Txt>
            </View>
          </View>
        </Button>
      )
    }
  )

  return (
    <View className="bg-light-background dark:bg-dark-background rounded-lg px-4 pt-10 pb-12 gap-4 relative">
      <View className="absolute h-2 bg-light-grayTertiary w-1/4 dark:bg-dark-grayTertiary rounded-full mt-2 self-center" />
      <Txt className="text-primary font-geologicaSemiBold text-2xl text-center">
        What would you like to log?
      </Txt>
      <View className="flex-col gap-2">{renderedElements}</View>
    </View>
  )
}

export default Log

const styles = StyleSheet.create({})
