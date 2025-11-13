import { Alert, Keyboard, Pressable, ScrollView, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import tw from '../../tw'
import Button from '../../components/button'
import {
  CalendarArrowDown,
  CalendarArrowUp,
  Circle,
  CircleCheck,
  CircleDot,
  Layers,
  RotateCcw,
  Search,
  X,
} from 'lucide-react-native'
import Colors from '../../constants/colors'
import useTheme from '../hooks/theme'
import { useWorkout, FilterOptions } from '../../context/workout-context'
import Input from '../../components/input'
import Spinner from '../../components/activity-indicator'
import { router, useNavigation } from 'expo-router'
import MyModal from '../../components/modal'

const statusOptions = [
  {
    value: 'all' as const,
    label: 'All',
    icon: Layers,
  },
  {
    value: 'completed' as const,
    label: 'Completed',
    icon: CircleCheck,
  },
  {
    value: 'planned' as const,
    label: 'Planned',
    icon: Circle,
  },
  {
    value: 'active' as const,
    label: 'Active',
    icon: CircleDot,
  },
]

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

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [resultOptions, setResultOptions] = useState<FilterOptions>([])
  const [selectedOptions, setSelectedOptions] = useState<FilterOptions>([])
  const [showStatusMenu, setShowStatusMenu] = useState(false)
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
              initial.label === option.label && initial.type === option.type
          )
      )
    const sortOrderChanged = sortOrder !== initialState.sortOrder
    const statusFilterChanged = statusFilter !== initialState.statusFilter
    return filtersChanged || sortOrderChanged || statusFilterChanged
  }

  const resetState = () => {
    initialState.selectedOptions.forEach((option) => {
      if (
        !selectedOptions.some(
          (sel) => sel.label === option.label && sel.type === option.type
        )
      ) {
        updateFilters(option, 'add')
      }
    })
    selectedOptions.forEach((option) => {
      if (
        !initialState.selectedOptions.some(
          (init) => init.label === option.label && init.type === option.type
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
          <View style={tw`flex-row items-center gap-2`}>
            {!isLoading && (
              <Button
                onPress={() => setShowStatusMenu(true)}
                hitSlop={12}
                twcn="p-1.5 rounded-xl bg-primary/10"
              >
                {(() => {
                  const StatusIcon = statusOptions.find(
                    (opt) => opt.value === (statusFilter || 'all')
                  )?.icon
                  return StatusIcon ? (
                    <StatusIcon
                      size={16}
                      color={Colors.primary}
                    />
                  ) : null
                })()}
              </Button>
            )}
            <Button
              onPress={changesExist ? handleApplyFilters : undefined}
              hitSlop={12}
              accessibilityLabel="apply filters and sort method"
              twcnText={`font-poppinsSemiBold text-primary dark:text-primary`}
              text={isLoading ? 'Applying...' : 'Apply'}
              disabled={!changesExist || isLoading}
            />
          </View>
        )
      },
      headerLeft: () => (
        <Button
          onPress={() => {
            resetState()
            router.back()
          }}
          hitSlop={12}
          accessibilityLabel="close workout filters"
          twcnText={`font-poppinsSemiBold text-light-grayText dark:text-dark-grayText`}
          text="Cancel"
        />
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
          (opt) => opt.type === 'tags' && opt.label === tag
        )
        if (option) selected.push(option)
      })

      filters.workoutNames.forEach((name) => {
        const option = filterOptions.find(
          (opt) => opt.type === 'workoutNames' && opt.label === name
        )
        if (option) selected.push(option)
      })

      filters.exerciseNames.forEach((name) => {
        const option = filterOptions.find(
          (opt) => opt.type === 'exerciseNames' && opt.label === name
        )
        if (option) selected.push(option)
      })

      filters.locations.forEach((loc) => {
        const option = filterOptions.find(
          (opt) => opt.type === 'locations' && opt.label === loc
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

  const handleChange = (text: string) => {
    setQuery(text)
    const filteredResults = filterOptions.filter((option) =>
      option.label.toLowerCase().includes(text.toLowerCase())
    )
    setResultOptions(filteredResults)
  }

  const handleSelectOption = (option: FilterOptions[number]) => {
    setSelectedOptions((prev) => [...prev, option])
    updateFilters(option, 'add')
  }

  const handleDeselectOption = (option: FilterOptions[number]) => {
    setSelectedOptions((prev) =>
      prev.filter(
        (opt) => !(opt.label === option.label && opt.type === option.type)
      )
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

  const handleStatusChange = (
    status: 'all' | 'completed' | 'planned' | 'active'
  ) => {
    setStatusFilter(status)
    setShowStatusMenu(false)
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
    (opt) => opt.type === 'workoutNames'
  )

  const renderedResultOptions = resultOptions.map((option) => {
    const isSelected = selectedOptions.some(
      (sel) => sel.label === option.label && sel.type === option.type
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
              style={tw`px-2 py-0.5 rounded-lg ${getTypeBgColor(option.type)}`}
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
      style={tw`flex-row items-center gap-2 px-3 py-1 ${getTypeBgColor(option.type)} rounded-lg`}
    >
      <Txt
        twcn={`text-xs text-[${getTypeTextColor(option.type)}] dark:text-[${getTypeTextColor(option.type)}]`}
      >
        {option.label}
      </Txt>
      <X
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
        <View style={tw`flex-row justify-between items-center gap-2 mb-2`}>
          <View
            style={tw`px-3 flex-1 h-10 border border-light-grayBorder dark:border-dark-grayBorder rounded-xl flex-row items-center justify-between gap-2 bg-white dark:bg-dark-grayPrimary`}
          >
            <Search
              size={16}
              color={theme.grayText}
            />
            <Input
              autoCorrect={false}
              twcnInput="flex-1"
              autoCapitalize="none"
              placeholder={'Search anything...'}
              value={query}
              onChange={(e) => handleChange(e.nativeEvent.text)}
              maxLength={50}
              autoFocus
            />
            <Button
              onPress={() => {
                if (query === '') Keyboard.dismiss()
                setQuery('')
              }}
            >
              <X
                size={16}
                color={theme.grayText}
              />
            </Button>
          </View>
          <View style={tw`flex-row items-center gap-1.5`}>
            <Button
              hitSlop={12}
              twcn={`${sortOrder != 'asc' ? 'bg-primary/10' : 'bg-primary'} rounded-xl p-2`}
              onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'desc' ? (
                <CalendarArrowDown
                  size={16}
                  color={Colors.primary}
                />
              ) : (
                <CalendarArrowUp
                  size={16}
                  color={'#FFFFFF'}
                />
              )}
            </Button>

            <Button
              hitSlop={12}
              onPress={handleResetAll}
              twcn="bg-primary/10 rounded-xl p-2"
            >
              <RotateCcw
                size={16}
                color={Colors.primary}
              />
            </Button>
          </View>
        </View>

        {selectedOptions.length > 0 && (
          <View
            style={tw`flex-row flex-wrap border-b border-light-grayBorder dark:border-dark-grayBorder pb-2 items-center gap-1 pt-2`}
          >
            {renderedSelectedOptions}
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={tw`flex-1 -mx-4`}
        contentContainerStyle={tw`flex-grow`}
      >
        {renderedResultOptions}
      </ScrollView>

      <MyModal
        isOpen={showStatusMenu}
        setIsOpen={setShowStatusMenu}
      >
        <Txt twcn="font-poppinsMedium mb-2">Workout Status</Txt>
        <View>
          {statusOptions.map((option) => {
            const isSelected = (statusFilter || 'all') === option.value
            const StatusIcon = option.icon

            return (
              <Button
                key={option.value}
                onPress={() => handleStatusChange(option.value)}
                twcn={`flex-row items-center gap-2 p-3 rounded-xl ${
                  isSelected ? 'bg-primary/10' : ''
                }`}
              >
                <StatusIcon
                  size={20}
                  color={isSelected ? Colors.primary : theme.text}
                />
                <Txt twcn="text-sm">{option.label}</Txt>
              </Button>
            )
          })}
        </View>
      </MyModal>
    </SafeView>
  )
}

export default WorkoutFilters
