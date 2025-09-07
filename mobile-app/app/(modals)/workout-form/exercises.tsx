import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { useNavigation } from 'expo-router'
import { useLocalSearchParams } from 'expo-router'
import { capString } from '../../../functions/cap-string'

const Execises = () => {
  const navigation = useNavigation()
  const { exercises, name } = useLocalSearchParams()
  console.log(exercises, name)

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Exercises',
      headerBackTitle: name ? capString(name as string, 15) : 'Workout',
    })
  }, [name])

  return (
    <SafeView>
      <Txt>Exercices</Txt>
    </SafeView>
  )
}

export default Execises

const styles = StyleSheet.create({})
