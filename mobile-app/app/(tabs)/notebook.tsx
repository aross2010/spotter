import { StyleSheet, Text, View, Animated, Easing } from 'react-native'
import React, { useEffect, useRef } from 'react'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import {
  Activity,
  Ambulance,
  PenLine,
  Smile,
  Target,
  Utensils,
} from 'lucide-react-native'
import tw from '../../tw'
import Colors from '../../constants/colors'
import Button from '../../components/button'
import { router } from 'expo-router'

const notebookFunctions = [
  {
    title: 'Injuries',
    description:
      'Keep track of your health and roadblocks along your fitness journey',
    icon: Ambulance,
  },
  {
    title: 'Warm-ups',
    description:
      'Never forget the warm-up routine that prepares your body for your workouts',
    icon: Activity,
  },
  {
    title: 'Goals',
    description:
      'Set, track, and achieve your fitness milestones with clear, actionable goals',
    icon: Target,
  },
  {
    title: 'Diet',
    description:
      'Note when you begin or end diets to see how they are affecting your performance',
    icon: Utensils,
  },
  {
    title: 'Mindset',
    description:
      'Reflect on how you feel about your workouts, progress, and fitness journey at large',
    icon: Smile,
  },
]

const Notebook = () => {
  // Create animated values for each function
  const animatedValues = useRef(
    notebookFunctions.map(() => ({
      translateX: new Animated.Value(-50),
      opacity: new Animated.Value(0),
    }))
  ).current

  // Trigger animations on mount
  useEffect(() => {
    const animations = animatedValues.map((animValue, index) => {
      return Animated.parallel([
        Animated.timing(animValue.translateX, {
          toValue: 0,
          duration: 500,
          delay: index * 25,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(animValue.opacity, {
          toValue: 1,
          duration: 500,
          delay: index * 25,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    })

    // Start all animations
    Animated.stagger(0, animations).start()
  }, [])

  const renderedNotebookFunctions = notebookFunctions.map(
    ({ icon, title, description }, index) => {
      const Icon = icon
      const animValue = animatedValues[index]

      return (
        <Animated.View
          key={title}
          style={[
            tw`flex-row items-center gap-6 rounded-2xl p-4 bg-light-grayPrimary dark:bg-dark-grayBackground`,
            {
              transform: [{ translateX: animValue.translateX }],
              opacity: animValue.opacity,
            },
          ]}
        >
          <View
            style={tw`p-2 rounded-full bg-primary/15 dark:bg-dark-primary/50`}
          >
            <Icon
              size={24}
              color={Colors.primary}
              strokeWidth={1.5}
            />
          </View>
          <View style={tw`flex-1 gap-0.5`}>
            <Txt twcn="font-poppinsMedium text-base">{title}</Txt>
            <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText">
              {description}
            </Txt>
          </View>
        </Animated.View>
      )
    }
  )

  return (
    <SafeView noScroll>
      <View style={tw`flex-1 justify-between`}>
        <View>
          <Txt twcn="text-center text-base mb-6 opacity-60">
            Capture everything beyond your workouts
          </Txt>
          <View style={tw`gap-3`}>{renderedNotebookFunctions}</View>
        </View>
        <View>
          <Button
            onPress={() => router.push('/notebook-entry-form')}
            twcn="w-full bg-primary justify-center items-center flex-row gap-2 rounded-full p-4"
            twcnText="text-light-background font-poppinsMedium text-base"
            text="Log your first entry"
          >
            <PenLine
              size={20}
              color={Colors.light.background}
            />
          </Button>
        </View>
      </View>
    </SafeView>
  )
}

export default Notebook
