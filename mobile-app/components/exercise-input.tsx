import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import tw from '../tw'

type ExerciseInputProps = {
  exNumber: number
}

const ExerciseInput = ({ exNumber }: ExerciseInputProps) => {
  const [baseData, setBaseData] = useState({
    exNumber: exNumber,
    name: '',
    isUnilateral: false,
  })
  const [setData, setSetData] = useState([
    {
      lbs: null,
      kg: null,
      reps: null,
      rpe: null,
      rir: null,
      partialReps: null,
      cheatReps: null,
    },
  ])

  const numberTimeline = (
    <View style={tw`gap-1 h-full`}>
      <View
        style={tw`h-5 w-5 rounded-full bg-primary items-center justify-center text-dark-text font-poppinsMedium`}
      />
      <View
        style={tw`flex-1 w-0.5 bg-light-grayTertiary dark:bg-dark-grayTertiary mx-auto`}
      />
    </View>
  )

  return (
    <View style={tw`flex-row gap-1 min-h-20`}>
      {numberTimeline}
      <View style={tw`flex-1`}>{/* Variable height content goes here */}</View>
    </View>
  )
}

export default ExerciseInput

const styles = StyleSheet.create({})
