import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'

// same list of exercises with a caret right indicator
// once clicked, next screen allows the user to select specific sets for the dropset
// disclaimer at the top about how dropsets work
// only display exercises that have at least one set

const Dropsets = () => {
  return (
    <SafeView>
      <Txt>Dropsets</Txt>
    </SafeView>
  )
}

export default Dropsets

const styles = StyleSheet.create({})
