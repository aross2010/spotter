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

export type WorkoutName = {
  name: string
  used: number
}

export type ExerciseName = {
  name: string
  isUnilateral: boolean
  used: number
}

export type SetGroupingType = 'superset' | 'drop set'

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
  weightUnit: 'lbs' | 'kg'
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

const defaultWorkoutData: WorkoutFormData = {
  name: '',
  date: new Date(),
  location: '',
  tags: [],
  notes: '',
  weightUnit: 'lbs',
  exercises: [
    {
      name: 'Bulgarian Split Squats Squats',
      isUnilateral: true,
      existing: true,
      sets: [
        {
          setNumber: 1,
          id: nanoid(),
          weightLbs: 255,
          leftReps: 6,
          rightReps: 6,
        },
        {
          setNumber: 2,
          id: nanoid(),
          weightLbs: 255,
          leftReps: 6,
          rightReps: 6,
        },
      ],
    },
    {
      name: 'Leg Extensions',
      isUnilateral: false,
      existing: true,
      sets: [
        {
          setNumber: 1,
          id: nanoid(),
          weightLbs: 100,
          reps: 12,
        },
        {
          setNumber: 2,
          id: nanoid(),
          weightLbs: 100,
          reps: 12,
        },
      ],
    },
    {
      name: 'Sissy Squats',
      isUnilateral: false,
      existing: true,
      sets: [
        {
          setNumber: 1,
          id: nanoid(),
          reps: 12,
        },
        {
          setNumber: 2,
          id: nanoid(),
          reps: 12,
        },
      ],
    },

    {
      name: 'Calf Extensions',
      isUnilateral: false,
      existing: true,
      sets: [
        {
          setNumber: 1,
          id: nanoid(),
          reps: 12,
          weightLbs: 90,
        },
        {
          setNumber: 2,
          id: nanoid(),
          reps: 12,
          weightLbs: 90,
        },
      ],
    },
  ],

  setGroupings: [],
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
  const [workoutData, setWorkoutData] =
    useState<WorkoutFormData>(defaultWorkoutData)
  const [exerciseNames, setExerciseNames] = useState<ExerciseName[]>([])
  const [workoutNames, setWorkoutNames] = useState<WorkoutName[]>([])
  const [newlyAddedExerciseNumber, setNewlyAddedExerciseNumber] = useState<
    number | null
  >(null)
  const { user } = useUserStore()
  const { fetchWithAuth } = useAuth()

  useEffect(() => {
    console.log('Workout Data Updated:', JSON.stringify(workoutData))
  }, [workoutData])

  useEffect(() => {
    getNames()
  }, []) // add workouts dependency

  const updateWorkoutData = (updates: Partial<WorkoutFormData>) => {
    setWorkoutData((prev) => ({ ...prev, ...updates }))
  }

  const resetWorkoutData = () => {
    setWorkoutData(defaultWorkoutData)
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

      const { exerciseNames, workoutNames } = await response.json()
      setExerciseNames(exerciseNames)
      setWorkoutNames(workoutNames)
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
  }

  return (
    <WorkoutFormContext.Provider value={value}>
      {children}
    </WorkoutFormContext.Provider>
  )
}
