import { View, FlatList } from 'react-native'
import React, { useEffect, useCallback } from 'react'
import { useNavigation, router } from 'expo-router'
import { Link } from 'expo-router'
import tw from '../../tw'
import Colors from '../../constants/colors'
import { ListFilter, Plus, Calendar } from 'lucide-react-native'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import Button from '../../components/button'
import { useWorkout } from '../../context/workout-context'
import Spinner from '../../components/activity-indicator'
import WorkoutView from '../../components/workout'
import { MONTHS } from '../../constants/data'
import { WorkoutMinimal } from '../../utils/types'
import { useWorkoutTabStore } from '../../stores/workout-store'
import { useFocusEffect } from 'expo-router'

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
    sortOrder,
    statusFilter,
    workouts,
    hasLoaded,
    refreshWorkouts,
  } = useWorkout()
  const { shouldRefresh, clearRefresh } = useWorkoutTabStore()

  const numActiveFilters =
    Object.keys(filters).reduce((acc: number, key) => {
      const filterLength = filters[key as keyof typeof filters]?.length || 0
      return Number(acc) + Number(filterLength)
    }, 0 as number) +
    (sortOrder == 'asc' ? 1 : 0) +
    (statusFilter && statusFilter !== 'all' ? 1 : 0)
  const noResults = currentWorkouts.length === 0 && numActiveFilters > 0

  useFocusEffect(
    useCallback(() => {
      if (shouldRefresh) {
        if (hasLoaded) {
          // the initial load has completed, so we can refresh else do not
          refreshWorkouts()
        }
        clearRefresh()
      }
      return () => {}
    }, [shouldRefresh])
  )

  useEffect(() => {
    initializeWorkouts()
  }, [])

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        return (
          <View style={tw`flex-row items-center gap-2 mr-4`}>
            {workouts.length > 0 && (
              <View style={tw`relative`}>
                <Link
                  href="/workout-filters"
                  style={tw` bg-primary/10 rounded-2xl p-2`}
                >
                  <ListFilter
                    size={20}
                    color={Colors.primary}
                  />
                </Link>
                {numActiveFilters > 0 && (
                  <View
                    style={tw.style(
                      'absolute -top-1 -right-1 min-w-5 h-5 rounded-full items-center justify-center bg-primary',
                      { pointerEvents: 'none' }
                    )}
                  >
                    <Txt twcn="text-xs font-poppinsMedium text-white">
                      {numActiveFilters}
                    </Txt>
                  </View>
                )}
              </View>
            )}

            <Link
              href="/workout-form"
              style={tw` bg-primary/10 rounded-2xl p-2`}
            >
              <Plus
                size={20}
                color={Colors.primary}
              />
            </Link>
          </View>
        )
      },
    })
  }, [currentWorkouts, filters])

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
          Stay in control of your progress
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

  const renderEntry = ({
    item,
    index,
  }: {
    item: WorkoutMinimal
    index: number
  }) => {
    let addMonth = false
    let lastInMonth = false
    const { date, pinned, id } = item

    // Parse date in local timezone to avoid UTC shifts
    const [year, monthNum, day] = date.split('-').map(Number)
    const localDate = new Date(year, monthNum - 1, day)
    const month = localDate.toLocaleString('default', {
      month: 'numeric',
      year: 'numeric',
    })

    if (index === 0) {
      const nextEntry = currentWorkouts[index + 1]
      let nextMonth = null
      if (nextEntry) {
        const [nextYear, nextMonthNum, nextDay] = nextEntry.date
          .split('-')
          .map(Number)
        const nextLocalDate = new Date(nextYear, nextMonthNum - 1, nextDay)
        nextMonth = nextLocalDate.toLocaleString('default', {
          month: 'numeric',
          year: 'numeric',
        })
      }

      if (nextMonth && month !== nextMonth && !pinned) {
        lastInMonth = true
      }
    }

    if (index > 0) {
      const prevEntry = currentWorkouts[index - 1]
      const [prevYear, prevMonthNum, prevDay] = prevEntry.date
        .split('-')
        .map(Number)
      const prevLocalDate = new Date(prevYear, prevMonthNum - 1, prevDay)
      const prevMonth = prevLocalDate.toLocaleString('default', {
        month: 'numeric',
        year: 'numeric',
      })

      const nextEntry = currentWorkouts[index + 1]
      let nextMonth = null
      if (nextEntry) {
        const [nextYear, nextMonthNum, nextDay] = nextEntry.date
          .split('-')
          .map(Number)
        const nextLocalDate = new Date(nextYear, nextMonthNum - 1, nextDay)
        nextMonth = nextLocalDate.toLocaleString('default', {
          month: 'numeric',
          year: 'numeric',
        })
      }

      if (nextMonth && month !== nextMonth && !pinned) {
        lastInMonth = true
      }

      if (
        !pinned &&
        (prevEntry.pinned || (month !== prevMonth && !prevEntry.pinned))
      ) {
        addMonth = true
      }
    } else if (!pinned) {
      addMonth = true
    }
    const [displayMonthNum, displayYear] = month.split('/')

    const monthTitle = addMonth && (
      <View
        style={tw`flex-row items-center gap-2 ${index === 0 ? 'mb-4' : 'my-4'}`}
      >
        <Txt twcn="font-poppinsSemiBold text-base">
          {MONTHS.get(displayMonthNum)} {displayYear}
        </Txt>
      </View>
    )

    return (
      <View>
        {monthTitle}
        <WorkoutView
          workout={item}
          roundTop={addMonth}
          roundBottom={lastInMonth || index === currentWorkouts.length - 1}
        />
      </View>
    )
  }

  const renderFooter = () => {
    if (!isLoadingMore) return null
    return <Spinner />
  }

  const workoutsView = isLoading ? (
    <Spinner />
  ) : noResults ? (
    <SafeView
      hasTabBar
      scroll={false}
    >
      <View style={tw`flex-1 items-center justify-center`}>
        <Txt twcn="text-center text-xl mb-4 font-poppinsSemiBold">
          No results found
        </Txt>
        <Txt twcn="text-center px-8 text-sm text-light-grayText dark:text-dark-grayText mt-2">
          Try adjusting your filters or sort method to find what you're looking
          for.
        </Txt>
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
        contentContainerStyle={tw`p-4`}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        disableVirtualization={true}
        initialNumToRender={currentWorkouts.length}
        maxToRenderPerBatch={currentWorkouts.length}
      />
    </View>
  )

  return !isLoading && workouts.length === 0 ? workoutPrompt : workoutsView
}

export default Workouts
