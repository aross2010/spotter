import { View } from 'react-native'
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import Txt from '../../../components/text'
import Button from '../../../components/button'
import tw from '../../../tw'
import { useNavigation, useRouter, useLocalSearchParams } from 'expo-router'
import SafeView from '../../../components/safe-view'
import { capString } from '../../../functions/cap-string'
import { useWorkoutForm } from '../../../context/workout-form-context'
import useTheme from '../../hooks/theme'
import SFIcon from '../../../components/sf-icon'
import Colors from '../../../constants/colors'

type UsedLocations = {
  location: string
  used: number
}

const LocationSelector = () => {
  const [locationResults, setLocationResults] = useState<UsedLocations[]>([])
  const searchBarRef = useRef(null)
  const { q } = useLocalSearchParams()
  const query = (q as string) || ''
  const router = useRouter()
  const navigation = useNavigation()
  const { workoutData, updateWorkoutData, locations } = useWorkoutForm()
  const { theme } = useTheme()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        onChangeText: (event: any) => {
          router.setParams({ q: event.nativeEvent.text })
        },
        placeholder: 'Search or add locations...',
        shouldShowHintSearchIcon: true,
        placement: 'stacked',
        hideWhenScrolling: false,
        autoCapitalize: 'none',
        autoFocus: true,
      },
    })
  }, [q])

  useEffect(() => {
    const timer = setTimeout(() => {
      // @ts-ignore
      searchBarRef?.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setLocationResults(locations)
  }, [locations])

  useEffect(() => {
    if (query.trim() === '') {
      setLocationResults(locations)
    } else {
      const filtered = locations.filter((l) =>
        l.location.toLowerCase().includes(query.toLowerCase())
      )
      setLocationResults(filtered)
    }
  }, [query, locations])

  const handleSaveLocation = (location: string) => {
    updateWorkoutData({ location })
    router.setParams({ q: '' })
    // @ts-ignore
    searchBarRef?.current?.setText('')
    if (router.canGoBack()) {
      router.back()
    }
  }

  const handleCreateNewLocation = () => {
    if (
      query.trim() === '' ||
      locations.find((loc) => loc.location === query.trim())
    ) {
      router.setParams({ q: '' })
      // @ts-ignore
      searchBarRef?.current?.setText('')
      return
    }

    handleSaveLocation(query.trim())
  }

  const showCreateOption =
    query.trim() !== '' &&
    !locations.find((loc) => loc.location === query.trim())

  const renderedResults = locationResults.map(({ location, used }) => {
    return (
      <Button
        style={tw`border-b border-light-grayBorder/50 dark:border-dark-grayBorder/50 justify-between flex-row px-4 py-3 items-center`}
        key={location}
        onPress={() => {
          handleSaveLocation(location)
        }}
      >
        <Txt>{location}</Txt>
        <Txt>{used}</Txt>
      </Button>
    )
  })

  return (
    <SafeView twcnContentView="px-0">
      {showCreateOption && (
        <Button
          style={tw`border-b border-light-grayBorder/50 dark:border-dark-grayBorder/50 flex-row gap-2 px-4 py-3 items-center`}
          onPress={handleCreateNewLocation}
        >
          <SFIcon
            name="plus.circle"
            size={18}
            color={Colors.green}
          />
          <Txt twcn="font-poppinsSemiBold">Create "{query.trim()}"</Txt>
        </Button>
      )}
      <View>{renderedResults}</View>
    </SafeView>
  )
}

export default LocationSelector
