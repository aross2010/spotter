import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Workout } from '../utils/types'
import tw from '../tw'
import Txt from './text'
import { formatNumber } from '../functions/format-number'
import { useUserStore } from '../stores/user-store'
import { toKg, toLbs } from '../functions/metric-conversions'

const WorkoutRecap = (workout: Workout) => {
  const { preferences } = useUserStore()
  const weightMetric = preferences?.weightMetric || 'lbs'

  const stats = [
    {
      label: 'Sets',
      value: workout.exercises.reduce(
        (acc, exercise) => acc + exercise.sets.length,
        0,
      ),
    },
    {
      label: 'Reps',
      value: workout.exercises.reduce(
        (acc, exercise) =>
          acc +
          exercise.sets.reduce((setAcc, exerciseSet) => {
            // For unilateral, take the higher of left or right reps
            if (exercise.isUnilateral) {
              const leftReps = exerciseSet.leftReps || 0
              const rightReps = exerciseSet.rightReps || 0
              return setAcc + Math.max(leftReps, rightReps)
            }
            return setAcc + (exerciseSet.reps || 0)
          }, 0),
        0,
      ),
    },
    {
      label: 'Exercises',
      value: new Set(workout.exercises.map((exercise) => exercise.name)).size,
    },
    {
      label:
        workout.status === 'planned'
          ? 'To Lift'
          : workout.status === 'active'
            ? 'Lifting'
            : 'Lifted',
      value: Math.floor(
        workout.exercises.reduce((acc, exercise) => {
          return (
            acc +
            exercise.sets.reduce((setAcc, exerciseSet) => {
              const setWeight =
                exerciseSet.weightLbs || exerciseSet.weightKg || 0
              const setMetric = exerciseSet.weightLbs ? 'lbs' : 'kgs'

              // Convert to user's preferred metric if needed
              const weight =
                setMetric === weightMetric
                  ? setWeight
                  : weightMetric === 'lbs'
                    ? toLbs(setWeight)
                    : toKg(setWeight)

              // Get reps for this set
              let reps = 0
              if (exercise.isUnilateral) {
                const leftReps = exerciseSet.leftReps || 0
                const rightReps = exerciseSet.rightReps || 0
                reps = Math.max(leftReps, rightReps)
              } else {
                reps = exerciseSet.reps || 0
              }

              // Calculate volume (weight × reps)
              return setAcc + weight * reps
            }, 0)
          )
        }, 0),
      ),
    },
  ]

  return (
    <View
      style={tw`border-r border-l mt-4 border-light-grayBorder/50 dark:border-dark-grayBorder/50 overflow-hidden `}
    >
      <View style={tw`flex-row`}>
        {stats.map((stat, index) => (
          <View
            key={stat.label}
            style={tw`flex-1 items-center ${index !== stats.length - 1 ? 'border-r border-light-grayBorder dark:border-dark-grayBorder' : ''}`}
          >
            <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText ">
              {stat.label}
            </Txt>
          </View>
        ))}
      </View>

      <View style={tw`flex-row`}>
        {stats.map((stat, index) => (
          <View
            key={stat.label}
            style={tw`flex-1 items-center ${index !== stats.length - 1 ? 'border-r border-light-grayBorder dark:border-dark-grayBorder' : ''}`}
          >
            <Txt twcn="text-base font-medium text-light-text dark:text-dark-text">
              {formatNumber(stat.value)}
              {weightMetric === 'lbs' &&
              stat.label.toLocaleLowerCase().includes('lift')
                ? ' lbs'
                : weightMetric === 'kgs' &&
                    stat.label.toLocaleLowerCase().includes('lift')
                  ? ' kgs'
                  : ''}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  )
}

export default WorkoutRecap

const styles = StyleSheet.create({})
