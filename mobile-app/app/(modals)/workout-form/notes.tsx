import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'
import { useNavigation } from 'expo-router'
import { useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { capString } from '../../../functions/cap-string'

const Notes = () => {
  const navigation = useNavigation()
  const { name } = useLocalSearchParams()

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: name ? capString(name as string, 15) : 'Workout',
    })
  }, [name])
  return (
    <SafeView>
      <Txt>Exercise Notes</Txt>
    </SafeView>
  )
}

export default Notes

const styles = StyleSheet.create({})
