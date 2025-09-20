import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import useTheme from '../../../hooks/theme'

const ExercisesLayout = () => {
  const { theme } = useTheme()

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: {
          fontFamily: 'poppins_600SemiBold',
          fontSize: 22,
          color: theme.text,
        },
        headerTitle: 'Exercises',
      }}
    />
  )
}

export default ExercisesLayout

const styles = StyleSheet.create({})
