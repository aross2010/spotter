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
          //   headerShown: true,
          //   headerShadowVisible: false,
          //   headerBackButtonDisplayMode: 'minimal',
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
            headerTitle: '',
            headerStyle: {
              backgroundColor: theme.background,
            },
            headerShadowVisible: false,
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
            // headerStyle: {
            //   backgroundColor: theme.background,
            // }, making white flash on screen transition

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

            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="workout-form"
          options={{
            headerShown: false,
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
    </View>
  )
}
