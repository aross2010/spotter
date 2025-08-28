import { StyleSheet, View } from 'react-native'
import React, { Fragment } from 'react'
import Txt from './text'
import { BookOpen, Calendar, PersonStanding } from 'lucide-react-native'
import Colors from '../constants/colors'
import Button from './button'
import { router } from 'expo-router'
import tw from '../tw'
import DragHandle from './drag-handle'

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
            style={tw`bg-white border border-light-grayPrimary dark:bg-dark-grayPrimary rounded-xl px-4 py-6 flex-row gap-6 items-center`}
          >
            <Icon
              color={Colors.primary}
              height={28}
              width={28}
            />

            <View style={tw`flex-1 gap-1`}>
              <Txt twcn="font-poppinsSemiBold text-base">{title}</Txt>
              <Txt twcn="text-light-grayText dark:text-dark-grayText">
                {description}
              </Txt>
            </View>
          </View>
        </Button>
      )
    }
  )

  return (
    <Fragment>
      <Txt twcn="text-primary dark:text-primary text-xl text-center font-geologicaSemiBold">
        What would you like to log?
      </Txt>
      <View style={tw`flex-col gap-2`}>{renderedElements}</View>
    </Fragment>
  )
}

export default Log
