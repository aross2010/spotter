import { View, FlatList } from 'react-native'
import React, { useEffect } from 'react'
import { useNavigation, router } from 'expo-router'
import { Link } from 'expo-router'
import tw from '../../tw'
import Colors from '../../constants/colors'
import { ListFilter, Plus, Calendar, Pin } from 'lucide-react-native'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import Button from '../../components/button'
import { useWorkout, WorkoutMinimal } from '../../context/workout-context'
import Spinner from '../../components/activity-indicator'
import useTheme from '../hooks/theme'
import WorkoutView from '../../components/workout'
import Selector from '../../components/selector'
import { MONTHS } from '../../constants/data'

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
    applyFiltersAndSort,
    sortOrder,
    statusFilter,
    setStatusFilter,
    workouts,
    hasLoaded,
  } = useWorkout()
  const { theme } = useTheme()

  const numActiveFilters =
    Object.keys(filters).reduce((acc: number, key) => {
      const filterLength = filters[key as keyof typeof filters]?.length || 0
      return Number(acc) + Number(filterLength)
    }, 0 as number) + (sortOrder == 'asc' ? 1 : 0)
  const noResults =
    currentWorkouts.length === 0 &&
    (numActiveFilters > 0 || statusFilter != 'all')

  useEffect(() => {
    initializeWorkouts()
  }, [])

  // Apply status filter through API when tab changes
  useEffect(() => {
    const status =
      statusFilter === 'all' || statusFilter === null ? undefined : statusFilter
    applyFiltersAndSort(status)
  }, [statusFilter])

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
      month: 'numeric',
      year: 'numeric',
    })

    if (index > 0) {
      const prevEntry = currentWorkouts[index - 1]
      const prevMonth = new Date(prevEntry.date).toLocaleString('default', {
        month: 'numeric',
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
    const [monthNum, day] = month.split('/')

    const monthTitle = addMonth && (
      <View
        style={tw`flex-row items-center gap-2 ${index === 0 ? 'mb-4' : 'my-4'}`}
      >
        <Txt twcn="font-poppinsMedium">
          {MONTHS.get(monthNum)} {day}
        </Txt>
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

  const workoutsView = (
    <View style={tw`flex-1`}>
      <View style={tw`px-4 py-2`}>
        <Selector
          selectedValue={statusFilter || 'all'}
          onSelect={(value) => {
            const status = value === 'all' ? null : value
            setStatusFilter(status)
          }}
          options={[
            {
              label: 'All',
              value: 'all',
            },
            {
              label: 'Completed',
              value: 'completed',
            },
            {
              label: 'Planned',
              value: 'planned',
            },
            {
              label: 'Active',
              value: 'active',
            },
          ]}
        />
      </View>

      {isLoading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <Spinner />
        </View>
      ) : noResults ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <Txt twcn="text-center text-xl mb-4 font-poppinsSemiBold">
            No results found
          </Txt>
          <Txt twcn="text-center px-8 text-sm text-light-grayText dark:text-dark-grayText mt-2">
            Try adjusting your filters or sort method to find what you're
            looking for.
          </Txt>
        </View>
      ) : (
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
      )}
    </View>
  )

  // Show loading spinner on first load, then show either workoutsView or workoutPrompt
  if (!hasLoaded) {
    return (
      <SafeView
        hasTabBar
        scroll={false}
      >
        <View style={tw`flex-1 items-center justify-center`}>
          <Spinner />
        </View>
      </SafeView>
    )
  }

  return workouts.length > 0 ? workoutsView : workoutPrompt
}

export default Workouts
