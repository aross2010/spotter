import SafeView from '../../../components/safe-view'
import { View, Keyboard, Platform } from 'react-native'
import Button from '../../../components/button'
import tw from '../../../tw'
import { formatDate } from '../../../functions/formatted-date'
import { formatNumber } from '../../../functions/format-number'
import { toKg, toLbs } from '../../../functions/metric-conversions'
import { HeaderBackButton } from '@react-navigation/elements'
import { useCallback, useEffect, useState, useRef } from 'react'
import {
  DefaultKeyboardToolbarTheme,
  KeyboardToolbar,
  KeyboardToolbarProps,
} from 'react-native-keyboard-controller'
import { router, useNavigation } from 'expo-router'
import useTheme from '../../hooks/theme'
import WorkoutNameInput from '../../../components/workout-name-input'
import { useWorkoutForm } from '../../../context/workout-form-context'
import { useUserStore } from '../../../stores/user-store'
import Exercises from '../../../components/exercises'
import { Alert } from 'react-native'
import { useWorkout } from '../../../context/workout-context'
import { useLocalSearchParams } from 'expo-router'
import { useAuth } from '../../../context/auth-context'
import { BASE_URL } from '../../../constants/auth'
import Spinner from '../../../components/activity-indicator'
import Txt from '../../../components/text'
import Colors from '../../../constants/colors'
import {
  useHomeDataStore,
  useWorkoutStore,
  useWorkoutTabStore,
} from '../../../stores/workout-store'
import { WorkoutFormData } from '../../../utils/types'
import { useExerciseStore } from '../../../stores/exercise-store'
import SFIcon from '../../../components/sf-icon'
import {
  ContextMenu,
  Host,
  Picker,
  Button as SwiftButton,
} from '@expo/ui/swift-ui'
import { toTitleCase } from '../../../functions/utils'
import { GlassView } from 'expo-glass-effect'
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated'
import MyDatePicker from '../../../components/date-picker'
import MyBottomSheet from '../../../components/bottom-sheet'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useInsightsStore } from '../../../stores/insights-store'

const WorkoutForm = () => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const navigation = useNavigation()
  const { theme } = useTheme()
  const {
    workoutData,
    setWorkoutData,
    addWorkout,
    adjustFocusedInputValue,
    focusedInput,
    getNames,
    exerciseNumberInputValue,
    setExerciseNumberInputValue,
    handleExerciseNumberSubmitRef,
    resetWorkoutFormContext,
  } = useWorkoutForm()
  const { updateWorkout } = useWorkout()
  const { fetchWithAuth } = useAuth()
  const { id, cloneId, from } = useLocalSearchParams()
  const [mode, setMode] = useState<'create' | 'edit' | 'clone'>(
    id ? 'edit' : cloneId ? 'clone' : 'create'
  )
  const [workoutId, setWorkoutId] = useState<string | null>(
    (id as string) || null
  )
  const [initialState, setInitialState] = useState<typeof workoutData | null>(
    null
  )
  const ref = useRef<BottomSheetModal | null>(null)
  const { triggerRefresh } = useWorkoutStore()
  const { triggerRefresh: triggerHomeDataRefresh } = useHomeDataStore()
  const { triggerRefresh: triggerExerciseDetailsRefresh } = useExerciseStore()
  const { triggerRefresh: triggerWorkoutTabRefresh } = useWorkoutTabStore()
  const { triggerRefresh: triggerInsightsRefresh } = useInsightsStore()

  const handleCancelForm = useCallback(() => {
    if (hasChanges()) {
      Alert.alert(
        'Are you sure you want to exit?',
        'Your changes will be lost.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => {
              resetWorkoutFormContext()
              router.back()
            },
          },
        ]
      )
    } else {
      resetWorkoutFormContext()
      router.back()
    }
  }, [resetWorkoutFormContext])

  const getWorkoutData = async (workoutId: string | null) => {
    setIsLoading(true)
    try {
      await getNames()
      if (!workoutId) return
      const response = await fetchWithAuth(
        `${BASE_URL}/api/workouts/${workoutId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      const workout = await response.json()
      const workoutData = {
        ...workout,
        date:
          mode === 'edit' ? new Date(workout.date + 'T00:00:00') : new Date(),
      } as WorkoutFormData
      setWorkoutData(workoutData)
      setInitialState(workoutData)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (cloneId) {
      setWorkoutId(cloneId as string)
      setMode('clone')
    } else if (id) {
      setWorkoutId(id as string)
      setMode('edit')
    }
    getWorkoutData(cloneId ? (cloneId as string) : id ? (id as string) : null)
    if (!id && !cloneId) {
      setInitialState(workoutData)
    }
  }, [])

  const hasChanges = () => {
    if (!initialState) {
      return true // Brand new workout AND there is user input
    }

    const dateChanged =
      workoutData.date.getTime() !== initialState.date.getTime()
    const nameChanged = workoutData.name.trim() !== initialState.name.trim()
    const locationChanged =
      workoutData.location.trim() !== initialState.location.trim()
    const notesChanged = workoutData.notes.trim() !== initialState.notes.trim()
    const statusChanged = workoutData.status !== initialState.status

    // Check if tags changed
    const tagsChanged =
      workoutData.tags.length !== initialState.tags.length ||
      workoutData.tags.some(
        (tag) => !initialState.tags.some((initial) => initial.name === tag.name)
      )

    // Check if exercises changed
    const exercisesChanged =
      workoutData.exercises.length !== initialState.exercises.length ||
      workoutData.exercises.some((exercise, index) => {
        const initialExercise = initialState.exercises[index]
        if (!initialExercise) return true

        const exerciseNameChanged = exercise.name !== initialExercise.name
        const isUnilateralChanged =
          exercise.isUnilateral !== initialExercise.isUnilateral
        const setsChanged =
          exercise.sets.length !== initialExercise.sets.length ||
          exercise.sets.some((set, setIndex) => {
            const initialSet = initialExercise.sets[setIndex]
            if (!initialSet) return true

            return (
              set.setNumber !== initialSet.setNumber ||
              set.weightLbs !== initialSet.weightLbs ||
              set.weightKg !== initialSet.weightKg ||
              set.reps !== initialSet.reps ||
              set.leftReps !== initialSet.leftReps ||
              set.rightReps !== initialSet.rightReps ||
              set.rpe !== initialSet.rpe ||
              set.leftRpe !== initialSet.leftRpe ||
              set.rightRpe !== initialSet.rightRpe ||
              set.rir !== initialSet.rir ||
              set.leftRir !== initialSet.leftRir ||
              set.rightRir !== initialSet.rightRir ||
              set.partialReps !== initialSet.partialReps ||
              set.leftPartialReps !== initialSet.leftPartialReps ||
              set.rightPartialReps !== initialSet.rightPartialReps ||
              set.cheatReps !== initialSet.cheatReps
            )
          })

        return exerciseNameChanged || isUnilateralChanged || setsChanged
      })

    // Check if set groupings changed
    const setGroupingsChanged =
      workoutData.setGroupings.length !== initialState.setGroupings.length ||
      workoutData.setGroupings.some((grouping, index) => {
        const initialGrouping = initialState.setGroupings[index]
        if (!initialGrouping) return true

        const groupingTypeChanged =
          grouping.groupingType !== initialGrouping.groupingType
        const groupSetsChanged =
          grouping.groupSets.length !== initialGrouping.groupSets.length ||
          grouping.groupSets.some((groupSet, groupSetIndex) => {
            const initialGroupSet = initialGrouping.groupSets[groupSetIndex]
            if (!initialGroupSet) return true

            return (
              groupSet.exerciseNumber !== initialGroupSet.exerciseNumber ||
              groupSet.setNumber !== initialGroupSet.setNumber
            )
          })

        return groupingTypeChanged || groupSetsChanged
      })

    return (
      dateChanged ||
      nameChanged ||
      locationChanged ||
      notesChanged ||
      statusChanged ||
      tagsChanged ||
      exercisesChanged ||
      setGroupingsChanged
    )
  }

  const isValidWorkout = () => {
    // Must have a date
    if (!workoutData.date) return false

    // Must have a workout name
    if (!workoutData.name || workoutData.name.trim() === '') return false

    // Must have at least one exercise
    if (workoutData.exercises.length === 0) return false

    // Each exercise must have at least one set
    for (const exercise of workoutData.exercises) {
      // Must have an exercise name
      if (!exercise.name || exercise.name.trim() === '') return false

      if (exercise.sets.length === 0) return false

      // Each set must have reps (for unilateral: leftReps or rightReps)
      for (const set of exercise.sets) {
        if (exercise.isUnilateral) {
          if (!set.leftReps && !set.rightReps) return false
        } else {
          if (!set.reps) return false
        }
      }
    }

    return true
  }

  useEffect(() => {
    const isValid = isValidWorkout()
    const saveEnabled = isValid && (mode === 'edit' ? hasChanges() : true)

    navigation.setOptions({
      title:
        mode === 'edit'
          ? 'Edit Workout'
          : mode === 'clone'
            ? 'New Workout'
            : 'New Workout',
      headerRight: () => (
        <View style={tw`flex-row items-center gap-6 px-2`}>
          <Host style={{ width: 26, height: 26 }}>
            <ContextMenu>
              <ContextMenu.Items>
                <SwiftButton
                  systemImage="calendar"
                  onPress={() => setIsDatePickerOpen(true)}
                >
                  {formatDate(workoutData.date)}
                </SwiftButton>
                <SwiftButton
                  systemImage="mappin"
                  onPress={() => router.push('/workout-form/location')}
                >
                  {workoutData.location || 'Location'}
                </SwiftButton>
                <SwiftButton
                  systemImage="tag"
                  onPress={() =>
                    router.push({
                      pathname: '/tag-selector',
                      params: {
                        type: 'workout',
                      },
                    })
                  }
                >
                  {workoutData.tags.map((tag) => tag.name).join(', ') || 'Tags'}
                </SwiftButton>
                <SwiftButton
                  systemImage="pencil.and.scribble"
                  onPress={() => router.push('/workout-form/notes')}
                >
                  {workoutData.notes.trim().length > 0 ? 'Edit Notes' : 'Notes'}
                </SwiftButton>
                <Picker
                  label={toTitleCase(workoutData.status)}
                  options={['Completed', 'Planned', 'Active']}
                  variant="menu"
                  selectedIndex={
                    workoutData.status === 'completed'
                      ? 0
                      : workoutData.status === 'planned'
                        ? 1
                        : 2
                  }
                  onOptionSelected={({ nativeEvent: { index } }) =>
                    index === 0
                      ? handleStatusChange('completed')
                      : index === 1
                        ? handleStatusChange('planned')
                        : handleStatusChange('active')
                  }
                />
                <SwiftButton
                  systemImage="chart.bar"
                  onPress={() => {
                    Keyboard.dismiss()
                    ref.current?.present()
                  }}
                >
                  Stats
                </SwiftButton>
              </ContextMenu.Items>
              <ContextMenu.Trigger>
                <SFIcon
                  name="info.circle"
                  color={Colors.primary}
                  size={26}
                />
              </ContextMenu.Trigger>
            </ContextMenu>
          </Host>
          {isSaving ? (
            <Spinner
              twcn="w-9"
              fullScreen={false}
            />
          ) : (
            <Button
              onPress={handleSubmitWorkout}
              hitSlop={12}
              accessibilityLabel="Save Workout"
              disabled={isSaving || !saveEnabled}
              twcn="w-9 flex-row items-center justify-center h-full"
            >
              <SFIcon
                name="checkmark"
                size={26}
                color={saveEnabled ? Colors.primary : theme.grayText}
              />
            </Button>
          )}
        </View>
      ),
      headerLeft:
        from === 'workout-details'
          ? () => (
              <View style={tw`flex-row items-center w-9`}>
                <HeaderBackButton
                  displayMode="minimal"
                  tintColor={theme.text}
                  onPress={handleCancelForm}
                  disabled={isSaving}
                  style={tw`w-9 h-full`}
                />
              </View>
            )
          : () => (
              <Button
                onPress={handleCancelForm}
                hitSlop={12}
                accessibilityLabel="close workout form"
                twcn="w-9 flex-row items-center justify-center h-full"
                disabled={isSaving}
              >
                <SFIcon
                  name="xmark"
                  size={26}
                  color={theme.text}
                />
              </Button>
            ),
    })
  }, [
    workoutData,
    isSaving,
    mode,
    isLoading,
    initialState,
    workoutId,
    handleCancelForm,
    from,
  ])

  const handleSubmitWorkout = async () => {
    setIsSaving(true)
    try {
      if (mode === 'create') {
        const res = await addWorkout()
        triggerHomeDataRefresh()
        triggerWorkoutTabRefresh()
        triggerInsightsRefresh()
        if (workoutData.status === 'active') {
          setInitialState({ ...workoutData })
          if (res?.id) {
            setWorkoutId(res.id)
            setMode('edit') // Transition to edit mode after first save
          }
        } else {
          resetWorkoutFormContext()
          router.replace('/workouts')
        }
      } else if (mode === 'edit' && workoutId) {
        await updateWorkout(workoutId, workoutData)
        triggerWorkoutTabRefresh()
        triggerHomeDataRefresh()
        triggerInsightsRefresh()
        if (workoutData.status === 'active') {
          setInitialState({ ...workoutData })
        } else {
          if (from === 'workout-details') {
            triggerRefresh()
            resetWorkoutFormContext()
            router.back()
          } else if (from === 'home') {
            resetWorkoutFormContext()
            router.back()
          } else if (from == 'exercise') {
            resetWorkoutFormContext()
            triggerExerciseDetailsRefresh()
          } else {
            resetWorkoutFormContext()
            router.replace('/workouts')
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = (status: 'completed' | 'planned' | 'active') => {
    setWorkoutData({ ...workoutData, status })
  }

  const CustomLeftButton: KeyboardToolbarProps['button'] = ({
    children,
    onPress,
  }) => (
    <Button onPress={onPress}>
      <SFIcon
        name="chevron.left"
        size={24}
        color={Colors.primary}
      />
    </Button>
  )

  const CustomRightButton: KeyboardToolbarProps['button'] = ({
    children,
    onPress,
  }) => (
    <Button onPress={onPress}>
      <SFIcon
        name="chevron.right"
        size={24}
        color={Colors.primary}
      />
    </Button>
  )

  const CustomDoneButton: KeyboardToolbarProps['button'] = ({
    children,
    onPress,
  }) => (
    <Button onPress={onPress}>
      <SFIcon
        name="checkmark"
        size={24}
        color={Colors.primary}
      />
    </Button>
  )

  const shouldShowToolbar =
    !!focusedInput &&
    focusedInput.field !== 'exerciseName' &&
    focusedInput.field !== 'workoutName'

  return isLoading ? (
    <Spinner />
  ) : (
    <>
      <SafeView
        keyboardAvoiding
        bottomOffset={200}
        extraKeyboardSpace={25}
        ignoreInset
      >
        <View style={tw`flex-1 gap-6 justify-between`}>
          <WorkoutNameInput />
          <Exercises />
        </View>

        <MyDatePicker
          isOpen={isDatePickerOpen}
          closePicker={() => setIsDatePickerOpen(false)}
          value={workoutData.date}
          onChange={(event, selectedDate) => {
            if (selectedDate) {
              // Check if the selected date is in the future
              const today = new Date()
              today.setHours(0, 0, 0, 0) // Reset time to start of day
              const newDate = new Date(selectedDate)
              newDate.setHours(0, 0, 0, 0)

              // If date is in the future, set status to planned
              if (newDate > today) {
                setWorkoutData({
                  ...workoutData,
                  date: selectedDate,
                  status: 'planned',
                })
              } else {
                setWorkoutData({ ...workoutData, date: selectedDate })
              }
            }

            // Close immediately on Android after selection
            if (Platform.OS === 'android') {
              setIsDatePickerOpen(false)
            }
          }}
        />

        <MyBottomSheet ref={ref}>
          <>
            <Txt twcn="font-semibold text-lg mb-2">Workout Stats</Txt>
            <View style={tw`gap-3`}>
              <View style={tw`flex-row justify-between items-center`}>
                <Txt twcn="text-light-grayText dark:text-dark-grayText">
                  Sets
                </Txt>
                <Txt twcn="font-semibold text-base">
                  {formatNumber(
                    workoutData.exercises.reduce(
                      (acc, exercise) => acc + exercise.sets.length,
                      0
                    )
                  )}
                </Txt>
              </View>
              <View style={tw`flex-row justify-between items-center`}>
                <Txt twcn="text-light-grayText dark:text-dark-grayText">
                  Reps
                </Txt>
                <Txt twcn="font-semibold text-base">
                  {formatNumber(
                    workoutData.exercises.reduce(
                      (acc, exercise) =>
                        acc +
                        exercise.sets.reduce((setAcc, exerciseSet) => {
                          if (exercise.isUnilateral) {
                            const leftReps = exerciseSet.leftReps || 0
                            const rightReps = exerciseSet.rightReps || 0
                            return setAcc + Math.max(leftReps, rightReps)
                          }
                          return setAcc + (exerciseSet.reps || 0)
                        }, 0),
                      0
                    )
                  )}
                </Txt>
              </View>
              <View style={tw`flex-row justify-between items-center`}>
                <Txt twcn="text-light-grayText dark:text-dark-grayText">
                  Exercises
                </Txt>
                <Txt twcn="font-semibold text-base">
                  {formatNumber(
                    new Set(
                      workoutData.exercises.map((exercise) => exercise.name)
                    ).size
                  )}
                </Txt>
              </View>
              <View style={tw`flex-row justify-between items-center`}>
                <Txt twcn="text-light-grayText dark:text-dark-grayText">
                  {workoutData.status === 'completed' ? 'Lifted' : 'Lift'}
                </Txt>
                <Txt twcn="font-semibold text-base">
                  {formatNumber(
                    Math.floor(
                      workoutData.exercises.reduce((acc, exercise) => {
                        return (
                          acc +
                          exercise.sets.reduce((setAcc, exerciseSet) => {
                            const { preferences } = useUserStore.getState()
                            const weightMetric =
                              preferences?.weightMetric || 'lbs'
                            const setWeight =
                              exerciseSet.weightLbs || exerciseSet.weightKg || 0
                            const setMetric = exerciseSet.weightLbs
                              ? 'lbs'
                              : 'kgs'

                            const weight =
                              setMetric === weightMetric
                                ? setWeight
                                : weightMetric === 'lbs'
                                  ? toLbs(setWeight)
                                  : toKg(setWeight)

                            let reps = 0
                            if (exercise.isUnilateral) {
                              const leftReps = exerciseSet.leftReps || 0
                              const rightReps = exerciseSet.rightReps || 0
                              reps = Math.max(leftReps, rightReps)
                            } else {
                              reps = exerciseSet.reps || 0
                            }

                            return setAcc + weight * reps
                          }, 0)
                        )
                      }, 0)
                    )
                  )}{' '}
                  {useUserStore.getState().preferences?.weightMetric || 'lbs'}
                </Txt>
              </View>
            </View>
          </>
        </MyBottomSheet>
      </SafeView>
      {shouldShowToolbar && (
        <Animated.View
          entering={SlideInDown.duration(150).damping(20)}
          exiting={SlideOutDown.duration(100)}
          collapsable={false}
        >
          <KeyboardToolbar
            theme={{
              ...DefaultKeyboardToolbarTheme,
              dark: {
                ...DefaultKeyboardToolbarTheme.dark,
                primary: Colors.dark.text,
                background: Colors.dark.background,
              },
              light: {
                ...DefaultKeyboardToolbarTheme.light,
                primary: Colors.light.text,
                background: Colors.light.background,
              },
            }}
          >
            <KeyboardToolbar.Content>
              {focusedInput && focusedInput.field === 'exerciseNumber' ? (
                <GlassView
                  style={tw`flex-row items-center justify-between gap-3 px-4 rounded-full`}
                >
                  <View style={tw`flex-row items-center gap-1`}>
                    <Button
                      onPress={() => {
                        const currentValue =
                          parseInt(exerciseNumberInputValue) || 1
                        const newValue = Math.max(currentValue - 1, 1)
                        setExerciseNumberInputValue(newValue.toString())
                      }}
                      twcn="p-2"
                    >
                      <SFIcon
                        name="minus"
                        size={24}
                        color={Colors.red}
                      />
                    </Button>
                    <Txt twcn="font-medium">1</Txt>
                    <Button
                      onPress={() => {
                        const currentValue =
                          parseInt(exerciseNumberInputValue) || 1
                        const maxNumber = workoutData.exercises.length
                        const newValue = Math.min(currentValue + 1, maxNumber)
                        setExerciseNumberInputValue(newValue.toString())
                      }}
                      twcn="p-2"
                    >
                      <SFIcon
                        name="plus"
                        size={24}
                        color={Colors.green}
                      />
                    </Button>
                  </View>
                  <Button
                    onPress={() => {
                      Keyboard.dismiss()
                      handleExerciseNumberSubmitRef.current?.()
                    }}
                  >
                    <SFIcon
                      name="checkmark"
                      size={24}
                      color={Colors.primary}
                    />
                  </Button>
                </GlassView>
              ) : focusedInput &&
                (focusedInput.field === 'weightLbs' ||
                  focusedInput.field === 'weightKg') ? (
                <GlassView
                  style={tw`flex-row items-center justify-between gap-3 px-2 rounded-full`}
                >
                  <View style={tw`flex-row items-center gap-2`}>
                    <KeyboardToolbar.Prev button={CustomLeftButton} />
                    <KeyboardToolbar.Next button={CustomRightButton} />
                  </View>
                  <View style={tw`flex-row gap-2 items-center`}>
                    <View style={tw`flex-row items-center gap-1`}>
                      <Button
                        onPress={() => adjustFocusedInputValue(false, 2.5)}
                        twcn="p-2"
                      >
                        <SFIcon
                          name="minus"
                          size={24}
                          color={Colors.red}
                        />
                      </Button>
                      <Txt twcn="font-medium">2.5</Txt>
                      <Button
                        onPress={() => adjustFocusedInputValue(true, 2.5)}
                        twcn="p-2"
                      >
                        <SFIcon
                          name="plus"
                          size={24}
                          color={Colors.green}
                        />
                      </Button>
                    </View>
                    <View style={tw`flex-row items-center gap-1`}>
                      <Button
                        onPress={() => adjustFocusedInputValue(false, 5)}
                        twcn="p-2"
                      >
                        <SFIcon
                          name="minus"
                          size={24}
                          color={Colors.red}
                        />
                      </Button>
                      <Txt twcn="font-medium">5</Txt>
                      <Button
                        onPress={() => adjustFocusedInputValue(true, 5)}
                        twcn="p-2"
                      >
                        <SFIcon
                          name="plus"
                          size={24}
                          color={Colors.green}
                        />
                      </Button>
                    </View>
                  </View>
                  <KeyboardToolbar.Done button={CustomDoneButton} />
                </GlassView>
              ) : (
                <GlassView
                  style={tw`flex-row items-center justify-between gap-3 px-2 rounded-full`}
                >
                  <View style={tw`flex-row items-center gap-4`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      <KeyboardToolbar.Prev button={CustomLeftButton} />
                      <KeyboardToolbar.Next button={CustomRightButton} />
                    </View>
                    <View style={tw`flex-row items-center gap-1`}>
                      <Button
                        onPress={() => adjustFocusedInputValue(false)}
                        twcn="p-2"
                      >
                        <SFIcon
                          name="minus"
                          size={24}
                          color={Colors.red}
                        />
                      </Button>
                      <Txt twcn="font-medium">
                        {focusedInput &&
                        (focusedInput.field === 'rpe' ||
                          focusedInput.field === 'rir')
                          ? '0.5'
                          : '1'}
                      </Txt>
                      <Button
                        onPress={() => adjustFocusedInputValue(true)}
                        twcn="p-2"
                      >
                        <SFIcon
                          name="plus"
                          size={24}
                          color={Colors.green}
                        />
                      </Button>
                    </View>
                  </View>
                  <KeyboardToolbar.Done button={CustomDoneButton} />
                </GlassView>
              )}
            </KeyboardToolbar.Content>
          </KeyboardToolbar>
        </Animated.View>
      )}
    </>
  )
}

export default WorkoutForm
