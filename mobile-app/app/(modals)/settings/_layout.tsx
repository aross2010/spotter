import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { router, Stack } from 'expo-router'
import Button from '../../../components/button'
import Colors from '../../../constants/colors'
import useTheme from '../../hooks/theme'
import tw from '../../../tw'

const SettingsLayout = () => {
  const { theme } = useTheme()

  return (
    <Stack
      screenOptions={{
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
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: 'Settings',
          headerRight: () => (
            <Button
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityLabel="close modal"
              twcnText={`font-poppinsSemiBold text-primary dark:text-primary`}
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
      <Stack.Screen
        name="version-history"
        options={{
          headerTitle: 'Version History',
        }}
      />
    </Stack>
  )
}

export default SettingsLayout

const styles = StyleSheet.create({})
