import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { router, Stack } from 'expo-router'
import Button from '../../../components/button'
import Colors from '../../../constants/colors'
import useTheme from '../../hooks/theme'
import { WorkoutFormProvider } from '../../../context/workout-form-context'

const WorkoutFormLayout = () => {
  const { theme } = useTheme()

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Insights',
          // headerLargeTitle: true,
          // headerTransparent: true,
          // headerTitleStyle: {
          //   color: theme.text,
          //   fontWeight: 600,
          // },
          // headerLargeTitleStyle: {
          //   color: theme.text,
          //   fontWeight: '600',
          // },
        }}
      />
    </Stack>
  )
}

export default WorkoutFormLayout
