import { View, Text } from 'react-native'
import React from 'react'

const OrDivider = () => {
  return (
    <View className="flex-row items-center my-12">
      <View className="flex-1 h-px bg-light-grayTertiary dark:bg-dark-grayTertiary" />
      <Text className="mx-4 text-light-grayText dark:text-dark-grayText font-poppins">
        or
      </Text>
      <View className="flex-1 h-px bg-light-grayTertiary dark:bg-dark-grayTertiary" />
    </View>
  )
}

export default OrDivider
