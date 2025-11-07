import {
  View,
  ScrollView,
  Image,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native'
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

const features = [
  {
    title: 'Intuitive Workout Logging',
    description: 'Log workouts, sets, reps, weights, and much more with ease',
    image: require('../assets/screenshots/Workout Form - for in app.png'),
  },
  {
    title: 'Visualize Your Journey',
    description:
      'Visualize your consistency and progress through data & charts',
    image: require('../assets/screenshots/Home Screen – for in app.png'),
  },
  {
    title: 'Every Single Workout',
    description: 'Every detail of your workout history at your fingertips',
    image: require('../assets/screenshots/Workout Details - for in app.png'),
  },
  {
    title: 'Exercise Library',
    description: 'Customize exercises and monitor progress over time',
    image: require('../assets/screenshots/Exercise Details - for in app.png'),
  },
  {
    title: 'Training Notebook',
    description:
      'Document your fitness journey by recording everything outside your sets',
    image: require('../assets/screenshots/Notebook Entries - for in app.png'),
  },
]

const Auth = () => {
  const { signIn, authUser, isLoading } = useAuth()
  const { width } = useWindowDimensions()
  const scrollViewRef = useRef<ScrollView>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollingRef = useRef(false)

  // Triple the features for infinite scrolling
  const infiniteFeatures = [...features, ...features, ...features]

  useFocusEffect(
    useCallback(() => {
      if (!authUser && !isLoading) {
        SplashScreen.hideAsync()
      }
    }, [authUser, isLoading])
  )

  useEffect(() => {
    // Start at the middle set of features
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: width * features.length,
          animated: false,
        })
      }, 0)
    }
  }, [width])

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x
    const index = Math.round(scrollPosition / width)
    const realIndex = index % features.length
    setActiveIndex(realIndex)

    // Reset scroll position when reaching the end or start
    if (!scrollingRef.current) {
      scrollingRef.current = true
      if (index >= features.length * 2) {
        // At end, jump back to middle
        scrollViewRef.current?.scrollTo({
          x: width * features.length,
          animated: false,
        })
      } else if (index < features.length) {
        // At start, jump forward to middle
        scrollViewRef.current?.scrollTo({
          x: width * (features.length + realIndex),
          animated: false,
        })
      }
      setTimeout(() => {
        scrollingRef.current = false
      }, 50)
    }
  }

  return isLoading ? (
    <Spinner />
  ) : (
    <SafeView
      scroll={false}
      hasHeader={false}
      twcnContentView="px-0 pb-0"
    >
      <View
        style={tw`flex-1 justify-between gap-4 mb-6 dark:bg-dark-background bg-light-background`}
      >
        {/* Logo */}
        <View style={tw`items-center pt-6`}>
          <View
            style={{
              height: 50,
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

        {/* Feature Carousel */}
        <View style={tw`flex-1`}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            bounces={false}
          >
            {infiniteFeatures.map((feature, index) => (
              <View
                key={`${feature.title}-${index}`}
                style={[
                  tw`items-center justify-center px-8`,
                  { width, flex: 1 },
                ]}
              >
                <View
                  style={tw`flex-1 w-full items-center justify-center mb-6`}
                >
                  <Image
                    source={feature.image}
                    style={{
                      width: width * 0.55,
                      height: '85%',
                    }}
                    resizeMode="contain"
                  />
                </View>
                <View style={tw`mb-4`}>
                  <Txt twcn="text-xl font-poppinsSemiBold text-center mb-2">
                    {feature.title}
                  </Txt>
                  <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText text-center px-6">
                    {feature.description}
                  </Txt>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Pagination Dots */}
          <View style={tw`flex-row justify-center items-center gap-2 mt-2`}>
            {features.map((_, index) => (
              <View
                key={index}
                style={[
                  tw`rounded-full`,
                  {
                    width: activeIndex === index ? 24 : 8,
                    height: 8,
                    backgroundColor:
                      activeIndex === index
                        ? Colors.primary
                        : Colors.light.grayBorder,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Buttons Section */}
        <View style={tw`mt-6`}>
          {/* Sign In Buttons */}
          <View style={tw`items-center flex-col gap-2 px-4`}>
            <SignInWithGoogle onPress={signIn} />
            <SignInWithAppleIos />
          </View>

          {/* Terms */}
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
      </View>
    </SafeView>
  )
}

export default Auth
