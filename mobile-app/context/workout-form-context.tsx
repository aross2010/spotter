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

export type WorkoutName = {
  name: string
  used: number
}

export type ExerciseName = {
  name: string
  used: number
}

export type SetGroupingType = 'superset' | 'drop set'

export type Set = {
  setNumber: number
  weight?: number // lbs or kg - depending on user preference
  reps?: number
  leftReps?: number // for unilateral exercises
  rightReps?: number // for unilateral exercises
  rpe?: number
  rir?: number
  partialReps?: number
  cheatReps?: number
}

export type SetGrouping = {
  groupingType: SetGroupingType
  groupSets: {
    exerciseNumber: number
    setNumber: number
  }
}

export type Exercise = {
  name: string
  isUnilateral: boolean
  sets: Set[]
}

export type WorkoutFormData = {
  name: string
  date: Date
  location: string
  tags: string[]
  notes: string
  exercises: Exercise[]
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
}

const starterExercise = {
  name: '',
  isUnilateral: false,
  sets: [
    {
      setNumber: 1,
    },
  ],
  setGroupings: [],
}

const defaultWorkoutData: WorkoutFormData = {
  name: '',
  date: new Date(),
  location: '',
  tags: [],
  notes: '',
  exercises: [starterExercise],
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
  const { user } = useUserStore()
  const { fetchWithAuth } = useAuth()

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
  }

  return (
    <WorkoutFormContext.Provider value={value}>
      {children}
    </WorkoutFormContext.Provider>
  )
}
