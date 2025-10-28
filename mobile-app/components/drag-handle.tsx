import { StyleSheet, Text, View } from 'react-native'
import tw from '../tw'
import React from 'react'

const DragHandle = () => {
  return (
    <View
      style={tw`absolute h-1 bg-light-grayBorder dark:bg-dark-grayBorderw-1/6 rounded-full mt-3 self-center`}
    />
  )
}

export default DragHandle

const styles = StyleSheet.create({})
