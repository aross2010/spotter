import { Stack } from 'expo-router'

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="settings" />
      <Stack.Screen name="notebook-entry-form" />
      <Stack.Screen name="workout-form" />
      <Stack.Screen name="weight-form" />
    </Stack>
  )
}
