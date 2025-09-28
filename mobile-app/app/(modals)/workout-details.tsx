import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { useNavigation } from 'expo-router'

const WorkoutDetails = () => {
  const navigation = useNavigation()

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Workout Details',
    })
  }, [navigation])

  return (
    <View>
      <Text>WorkoutDetails</Text>
    </View>
  )
}

export default WorkoutDetails

const styles = StyleSheet.create({})
