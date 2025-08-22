import { router, Stack } from 'expo-router'
import useTheme from '../hooks/theme'
import ThemedStatusBar from '../../components/status-bar'

export default function ModalLayout() {
  const { theme, colorScheme } = useTheme()

  return (
    <>
      <ThemedStatusBar override="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'modal',
          headerStyle: {
            backgroundColor: theme.background,
          },
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
    </>
  )
}
