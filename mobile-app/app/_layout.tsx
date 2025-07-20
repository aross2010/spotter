import { StyleSheet, Text } from 'react-native'
import React from 'react'
import { Slot, Stack } from 'expo-router'
import { useFonts } from 'expo-font'
import {
  Poppins_100Thin,
  Poppins_100Thin_Italic,
  Poppins_200ExtraLight,
  Poppins_200ExtraLight_Italic,
  Poppins_300Light,
  Poppins_300Light_Italic,
  Poppins_400Regular,
  Poppins_400Regular_Italic,
  Poppins_500Medium,
  Poppins_500Medium_Italic,
  Poppins_600SemiBold,
  Poppins_600SemiBold_Italic,
  Poppins_700Bold,
  Poppins_700Bold_Italic,
  Poppins_800ExtraBold,
  Poppins_800ExtraBold_Italic,
  Poppins_900Black,
  Poppins_900Black_Italic,
} from '@expo-google-fonts/poppins'
import { KeyboardProvider } from 'react-native-keyboard-controller'

import {
  Geologica_100Thin,
  Geologica_200ExtraLight,
  Geologica_300Light,
  Geologica_400Regular,
  Geologica_500Medium,
  Geologica_600SemiBold,
  Geologica_700Bold,
  Geologica_800ExtraBold,
  Geologica_900Black,
} from '@expo-google-fonts/geologica'

import Loading from '../components/loading'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from '../utils/auth-context'
import '../global.css'
import { StatusBar } from 'expo-status-bar'

const RootLayout = () => {
  const [fontsLoaded] = useFonts({
    Poppins_100Thin,
    Poppins_100Thin_Italic,
    Poppins_200ExtraLight,
    Poppins_200ExtraLight_Italic,
    Poppins_300Light,
    Poppins_300Light_Italic,
    Poppins_400Regular,
    Poppins_400Regular_Italic,
    Poppins_500Medium,
    Poppins_500Medium_Italic,
    Poppins_600SemiBold,
    Poppins_600SemiBold_Italic,
    Poppins_700Bold,
    Poppins_700Bold_Italic,
    Poppins_800ExtraBold,
    Poppins_800ExtraBold_Italic,
    Poppins_900Black,
    Poppins_900Black_Italic,
    Geologica_100Thin,
    Geologica_200ExtraLight,
    Geologica_300Light,
    Geologica_400Regular,
    Geologica_500Medium,
    Geologica_600SemiBold,
    Geologica_700Bold,
    Geologica_800ExtraBold,
    Geologica_900Black,
  })

  if (!fontsLoaded) {
    return <Loading />
  }

  return (
    <AuthProvider>
      <KeyboardProvider>
        <SafeAreaProvider>
          <StatusBar />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{
                animation: 'none',
              }}
            />
            <Stack.Screen
              name="(auth)"
              options={{ animation: 'none' }}
            />
          </Stack>
        </SafeAreaProvider>
      </KeyboardProvider>
    </AuthProvider>
  )
}

export default RootLayout
