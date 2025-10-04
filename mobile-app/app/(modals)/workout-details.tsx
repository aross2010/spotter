import { Alert, Share as RNShare, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router, useLocalSearchParams, useNavigation } from 'expo-router'
import Txt from '../../components/text'
import SafeView from '../../components/safe-view'
import { WorkoutDetails as WorkoutDetailsType } from '../../context/workout-context'
import { useAuth } from '../../context/auth-context'
import { BASE_URL } from '../../constants/auth'
import tw from '../../tw'
import useTheme from '../hooks/theme'
import {
  Calendar,
  Check,
  MapPin,
  Pencil,
  Share,
  Tag,
} from 'lucide-react-native'
import { formatDate } from '../../functions/formatted-date'
import Spinner from '../../components/activity-indicator'
import Button from '../../components/button'
import Colors from '../../constants/colors'
import { capString } from '../../functions/cap-string'

// display at the header level: location, date, sets
// then notes
// muscle group analysis (button to toggle)
// exercises in the timeline form like the workout form (same exact layout)
// tags at the bottom
// add share and edit buttons at the top right

const WorkoutDetails = () => {
  const [workout, setWorkout] = useState<WorkoutDetailsType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigation = useNavigation()
  const { id } = useLocalSearchParams()
  const { fetchWithAuth } = useAuth()
  const { theme } = useTheme()

  useEffect(() => {
    const getWorkoutDetails = async () => {
      setIsLoading(true)
      try {
        const response = await fetchWithAuth(
          `${BASE_URL}/api/workouts/info/${id}`,
          {
            method: 'GET',
          }
        )
        const workoutDetails = (await response.json()) as WorkoutDetailsType
        setWorkout(workoutDetails)
      } catch (error: any) {
        Alert.alert('Error', error.message)
      } finally {
        setIsLoading(false)
      }
    }
    getWorkoutDetails()
  }, [])

  const buildWorkoutMessage = () => {
    if (!workout) return ''

    // Build the workout summary text
    let message = `💪 ${workout.name}\n`
    message += `📅 ${formatDate(workout.date)}`
    if (workout.location) {
      message += ` @ ${workout.location}`
    }
    message += '\n\n'

    if (workout.notes) {
      message += `📝 ${workout.notes}\n\n`
    }

    // Add exercises
    workout.exercises.forEach((exercise, index) => {
      message += `${index + 1}. ${exercise.name}\n`
      exercise.sets.forEach((set) => {
        if (exercise.isUnilateral) {
          const weight = set.weightLbs || set.weightKg
          const leftReps = set.leftReps || 0
          const rightReps = set.rightReps || 0
          const reps =
            leftReps !== rightReps ? `${leftReps}/${rightReps}` : leftReps

          if (weight && weight > 0) {
            message += `   Set ${set.setNumber}: ${weight} lbs × ${reps} reps`
          } else {
            message += `   Set ${set.setNumber}: ${reps} reps`
          }

          if (set.leftPartialReps || set.rightPartialReps) {
            const leftPartials = set.leftPartialReps || 0
            const rightPartials = set.rightPartialReps || 0
            const partials =
              leftPartials !== rightPartials
                ? `${leftPartials}/${rightPartials}`
                : leftPartials
            message += ` + ${partials} partials`
          }

          if (set.leftRpe || set.rightRpe) {
            const leftRpe = set.leftRpe || 0
            const rightRpe = set.rightRpe || 0
            const rpe =
              leftRpe !== rightRpe ? `${leftRpe}/${rightRpe}` : leftRpe
            message += ` @ RPE ${rpe}`
          }
        } else {
          const weight = set.weightLbs || set.weightKg
          const reps = set.reps || '-'

          if (weight && weight > 0) {
            message += `   Set ${set.setNumber}: ${weight} lbs × ${reps} reps`
          } else {
            message += `   Set ${set.setNumber}: ${reps} reps`
          }

          if (set.partialReps) {
            message += ` + ${set.partialReps} partials`
          }

          if (set.rpe) {
            message += ` @ RPE ${set.rpe}`
          }
        }
        message += '\n'
      })
      message += '\n'
    })

    // Add tags if available
    if (workout.tags && workout.tags.length > 0) {
      message += `🏷️ ${workout.tags.map((tag) => tag.name).join(', ')}`
    }

    return message
  }

  const handleShareWorkout = async () => {
    try {
      const message = buildWorkoutMessage()

      const result = await RNShare.share(
        {
          message: message,
          title: workout?.name || 'My Workout',
        },
        {
          subject: workout?.name || 'My Workout',
        }
      )

      if (result.action === RNShare.sharedAction) {
        if (result.activityType) {
          // Shared with activity type
          console.log('Shared with activity type:', result.activityType)
        } else {
          // Shared
          console.log('Workout shared successfully')
        }
      } else if (result.action === RNShare.dismissedAction) {
        // Dismissed
        console.log('Share dismissed')
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share workout')
    }
  }

  useEffect(() => {
    navigation.setOptions({
      headerTitle: workout?.name || 'Workout Details',
      headerShown: true,
      headerRight: workout
        ? () => (
            <View style={tw`flex-row items-center gap-2`}>
              <Button
                onPress={() =>
                  router.push({
                    pathname: '/workout-form',
                    params: {
                      id: workout?.id,
                    },
                  })
                }
                twcn="bg-primary/10 rounded-2xl p-2"
              >
                <Pencil
                  size={20}
                  color={Colors.primary}
                />
              </Button>
              <Button
                onPress={handleShareWorkout}
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
    })
  }, [navigation, workout?.name])

  const renderedExercises =
    workout &&
    workout.exercises.map((exercise, exerciseIndex) => (
      <View
        key={exerciseIndex}
        style={tw`flex-row gap-4 items-start`}
      >
        {/* Timeline Component */}
        <View style={tw`gap-1 justify-center items-center`}>
          <View
            style={tw`${exerciseIndex !== 0 ? 'mt-1' : ''} w-7 h-7 rounded-full bg-primary items-center justify-center`}
          >
            <Txt twcn="text-sm text-dark-text font-poppinsSemiBold">
              {exerciseIndex + 1}
            </Txt>
          </View>
          <View style={tw`flex-1 w-1 bg-primary rounded-full`} />
          {exerciseIndex === workout.exercises.length - 1 && (
            <View
              style={tw`w-7 h-7 rounded-full bg-primary items-center justify-center`}
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
                Lbs
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
              if (exercise.isUnilateral) {
                const showRepsSlash = set.leftReps !== set.rightReps
                const showPartialsSlash =
                  set.leftPartialReps !== set.rightPartialReps
                const showRpeSlash = set.leftRpe !== set.rightRpe

                return (
                  <View
                    key={set.id}
                    style={tw`flex-row flex-wrap border-b bg-light-background dark:bg-dark-background border-light-grayTertiary dark:border-dark-grayTertiary py-1`}
                  >
                    <View style={tw`w-1/5 py-1 items-center justify-center`}>
                      <Txt twcn="text-center text-light-text dark:text-dark-text">
                        {set.setNumber} L/R
                      </Txt>
                    </View>
                    <View style={tw`w-1/5 py-1 items-center justify-center`}>
                      {(set.weightLbs || set.weightKg) && (
                        <Txt twcn="text-center text-light-text dark:text-dark-text">
                          {set.weightLbs || set.weightKg}
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
                    style={tw`flex-row flex-wrap bg-light-background dark:bg-dark-background border-b border-light-grayTertiary/50 dark:border-dark-grayTertiary/50 py-1`}
                  >
                    <View style={tw`w-1/5 py-1 items-center justify-center`}>
                      <Txt twcn="text-center text-light-text dark:text-dark-text">
                        {set.setNumber}
                      </Txt>
                    </View>
                    <View style={tw`w-1/5 py-1 items-center justify-center`}>
                      {(set.weightLbs || set.weightKg) && (
                        <Txt twcn="text-center text-light-text dark:text-dark-text">
                          {set.weightLbs || set.weightKg}
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
    ))

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

  return !workout ? (
    <Spinner />
  ) : (
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
}

export default WorkoutDetails

const styles = StyleSheet.create({})
