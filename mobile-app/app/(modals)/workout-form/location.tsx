import { StyleSheet, Text, View } from 'react-native'
import React, { useState, useEffect } from 'react'
import Txt from '../../../components/text'
import Input from '../../../components/input'
import Button from '../../../components/button'
import tw from '../../../tw'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import SafeView from '../../../components/safe-view'
import { capString } from '../../../functions/cap-string'
import { useWorkoutForm } from '../../../context/workout-form-context'

type UsedLocations = {
  id: number
  name: string
  used: number
}

// load after new workout form has been rendered
const usedLocations: UsedLocations[] = [
  { id: 1, name: 'Gym', used: 35 },
  { id: 2, name: 'Park', used: 21 },
  { id: 3, name: 'Home', used: 12 },
  { id: 4, name: 'Office', used: 2 },
  { id: 5, name: 'Other', used: 5 },
]

const LocationSelector = () => {
  const [locations, setLocations] = useState<UsedLocations[]>(usedLocations)
  const [locationResults, setLocationResults] = useState<UsedLocations[]>([])
  const [query, setQuery] = useState<string>('')
  const router = useRouter()
  const navigation = useNavigation()
  const { workoutData, updateWorkoutData } = useWorkoutForm()

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={() => handleSaveLocation(query)}
          hitSlop={12}
          accessibilityLabel="save selected location"
          twcnText="font-semibold text-primary dark:text-primary"
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
      setLocationResults(usedLocations)
    } else {
      const filtered = usedLocations.filter((location) =>
        location.name.toLowerCase().includes(query.toLowerCase())
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

  const renderedResults = locationResults.map(({ id, name, used }) => {
    return (
      <Button
        style={tw`border-b border-light-grayTertiary dark:border-dark-grayTertiary justify-between flex-row px-2 py-3 items-center`}
        key={id}
        onPress={() => {
          handleSaveLocation(name)
        }}
      >
        <Txt>{name}</Txt>
        <Txt>{used}</Txt>
      </Button>
    )
  })

  return (
    <SafeView>
      <Input
        noBorder
        value={query}
        onChange={(e) => setQuery(e.nativeEvent.text)}
        placeholder="Enter location..."
        onSubmitEditing={(e) => {
          const newLocation = e.nativeEvent.text
          handleSaveLocation(newLocation)
        }}
        returnKeyType="done"
      />

      <View
        style={tw`flex-col mt-2 border-t border-light-grayTertiary dark:border-dark-grayTertiary flex-1`}
      >
        {renderedResults}
      </View>
    </SafeView>
  )
}

export default LocationSelector
