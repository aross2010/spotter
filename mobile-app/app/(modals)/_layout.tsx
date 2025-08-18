import { router, Stack } from 'expo-router'
import { Pressable } from 'react-native'
import Button from '../../components/button'

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
      }}
    >
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
        }}
      />
      <Stack.Screen
        name="notebook-entry-form"
        options={{
          title: 'Notebook Entry',
        }}
      />
      <Stack.Screen
        name="workout-form"
        options={{
          title: 'Workout',
        }}
      />
      <Stack.Screen
        name="weight-form"
        options={{
          title: 'Weight',
        }}
      />
    </Stack>
  )
}
