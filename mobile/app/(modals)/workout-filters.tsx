import { Alert, Pressable, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import tw from '../../tw'
import Button from '../../components/button'
import {
  CalendarArrowDown,
  CalendarArrowUp,
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
  } = useWorkout()

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [resultOptions, setResultOptions] = useState<FilterOptions>([])
  const [selectedOptions, setSelectedOptions] = useState<FilterOptions>([])
  const [initialState, setInitialState] = useState<{
    selectedOptions: FilterOptions
    sortOrder: 'asc' | 'desc'
  }>({
    selectedOptions: [],
    sortOrder: 'desc',
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
    return filtersChanged || sortOrderChanged
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
  }

  useEffect(() => {
    const changesExist = hasChanges()
    navigation.setOptions({
      headerRight: () => {
        return (
          <Button
            onPress={changesExist ? handleApplyFilters : undefined}
            hitSlop={12}
            accessibilityLabel="apply filters and sort method"
            twcnText={`font-poppinsSemiBold text-primary dark:text-primary`}
            text={isLoading ? 'Applying...' : 'Apply'}
            disabled={!changesExist || isLoading}
          />
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
    })
  }, [navigation, selectedOptions, sortOrder, initialState, isLoading])

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
      })

      // Filter out selected options from results and maintain original order
      const available = filterOptions.filter(
        (opt) =>
          !selected.some(
            (sel) => sel.label === opt.label && sel.type === opt.type
          )
      )
      setResultOptions(available)
    }
  }, [filterOptions])

  const handleChange = (text: string) => {
    setQuery(text)
    const filteredResults = filterOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(text.toLowerCase()) &&
        !selectedOptions.some(
          (sel) => sel.label === option.label && sel.type === option.type
        )
    )
    setResultOptions(filteredResults)
  }

  const handleSelectOption = (option: FilterOptions[number]) => {
    setSelectedOptions((prev) => [...prev, option])
    setResultOptions((prev) =>
      prev.filter(
        (opt) => !(opt.label === option.label && opt.type === option.type)
      )
    )
    updateFilters(option, 'add')
  }

  const handleDeselectOption = (option: FilterOptions[number]) => {
    setSelectedOptions((prev) =>
      prev.filter(
        (opt) => !(opt.label === option.label && opt.type === option.type)
      )
    )

    setResultOptions((prev) => {
      const newResults = [...prev, option]
      // Sort by original filterOptions order
      return newResults.sort(
        (a, b) =>
          filterOptions.findIndex(
            (opt) => opt.label === a.label && opt.type === a.type
          ) -
          filterOptions.findIndex(
            (opt) => opt.label === b.label && opt.type === b.type
          )
      )
    })
    updateFilters(option, 'remove')
  }

  const handleApplyFilters = async () => {
    await applyFiltersAndSort()
    router.back()
  }

  const handleResetAll = () => {
    setSelectedOptions([])
    setSortOrder('desc')
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
        return 'bg-blue/20'
      case 'workoutNames':
        return 'bg-orange/20'
      case 'exerciseNames':
        return 'bg-green/20'
      case 'locations':
        return 'bg-red/20'
      default:
        return 'bg-light-grayPrimary dark:bg-dark-grayPrimary'
    }
  }

  const getTypeTextColor = (type: string) => {
    switch (type) {
      case 'tags':
        return 'text-blue'
      case 'workoutNames':
        return 'text-orange'
      case 'exerciseNames':
        return 'text-green'
      case 'locations':
        return 'text-red'
      default:
        return 'text-light-grayText dark:text-dark-grayText'
    }
  }

  const hasWorkoutNameSelected = selectedOptions.some(
    (opt) => opt.type === 'workoutNames'
  )

  const renderedResultOptions = resultOptions.map((option) => {
    const isDisabled = option.type === 'workoutNames' && hasWorkoutNameSelected

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
              style={tw`px-2 py-0.5 rounded-xl ${getTypeBgColor(option.type)}`}
            >
              <Txt twcn={`text-xs ${getTypeTextColor(option.type)}`}>
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
      style={tw`flex-row items-center gap-2 px-2 py-1 ${getTypeBgColor(option.type)} rounded-xl`}
    >
      <Txt twcn={`text-xs ${getTypeTextColor(option.type)}`}>
        {option.label}
      </Txt>
    </Pressable>
  ))

  return loading ? (
    <Spinner />
  ) : (
    <SafeView
      twcnContentView="px-0"
      keyboardAvoiding
    >
      <View style={tw`flex-row justify-between items-center px-4 gap-4 mb-2`}>
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
          <Button onPress={() => setQuery('')}>
            <X
              size={16}
              color={theme.grayText}
            />
          </Button>
        </View>
        <View style={tw`flex-row items-center gap-2`}>
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
        </View>
      </View>

      {selectedOptions.length > 0 && (
        <View
          style={tw`flex-row flex-wrap border-b border-light-grayBorder dark:border-dark-grayBorder pb-2 items-center gap-1 pt-2 px-4`}
        >
          {renderedSelectedOptions}
        </View>
      )}

      <View>{renderedResultOptions}</View>
    </SafeView>
  )
}

export default WorkoutFilters
