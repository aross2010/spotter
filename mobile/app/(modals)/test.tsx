import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import SafeView from '../../components/safe-view'
import Txt from '../../components/text'

const Test = () => {
  return (
    <SafeView>
      <Txt>Test</Txt>
    </SafeView>
  )
}

export default Test

const styles = StyleSheet.create({})
