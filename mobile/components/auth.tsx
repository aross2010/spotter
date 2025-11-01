import { View } from 'react-native'
import React, { useEffect } from 'react'
import SafeView from './safe-view'
import { useAuth } from '../context/auth-context'
import SignInWithGoogle from './sign-in-google'
import { SignInWithAppleIos } from './sign-in-apple.ios'
import TextLogo from '../assets/spotter-text-logo.svg'
import Colors from '../constants/colors'
import tw from '../tw'
import { Link, SplashScreen, useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { BackgroundDots } from './dots'
import Txt from './text'
import { BASE_URL } from '../constants/auth'
import Spinner from './activity-indicator'

const Auth = () => {
  const { signIn, authUser, isLoading } = useAuth()

  useFocusEffect(
    useCallback(() => {
      if (!authUser && !isLoading) {
        SplashScreen.hideAsync()
      }
    }, [authUser, isLoading])
  )

  return isLoading ? (
    <Spinner />
  ) : (
    <SafeView
      scroll={false}
      hasHeader={false}
      twcnContentView="px-0 pb-6"
    >
      <View
        style={tw`flex-1 justify-between dark:bg-dark-background bg-light-background`}
      >
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
            numDots={10}
            minSize={75}
            maxSize={100}
            speedMin={20}
            speedMax={30}
          />
        </View>
        <View style={tw`items-center flex-col gap-2 px-4`}>
          <SignInWithGoogle onPress={signIn} />
          <SignInWithAppleIos />
        </View>
        <View>
          <Txt twcn="text-center text-light-grayText dark:text-dark-grayText text-xs mt-2 px-12">
            By proceeding, you agree to the{' '}
            <Link
              href={`${BASE_URL}/terms`}
              style={tw`underline`}
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href={`${BASE_URL}/privacy`}
              style={tw`underline`}
            >
              Privacy Policy
            </Link>
            .
          </Txt>
        </View>
      </View>
    </SafeView>
  )
}

export default Auth
