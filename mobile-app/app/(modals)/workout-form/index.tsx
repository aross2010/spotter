import SafeView from '../../../components/safe-view'
import { View } from 'react-native'
import Button from '../../../components/button'
import tw from '../../../tw'
import { formatDate } from '../../../functions/formatted-date'
import { HeaderBackButton } from '@react-navigation/elements'
import { useEffect, useState } from 'react'
import {
  Calendar,
  MapPin,
  Check,
  Circle,
  CircleDot,
  CircleCheck,
} from 'lucide-react-native'
import { router, useNavigation } from 'expo-router'
import DatePicker from 'react-native-date-picker'
import useTheme from '../../hooks/theme'
import WorkoutNameInput from '../../../components/workout-name-input'
import {
  useWorkoutForm,
  WorkoutFormData,
} from '../../../context/workout-form-context'
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
import { useWorkoutStore } from '../../../stores/workout-store'

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
  const navigation = useNavigation()
  const { theme } = useTheme()
  const { workoutData, setWorkoutData, addWorkout } = useWorkoutForm()
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
  const { triggerRefresh } = useWorkoutStore()

  const getWorkoutData = async () => {
    setIsLoading(true)
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/api/workouts/${mode === 'edit' ? id : cloneId}`,
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
    if (mode === 'edit' || mode === 'clone') getWorkoutData()
  }, [])

  useEffect(() => {
    const isValid = isValidWorkout()
    const saveEnabled = isValid && (mode === 'edit' ? hasChanges() : true)

    navigation.setOptions({
      headerTitle:
        mode === 'edit'
          ? 'Edit Workout'
          : mode === 'clone'
            ? 'Clone Workout'
            : 'New Workout',
      headerRight: () => (
        <View style={tw`flex-row items-center gap-2`}>
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
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="close workout form"
                twcnText={`font-poppinsSemiBold text-light-grayText dark:text-dark-grayText`}
                text="Cancel"
              />
            ),
    })
  }, [workoutData, isSaving, mode, isLoading, initialState, workoutId])

  const handleSubmitWorkout = async () => {
    setIsSaving(true)
    try {
      if (mode === 'create') {
        const res = await addWorkout()
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
          } else router.replace('/workouts')
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

  return isLoading ? (
    <Spinner />
  ) : (
    <SafeView
      keyboardAvoiding
      bottomOffset={200}
    >
      <View style={tw`flex-row gap-2`}>
        <Button
          text={formatDate(workoutData.date)}
          onPress={() => {
            setIsDatePickerOpen(true)
          }}
          hitSlop={12}
          twcn="flex-1 bg-light-grayPrimary dark:bg-dark-grayPrimary border border-light-grayTertiary/50 dark:border-dark-grayTertiary rounded-xl py-2 px-3 flex-row flex-row-reverse justify-center items-center gap-2"
          twcnText="text-xs  text-light-text dark:text-dark-text"
        >
          <Calendar
            size={16}
            color={theme.text}
          />
        </Button>
        <Button
          text={
            workoutData.location.length > 0
              ? workoutData.location
              : 'Location (optional)'
          }
          onPress={() => {
            router.push('/workout-form/location')
          }}
          hitSlop={12}
          twcn="flex-1 bg-light-grayPrimary dark:bg-dark-grayPrimary border border-light-grayTertiary/50 dark:border-dark-grayTertiary rounded-xl py-2 px-3 flex-row flex-row-reverse justify-center items-center gap-2"
          twcnText={`text-xs ${
            workoutData.location.length > 0
              ? 'text-light-text dark:text-dark-text'
              : 'text-light-grayText dark:text-dark-grayText'
          }`}
        >
          <MapPin
            size={16}
            color={
              workoutData.location.length > 0 ? theme.text : theme.grayText
            }
          />
        </Button>
      </View>

      <View style={tw`mt-4 flex-1 gap-6 justify-between`}>
        <WorkoutNameInput />
        <Exercises />
        <WorkoutNotes />
        <WorkoutTags />
      </View>

      <DatePicker
        modal
        open={isDatePickerOpen}
        date={workoutData.date}
        onConfirm={(date) => {
          setIsDatePickerOpen(false)
          setWorkoutData({ ...workoutData, date })
        }}
        mode="date"
        onCancel={() => {
          setIsDatePickerOpen(false)
        }}
      />

      <MyModal
        isOpen={showStatusMenu}
        setIsOpen={setShowStatusMenu}
      >
        <Txt twcn="font-poppinsMedium text-xs uppercase tracking-wide text-light-grayText dark:text-dark-grayText">
          Workout Status
        </Txt>
        <View style={tw``}>
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
  )
}

export default WorkoutForm
