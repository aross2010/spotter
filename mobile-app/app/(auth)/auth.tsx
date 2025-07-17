import { StyleSheet, Text, View, Image, Pressable } from 'react-native'
import React, { useContext, useEffect } from 'react'
import { Link, Redirect, useRouter } from 'expo-router'
import SafeView from '../../components/safe-view'
import TextLogo from '../../components/text-logo'
import Button from '../../components/button'

const Auth = () => {
  return (
    <SafeView
      noHeader
      noScroll
    >
      <View className="mt-28 flex flex-row justify-center mb-8">
        <TextLogo color="#807BCF" />
      </View>
      <Text className="text-light-text text-2xl font-poppins text-center">
        progress simplified
      </Text>
      <View className="mt-auto items-center flex-col gap-4">
        <Link
          href="/signup"
          asChild
        >
          <Button
            textClassName="text-primary font-poppinsBold"
            className="w-full flex flex-row border border-primary rounded-full py-5 px-8 items-center justify-center"
          >
            Sign Up
          </Button>
        </Link>
        <Link
          href="/signin"
          asChild
        >
          <Button
            textClassName="text-dark-text font-poppinsBold"
            className="w-full flex flex-row bg-primary rounded-full py-5 px-8 items-center justify-center"
          >
            Sign In
          </Button>
        </Link>
      </View>
    </SafeView>
  )
}

export default Auth
