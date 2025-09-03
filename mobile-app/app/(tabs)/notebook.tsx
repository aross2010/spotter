import { View, Animated, Easing, FlatList, ScrollView } from 'react-native'
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
import { NotebookEntry } from '../../utils/types'

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
  const {
    currentNotebookEntries,
    isLoading,
    isLoadingMore,
    hasMore,
    initializeNotebook,
    loadMoreEntries,
    tagFilters,
    sortOrder,
  } = useNotebook()
  const { theme } = useTheme()
  const navigation = useNavigation()
  const hasEntries = currentNotebookEntries.length > 0
  const noResults = currentNotebookEntries.length === 0 && tagFilters.length > 0

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        const numFilters = tagFilters.length + (sortOrder !== 'desc' ? 1 : 0)
        return (
          <View style={tw`flex-row items-center gap-4 pr-2`}>
            {hasEntries && (
              <View style={tw`relative`}>
                <Link href="/notebook-filters">
                  <ListFilter
                    strokeWidth={1.5}
                    size={24}
                    color={Colors.primary}
                  />
                </Link>
                {numFilters > 0 && (
                  <View
                    style={tw.style(
                      'absolute -top-1 -right-1 min-w-5 h-5 rounded-full items-center justify-center bg-primary',
                      { pointerEvents: 'none' }
                    )}
                  >
                    <Txt twcn="text-xs font-poppinsMedium text-white">
                      {numFilters}
                    </Txt>
                  </View>
                )}
              </View>
            )}

            <Link href="/notebook-entry-form">
              <Plus
                strokeWidth={1.5}
                size={24}
                color={Colors.primary}
              />
            </Link>
          </View>
        )
      },
    })
  }, [navigation, tagFilters, sortOrder, currentNotebookEntries])

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
            tw`flex-row items-center gap-6 rounded-2xl p-4 bg-white dark:bg-dark-grayPrimary border border-light-grayPrimary dark:border-dark-graySecondary`,
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

  const renderEntry = ({
    item,
    index,
  }: {
    item: NotebookEntry
    index: number
  }) => {
    let addMonth = false
    const { date, pinned, id } = item
    const month = new Date(date).toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    })

    // Check if we need to show month header
    if (index > 0) {
      const prevEntry = currentNotebookEntries[index - 1]
      const prevMonth = new Date(prevEntry.date).toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      })

      if (
        !pinned &&
        (prevEntry.pinned || (month !== prevMonth && !prevEntry.pinned))
      ) {
        addMonth = true
      }
    } else if (!pinned) {
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

    const showPinnedHeader = index === 0 && pinned

    return (
      <View>
        {showPinnedHeader && pinnedTitle}
        {monthTitle}
        <NotebookEntryView entry={item} />
      </View>
    )
  }

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      loadMoreEntries()
    }
  }

  const renderFooter = () => {
    if (!isLoadingMore) return null
    return <Spinner />
  }

  const notebookPrompt = (
    <SafeView noScroll>
      <View style={tw`flex-1 justify-between`}>
        <View>
          <Txt twcn="text-center text-base mb-6 opacity-60">
            Capture everything beyond your workouts
          </Txt>
          <View style={tw`gap-2`}>{renderedNotebookFunctions}</View>
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
    <SafeView>
      <View style={tw`flex-1 items-center justify-center`}>
        <Txt twcn="text-center text-base opacity-60">No results found</Txt>
      </View>
    </SafeView>
  ) : (
    <View style={tw`flex-1`}>
      <FlatList
        data={currentNotebookEntries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        contentContainerStyle={tw`p-4 gap-2`}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        disableVirtualization={true}
        initialNumToRender={currentNotebookEntries.length}
        maxToRenderPerBatch={currentNotebookEntries.length}
      />
    </View>
  )

  return isLoading ? <Spinner /> : hasEntries ? notebookView : notebookPrompt
}

export default Notebook
