import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { router, Stack } from 'expo-router'
import Button from '../../../components/button'
import Colors from '../../../constants/colors'
import useTheme from '../../hooks/theme'
import tw from '../../../tw'
import { WorkoutFormProvider } from '../../../context/workout-form-context'

const WorkoutFormLayout = () => {
  const { theme } = useTheme()

  return (
    <WorkoutFormProvider>
      <Stack
        screenOptions={{
          headerTitleStyle: {
            fontSize: 18,
            fontFamily: 'Geologica_600SemiBold',
            color: theme.text,
          },
          headerBackButtonDisplayMode: 'default',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerBackTitleStyle: {
            fontSize: 16,
            fontFamily: 'Poppins_500Medium',
          },
          headerTintColor: Colors.primary,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerTitle: 'New Workout',
            headerRight: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="close modal"
                twcnText={`font-poppinsSemiBold text-primary dark:text-primary`}
                text="Close"
              />
            ),
            headerLeft: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="close workout form"
                twcnText={`font-poppinsSemiBold text-light-grayText dark:text-dark-grayText`}
                text="Cancel"
              />
            ),
          }}
        />
        <Stack.Screen
          name="location"
          options={{
            headerTitle: 'Select Location',
          }}
        />
        <Stack.Screen
          name="notes"
          options={{
            headerTitle: 'Workout Notes',
          }}
        />
      </Stack>
    </WorkoutFormProvider>
  )
}

export default WorkoutFormLayout
