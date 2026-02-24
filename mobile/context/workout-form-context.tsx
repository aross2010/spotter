import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from 'react'
import { useUserStore } from '../stores/user-store'
import { useAuth } from './auth-context'
import { BASE_URL } from '../constants/auth'
import { Alert, AppState } from 'react-native'
import { registerContextResetter } from '../utils/context-manager'
import { nanoid } from 'nanoid/non-secure'
import {
  WorkoutFormData,
  WorkoutName,
  ExerciseName,
  TagWithCount,
} from '../utils/types'
import { useWorkout } from './workout-context'
import { toLocalDateString } from '../functions/formatted-date'

type FocusedInputType = {
  exerciseIndex: number
  setIndex: number
  field: string
  isLeftSide?: boolean
} | null

type WorkoutFormContextType = {
  workoutData: WorkoutFormData
  setWorkoutData: React.Dispatch<React.SetStateAction<WorkoutFormData>>
  updateWorkoutData: (updates: Partial<WorkoutFormData>) => void
  workoutNames: WorkoutName[]
  exerciseNames: ExerciseName[]
  newlyAddedExerciseNumber: number | null
  setNewlyAddedExerciseNumber: (exerciseNumber: number | null) => void
  addWorkout: (
    silent?: boolean,
  ) => Promise<{ id: string; message: string } | undefined>
  locations: UsedLocations[]
  focusedInput: FocusedInputType
  setFocusedInput: (input: FocusedInputType) => void
  adjustFocusedInputValue: (increment: boolean, customStep?: number) => void
  exerciseNumberInputValue: string
  setExerciseNumberInputValue: (value: string) => void
  handleExerciseNumberSubmitRef: React.MutableRefObject<(() => void) | null>
  getNames: () => Promise<void>
  userTags: TagWithCount[]
  setUserTags: React.Dispatch<React.SetStateAction<TagWithCount[]>>
  updateExerciseDetails: (
    exerciseIndex: number,
    details: any,
    loading: boolean,
  ) => void
  prefetchAllExerciseHistories: (data?: WorkoutFormData) => Promise<void>
  resetWorkoutFormContext: () => void
}

type UsedLocations = {
  location: string
  used: number
}

const starterExercise = {
  name: '',
  isUnilateral: false,
  sets: [
    {
      setNumber: 1,
      id: nanoid(),
    },
  ],
  details: {
    loading: false,
    data: null,
  },
}

const WorkoutFormContext = createContext<WorkoutFormContextType | undefined>(
  undefined,
)

export const useWorkoutForm = () => {
  const context = useContext(WorkoutFormContext)
  if (!context) {
    throw new Error('useWorkoutForm must be used within a WorkoutFormProvider')
  }
  return context
}

type WorkoutFormProviderProps = {
  children: ReactNode
}

export const WorkoutFormProvider = ({ children }: WorkoutFormProviderProps) => {
  const { user, preferences } = useUserStore()
  const defaultWeightMetric = preferences?.weightMetric || 'lbs'
  const defaultLocation = preferences?.location || ''
  const defaultDistanceMetric = preferences?.distanceMetric || 'mi'
  const defaultUnilateralLogging = preferences?.unilateralLogging || 'sync'
  const defaultAutosaveActiveWorkouts =
    preferences?.autosaveActiveWorkouts || 'enabled'
  const [workoutData, setWorkoutData] = useState<WorkoutFormData>({
    name: '',
    date: new Date(),
    location: defaultLocation,
    tags: [],
    notes: '',
    weightUnit: defaultWeightMetric,
    distanceUnit: defaultDistanceMetric,
    exercises: [starterExercise],
    setGroupings: [],
    status: 'completed',
  })
  const [exerciseNames, setExerciseNames] = useState<ExerciseName[]>([])
  const [workoutNames, setWorkoutNames] = useState<WorkoutName[]>([])
  const [userTags, setUserTags] = useState<TagWithCount[]>([])
  const [locations, setLocations] = useState<UsedLocations[]>([])
  const [newlyAddedExerciseNumber, setNewlyAddedExerciseNumber] = useState<
    number | null
  >(null)
  const [focusedInput, setFocusedInput] = useState<FocusedInputType>(null)
  const [exerciseNumberInputValue, setExerciseNumberInputValue] = useState('')
  const handleExerciseNumberSubmitRef = useRef<(() => void) | null>(null)
  const { fetchWithAuth } = useAuth()
  const { refreshWorkouts } = useWorkout()

  // Sync preferences to workout form when they change
  // Only update if the current value matches the previous default (user hasn't manually changed it)
  const prevDefaultsRef = useRef({
    location: defaultLocation,
    weightMetric: defaultWeightMetric,
    distanceMetric: defaultDistanceMetric,
  })

  useEffect(() => {
    const prevDefaults = prevDefaultsRef.current

    setWorkoutData((prev) => {
      let updated = { ...prev }
      let hasChanges = false

      // Sync location
      if (defaultLocation !== prevDefaults.location) {
        if (prev.location === '' || prev.location === prevDefaults.location) {
          updated.location = defaultLocation
          hasChanges = true
        }
      }

      // Sync weight unit
      if (defaultWeightMetric !== prevDefaults.weightMetric) {
        if (prev.weightUnit === prevDefaults.weightMetric) {
          updated.weightUnit = defaultWeightMetric
          hasChanges = true
        }
      }

      // Sync distance unit
      if (defaultDistanceMetric !== prevDefaults.distanceMetric) {
        if (prev.distanceUnit === prevDefaults.distanceMetric) {
          updated.distanceUnit = defaultDistanceMetric
          hasChanges = true
        }
      }

      return hasChanges ? updated : prev
    })

    // Update refs
    prevDefaultsRef.current = {
      location: defaultLocation,
      weightMetric: defaultWeightMetric,
      distanceMetric: defaultDistanceMetric,
    }
  }, [defaultLocation, defaultWeightMetric, defaultDistanceMetric])

  // Note: unilateralLogging and autosaveActiveWorkouts are read directly from preferences
  // where needed, so they don't need to be synced to workoutData

  // add workouts dependency

  const adjustFocusedInputValue = (increment: boolean, customStep?: number) => {
    if (!focusedInput) return

    const { exerciseIndex, setIndex, field, isLeftSide } = focusedInput
    const currentExercise = workoutData.exercises[exerciseIndex]
    if (!currentExercise) return

    const currentSet = currentExercise.sets[setIndex]
    if (!currentSet) return

    const isUnilateral = currentExercise.isUnilateral
    const isSynced =
      currentExercise.isSynced ?? preferences?.unilateralLogging === 'sync'

    let currentValue: number | undefined
    let fieldToUpdate: string = field
    let leftFieldToUpdate: string | undefined
    let rightFieldToUpdate: string | undefined

    // Determine the current value and field to update
    if (isUnilateral && isLeftSide !== undefined) {
      if (field === 'reps') {
        fieldToUpdate = isLeftSide ? 'leftReps' : 'rightReps'
        leftFieldToUpdate = 'leftReps'
        rightFieldToUpdate = 'rightReps'
      } else if (field === 'partials') {
        fieldToUpdate = isLeftSide ? 'leftPartialReps' : 'rightPartialReps'
        leftFieldToUpdate = 'leftPartialReps'
        rightFieldToUpdate = 'rightPartialReps'
      } else if (field === 'rpe') {
        fieldToUpdate = isLeftSide ? 'leftRpe' : 'rightRpe'
        leftFieldToUpdate = 'leftRpe'
        rightFieldToUpdate = 'rightRpe'
      } else if (field === 'rir') {
        fieldToUpdate = isLeftSide ? 'leftRir' : 'rightRir'
        leftFieldToUpdate = 'leftRir'
        rightFieldToUpdate = 'rightRir'
      }
    } else {
      // For bilateral exercises, map 'partials' to 'partialReps'
      if (field === 'partials') fieldToUpdate = 'partialReps'
    }

    currentValue = currentSet[fieldToUpdate as keyof typeof currentSet] as
      | number
      | undefined

    // Calculate step based on field type or use custom step for weight
    let step: number
    if (
      customStep !== undefined &&
      (field === 'weightLbs' || field === 'weightKg')
    ) {
      // Use custom step for weight fields
      step = increment ? customStep : -customStep
    } else if (field === 'rpe' || field === 'rir') {
      // RPE and RIR: increment by 0.5
      step = increment ? 0.5 : -0.5
    } else {
      // Reps and partials: increment by 1
      step = increment ? 1 : -1
    }

    // Calculate new value
    let newValue: number
    if (currentValue === undefined || isNaN(currentValue)) {
      // If no current value, start from appropriate base
      if (increment) {
        if (field === 'rpe' || field === 'rir') {
          newValue = 0.5
        } else if (customStep !== undefined) {
          newValue = customStep
        } else {
          newValue = 1
        }
      } else {
        newValue = 0
      }
    } else {
      newValue = Math.max(0, currentValue + step)

      // Cap RPE and RIR at 10
      if (field === 'rpe' || field === 'rir') {
        newValue = Math.min(10, newValue)
      }
    }

    // Update the value
    const updatedExercises = [...workoutData.exercises]
    const updatedSets = [...updatedExercises[exerciseIndex].sets]

    // Update both left and right at the same time for sync mode
    if (isUnilateral && isSynced && leftFieldToUpdate && rightFieldToUpdate) {
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [leftFieldToUpdate]: newValue,
        [rightFieldToUpdate]: newValue,
      } as any
    } else {
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [fieldToUpdate]: newValue,
      } as any
    }

    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      sets: updatedSets,
    }

    setWorkoutData({
      ...workoutData,
      exercises: updatedExercises,
    })
  }

  const addWorkout = async (silent?: boolean) => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/api/workouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...workoutData,
          tags: workoutData.tags.map((tag) => tag.name),
          date: toLocalDateString(workoutData.date), // Send local date (YYYY-MM-DD)
        }),
      })
      const workout = await response.json()
      await refreshWorkouts()
      return workout
    } catch (error: any) {
      const isBackgrounded = AppState.currentState !== 'active'
      const isNetworkError =
        error.message?.includes('Network request failed') ||
        error.message?.includes('Aborted') ||
        error.name === 'AbortError'
      if (!(silent && (isBackgrounded || isNetworkError))) {
        Alert.alert('Error adding workout:', error.message)
      }
    }
  }

  const updateWorkoutData = (updates: Partial<WorkoutFormData>) => {
    setWorkoutData((prev) => ({ ...prev, ...updates }))
  }

  const getNames = async () => {
    if (!user) return

    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/api/workouts/names/${user.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      const { exerciseNames, workoutNames, locations, tags } =
        await response.json()
      setExerciseNames(exerciseNames)
      setWorkoutNames(workoutNames)
      setLocations(locations)
      setUserTags(tags)
    } catch (error: any) {
      console.error('Error fetching exercise names:', error)
      Alert.alert('Error fetching exercise names:', error.message)
    }
  }

  const resetWorkoutFormContext = () => {
    setWorkoutData({
      name: '',
      date: new Date(),
      location: defaultLocation,
      tags: [],
      notes: '',
      exercises: [starterExercise],
      weightUnit: defaultWeightMetric,
      distanceUnit: defaultDistanceMetric,
      setGroupings: [],
      status: 'completed',
    })
    setExerciseNames([])
    setWorkoutNames([])
    setUserTags([])
    setLocations([])
    setNewlyAddedExerciseNumber(null)
    setFocusedInput(null)
  }

  const updateExerciseDetails = (
    exerciseIndex: number,
    details: any,
    loading: boolean,
  ) => {
    setWorkoutData((prev) => {
      const updatedExercises = [...prev.exercises]
      if (updatedExercises[exerciseIndex]) {
        updatedExercises[exerciseIndex] = {
          ...updatedExercises[exerciseIndex],
          details: {
            loading,
            data: details,
          },
        }
      }
      return {
        ...prev,
        exercises: updatedExercises,
      }
    })
  }

  const prefetchAllExerciseHistories = async (data?: WorkoutFormData) => {
    const dataToUse = data || workoutData
    const weightMetric = preferences?.weightMetric || 'lbs'
    const intensityMetric = preferences?.intensityMetric || 'rpe'
    const workoutDate = dataToUse.date.toISOString().slice(0, 10)

    // Map exercises with their original indices
    const exercisesToFetch = dataToUse.exercises
      .map((exercise, index) => ({ exercise, index }))
      .filter(({ exercise }) => exercise.id && exercise.existing)

    // Mark all as loading using original indices
    exercisesToFetch.forEach(({ index }) => {
      updateExerciseDetails(index, null, true)
    })

    // Fetch all histories in parallel
    await Promise.all(
      exercisesToFetch.map(async ({ exercise, index }) => {
        try {
          const res = await fetchWithAuth(
            `${BASE_URL}/api/exercises/mini/${exercise.id}?weight=${weightMetric}&intensity=${intensityMetric}&date=${workoutDate}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            },
          )
          const data = await res.json()
          updateExerciseDetails(index, data, false)
        } catch (error) {
          console.error(
            `Error prefetching exercise history for ${exercise.name}:`,
            error,
          )
          updateExerciseDetails(index, null, false)
        }
      }),
    )
  }

  // Register reset function on mount
  useEffect(() => {
    registerContextResetter('resetWorkoutFormContext', resetWorkoutFormContext)
  }, [])

  const value = {
    workoutData,
    setWorkoutData,
    workoutNames,
    exerciseNames,
    updateWorkoutData,
    newlyAddedExerciseNumber,
    setNewlyAddedExerciseNumber,
    addWorkout,
    locations,
    focusedInput,
    setFocusedInput,
    adjustFocusedInputValue,
    exerciseNumberInputValue,
    setExerciseNumberInputValue,
    handleExerciseNumberSubmitRef,
    getNames,
    userTags,
    resetWorkoutFormContext,
    setUserTags,
    updateExerciseDetails,
    prefetchAllExerciseHistories,
  }

  return (
    <WorkoutFormContext.Provider value={value}>
      {children}
    </WorkoutFormContext.Provider>
  )
}
