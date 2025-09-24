import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Txt from './text'
import { Workout, WorkoutMinimal } from '../context/workout-context'

type WorkoutOptionsProps = {
  workout: WorkoutMinimal
  setIsOptionsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const WorkoutOptions = ({ workout, setIsOptionsOpen }: WorkoutOptionsProps) => {
  return <Txt>Workout Options</Txt>
}

export default WorkoutOptions

const styles = StyleSheet.create({})
