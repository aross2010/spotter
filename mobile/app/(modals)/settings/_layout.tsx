import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { router, Stack } from 'expo-router'
import Button from '../../../components/button'
import Colors from '../../../constants/colors'
import useTheme from '../../hooks/theme'

const SettingsLayout = () => {
  const { theme } = useTheme()

  return (
    <Stack
      screenOptions={{
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: 600,
          color: theme.text,
        },
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerBackTitleStyle: {
          fontSize: 16,
        },
        headerTitleAlign: 'left',
        headerTintColor: Colors.primary,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: 'Settings',
          headerLeft: () => (
            <Button
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityLabel="close modal"
              twcnText={`font-semibold text-primary dark:text-primary`}
              text="Close"
            />
          ),
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerTitle: 'Edit Profile',
        }}
      />
      <Stack.Screen
        name="linked-accounts"
        options={{
          headerTitle: 'Linked Accounts',
        }}
      />
      <Stack.Screen
        name="user-preferences"
        options={{
          headerTitle: 'Preferences',
        }}
      />
      <Stack.Screen
        name="faq"
        options={{
          headerTitle: 'FAQ',
        }}
      />
    </Stack>
  )
}

export default SettingsLayout

const styles = StyleSheet.create({})
