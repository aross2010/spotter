import SafeView from '../../../components/safe-view'
import {
  View,
  Keyboard,
  Platform,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native'
import Button from '../../../components/button'
import tw from '../../../tw'
import { formatDate } from '../../../functions/formatted-date'
import { HeaderBackButton } from '@react-navigation/elements'
import { useCallback, useEffect, useState } from 'react'
import {
  DefaultKeyboardToolbarTheme,
  KeyboardToolbar,
  KeyboardToolbarProps,
} from 'react-native-keyboard-controller'
import {
  Calendar,
  MapPin,
  Circle,
  CircleDot,
  CircleCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Check,
} from 'lucide-react-native'
import { router, useNavigation } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import useTheme from '../../hooks/theme'
import WorkoutNameInput from '../../../components/workout-name-input'
import { useWorkoutForm } from '../../../context/workout-form-context'
import Exercises from '../../../components/exercises'
import WorkoutNotes from '../../../components/workout-notes'
import WorkoutTags from '../../../components/workout-tags'
import { Alert } from 'react-native'
import { useWorkout } from '../../../context/workout-context'
import { useLocalSearchParams } from 'expo-router'
import { useAuth } from '../../../context/auth-context'
import { BASE_URL } from '../../../constants/auth'
import Spinner from '../../../components/activity-indicator'
import Txt from '../../../components/text'
import MyModal from '../../../components/modal'
import Colors from '../../../constants/colors'
import {
  useHomeDataStore,
  useWorkoutStore,
  useWorkoutTabStore,
} from '../../../stores/workout-store'
import { WorkoutFormData } from '../../../utils/types'
import { useExerciseStore } from '../../../stores/exercise-store'
import { capString } from '../../../functions/cap-string'

const statusOptions = [
  {
    value: 'completed' as const,
    label: 'Completed',
    icon: CircleCheck,
  },
  {
    value: 'planned' as const,
    label: 'Planned',
    icon: Circle,
  },
  {
    value: 'active' as const,
    label: 'Active',
    icon: CircleDot,
  },
]

const WorkoutForm = () => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [isNotesActive, setIsNotesActive] = useState(false)
  const navigation = useNavigation()
  const { theme, colorScheme } = useTheme()
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
  const { updateWorkout, refreshWorkouts } = useWorkout()
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
  const { triggerRefresh } = useWorkoutStore()
  const { triggerRefresh: triggerHomeDataRefresh } = useHomeDataStore()
  const { triggerRefresh: triggerExerciseDetailsRefresh } = useExerciseStore()
  const { triggerRefresh: triggerWorkoutTabRefresh } = useWorkoutTabStore()
  const handleCancelForm = useCallback(() => {
    resetWorkoutFormContext()
    router.back()
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
  }, [])

  const hasChanges = () => {
    if (!initialState) return true // Brand new workout, no changes to compare against

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
      headerTitle:
        mode === 'edit'
          ? 'Edit Workout'
          : mode === 'clone'
            ? 'New Workout'
            : 'New Workout',
      headerRight: () => (
        <View style={tw`flex-row items-center gap-3`}>
          {!isLoading && (
            <Button
              onPress={() => setShowStatusMenu(true)}
              hitSlop={12}
              twcn="p-1.5 rounded-xl bg-primary/10"
            >
              {(() => {
                const StatusIcon = statusOptions.find(
                  (opt) => opt.value === workoutData.status
                )?.icon
                return StatusIcon ? (
                  <StatusIcon
                    size={16}
                    color={Colors.primary}
                  />
                ) : null
              })()}
            </Button>
          )}

          <Button
            onPress={handleSubmitWorkout}
            hitSlop={12}
            accessibilityLabel="Save Workout"
            twcnText={`font-poppinsSemiBold ${saveEnabled ? 'text-primary dark:text-primary' : 'text-light-grayText dark:text-dark-grayText'}`}
            text={
              mode !== 'create' && isSaving
                ? 'Updating...'
                : mode === 'edit'
                  ? 'Update'
                  : isSaving
                    ? 'Saving...'
                    : 'Save'
            }
            disabled={isSaving || !saveEnabled}
          />
        </View>
      ),
      headerLeft:
        from === 'workout-details'
          ? () => (
              <HeaderBackButton
                displayMode="minimal"
                tintColor={Colors.primary}
                onPress={() => router.back()}
                disabled={isSaving}
              />
            )
          : () => (
              <Button
                onPress={handleCancelForm}
                hitSlop={12}
                accessibilityLabel="close workout form"
                twcnText={`font-poppinsSemiBold text-light-grayText dark:text-dark-grayText`}
                text="Cancel"
                disabled={isSaving}
              />
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
        if (workoutData.status === 'active') {
          setInitialState({ ...workoutData })
          if (res?.id) {
            setWorkoutId(res.id)
            setMode('edit') // Transition to edit mode after first save
          }
        } else router.replace('/workouts')
      } else if (mode === 'edit' && workoutId) {
        await updateWorkout(workoutId, workoutData)
        if (workoutData.status === 'active') {
          setInitialState({ ...workoutData })
        } else {
          if (from === 'workout-details') {
            triggerRefresh()
            router.back()
          } else if (from === 'home') {
            triggerHomeDataRefresh()
            router.back()
          } else if (from == 'exercise') {
            triggerExerciseDetailsRefresh()
            triggerWorkoutTabRefresh()
          } else {
            triggerWorkoutTabRefresh()
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
    setShowStatusMenu(false)
  }

  const CustomLeftButton: KeyboardToolbarProps['button'] = ({
    children,
    onPress,
  }) => (
    <Button onPress={onPress}>
      <ChevronLeft
        size={32}
        color={Colors.primary}
      />
    </Button>
  )

  const CustomRightButton: KeyboardToolbarProps['button'] = ({
    children,
    onPress,
  }) => (
    <Button onPress={onPress}>
      <ChevronRight
        size={32}
        color={Colors.primary}
      />
    </Button>
  )

  const CustomDoneButton: KeyboardToolbarProps['button'] = ({
    children,
    onPress,
  }) => (
    <Button onPress={onPress}>
      <Check
        size={32}
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
      >
        <View style={tw`gap-4 flex-row items-center`}>
          <Button
            text={formatDate(workoutData.date)}
            onPress={() => {
              setIsDatePickerOpen(true)
            }}
            hitSlop={12}
            twcn="flex-row-reverse items-center gap-1"
            twcnText="font-poppinsSemiBold text-primary dark:text-primary"
          >
            <Calendar
              size={16}
              color={Colors.primary}
            />
          </Button>

          <Button
            text={
              workoutData.location.length > 0
                ? capString(workoutData.location, 20)
                : 'Add location'
            }
            onPress={() => {
              router.push('/workout-form/location')
            }}
            hitSlop={12}
            twcn="flex-row-reverse items-center gap-1"
            twcnText={`font-poppinsSemiBold text-primary dark:text-primary
            `}
          >
            <MapPin
              size={16}
              color={Colors.primary}
            />
          </Button>
        </View>

        <View style={tw`mt-2 flex-1 gap-4 justify-between`}>
          <WorkoutNameInput />
          <Exercises />
          <View
            style={tw`${isNotesActive || workoutData.notes ? 'gap-6' : 'gap-4 flex-row'}`}
          >
            <WorkoutNotes
              isNotesActive={isNotesActive}
              setIsNotesActive={setIsNotesActive}
            />

            <WorkoutTags />
          </View>
        </View>

        <Modal
          visible={isDatePickerOpen}
          transparent
          animationType="fade"
        >
          <Pressable
            style={tw`flex-1 justify-center items-center bg-black/50`}
            onPress={() => setIsDatePickerOpen(false)}
          >
            <TouchableWithoutFeedback>
              <View
                style={tw`bg-light-background dark:bg-dark-background rounded-2xl p-3 shadow-lg`}
              >
                <DateTimePicker
                  value={workoutData.date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
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
                {Platform.OS === 'ios' && (
                  <Button
                    text="Done"
                    onPress={() => setIsDatePickerOpen(false)}
                    twcn="mt-2 bg-primary rounded-xl p-3"
                    twcnText="text-center font-poppinsSemiBold text-dark-text"
                  />
                )}
              </View>
            </TouchableWithoutFeedback>
          </Pressable>
        </Modal>

        <MyModal
          isOpen={showStatusMenu}
          setIsOpen={setShowStatusMenu}
        >
          <Txt twcn="font-poppinsMedium ">Workout Status</Txt>
          <View>
            {statusOptions.map((option) => {
              const isSelected = workoutData.status === option.value
              const StatusIcon = option.icon

              return (
                <Button
                  key={option.value}
                  onPress={() => handleStatusChange(option.value)}
                  twcn={`flex-row items-center gap-2 p-3 rounded-xl ${
                    isSelected ? 'bg-primary/10' : ''
                  }`}
                >
                  <StatusIcon
                    size={20}
                    color={isSelected ? Colors.primary : theme.text}
                  />
                  <Txt twcn="text-sm">{option.label}</Txt>
                </Button>
              )
            })}
          </View>
        </MyModal>
      </SafeView>
      <View
        collapsable={false}
        pointerEvents={shouldShowToolbar ? 'auto' : 'none'}
        style={!shouldShowToolbar ? { height: 0, opacity: 0 } : undefined}
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
              <View
                style={tw`flex-row items-center justify-between gap-3 px-2 bg-white dark:bg-dark-grayPrimary rounded-full border border-light-grayBorder dark:border-dark-grayBorder`}
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
                    <Minus
                      size={24}
                      color={Colors.red}
                    />
                  </Button>
                  <Txt twcn="font-poppinsMedium">1</Txt>
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
                    <Plus
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
                  <Check
                    size={32}
                    color={Colors.primary}
                  />
                </Button>
              </View>
            ) : focusedInput &&
              (focusedInput.field === 'weightLbs' ||
                focusedInput.field === 'weightKg') ? (
              <View
                style={tw`flex-row items-center justify-between gap-3 px-2 bg-white dark:bg-dark-grayPrimary rounded-full border border-light-grayBorder dark:border-dark-grayBorder`}
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
                      <Minus
                        size={24}
                        color={Colors.red}
                      />
                    </Button>
                    <Txt twcn="font-poppinsMedium">2.5</Txt>
                    <Button
                      onPress={() => adjustFocusedInputValue(true, 2.5)}
                      twcn="p-2"
                    >
                      <Plus
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
                      <Minus
                        size={24}
                        color={Colors.red}
                      />
                    </Button>
                    <Txt twcn="font-poppinsMedium">5</Txt>
                    <Button
                      onPress={() => adjustFocusedInputValue(true, 5)}
                      twcn="p-2"
                    >
                      <Plus
                        size={24}
                        color={Colors.green}
                      />
                    </Button>
                  </View>
                </View>
                <KeyboardToolbar.Done button={CustomDoneButton} />
              </View>
            ) : (
              <View
                style={tw`flex-row items-center justify-between gap-3 px-2 bg-white dark:bg-dark-grayPrimary rounded-full border border-light-grayBorder dark:border-dark-grayBorder`}
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
                      <Minus
                        size={24}
                        color={Colors.red}
                      />
                    </Button>
                    <Txt twcn="font-poppinsMedium">
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
                      <Plus
                        size={24}
                        color={Colors.green}
                      />
                    </Button>
                  </View>
                </View>
                <KeyboardToolbar.Done button={CustomDoneButton} />
              </View>
            )}
          </KeyboardToolbar.Content>
        </KeyboardToolbar>
      </View>
    </>
  )
}

export default WorkoutForm
