import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import TabWrapper from '../../components/tab-wrapper'
import { Link } from 'expo-router'

const SignIn = () => {
  return (
    <TabWrapper>
      <Text>SignIn</Text>
      <Link href="/dashboard">Sign In</Link>
    </TabWrapper>
  )
}

export default SignIn

const styles = StyleSheet.create({})
