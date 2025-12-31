import {
  Alert,
  Share as RNShare,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Link,
  router,
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
import { Camera, Check, Frame, Pencil, Share, Tag } from 'lucide-react-native'
import { formatDate } from '../../functions/formatted-date'
import Spinner from '../../components/activity-indicator'
import Button from '../../components/button'
import Colors from '../../constants/colors'
import { capString } from '../../functions/cap-string'
import { handleShareWorkout } from '../../functions/share'
import { useUserStore } from '../../stores/user-store'
import { useWorkoutStore, useWorkoutTabStore } from '../../stores/workout-store'
import { useExerciseStore } from '../../stores/exercise-store'
import WorkoutRecap from '../../components/workout-recap'
import { captureRef } from 'react-native-view-shot'
import * as MediaLibrary from 'expo-media-library'
import useTheme from '../hooks/theme'
import SFIcon from '../../components/sf-icon'

const WorkoutDetails = () => {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const contentRef = useRef<View>(null)
  const screenshotRef = useRef<View>(null)
  const navigation = useNavigation()
  const { id, from, workoutName } = useLocalSearchParams()
  const { fetchWithAuth } = useAuth()
  const { preferences } = useUserStore()
  const intensityMetric = preferences?.intensityMetric || 'rpe'
  const { shouldRefresh, clearRefresh } = useWorkoutStore()
  const { triggerRefresh: triggerExerciseDetailsRefresh } = useExerciseStore()
  const { triggerRefresh: triggerWorkoutTabsRefresh } = useWorkoutTabStore()
  const [hasLoaded, setHasLoaded] = useState(false)
  const { theme } = useTheme()

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
      setHasLoaded(true)
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
        triggerWorkoutTabsRefresh()
        if (from === 'exercise') {
          triggerExerciseDetailsRefresh()
        }
        if (hasLoaded) getWorkoutDetails()
        clearRefresh()
      }
      return () => {}
    }, [shouldRefresh])
  )

  useEffect(() => {
    const presentation = from === 'exercise' ? 'modal' : 'card'
    navigation.setOptions({
      title: workout?.name || (workoutName ? String(workoutName) : ''),
      headerRight: workout
        ? () => (
            <View style={tw`flex-row items-center gap-6 px-2`}>
              <Button
                onPress={() =>
                  router.push(
                    `/workout-form?id=${workout?.id}&from=workout-details`
                  )
                }
              >
                <SFIcon
                  name="pencil"
                  size={26}
                  color={Colors.primary}
                />
              </Button>
              <Button onPress={() => handleShareWorkout(workout)}>
                <SFIcon
                  name="square.and.arrow.up"
                  size={26}
                  color={Colors.primary}
                />
              </Button>
              <Button onPress={() => handleScreenshotWorkout()}>
                <SFIcon
                  name="camera.viewfinder"
                  size={26}
                  color={Colors.primary}
                />
              </Button>
            </View>
          )
        : undefined,
      headerLeft:
        from != 'workout-form' &&
        (() => (
          <Button
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityLabel="close workout details"
            twcn="w-9 flex-row items-center justify-center h-full"
          >
            <SFIcon
              name="xmark"
              size={26}
              color={theme.text}
            />
          </Button>
        )),
    })
  }, [navigation, workout?.name])

  const handleScreenshotWorkout = async () => {
    try {
      setIsCapturing(true)
      // Small delay to ensure the off-screen view renders
      await new Promise((resolve) => setTimeout(resolve, 150))

      if (!screenshotRef.current) {
        setIsCapturing(false)
        Alert.alert('Error', 'Failed to capture workout screenshot.')
        return
      }

      const uri = await captureRef(screenshotRef, {
        format: 'png',
        quality: 1,
      })

      setIsCapturing(false)

      let perm = await MediaLibrary.getPermissionsAsync()

      if (perm.status !== 'granted') {
        perm = await MediaLibrary.requestPermissionsAsync()
      }

      if (perm.status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri)
        Alert.alert(
          'Workout saved',
          'Your workout screenshot is now available in Photos.'
        )
      } else {
        Alert.alert(
          'Permission needed',
          'Enable Photos access in Settings to save screenshots.'
        )
      }
    } catch (error) {
      console.error(error)
      Alert.alert('Error', 'Failed to capture workout screenshot.')
    }
  }

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
          <View style={tw`gap-1 justify-center items-center`}>
            <View
              style={tw`${exerciseIndex !== 0 ? 'mt-1' : ''} w-8 h-8 rounded-full ${isInSuperset ? 'bg-secondary' : 'bg-primary'} items-center justify-center`}
            >
              <Txt twcn="text-base text-dark-text font-semibold">
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

          <View
            style={tw`flex-1 mb-4 ${exerciseIndex != 0 ? 'mt-[7]' : 'mt-[3]'}`}
          >
            <View style={tw`pb-2`}>
              <Txt twcn="text-base">{exercise.name}</Txt>
            </View>

            <View style={tw`mt-2 flex-row flex-wrap`}>
              <View style={tw`w-1/5 items-center`}>
                <Txt twcn="text-xs font-medium text-light-grayText dark:text-dark-grayText">
                  Set
                </Txt>
              </View>
              <View style={tw`w-1/5 items-center`}>
                <Txt twcn="text-xs font-medium text-light-grayText dark:text-dark-grayText">
                  {preferences?.weightMetric === 'kgs' ? 'Kg' : 'Lbs'}
                </Txt>
              </View>
              <View style={tw`w-1/5 items-center`}>
                <Txt twcn="text-xs font-medium text-light-grayText dark:text-dark-grayText">
                  Reps
                </Txt>
              </View>
              <View style={tw`w-1/5 items-center`}>
                <Txt twcn="text-xs font-medium text-light-grayText dark:text-dark-grayText">
                  Part.
                </Txt>
              </View>
              <View style={tw`w-1/5 items-center`}>
                <Txt twcn="text-xs font-medium text-light-grayText dark:text-dark-grayText">
                  {intensityMetric === 'rir' ? 'RIR' : 'RPE'}
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

                  // Convert RPE to RIR if needed
                  const leftIntensity = set.leftRpe
                    ? intensityMetric === 'rir'
                      ? 10 - set.leftRpe
                      : set.leftRpe
                    : null
                  const rightIntensity = set.rightRpe
                    ? intensityMetric === 'rir'
                      ? 10 - set.rightRpe
                      : set.rightRpe
                    : null

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
                        {(leftIntensity !== null ||
                          rightIntensity !== null) && (
                          <Txt twcn="text-center text-light-text dark:text-dark-text">
                            {showRpeSlash
                              ? `${leftIntensity || 0}/${rightIntensity || 0}`
                              : leftIntensity || rightIntensity}
                          </Txt>
                        )}
                      </View>
                    </View>
                  )
                } else {
                  // Convert RPE to RIR if needed
                  const intensity = set.rpe
                    ? intensityMetric === 'rir'
                      ? 10 - set.rpe
                      : set.rpe
                    : null

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
                        {intensity !== null && (
                          <Txt twcn="text-center text-light-text dark:text-dark-text">
                            {intensity}
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
      <>
        <SafeView>
          <View
            ref={contentRef}
            collapsable={false}
            style={tw`bg-light-background dark:bg-dark-background -mx-4 -mt-2 px-4 pt-2 pb-12 -mb-12`}
          >
            <View style={tw`gap-2`}>
              <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-medium  text-left">
                {capString(
                  `${formatDate(workout.date)}${workout.location ? ` @ ${workout.location}` : ''}`,
                  40
                )}
              </Txt>
              {workout.notes && (
                <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText">
                  {workout.notes}
                </Txt>
              )}
              {workout && <WorkoutRecap {...workout} />}
            </View>

            <View style={tw`mt-6`}>{renderedExercises}</View>
            <View style={tw`mt-4 gap-3`}>
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
          </View>
        </SafeView>

        {/* Off-screen view for screenshots */}
        {isCapturing && (
          <View style={{ position: 'absolute', left: -10000, top: 0 }}>
            <View
              ref={screenshotRef}
              collapsable={false}
              style={{
                width: Dimensions.get('window').width,
                backgroundColor: theme.background,
                paddingVertical: 32,
                paddingHorizontal: 16,
              }}
            >
              <Txt twcn="text-4xl font-semibold mb-4 text-light-text dark:text-dark-text">
                {workout.name}
              </Txt>
              <View style={tw`gap-2`}>
                <Txt twcn="text-xs text-light-grayText dark:text-dark-grayText uppercase font-medium text-left">
                  {capString(
                    `${formatDate(workout.date)}${workout.location ? ` @ ${workout.location}` : ''}`,
                    40
                  )}
                </Txt>
                {workout.notes && (
                  <Txt twcn="text-sm text-light-grayText dark:text-dark-grayText">
                    {workout.notes}
                  </Txt>
                )}
                {workout && <WorkoutRecap {...workout} />}
              </View>

              <View style={tw`mt-6`}>{renderedExercises}</View>
              <View style={tw`mt-4 gap-3`}>
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
            </View>
          </View>
        )}
      </>
    )
  )
}

export default WorkoutDetails

const styles = StyleSheet.create({})
