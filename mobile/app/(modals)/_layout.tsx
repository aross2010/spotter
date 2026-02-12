import { router, Stack, useNavigation } from 'expo-router'
import useTheme from '../hooks/theme'
import Button from '../../components/button'
import tw from '../../tw'
import { View } from 'react-native'
import SFIcon from '../../components/sf-icon'

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
            title: '',
            headerShown: true,
            headerTransparent: false,
            headerStyle: {
              backgroundColor: theme.background,
            },

            headerSearchBarOptions: {
              onChangeText: (event: any) => {
                router.setParams({
                  q: event.nativeEvent.text,
                })
              },
              placeholder: 'Search tags...',
              placement: 'stacked',
              hideWhenScrolling: false,
              autoCapitalize: 'none',
            },
            headerLargeTitle: false,
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
            headerLeft: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="close workout details"
                twcn="w-9 flex-row items-center justify-center h-full"
              >
                <SFIcon
                  name="xmark"
                  size={26}
                  color={theme.text}
                />
              </Button>
            ),
          }}
        />
        <Stack.Screen
          name="tag-selector"
          options={{
            title: '',
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
        <Stack.Screen name="bodyweight-overview" />
        <Stack.Screen
          name="workout-filters"
          options={{
            title: '',
            headerShown: true,
            headerTransparent: false,
            headerStyle: {
              backgroundColor: theme.background,
            },

            headerSearchBarOptions: {
              onChangeText: (event: any) => {
                router.setParams({
                  q: event.nativeEvent.text,
                })
              },
              placeholder: 'Search filters...',
              placement: 'stacked',
              hideWhenScrolling: false,
              autoCapitalize: 'none',
            },
            headerLargeTitle: false,
            headerBackButtonDisplayMode: 'minimal',
            headerShadowVisible: false,
            headerLeft: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="close workout details"
                twcn="w-9 flex-row items-center justify-center h-full"
              >
                <SFIcon
                  name="xmark"
                  size={26}
                  color={theme.text}
                />
              </Button>
            ),
          }}
        />
        <Stack.Screen
          name="exercise-details"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  )
}
