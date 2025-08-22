import Toast from 'react-native-toast-message'
import React from 'react'
import { Stack } from 'expo-router'
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
import { AuthProvider } from '../context/auth-context'
import '../global.css'
import { toastConfig } from '../utils/toast'
import { useDeviceContext } from 'twrnc'
import tw from '../tw'
import ThemedStatusBar from '../components/status-bar'

const RootLayout = () => {
  useDeviceContext(tw, {
    observeDeviceColorSchemeChanges: false,
    initialColorScheme: 'device',
  })
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
    return <Loading visible />
  }

  return (
    <AuthProvider>
      <KeyboardProvider>
        <SafeAreaProvider>
          <ThemedStatusBar />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen
              name="index"
              options={{ animation: 'none' }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                animation: 'none',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(modals)"
              options={{
                presentation: 'modal',
              }}
            />
          </Stack>
        </SafeAreaProvider>
      </KeyboardProvider>
      <Toast config={toastConfig} />
    </AuthProvider>
  )
}

export default RootLayout
