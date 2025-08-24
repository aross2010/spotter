import { router, Stack } from 'expo-router'
import useTheme from '../hooks/theme'
import ThemedStatusBar from '../../components/status-bar'
import Button from '../../components/button'
import Colors from '../../constants/colors'

export default function ModalLayout() {
  const { theme, colorScheme } = useTheme()

  return (
    <>
      <ThemedStatusBar override="light" />
      <Stack
        screenOptions={{
          presentation: 'modal',
          headerShown: false,
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
            headerTitle: 'Notebook Entry',
            headerShown: true,
            headerRight: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="close modal"
                twcnText={`font-poppinsSemiBold text-primary dark:text-primary`}
                text="Close"
              />
            ),
            headerTitleStyle: {
              fontSize: 20,
              fontFamily: 'Poppins_600SemiBold',
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
