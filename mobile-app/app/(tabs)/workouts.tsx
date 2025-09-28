import { StyleSheet, Text, TextInput, View, FlatList } from 'react-native'
import React, { useEffect } from 'react'
import { useNavigation, router } from 'expo-router'
import { Link } from 'expo-router'
import tw from '../../tw'
import Colors from '../../constants/colors'
import { ListFilter, Plus, Dumbbell, Calendar, Pin } from 'lucide-react-native'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import Button from '../../components/button'
import {
  useWorkout,
  Workout,
  WorkoutMinimal,
} from '../../context/workout-context'
import Spinner from '../../components/activity-indicator'
import useTheme from '../hooks/theme'
import WorkoutView from '../../components/workout'

const Workouts = () => {
  const navigation = useNavigation()
  const {
    currentWorkouts,
    filters,
    isLoading,
    isLoadingMore,
    hasMore,
    initializeWorkouts,
    loadMoreWorkouts,
  } = useWorkout()
  const { theme } = useTheme()
  const hasWorkouts = currentWorkouts.length > 0
  const noResults = currentWorkouts.length === 0 && !filters

  useEffect(() => {
    initializeWorkouts()
  }, [])

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        const numFilters = 0

        return (
          <View style={tw`flex-row items-center gap-4 pr-2`}>
            {numFilters > 0 && (
              <View style={tw`relative`}>
                <Link href="/notebook-filters">
                  <ListFilter
                    strokeWidth={1.5}
                    size={24}
                    color={Colors.primary}
                  />
                </Link>
              </View>
            )}
            <Link href="/workout-form">
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
  }, [])

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      loadMoreWorkouts()
    }
  }

  const workoutPrompt = (
    <SafeView
      hasTabBar
      scroll={false}
    >
      <View style={tw`flex-1 items-center justify-center px-16`}>
        <Calendar
          color={Colors.primary}
          strokeWidth={1}
          size={64}
        />
        <Txt twcn="text-xl font-poppinsMedium text-center mt-6 mb-3">
          Your Workouts
        </Txt>
        <Txt twcn="text-center text-sm text-light-grayText dark:text-dark-grayText">
          Capture everything beyond your workouts
        </Txt>
        <Button
          onPress={() => router.push('/workout-form')}
          text="Log your first workout"
          twcn="mt-6 py-4 w-full items-center flex-row justify-center rounded-full bg-primary"
          twcnText="font-poppinsMedium text-dark-text"
        >
          <Plus
            color={Colors.dark.text}
            size={16}
            style={tw`ml-2`}
          />
        </Button>
      </View>
    </SafeView>
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
    item: WorkoutMinimal
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
      const prevEntry = currentWorkouts[index - 1]
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
        <Txt twcn="text-xs uppercase text-light-grayText dark:text-dark-grayText font-poppinsMedium tracking-wide">
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
        <WorkoutView workout={item} />
      </View>
    )
  }

  const renderFooter = () => {
    if (!isLoadingMore) return null
    return <Spinner />
  }

  const workoutsView = noResults ? (
    <SafeView>
      <View style={tw`flex-1 items-center justify-center`}>
        <Txt twcn="text-center text-base">No results found</Txt>
      </View>
    </SafeView>
  ) : (
    <View style={tw`flex-1`}>
      <FlatList
        data={currentWorkouts}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        contentContainerStyle={tw`p-4 gap-2`}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        disableVirtualization={true}
        initialNumToRender={currentWorkouts.length}
        maxToRenderPerBatch={currentWorkouts.length}
      />
    </View>
  )

  return isLoading ? <Spinner /> : hasWorkouts ? workoutsView : workoutPrompt
}

export default Workouts
