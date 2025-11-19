import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Button from './button'
import { SymbolView } from 'expo-symbols'
import Colors from '../constants/colors'
import { router } from 'expo-router'

const WorkoutCardio = () => {
  return (
    <Button
      onPress={() => {
        router.push('/cardio-form')
      }}
      twcnText="font-poppinsSemiBold text-primary dark:text-primary"
      twcn="flex-row-reverse items-center gap-1"
      text="Add Cardio"
    >
      <SymbolView
        name="figure.run.treadmill"
        tintColor={Colors.primary}
        style={{
          width: 24,
          height: 24,
        }}
      />
    </Button>
  )
}

export default WorkoutCardio

const styles = StyleSheet.create({})
