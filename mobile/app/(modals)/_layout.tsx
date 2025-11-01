import { router, Stack, useNavigation } from 'expo-router'
import useTheme from '../hooks/theme'
import Button from '../../components/button'
import Colors from '../../constants/colors'

export default function ModalLayout() {
  const { theme, colorScheme } = useTheme()

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          headerTitleStyle: {
            fontSize: 20,
            fontFamily: 'Poppins_600SemiBold',
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
          }}
        />

        <Stack.Screen
          name="workout-details"
          options={{
            title: 'Workout Details',
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
        <Stack.Screen
          name="workout-filters"
          options={{
            title: 'Workout Filters',
            headerShown: true,
            headerTitle: 'Filter Workouts',
          }}
        />
        <Stack.Screen
          name="exercise-details"
          options={{
            title: 'Exercise',
          }}
        />
      </Stack>
    </>
  )
}
