import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import React, { ReactNode } from 'react'

const TabWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <SafeAreaView className="bg-light-background dark:bg-dark-background h-full">
      <View className="px-4 h-full">{children}</View>
    </SafeAreaView>
  )
}

export default TabWrapper

const styles = StyleSheet.create({})
