import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const AuthLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerTitleAlign: 'center',
        animation: 'none',
        headerShown: false,
      }}
    />
  )
}

export default AuthLayout

const styles = StyleSheet.create({})
