import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import useTheme from '../../../hooks/theme'

const WorkoutLayout = () => {
  const { theme } = useTheme()

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerStyle: { backgroundColor: theme.background },
        headerTitleStyle: {
          fontSize: 22,
          color: theme.text,
        },
        headerTitle: 'Workouts',
      }}
    />
  )
}

export default WorkoutLayout

const styles = StyleSheet.create({})
