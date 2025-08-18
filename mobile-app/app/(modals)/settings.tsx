import { View, Text, Pressable } from 'react-native'
import React from 'react'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'
import { router } from 'expo-router'

const Add = () => {
  return (
    <SafeView>
      <Pressable
        onPress={() => {
          console.log('Go back pressed, navigating to home.')
          router.back()
        }}
        className="p-4"
      >
        <Txt>Go Back</Txt>
      </Pressable>
      <Pressable
        onPress={() => {
          console.log('Go back pressed, navigating to home.')
          router.back()
        }}
        className="p-4"
      >
        <Txt>Go Back</Txt>
      </Pressable>
      <Pressable
        onPress={() => {
          console.log('Go back pressed, navigating to home.')
          router.back()
        }}
        className="p-4"
      >
        <Txt>Go Back</Txt>
      </Pressable>
    </SafeView>
  )
}

export default Add
