import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react'
import { useUserStore } from '../stores/user-store'
import { useAuth } from './auth-context'
import { BASE_URL } from '../constants/auth'
import { Alert } from 'react-native'
import { nanoid } from 'nanoid/non-secure'
import { Tag } from '../utils/types'
import { useWorkout } from './workout-context'
import { toLocalDateString } from '../functions/formatted-date'

export type WorkoutName = {
  name: string
  used: number
}

export type ExerciseName = {
  name: string
  isUnilateral: boolean
  used: number
}

export type SetGroupingType = 'superset' | 'dropset'

export type Set = {
  setNumber: number
  weightLbs?: number // lbs or kg - depending on user preference
  weightKg?: number
  reps?: number
  leftReps?: number
  rightReps?: number
  rpe?: number
  leftRpe?: number
  rightRpe?: number
  rir?: number
  leftRir?: number
  rightRir?: number
  partialReps?: number
  leftPartialReps?: number
  rightPartialReps?: number
  cheatReps?: number
  id: string
}

export type SetGrouping = {
  groupingType: SetGroupingType
  groupSets: {
    exerciseNumber: number
    setNumber: number
  }[]
}

// leave the isUnilateral button for new exercises only, not existing ones
export type Exercise = {
  name: string
  isUnilateral: boolean
  existing?: boolean // whether this exercise already exists in the user's exercise names
  sets: Set[]
}

export type WorkoutFormData = {
  name: string
  date: Date
  location: string
  tags: Tag[]
  notes: string
  exercises: Exercise[]
  weightUnit: 'lbs' | 'kgs'
  setGroupings: SetGrouping[]
  status?: 'completed' | 'planned'
}

type WorkoutFormContextType = {
  workoutData: WorkoutFormData
  setWorkoutData: React.Dispatch<React.SetStateAction<WorkoutFormData>>
  updateWorkoutData: (updates: Partial<WorkoutFormData>) => void
  resetWorkoutData: () => void
  workoutNames: WorkoutName[]
  exerciseNames: ExerciseName[]
  newlyAddedExerciseNumber: number | null
  setNewlyAddedExerciseNumber: (exerciseNumber: number | null) => void
  addWorkout: () => Promise<void>
  locations: UsedLocations[]
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
}

const WorkoutFormContext = createContext<WorkoutFormContextType | undefined>(
  undefined
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
  const [workoutData, setWorkoutData] = useState<WorkoutFormData>({
    name: '',
    date: new Date(),
    location: '',
    tags: [],
    notes: '',
    weightUnit: defaultWeightMetric,
    exercises: [starterExercise],
    setGroupings: [],
  })
  const [exerciseNames, setExerciseNames] = useState<ExerciseName[]>([])
  const [workoutNames, setWorkoutNames] = useState<WorkoutName[]>([])
  const [locations, setLocations] = useState<UsedLocations[]>([])
  const [newlyAddedExerciseNumber, setNewlyAddedExerciseNumber] = useState<
    number | null
  >(null)
  const { fetchWithAuth } = useAuth()
  const { refreshWorkouts } = useWorkout()

  useEffect(() => {
    console.log('Workout Data Updated:', JSON.stringify(workoutData))
  }, [workoutData])

  useEffect(() => {
    getNames()
  }, []) // add workouts dependency

  const addWorkout = async () => {
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
      await refreshWorkouts()
    } catch (error: any) {
      Alert.alert('Error adding workout:', error.message)
    }
  }

  const updateWorkoutData = (updates: Partial<WorkoutFormData>) => {
    setWorkoutData((prev) => ({ ...prev, ...updates }))
  }

  const resetWorkoutData = () => {
    setWorkoutData({
      name: '',
      date: new Date(),
      location: '',
      tags: [],
      notes: '',
      weightUnit: defaultWeightMetric,
      exercises: [starterExercise],
      setGroupings: [],
    })
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
        }
      )

      const { exerciseNames, workoutNames, locations } = await response.json()
      setExerciseNames(exerciseNames)
      setWorkoutNames(workoutNames)
      setLocations(locations)
    } catch (error: any) {
      console.error('Error fetching exercise names:', error)
      Alert.alert('Error fetching exercise names:', error.message)
    }
  }

  const value = {
    workoutData,
    setWorkoutData,
    workoutNames,
    exerciseNames,
    updateWorkoutData,
    resetWorkoutData,
    newlyAddedExerciseNumber,
    setNewlyAddedExerciseNumber,
    addWorkout,
    locations,
  }

  return (
    <WorkoutFormContext.Provider value={value}>
      {children}
    </WorkoutFormContext.Provider>
  )
}
