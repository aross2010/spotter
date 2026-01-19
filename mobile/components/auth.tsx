import { View, ScrollView, useWindowDimensions } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import SafeView from './safe-view'
import { useAuth } from '../context/auth-context'
import SignInWithGoogle from './sign-in-google'
import { SignInWithAppleIos } from './sign-in-apple.ios'
import TextLogo from '../assets/spotter-text-logo.svg'
import Colors from '../constants/colors'
import tw from '../tw'
import { Link, SplashScreen, useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import Txt from './text'
import { BASE_URL } from '../constants/auth'
import Spinner from './activity-indicator'
import FeatureCarousel from './feature-carousel'

const Auth = () => {
  const { signIn, authUser, isLoading } = useAuth()

  useFocusEffect(
    useCallback(() => {
      if (!authUser && !isLoading) {
        setTimeout(() => {
          SplashScreen.hideAsync()
        }, 500)
      }
    }, [authUser, isLoading])
  )

  return (
    <SafeView
      scroll={false}
      hasHeader={false}
      twcnContentView={`px-0 pb-0 ${isLoading ? 'relative' : ''}`}
    >
      {isLoading && <Spinner overlay />}
      <View
        style={tw`flex-1 dark:bg-dark-background bg-light-background ${isLoading ? 'opacity-50' : ''}`}
      >
        {/* Logo section - fixed at top */}
        <View style={tw`items-center pt-6 pb-4`}>
          <View
            style={{
              height: 60,
              aspectRatio: 135 / 57,
            }}
          >
            <TextLogo
              width={'100%'}
              height={'100%'}
              color={Colors.primary}
            />
          </View>
        </View>

        {/* Carousel in the middle - takes available space */}
        <View style={tw`flex-1`}>
          <FeatureCarousel />
        </View>

        {/* Auth buttons section - fixed at bottom */}
        <View style={tw`pb-8`}>
          <View style={tw`items-center flex-col gap-2 px-4`}>
            <SignInWithGoogle
              onPress={signIn}
              disabled={isLoading}
            />
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
              and our{' '}
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
      </View>
    </SafeView>
  )
}

export default Auth
