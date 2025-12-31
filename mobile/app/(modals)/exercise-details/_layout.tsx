import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack, useNavigation } from 'expo-router'
import Button from '../../../components/button'
import { router } from 'expo-router'
import useTheme from '../../hooks/theme'
import Colors from '../../../constants/colors'
import SFIcon from '../../../components/sf-icon'
import tw from '../../../tw'

const ExerciseDetailsLayout = () => {
  const { theme } = useTheme()

  return (
    <View style={tw`flex-1 bg-background dark:bg-dark-background`}>
      <Stack
        screenOptions={{
          headerLargeTitle: true,
          headerTransparent: true,
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
            title: '',
            headerLeft: () => (
              <Button
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="close exercise details"
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
          name="form"
          options={{
            title: 'Edit Exercise',
            headerTitle: 'Edit Exercise',
            headerShown: true,
          }}
        />
      </Stack>
    </View>
  )
}

export default ExerciseDetailsLayout

const styles = StyleSheet.create({})
