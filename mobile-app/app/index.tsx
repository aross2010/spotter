import { StyleSheet, Text, View, Image, Pressable } from 'react-native'
import React, { useEffect } from 'react'
import { Link, useRouter } from 'expo-router'
import '../global.css'
import TabWrapper from '../components/tab-wrapper'

const Home = () => {
  const router = useRouter()
  const user = false

  useEffect(() => {
    if (user) router.replace('/dashboard')
  })

  return (
    <TabWrapper>
      <View className="mt-28" />
      <Text className="text-primary text-7xl font-bold text-center">lift</Text>
      <Text className="text-light-text text-2xl font-bold text-center">
        progress simplified
      </Text>
      <View className="mt-auto items-center mb-4 flex-col gap-4">
        <Link
          href="/signin"
          className="w-full flex flex-row bg-primary text-dark-text rounded-full py-4 px-8 items-center justify-center active:opacity-75 text-center text-lg font-bold"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="w-full flex flex-row border border-primary text-primary rounded-full py-4 px-8 items-center justify-center active:opacity-75 text-center text-lg font-bold"
        >
          Sign Up
        </Link>
      </View>
    </TabWrapper>
  )
}

export default Home

const styles = StyleSheet.create({})
