import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { router, Stack } from 'expo-router'
import Button from '../../../components/button'
import Colors from '../../../constants/colors'
import useTheme from '../../hooks/theme'
import SFIcon from '../../../components/sf-icon'
import tw from '../../../tw'

const SettingsLayout = () => {
  const { theme } = useTheme()

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
          name="index"
          options={{
            title: 'Settings',
            headerLeft: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="close settings"
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
          name="profile"
          options={{
            title: 'Edit Profile',
            // use these for non scrollable screens
            headerTransparent: false,
            headerStyle: {
              backgroundColor: theme.background,
            },
          }}
        />
        <Stack.Screen
          name="linked-accounts"
          options={{
            title: 'Linked Accounts',
            // use these for non scrollable screens
            headerTransparent: false,
            headerStyle: {
              backgroundColor: theme.background,
            },
          }}
        />
        <Stack.Screen
          name="user-preferences"
          options={{
            title: 'Preferences',
          }}
        />
        <Stack.Screen
          name="faq"
          options={{
            title: 'FAQ',
            headerSearchBarOptions: {
              onChangeText: (event: any) => {
                router.setParams({ q: event.nativeEvent.text })
              },
              placeholder: 'Search FAQs...',
              shouldShowHintSearchIcon: true,
              placement: 'stacked',
              hideWhenScrolling: false,
              autoCapitalize: 'none',
              autoFocus: false,
            },
          }}
        />
      </Stack>
    </View>
  )
}

export default SettingsLayout

const styles = StyleSheet.create({})
