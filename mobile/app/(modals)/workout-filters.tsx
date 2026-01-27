import { Alert, Keyboard, Pressable, ScrollView, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import tw from '../../tw'
import Button from '../../components/button'
import Colors from '../../constants/colors'
import useTheme from '../hooks/theme'
import { useWorkout, FilterOptions } from '../../context/workout-context'
import Spinner from '../../components/activity-indicator'
import { router, useNavigation, useLocalSearchParams } from 'expo-router'
import SFIcon from '../../components/sf-icon'
import {
  ContextMenu,
  Host,
  Picker,
  Button as SwiftButton,
} from '@expo/ui/swift-ui'

const WorkoutFilters = () => {
  const { theme } = useTheme()
  const {
    clearFilters,
    sortOrder,
    setSortOrder,
    applyFiltersAndSort,
    updateFilters,
    filters,
    getFilterOptions,
    filterOptions,
    isLoading,
    statusFilter,
    setStatusFilter,
  } = useWorkout()

  const { q } = useLocalSearchParams()
  const query = (q as string) || ''
  const [loading, setLoading] = useState(true)
  const [resultOptions, setResultOptions] = useState<FilterOptions>([])
  const [selectedOptions, setSelectedOptions] = useState<FilterOptions>([])
  const [initialState, setInitialState] = useState<{
    selectedOptions: FilterOptions
    sortOrder: 'asc' | 'desc'
    statusFilter: string | null
  }>({
    selectedOptions: [],
    sortOrder: 'desc',
    statusFilter: 'all',
  })

  const navigation = useNavigation()

  // Check if any changes have been made
  const hasChanges = () => {
    const filtersChanged =
      selectedOptions.length !== initialState.selectedOptions.length ||
      selectedOptions.some(
        (option) =>
          !initialState.selectedOptions.some(
            (initial) =>
              initial.label === option.label && initial.type === option.type,
          ),
      )
    const sortOrderChanged = sortOrder !== initialState.sortOrder
    const statusFilterChanged = statusFilter !== initialState.statusFilter
    return filtersChanged || sortOrderChanged || statusFilterChanged
  }

  const resetState = () => {
    initialState.selectedOptions.forEach((option) => {
      if (
        !selectedOptions.some(
          (sel) => sel.label === option.label && sel.type === option.type,
        )
      ) {
        updateFilters(option, 'add')
      }
    })
    selectedOptions.forEach((option) => {
      if (
        !initialState.selectedOptions.some(
          (init) => init.label === option.label && init.type === option.type,
        )
      ) {
        updateFilters(option, 'remove')
      }
    })
    setSortOrder(initialState.sortOrder)
    setStatusFilter(initialState.statusFilter)
  }

  useEffect(() => {
    const changesExist = hasChanges()
    navigation.setOptions({
      headerRight: () => {
        return (
          <View style={tw`flex-row items-center gap-6 px-2`}>
            <Host style={{ width: 26, height: 26 }}>
              <ContextMenu>
                <ContextMenu.Items>
                  <Picker
                    label={`Sort: ${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
                    options={['Newest First', 'Oldest First']}
                    variant="menu"
                    selectedIndex={sortOrder === 'desc' ? 0 : 1}
                    onOptionSelected={({ nativeEvent: { index } }) =>
                      index === 0 ? setSortOrder('desc') : setSortOrder('asc')
                    }
                  />
                  <Picker
                    label={`Status: ${
                      statusFilter === 'all'
                        ? 'All'
                        : statusFilter === 'completed'
                          ? 'Completed'
                          : statusFilter === 'planned'
                            ? 'Planned'
                            : 'Active'
                    }`}
                    options={['All', 'Completed', 'Planned', 'Active']}
                    variant="menu"
                    selectedIndex={
                      statusFilter === 'all'
                        ? 0
                        : statusFilter === 'completed'
                          ? 1
                          : statusFilter === 'planned'
                            ? 2
                            : 3
                    }
                    onOptionSelected={({ nativeEvent: { index } }) =>
                      index === 0
                        ? setStatusFilter('all')
                        : index === 1
                          ? setStatusFilter('completed')
                          : index === 2
                            ? setStatusFilter('planned')
                            : setStatusFilter('active')
                    }
                  />
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                  <SFIcon
                    name="ellipsis.circle"
                    color={Colors.primary}
                    size={26}
                  />
                </ContextMenu.Trigger>
              </ContextMenu>
            </Host>
            <Button
              onPress={handleResetAll}
              hitSlop={8}
              accessibilityLabel="reset all filters"
            >
              <SFIcon
                name="arrow.counterclockwise"
                size={26}
                color={Colors.primary}
              />
            </Button>
            {isLoading && changesExist ? (
              <Spinner
                twcn="w-9"
                fullScreen={false}
              />
            ) : (
              <Button
                onPress={changesExist ? handleApplyFilters : undefined}
                hitSlop={8}
                accessibilityLabel="apply filters and sort method"
                disabled={!changesExist || isLoading}
                twcn="w-9 flex-row items-center justify-center h-full"
              >
                <SFIcon
                  name="checkmark"
                  size={26}
                  color={
                    changesExist && !isLoading ? Colors.primary : theme.grayText
                  }
                />
              </Button>
            )}
          </View>
        )
      },
      headerLeft: () => (
        <Button
          onPress={() => {
            resetState()
            router.back()
          }}
          hitSlop={8}
          accessibilityLabel="close workout filters"
        >
          <SFIcon
            name="xmark"
            size={26}
            color={theme.text}
          />
        </Button>
      ),
      presentation: 'modal',
    })
  }, [
    navigation,
    selectedOptions,
    sortOrder,
    statusFilter,
    initialState,
    isLoading,
  ])

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        await getFilterOptions()
      } catch (error: any) {
        Alert.alert('Error', error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchFilters()
  }, [])

  useEffect(() => {
    if (filterOptions.length > 0) {
      // Build selected options from current filters
      const selected: FilterOptions = []

      filters.tags.forEach((tag) => {
        const option = filterOptions.find(
          (opt) => opt.type === 'tags' && opt.label === tag,
        )
        if (option) selected.push(option)
      })

      filters.workoutNames.forEach((name) => {
        const option = filterOptions.find(
          (opt) => opt.type === 'workoutNames' && opt.label === name,
        )
        if (option) selected.push(option)
      })

      filters.exerciseNames.forEach((name) => {
        const option = filterOptions.find(
          (opt) => opt.type === 'exerciseNames' && opt.label === name,
        )
        if (option) selected.push(option)
      })

      filters.locations.forEach((loc) => {
        const option = filterOptions.find(
          (opt) => opt.type === 'locations' && opt.label === loc,
        )
        if (option) selected.push(option)
      })

      setSelectedOptions(selected)
      setInitialState({
        selectedOptions: selected,
        sortOrder: sortOrder,
        statusFilter: statusFilter,
      })

      // Show all filter options
      setResultOptions(filterOptions)
    }
  }, [filterOptions])

  useEffect(() => {
    const filteredResults = filterOptions.filter((option) =>
      option.label.toLowerCase().includes(query.toLowerCase()),
    )
    setResultOptions(filteredResults)
  }, [query, filterOptions])

  const handleSelectOption = (option: FilterOptions[number]) => {
    setSelectedOptions((prev) => [...prev, option])
    updateFilters(option, 'add')
  }

  const handleDeselectOption = (option: FilterOptions[number]) => {
    setSelectedOptions((prev) =>
      prev.filter(
        (opt) => !(opt.label === option.label && opt.type === option.type),
      ),
    )
    updateFilters(option, 'remove')
  }

  const handleApplyFilters = async () => {
    await applyFiltersAndSort()
    router.back()
  }

  const handleResetAll = () => {
    setSelectedOptions([])
    setSortOrder('desc')
    setStatusFilter('all')
    setResultOptions(filterOptions)
    clearFilters()
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'tags':
        return 'Tag'
      case 'workoutNames':
        return 'Workout'
      case 'exerciseNames':
        return 'Exercise'
      case 'locations':
        return 'Location'
      default:
        return type
    }
  }

  const getTypeBgColor = (type: string) => {
    switch (type) {
      case 'tags':
        return 'bg-blue/10 '
      case 'workoutNames':
        return 'bg-orange/10'
      case 'exerciseNames':
        return 'bg-green/10'
      case 'locations':
        return 'bg-red/10'
      default:
        return 'bg-light-grayPrimary dark:bg-dark-grayPrimary'
    }
  }

  const getTypeTextColor = (type: string) => {
    switch (type) {
      case 'tags':
        return Colors.blue
      case 'workoutNames':
        return Colors.orange
      case 'exerciseNames':
        return Colors.green
      case 'locations':
        return Colors.red
      default:
        return theme.grayText
    }
  }

  const hasWorkoutNameSelected = selectedOptions.some(
    (opt) => opt.type === 'workoutNames',
  )

  const renderedResultOptions = resultOptions.map((option) => {
    const isSelected = selectedOptions.some(
      (sel) => sel.label === option.label && sel.type === option.type,
    )
    const isDisabled =
      isSelected || (option.type === 'workoutNames' && hasWorkoutNameSelected)

    return (
      <View
        key={`${option.type}-${option.label}`}
        style={tw`border-b border-light-grayBorder dark:border-dark-grayBorder`}
      >
        <Pressable
          style={tw`justify-between flex-row px-4 py-3 items-center ${isDisabled ? 'opacity-40' : ''}`}
          onPress={() => !isDisabled && handleSelectOption(option)}
          disabled={isDisabled}
        >
          <View style={tw`flex-row items-center gap-2 flex-1`}>
            <Txt
              numberOfLines={1}
              twcn="text-sm flex-1"
            >
              {option.label}
            </Txt>
            <View
              style={tw`px-2 py-0.5 rounded-full ${getTypeBgColor(option.type)}`}
            >
              <Txt
                twcn={`text-xs text-[${getTypeTextColor(option.type)}] dark:text-[${getTypeTextColor(option.type)}]`}
              >
                {getTypeLabel(option.type)}
              </Txt>
            </View>
          </View>
          <Txt twcn="text-light-grayText dark:text-dark-grayText ml-2">
            {option.used}
          </Txt>
        </Pressable>
      </View>
    )
  })

  const renderedSelectedOptions = selectedOptions.map((option) => (
    <Pressable
      key={`${option.type}-${option.label}`}
      onPress={() => handleDeselectOption(option)}
      hitSlop={12}
      style={tw`flex-row items-center gap-2 px-3 py-1 ${getTypeBgColor(option.type)} rounded-full`}
    >
      <Txt
        twcn={`text-xs text-[${getTypeTextColor(option.type)}] dark:text-[${getTypeTextColor(option.type)}]`}
      >
        {option.label}
      </Txt>
      <SFIcon
        name="xmark"
        size={12}
        color={getTypeTextColor(option.type)}
      />
    </Pressable>
  ))

  return loading ? (
    <Spinner />
  ) : (
    <SafeView
      scroll={false}
      keyboardAvoiding
      twcnContentView="mb-0"
    >
      {/* Sticky Header */}
      <View style={tw`pb-2 bg-light-background dark:bg-dark-background`}>
        {selectedOptions.length > 0 && (
          <View
            style={tw`flex-row flex-wrap -mx-4 border-b border-light-grayBorder dark:border-dark-grayBorder pb-2 px-4 items-center gap-1`}
          >
            {renderedSelectedOptions}
          </View>
        )}
      </View>

      <ScrollView
        style={tw`flex-1 -mx-4`}
        contentContainerStyle={tw`flex-grow pb-12`}
      >
        {renderedResultOptions}
      </ScrollView>
    </SafeView>
  )
}

export default WorkoutFilters
