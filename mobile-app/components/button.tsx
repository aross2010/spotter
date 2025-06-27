import { StyleSheet, Text, View, Pressable } from 'react-native'
import React, { ReactNode } from 'react'

const Button = ({ children }: { children: ReactNode }) => {
  return (
    <Pressable
      onPress={() => console.log('presed')}
      className="flex-row active:opacity-75 justify-center mx-8 bg-brand-primary p-4 rounded-lg"
    >
      <Text className="text-white text-lg font-semibold">{children}</Text>
    </Pressable>
  )
}

export default Button

const styles = StyleSheet.create({})
