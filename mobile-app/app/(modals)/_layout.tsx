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
          presentation: 'fullScreenModal',
          headerShown: false,
          headerTitleStyle: {
            fontSize: 18,
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
      >
        <Stack.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerTitle: 'Settings',
            presentation: 'fullScreenModal',
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
                accessibilityLabel="save notebook entry"
                twcnText={`font-poppinsSemiBold text-primary dark:text-primary`}
                text="Save"
              />
            ),
            headerLeft: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="close notebook entry"
                twcnText={`font-poppinsSemiBold text-light-grayText dark:text-dark-grayText`}
                text="Cancel"
              />
            ),
            presentation: 'fullScreenModal',
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
                accessibilityLabel="close notebook entry"
                twcnText={`font-poppinsSemiBold text-light-grayText dark:text-dark-grayText`}
                text="Cancel"
              />
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
                twcnText={`font-poppinsSemiBold text-light-grayText dark:text-dark-grayText`}
                text="Cancel"
              />
            ),
            headerRight: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="save notebook entry"
                twcnText={`font-poppinsSemiBold text-primary dark:text-primary`}
                text="Save"
              />
            ),
          }}
        />
        <Stack.Screen
          name="workout-form"
          options={{
            title: 'Workout',
            headerTitle: 'New Workout',
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="workout-details"
          options={{
            title: 'Workout Details',
            presentation: 'fullScreenModal',
            headerTitleAlign: 'left',
            headerLeft: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="close workout details"
                twcnText={`font-poppinsSemiBold text-primary dark:text-primary`}
                text="Close"
              />
            ),
          }}
        />
      </Stack>
    </>
  )
}
