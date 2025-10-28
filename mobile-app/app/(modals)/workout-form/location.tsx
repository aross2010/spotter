import { View } from 'react-native'
import React, { useState, useEffect } from 'react'
import Txt from '../../../components/text'
import Input from '../../../components/input'
import Button from '../../../components/button'
import tw from '../../../tw'
import { useNavigation, useRouter } from 'expo-router'
import SafeView from '../../../components/safe-view'
import { capString } from '../../../functions/cap-string'
import { useWorkoutForm } from '../../../context/workout-form-context'
import { Search, X } from 'lucide-react-native'
import useTheme from '../../hooks/theme'

type UsedLocations = {
  location: string
  used: number
}

const LocationSelector = () => {
  const [locationResults, setLocationResults] = useState<UsedLocations[]>([])
  const [query, setQuery] = useState<string>('')
  const router = useRouter()
  const navigation = useNavigation()
  const { workoutData, updateWorkoutData, locations } = useWorkoutForm()
  const { theme } = useTheme()

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={() => handleSaveLocation(query)}
          hitSlop={12}
          accessibilityLabel="save selected location"
          twcnText="font-poppinsSemiBold text-primary dark:text-primary"
          text="Save"
        />
      ),
      headerBackTitle: workoutData.name
        ? capString(workoutData.name, 15)
        : 'Workout',
    })
  }, [navigation, workoutData.name, query])

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
  }, [query])

  const handleSaveLocation = (location: string) => {
    updateWorkoutData({ location })
    if (router.canGoBack()) {
      router.back()
    }
  }

  const renderedResults = locationResults.map(({ location, used }) => {
    return (
      <Button
        style={tw`border-b border-light-grayBorder dark:border-dark-grayBorder justify-between flex-row px-4 py-3 items-center`}
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
      <View
        style={tw`px-3 mx-4 mb-2 h-10 border border-light-grayBorder dark:border-dark-grayBorder rounded-xl flex-row items-center justify-between gap-2 bg-white`}
      >
        <Search
          size={16}
          color={theme.grayText}
        />
        <Input
          autoCorrect={false}
          twcnInput="flex-1"
          autoCapitalize="none"
          placeholder={'Search locations...'}
          value={query}
          onChange={(e) => setQuery(e.nativeEvent.text)}
          returnKeyType="done"
          onSubmitEditing={(e) => {
            const newLocation = e.nativeEvent.text
            handleSaveLocation(newLocation)
          }}
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

      <View>{renderedResults}</View>
    </SafeView>
  )
}

export default LocationSelector
