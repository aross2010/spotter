import { StyleSheet, Text, View } from 'react-native'
import React, { useState, useEffect } from 'react'
import Txt from '../../../components/text'
import Input from '../../../components/input'
import Button from '../../../components/button'
import tw from '../../../tw'
import { useNavigation, useRouter } from 'expo-router'
import SafeView from '../../../components/safe-view'
import { capString } from '../../../functions/cap-string'
import { useWorkoutForm } from '../../../context/workout-form-context'

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
        style={tw`border-b border-light-grayTertiary/50 dark:border-dark-grayTertiary/50 justify-between flex-row px-2 py-3 items-center`}
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
    <SafeView>
      <Input
        value={query}
        onChange={(e) => setQuery(e.nativeEvent.text)}
        placeholder="Enter location..."
        onSubmitEditing={(e) => {
          const newLocation = e.nativeEvent.text
          handleSaveLocation(newLocation)
        }}
        returnKeyType="done"
        maxLength={50}
        autoFocus
      />

      <View
        style={tw`flex-col border-t border-light-grayTertiary dark:border-dark-grayTertiary flex-1`}
      >
        {renderedResults}
      </View>
    </SafeView>
  )
}

export default LocationSelector
