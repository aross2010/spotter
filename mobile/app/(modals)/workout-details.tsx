import { Alert, Share as RNShare, StyleSheet, View } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import {
  Link,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from 'expo-router'
import Txt from '../../components/text'
import SafeView from '../../components/safe-view'
import { Workout } from '../../utils/types'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import tw from '../../tw'
import { Check, Pencil, Share, Tag } from 'lucide-react-native'
import { formatDate } from '../../functions/formatted-date'
import Spinner from '../../components/activity-indicator'
import Button from '../../components/button'
import Colors from '../../constants/colors'
import { capString } from '../../functions/cap-string'
import { handleShareWorkout } from '../../functions/share'
import { useUserStore } from '../../stores/user-store'
import { useWorkoutStore } from '../../stores/workout-store'

const WorkoutDetails = () => {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigation = useNavigation()
  const { id, from } = useLocalSearchParams()
  const { fetchWithAuth } = useAuth()
  const { preferences } = useUserStore()
  const { shouldRefresh, clearRefresh } = useWorkoutStore()

  const getWorkoutDetails = async () => {
    setIsLoading(true)
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/api/workouts/info/${id}`,
        {
          method: 'GET',
        }
      )
      const workoutDetails = (await response.json()) as Workout
      setWorkout(workoutDetails)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getWorkoutDetails()
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (shouldRefresh) {
        getWorkoutDetails()
        clearRefresh()
      }
      return () => {}
    }, [])
  )

  useEffect(() => {
    const presentation = from === 'exercise' ? 'modal' : 'card'
    navigation.setOptions({
      headerTitle: workout?.name || '',
      headerShown: true,
      headerRight: workout
        ? () => (
            <View style={tw`flex-row items-center gap-2`}>
              <Link
                prefetch
                href={`/workout-form?id=${workout?.id}&from=workout-details`}
              >
                <View style={tw`bg-primary/10 rounded-2xl p-2`}>
                  <Pencil
                    size={20}
                    color={Colors.primary}
                  />
                </View>
              </Link>
              <Button
                onPress={() => handleShareWorkout(workout)}
                twcn="bg-primary/10 rounded-2xl p-2"
              >
                <Share
                  size={20}
                  color={Colors.primary}
                />
              </Button>
            </View>
          )
        : undefined,
      presentation,
      animation: 'slide_from_bottom',
      animationDuration: 350,
    })
  }, [navigation, workout?.name])

  const renderedExercises =
    workout &&
    workout.exercises.map((exercise, exerciseIndex) => {
      const isInSuperset = workout.setGroupings.some(
        (grouping) =>
          grouping.groupingType === 'superset' &&
          grouping.groupSets.some(
            (set) => set.exerciseNumber === exerciseIndex + 1
          )
      )

      // Check if the next exercise is in the same superset group
      const isNextExerciseInSameSuperset = workout.setGroupings.some(
        (grouping) =>
          grouping.groupingType === 'superset' &&
          grouping.groupSets.some(
            (set) => set.exerciseNumber === exerciseIndex + 1
          ) &&
          grouping.groupSets.some(
            (set) => set.exerciseNumber === exerciseIndex + 2
          )
      )

      return (
        <View
          key={exerciseIndex}
          style={tw`flex-row gap-2 items-start`}
        >
          {/* Timeline Component */}
          <View style={tw`gap-1 justify-center items-center`}>
            <View
              style={tw`${exerciseIndex !== 0 ? 'mt-1' : ''} w-7 h-7 rounded-full ${isInSuperset ? 'bg-secondary' : 'bg-primary'} items-center justify-center`}
            >
              <Txt twcn="text-sm text-dark-text font-poppinsSemiBold">
                {exerciseIndex + 1}
              </Txt>
            </View>
            <View
              style={tw`flex-1 w-1 ${isNextExerciseInSameSuperset ? 'bg-secondary' : 'bg-primary'} rounded-full`}
            />
            {exerciseIndex === workout.exercises.length - 1 && (
              <View
                style={tw`w-7 h-7 rounded-full ${isInSuperset ? 'bg-secondary' : 'bg-primary'} items-center justify-center`}
              >
                <Check
                  size={16}
                  color={Colors.dark.text}
                  strokeWidth={3}
                />
              </View>
            )}
          </View>

          {/* Exercise Content */}
          <View style={tw`flex-1 mb-4 ${exerciseIndex !== 0 ? 'mt-1' : ''}`}>
            {/* Exercise Name */}
            <View style={tw`pb-2`}>
              <Txt twcn="text-base">{exercise.name}</Txt>
            </View>

            {/* Set Labels */}
            <View style={tw`mt-2 flex-row flex-wrap`}>
              <View style={tw`w-1/5 items-center`}>
                <Txt twcn="text-xs font-poppinsMedium uppercase tracking-wider text-light-grayText dark:text-dark-grayText">
                  Set
                </Txt>
              </View>
              <View style={tw`w-1/5 items-center`}>
                <Txt twcn="text-xs font-poppinsMedium uppercase tracking-wider text-light-grayText dark:text-dark-grayText">
                  {preferences?.weightMetric === 'kgs' ? 'Kg' : 'Lbs'}
                </Txt>
              </View>
              <View style={tw`w-1/5 items-center`}>
                <Txt twcn="text-xs font-poppinsMedium uppercase tracking-wider text-light-grayText dark:text-dark-grayText">
                  Reps
                </Txt>
              </View>
              <View style={tw`w-1/5 items-center`}>
                <Txt twcn="text-xs font-poppinsMedium uppercase tracking-wider text-light-grayText dark:text-dark-grayText">
                  Part.
                </Txt>
              </View>
              <View style={tw`w-1/5 items-center`}>
                <Txt twcn="text-xs font-poppinsMedium uppercase tracking-wider text-light-grayText dark:text-dark-grayText">
                  RPE
                </Txt>
              </View>
            </View>

            {/* Sets */}
            <View style={tw`mt-2`}>
              {exercise.sets.map((set, setIndex) => {
                const isSetInDropset = workout.setGroupings.some(
                  (grouping) =>
                    grouping.groupingType === 'dropset' &&
                    grouping.groupSets.some(
                      (gs) =>
                        gs.exerciseNumber === exerciseIndex + 1 &&
                        gs.setNumber === set.setNumber
                    )
                )

                if (exercise.isUnilateral) {
                  const showRepsSlash = set.leftReps !== set.rightReps
                  const showPartialsSlash =
                    set.leftPartialReps !== set.rightPartialReps
                  const showRpeSlash = set.leftRpe !== set.rightRpe

                  return (
                    <View
                      key={set.id}
                      style={tw`flex-row flex-wrap border-b ${isSetInDropset ? 'bg-secondary/10' : 'bg-light-background dark:bg-dark-background'} border-light-grayBorder dark:border-dark-grayBorder py-1`}
                    >
                      <View style={tw`w-1/5 py-1 items-center justify-center`}>
                        <Txt twcn="text-center text-light-text dark:text-dark-text">
                          {set.setNumber} L/R
                        </Txt>
                      </View>
                      <View style={tw`w-1/5 py-1 items-center justify-center`}>
                        {(set.weightLbs || set.weightKg) && (
                          <Txt twcn="text-center text-light-text dark:text-dark-text">
                            {preferences?.weightMetric === 'kgs'
                              ? set.weightKg ||
                                (set.weightLbs
                                  ? (set.weightLbs / 2.205).toFixed(1)
                                  : '')
                              : set.weightLbs ||
                                (set.weightKg
                                  ? (set.weightKg * 2.205).toFixed(1)
                                  : '')}
                          </Txt>
                        )}
                      </View>
                      <View style={tw`w-1/5 py-1 items-center justify-center`}>
                        {(set.leftReps || set.rightReps) && (
                          <Txt twcn="text-center text-light-text dark:text-dark-text">
                            {showRepsSlash
                              ? `${set.leftReps || 0}/${set.rightReps || 0}`
                              : set.leftReps || set.rightReps}
                          </Txt>
                        )}
                      </View>
                      <View style={tw`w-1/5 py-1 items-center justify-center`}>
                        {(set.leftPartialReps || set.rightPartialReps) && (
                          <Txt twcn="text-center text-light-text dark:text-dark-text">
                            {showPartialsSlash
                              ? `${set.leftPartialReps || 0}/${set.rightPartialReps || 0}`
                              : set.leftPartialReps || set.rightPartialReps}
                          </Txt>
                        )}
                      </View>
                      <View style={tw`w-1/5 py-1 items-center justify-center`}>
                        {(set.leftRpe || set.rightRpe) && (
                          <Txt twcn="text-center text-light-text dark:text-dark-text">
                            {showRpeSlash
                              ? `${set.leftRpe || 0}/${set.rightRpe || 0}`
                              : set.leftRpe || set.rightRpe}
                          </Txt>
                        )}
                      </View>
                    </View>
                  )
                } else {
                  return (
                    <View
                      key={set.id}
                      style={tw`flex-row flex-wrap ${isSetInDropset ? 'bg-secondary/10' : 'bg-light-background dark:bg-dark-background'} border-b border-light-grayBorder dark:border-dark-grayBorder py-1`}
                    >
                      <View style={tw`w-1/5 py-1 items-center justify-center`}>
                        <Txt twcn="text-center text-light-text dark:text-dark-text">
                          {set.setNumber}
                        </Txt>
                      </View>
                      <View style={tw`w-1/5 py-1 items-center justify-center`}>
                        {(set.weightLbs || set.weightKg) && (
                          <Txt twcn="text-center text-light-text dark:text-dark-text">
                            {preferences?.weightMetric === 'kgs'
                              ? set.weightKg ||
                                (set.weightLbs
                                  ? (set.weightLbs / 2.205).toFixed(1)
                                  : '')
                              : set.weightLbs ||
                                (set.weightKg
                                  ? (set.weightKg * 2.205).toFixed(1)
                                  : '')}
                          </Txt>
                        )}
                      </View>
                      <View style={tw`w-1/5 py-1 items-center justify-center`}>
                        {set.reps && (
                          <Txt twcn="text-center text-light-text dark:text-dark-text">
                            {set.reps}
                          </Txt>
                        )}
                      </View>
                      <View style={tw`w-1/5 py-1 items-center justify-center`}>
                        {set.partialReps && (
                          <Txt twcn="text-center text-light-text dark:text-dark-text">
                            {set.partialReps}
                          </Txt>
                        )}
                      </View>
                      <View style={tw`w-1/5 py-1 items-center justify-center`}>
                        {set.rpe && (
                          <Txt twcn="text-center text-light-text dark:text-dark-text">
                            {set.rpe}
                          </Txt>
                        )}
                      </View>
                    </View>
                  )
                }
              })}
            </View>
          </View>
        </View>
      )
    })

  const renderedTags =
    workout &&
    workout.tags.map((tag) => {
      const { id, name } = tag
      return (
        <Txt
          key={id}
          twcn="text-xs text-primary"
        >
          #{name}
        </Txt>
      )
    })

  return isLoading ? (
    <Spinner />
  ) : (
    workout && (
      <SafeView>
        <View style={tw`gap-3`}>
          <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-poppinsMedium tracking-wide">
            {capString(
              `${formatDate(workout.date)}${workout.location ? ` @ ${workout.location}` : ''}`,
              40
            )}
          </Txt>
          {workout.notes && (
            <Txt twcn="text-sm font-poppinsItalic">{workout.notes}</Txt>
          )}
          {workout.tags.length > 0 && (
            <View style={tw`flex-row flex-wrap items-center gap-2`}>
              <Tag
                color={Colors.primary}
                strokeWidth={1.5}
                size={12}
              />
              {renderedTags}
            </View>
          )}
        </View>
        <View style={tw`mt-6`}>{renderedExercises}</View>
      </SafeView>
    )
  )
}

export default WorkoutDetails

const styles = StyleSheet.create({})
