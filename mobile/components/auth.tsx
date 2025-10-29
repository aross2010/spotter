import { View } from 'react-native'
import React from 'react'
import SafeView from './safe-view'
import { useAuth } from '../context/auth-context'
import SignInWithGoogle from './sign-in-google'
import { SignInWithAppleIos } from './sign-in-apple.ios'
import TextLogo from '../assets/spotter-text-logo.svg'
import Colors from '../constants/colors'
import { BackgroundDots } from './dots'
import tw from '../tw'
import { SplashScreen } from 'expo-router'

SplashScreen.hide()

const Auth = () => {
  const { signIn } = useAuth()
  return (
    <SafeView
      scroll={false}
      hasHeader={false}
    >
      <View style={tw`flex-1 justify-between`}>
        <View style={tw`flex-1 flex-col items-center relative`}>
          <View
            style={{
              height: 80,
              aspectRatio: 135 / 57,
              marginBottom: 12,
              marginTop: 144,
            }}
          >
            <TextLogo
              width={'100%'}
              height={'100%'}
              color={Colors.primary}
            />
          </View>

          <BackgroundDots
            numDots={20}
            minSize={20}
            maxSize={50}
            speedMin={15}
            speedMax={30}
          />
        </View>
        <View style={tw`items-center flex-col gap-2`}>
          <SignInWithGoogle onPress={signIn} />
          <SignInWithAppleIos />
        </View>
      </View>
    </SafeView>
  )
}

export default Auth
