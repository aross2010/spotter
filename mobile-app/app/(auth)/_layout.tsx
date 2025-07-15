import { Pressable } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useRouter } from 'expo-router'

const AuthLayout = () => {
  const router = useRouter()

  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        animation: 'none',
        headerShown: true,
        headerStyle: {
          backgroundColor: 'transparent',
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: 'Geologica_700Bold',
          fontSize: 28,
          color: '#807BCF',
        },
        headerLeft: () => (
          <Pressable
            onPress={() => {
              router.back()
            }}
          >
            <ArrowLeft
              color={'#807BCF'}
              height={32}
              width={32}
            />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen
        name="signin"
        options={{
          title: 'Sign In',
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Sign Up',
        }}
      />
    </Stack>
  )
}

export default AuthLayout
