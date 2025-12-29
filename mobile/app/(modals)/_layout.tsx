import { router, Stack, useNavigation } from 'expo-router'
import useTheme from '../hooks/theme'
import Button from '../../components/button'
import tw from '../../tw'
import { View } from 'react-native'

export default function ModalLayout() {
  const { theme, colorScheme } = useTheme()

  return (
    <View style={tw`flex-1 bg-background dark:bg-dark-background`}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerTransparent: true,
          headerShadowVisible: false,
          headerLargeTitle: true,
          headerTitleStyle: {
            color: theme.text,
            fontWeight: 600,
          },
          headerLargeTitleStyle: {
            color: theme.text,
            fontWeight: '600',
          },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen
          name="settings"
          options={{
            headerShown: false, // defined in settings/_layout.tsx
          }}
        />
        <Stack.Screen
          name="notebook-entry-form"
          options={{
            title: '',
            headerLargeTitle: false,
            headerTransparent: false,
            headerStyle: {
              backgroundColor: theme.background,
            },
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
            title: '',
            // // headerLargeTitle: true,
            // headerTransparent: true,
            // headerTitleStyle: {
            //   color: theme.text,
            //   fontWeight: 600,
            // },
            // headerLargeTitleStyle: {
            //   color: theme.text,
            //   fontWeight: '600',
            // },
            headerStyle: {
              backgroundColor: theme.background,
            },

            headerSearchBarOptions: {
              onChangeText: (event: any) => {
                router.setParams({
                  q: event.nativeEvent.text,
                })
              },
              placeholder: 'Search or add tags...',
              shouldShowHintSearchIcon: true,
              placement: 'stacked',
              hideWhenScrolling: false,
              autoCapitalize: 'none',
              autoFocus: true,
            },
            headerLargeTitle: false,
            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="workout-form"
          options={{
            headerShown: false, // defined in workout-form/_layout.tsx
          }}
        />
        <Stack.Screen name="workout-details" />
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
    </View>
  )
}
