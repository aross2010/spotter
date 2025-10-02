import SafeView from '../../../components/safe-view'
import { View } from 'react-native'
import Button from '../../../components/button'
import tw from '../../../tw'
import { formatDate } from '../../../functions/formatted-date'
import { useEffect, useState } from 'react'
import { Calendar, MapPin } from 'lucide-react-native'
import { router, useNavigation } from 'expo-router'
import DatePicker from 'react-native-date-picker'
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

const WorkoutForm = () => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const navigation = useNavigation()
  const { theme } = useTheme()
  const { workoutData, setWorkoutData, addWorkout } = useWorkoutForm()
  const { updateWorkout } = useWorkout()
  const { fetchWithAuth } = useAuth()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const isEditing = !!id
  const [initialState, setInitialState] = useState<typeof workoutData | null>(
    null
  )

  const hasChanges = () => {
    if (!isEditing || !initialState) return true // For new workouts or before initial state is set, always allow saving

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

  useEffect(() => {
    const getWorkoutData = async () => {
      setIsLoading(true)
      try {
        const response = await fetchWithAuth(`${BASE_URL}/api/workouts/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const workout = await response.json()
        console.log('Workout Data: ', JSON.stringify(workout, null, 2))
        const workoutData = {
          ...workout,
          date: new Date(workout.date + 'T00:00:00'),
        }
        setWorkoutData(workoutData)
        setInitialState(workoutData)
      } catch (error: any) {
        Alert.alert('Error', error.message)
      } finally {
        setIsLoading(false)
      }
    }
    if (isEditing) getWorkoutData()
  }, [isEditing])

  useEffect(() => {
    const saveEnabled = hasChanges()

    navigation.setOptions({
      headerTitle: isEditing ? 'Edit Workout' : 'New Workout',
      headerRight: () => (
        <Button
          onPress={handleSubmitWorkout}
          hitSlop={12}
          accessibilityLabel="Save Workout"
          twcnText={`font-poppinsSemiBold ${saveEnabled ? 'text-primary dark:text-primary' : 'text-light-grayText dark:text-dark-grayText'}`}
          text={
            isEditing && isSaving
              ? 'Updating...'
              : isEditing
                ? 'Update'
                : isSaving
                  ? 'Saving...'
                  : 'Save'
          }
          disabled={isSaving || !saveEnabled}
        />
      ),
    })
  }, [workoutData, isSaving, isEditing])

  const handleSubmitWorkout = async () => {
    setIsSaving(true)
    try {
      if (isEditing) {
        await updateWorkout(id, workoutData)
      } else {
        console.log(
          'Submitting workout entry: ',
          JSON.stringify(workoutData, null, 2)
        )
        await addWorkout()
      }
      router.replace('/workouts')
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'Something went wrong')
    } finally {
      setIsSaving(false)
    }
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
          twcn="flex-1 bg-light-grayPrimary dark:bg-dark-grayPrimary border border-light-grayTertiary dark:border-dark-grayTertiary rounded-xl py-2.5 px-3 flex-row flex-row-reverse justify-center items-center gap-2"
          twcnText="text-xs font-poppinsMedium uppercase tracking-wide text-light-text dark:text-dark-text"
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
          twcn="flex-1 bg-light-grayPrimary dark:bg-dark-grayPrimary border border-light-grayTertiary dark:border-dark-grayTertiary rounded-xl py-2.5 px-3 flex-row flex-row-reverse justify-center items-center gap-2"
          twcnText={`text-xs font-poppinsMedium uppercase tracking-wide ${
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
    </SafeView>
  )
}

export default WorkoutForm
