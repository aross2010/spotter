import { StyleSheet, Text, View } from 'react-native'
import React, { useState, useEffect } from 'react'
import Txt from './text'
import Input from './input'
import Button from './button'
import tw from '../tw'

type LocationSelectorProps = {
  setLocation: (location: string) => void
  closeModal: () => void
}

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

const LocationSelector = ({
  setLocation,
  closeModal,
}: LocationSelectorProps) => {
  const [locations, setLocations] = useState<UsedLocations[]>(usedLocations)
  const [locationResults, setLocationResults] = useState<UsedLocations[]>([])
  const [query, setQuery] = useState<string>('')

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

  const renderedResults = locationResults.map(({ id, name, used }) => {
    return (
      <Button
        style={tw`border-b border-light-grayTertiary dark:border-dark-grayTertiary justify-between flex-row px-2 py-3 items-center`}
        key={id}
        onPress={() => {
          setLocation(name)
          closeModal()
        }}
      >
        <Txt>{name}</Txt>
        <Txt>{used}</Txt>
      </Button>
    )
  })

  return (
    <View style={tw`max-h-80`}>
      <Txt twcn="text-xl text-center font-semibold mb-4">Select Location</Txt>
      <Input
        noBorder
        value={query}
        onChange={(e) => setQuery(e.nativeEvent.text)}
        placeholder="Enter location..."
        onSubmitEditing={(e) => {
          const newLocation = e.nativeEvent.text
          setLocation(newLocation)
          setQuery('')
          closeModal()
        }}
        returnKeyType="done"
      />

      <View
        style={tw`flex-col mt-2 border-t border-light-grayTertiary dark:border-dark-grayTertiary flex-1`}
      >
        {renderedResults}
      </View>
    </View>
  )
}

export default LocationSelector

const styles = StyleSheet.create({})
