import { router, Stack } from 'expo-router'
import useTheme from '../../hooks/theme'
import ThemedStatusBar from '../../components/status-bar'
import Button from '../../components/button'
import Colors from '../../constants/colors'
import { X } from 'lucide-react-native'

export default function ModalLayout() {
  const { theme, colorScheme } = useTheme()

  return (
    <>
      <ThemedStatusBar override="light" />
      <Stack
        screenOptions={{
          presentation: 'modal',
          headerShown: false,
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
            headerLeft: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="close notebook entry"
              >
                <X
                  size={36}
                  color={theme.grayTertiary}
                />
              </Button>
            ),
          }}
        />

        <Stack.Screen
          name="notebook-filters"
          options={{
            title: 'Notebook Filters',
            headerTitle: 'Filter Entries',
            headerShown: true,
            headerLeft: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="close notebook filters"
              >
                <X
                  size={36}
                  color={theme.grayTertiary}
                />
              </Button>
            ),
          }}
        />
        <Stack.Screen
          name="tag-selector"
          options={{
            title: 'Tag Selector',
            headerTitle: 'Add Tags',
            headerShown: true,
            headerLeft: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="close notebook entry"
              >
                <X
                  size={36}
                  color={theme.grayText}
                />
              </Button>
            ),
            headerRight: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="save notebook entry"
              >
                <X
                  size={36}
                  color={Colors.primary}
                />
              </Button>
            ),
          }}
        />
        <Stack.Screen
          name="workout-form"
          options={{
            title: 'Workout',
            headerTitle: 'New Workout',
          }}
        />
      </Stack>
    </>
  )
}
