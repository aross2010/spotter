import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack, useNavigation } from 'expo-router'
import Button from '../../../components/button'
import { router } from 'expo-router'
import useTheme from '../../hooks/theme'
import Colors from '../../../constants/colors'

const ExerciseDetailsLayout = () => {
  const { theme } = useTheme()

  return (
    <Stack
      screenOptions={{
        headerTitleStyle: {
          fontSize: 18,
          fontFamily: 'Poppins_600SemiBold',
          color: theme.text,
        },
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerBackTitleStyle: {
          fontSize: 16,
          fontFamily: 'Poppins_500Medium',
        },
        headerTitleAlign: 'left',
        headerTintColor: Colors.primary,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '',
          headerLeft: () => (
            <Button
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityLabel="close exercise details"
              twcnText={`font-poppinsSemiBold text-primary dark:text-primary`}
              text="Close"
            />
          ),
        }}
      />
      <Stack.Screen
        name="form"
        options={{
          title: 'Edit Exercise',
          headerTitle: 'Edit Exercise',
          headerShown: true,
        }}
      />
    </Stack>
  )
}

export default ExerciseDetailsLayout

const styles = StyleSheet.create({})
