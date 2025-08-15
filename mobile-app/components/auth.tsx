import { View } from 'react-native'
import React from 'react'
import SafeView from './safe-view'
import Txt from './text'
import { useAuth } from '../context/auth-context'
import SignInWithGoogle from './sign-in-google'
import { SignInWithAppleIos } from './sign-in-apple.ios'
import TextLogo from '../assets/spotter-text-logo.svg'
import Colors from '../constants/colors'
import { BackgroundDots } from './dots'

const Auth = () => {
  const { signIn } = useAuth()
  return (
    <SafeView
      noHeader
      noScroll
    >
      <View className="flex-1 justify-between">
        <View className="flex-1 flex-col items-center relative">
          <View
            style={{ height: 80, aspectRatio: 135 / 57 }}
            className="mb-4 mt-36"
          >
            <TextLogo
              width={'100%'}
              height={'100%'}
              color={Colors.primary}
            />
          </View>
          <Txt className="text-2xl font-poppinsMedium text-center">
            assisting your daily lifts
          </Txt>
          <BackgroundDots
            numDots={20}
            minSize={20}
            maxSize={50}
            speedMin={15}
            speedMax={30}
          />
        </View>
        <View className="items-center flex-col gap-4">
          <SignInWithAppleIos />
          <SignInWithGoogle onPress={signIn} />
        </View>
      </View>
    </SafeView>
  )
}

export default Auth
