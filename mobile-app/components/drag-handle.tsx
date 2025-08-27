import { StyleSheet, Text, View } from 'react-native'
import tw from '../tw'
import React from 'react'

const DragHandle = () => {
  return (
    <View
      style={tw`absolute h-1 bg-light-grayTertiary dark:bg-dark-grayTertiary w-1/4 rounded-full mt-3 self-center`}
    />
  )
}

export default DragHandle

const styles = StyleSheet.create({})
