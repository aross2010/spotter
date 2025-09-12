import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import SafeView from '../../../components/safe-view'
import Txt from '../../../components/text'

// search for exercises in the list form
// each list element has the name and a circle input to check it
// next button at top right to confirm selection and select specific sets if the lengths do not match
// next screen will allow the user to select certain sets
// once a user checks one, only allow a subsequent exercise to be checked
// disclaim rules at the top

const Supersets = () => {
  return (
    <SafeView keyboardAvoiding>
      <Txt>Supersets</Txt>
    </SafeView>
  )
}

export default Supersets

const styles = StyleSheet.create({})
