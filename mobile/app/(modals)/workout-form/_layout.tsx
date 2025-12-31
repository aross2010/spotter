import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { router, Stack } from 'expo-router'
import Button from '../../../components/button'
import Colors from '../../../constants/colors'
import useTheme from '../../hooks/theme'
import { WorkoutFormProvider } from '../../../context/workout-form-context'
import tw from '../../../tw'

const WorkoutFormLayout = () => {
  const { theme } = useTheme()

  return (
    <View style={tw`flex-1 bg-background dark:bg-dark-background`}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'New Workout',
            headerLargeTitle: true,
            headerTransparent: true,
            headerTitleStyle: {
              color: theme.text,
              fontWeight: 600,
            },
            headerLargeTitleStyle: {
              color: theme.text,
              fontWeight: '600',
            },
            headerBackButtonDisplayMode: 'minimal',
            // headerStyle: {
            //   backgroundColor: theme.background,
            // },
          }}
        />
        <Stack.Screen
          name="location"
          options={{
            headerTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerStyle: {
              backgroundColor: theme.background,
            },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="supersets"
          options={{
            headerTitle: 'Super Sets',
          }}
        />
        <Stack.Screen
          name="dropsets"
          options={{
            headerTitle: 'Create Drop Set',
          }}
        />
        <Stack.Screen
          name="notes"
          options={{
            headerTitle: '',
            headerBackButtonDisplayMode: 'minimal',
            headerStyle: {
              backgroundColor: theme.background,
            },
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </View>
  )
}

export default WorkoutFormLayout
