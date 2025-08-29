import { View, Animated, Easing } from 'react-native'
import React, { useEffect, useRef } from 'react'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import {
  Activity,
  Ambulance,
  PenLine,
  Pin,
  Smile,
  Target,
  Utensils,
  ListFilter,
  Plus,
} from 'lucide-react-native'
import { Link } from 'expo-router'
import tw from '../../tw'
import Colors from '../../constants/colors'
import Button from '../../components/button'
import { router, useNavigation } from 'expo-router'
import Spinner from '../../components/activity-indicator'
import NotebookEntryView from '../../components/notebook-entry'
import { useNotebook } from '../../context/notebook-context'
import useTheme from '../hooks/theme'

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
  const { currentNotebookEntries, isLoading, initializeNotebook, tagFilters } =
    useNotebook()
  const { theme } = useTheme()
  const navigation = useNavigation()
  const hasEntries = currentNotebookEntries.length > 0
  const noResults = currentNotebookEntries.length === 0 && tagFilters.length > 0

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        return (
          <View style={tw`flex-row items-center gap-4 pr-2`}>
            <View style={tw`relative`}>
              <Link href="/notebook-filters">
                <ListFilter
                  strokeWidth={1.5}
                  size={28}
                  color={Colors.primary}
                />
              </Link>
              {tagFilters.length > 0 && (
                <View
                  style={tw.style(
                    'absolute -z-1 -top-1 -right-1 min-w-5 h-5 rounded-full items-center justify-center bg-primary'
                  )}
                >
                  <Txt twcn="text-xs font-poppinsMedium text-white">
                    {tagFilters.length}
                  </Txt>
                </View>
              )}
            </View>
            <Link href="/notebook-entry-form">
              <Plus
                strokeWidth={1.5}
                size={28}
                color={Colors.primary}
              />
            </Link>
          </View>
        )
      },
    })
  }, [navigation, tagFilters])

  useEffect(() => {
    initializeNotebook()
  }, [])

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

  const animatedValues = useRef(
    notebookFunctions.map(() => ({
      translateX: new Animated.Value(-50),
      opacity: new Animated.Value(0),
    }))
  ).current

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

  const pinnedTitle = (
    <View style={tw`flex-row items-center gap-1 mb-4`}>
      <Pin
        size={16}
        color={theme.grayText}
      />
      <Txt twcn="text-xs uppercase text-light-grayText dark:text-dark-grayText font-poppinsMedium">
        Pinned
      </Txt>
    </View>
  )

  let currentMonth = ''

  const renderedEntries = currentNotebookEntries.map((entry, index) => {
    let addMonth = false
    const { date, pinned, id } = entry
    const month = new Date(date).toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    })

    if (month !== currentMonth && !pinned) {
      currentMonth = month
      addMonth = true
    }

    const monthTitle = addMonth && (
      <View style={tw`flex-row items-center gap-2 my-4`}>
        <Txt twcn="text-xs uppercase text-light-grayText dark:text-dark-grayText font-poppinsMedium">
          {month}
        </Txt>
        <View
          style={tw`flex-1 h-px bg-light-grayPrimary dark:bg-dark-graySecondary ml-2`}
        />
      </View>
    )

    return (
      <View key={id}>
        {index == 0 && pinned ? pinnedTitle : null}
        {monthTitle}
        <NotebookEntryView entry={entry} />
      </View>
    )
  })

  const notebookPrompt = (
    <SafeView noScroll>
      <View style={tw`flex-1 justify-between`}>
        <View>
          <Txt twcn="text-center text-base mb-6 opacity-60">
            Capture everything beyond your workouts
          </Txt>
          <View style={tw`gap-4`}>{renderedNotebookFunctions}</View>
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

  const notebookView = noResults ? (
    <View>
      <Txt>No results found</Txt>
    </View>
  ) : (
    <SafeView twcnInnerView="gap-2">{renderedEntries}</SafeView>
  )

  return isLoading ? <Spinner /> : hasEntries ? notebookView : notebookPrompt
}

export default Notebook
