import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { router, Stack } from 'expo-router'
import Button from '../../../components/button'
import Colors from '../../../constants/colors'
import useTheme from '../../../hooks/theme'
import { WorkoutFormProvider } from '../../../context/workout-form-context'
import { Check, X } from 'lucide-react-native'

const WorkoutFormLayout = () => {
  const { theme } = useTheme()

  return (
    <WorkoutFormProvider>
      <Stack
        screenOptions={{
          headerTitleStyle: {
            fontSize: 22,
            color: theme.text,
          },
          headerBackButtonDisplayMode: 'minimal',
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: Colors.primary,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerTitle: 'New Workout',
            headerLeft: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="close workout form"
              >
                <X
                  size={36}
                  color={theme.grayText}
                />
              </Button>
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
      </Stack>
    </WorkoutFormProvider>
  )
}

export default WorkoutFormLayout
