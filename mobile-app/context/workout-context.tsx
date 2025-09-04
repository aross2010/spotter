import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Workout } from '../utils/types'
import { useUserStore } from '../stores/user-store'
import { useAuth } from './auth-context'
import { BASE_URL } from '../constants/auth'
import { Alert } from 'react-native'

type WorkoutData = Omit<Workout, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

export type WorkoutName = {
  name: string
  used: number
}

type WorkoutContextType = {
  currentWorkouts: Workout[]
  isLoading: boolean
  isLoadingMore: boolean
  hasLoaded: boolean
  hasMore: boolean
  initializeWorkouts: () => Promise<void>
  refreshWorkouts: () => Promise<void>
  loadMoreWorkouts: () => Promise<void>
  updateWorkout: (
    workoutId: string,
    workoutToUpdate: WorkoutData
  ) => Promise<void>
  deleteWorkout: (workoutId: string) => Promise<void>
  addWorkout: (newWorkout: WorkoutData) => Promise<void>
  fetchWorkoutNames: () => Promise<WorkoutName[]>
  applyFiltersAndSort: (
    status?: string,
    order?: 'asc' | 'desc'
  ) => Promise<void>
  statusFilter: string | null
  sortOrder: 'asc' | 'desc'
  setSortOrder: (order: 'asc' | 'desc') => void
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined)

type WorkoutProviderProps = {
  children: ReactNode
}

export const WorkoutProvider = ({ children }: WorkoutProviderProps) => {
  const [currentWorkouts, setCurrentWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const { user } = useUserStore()
  const { fetchWithAuth } = useAuth()

  const initializeWorkouts = async () => {}

  const refreshWorkouts = async () => {}

  const loadMoreWorkouts = async () => {}

  const fetchWorkoutNames = async (): Promise<WorkoutName[]> => {
    if (!user?.id) {
      return []
    }
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
      const workoutNames = (await response.json()) as WorkoutName[]
      return workoutNames
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }

    return []
  }

  const applyFiltersAndSort = async (
    status?: string,
    order?: 'asc' | 'desc'
  ) => {}

  const updateWorkout = async (
    workoutId: string,
    workoutToUpdate: WorkoutData
  ) => {}

  const deleteWorkout = async (workoutId: string) => {}

  const addWorkout = async (newWorkout: WorkoutData) => {}

  const value: WorkoutContextType = {
    currentWorkouts,
    isLoading,
    isLoadingMore,
    hasLoaded,
    hasMore,
    initializeWorkouts,
    refreshWorkouts,
    loadMoreWorkouts,
    updateWorkout,
    deleteWorkout,
    addWorkout,
    fetchWorkoutNames,
    applyFiltersAndSort,
    statusFilter,
    sortOrder,
    setSortOrder,
  }

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  )
}

export const useWorkout = () => {
  const context = useContext(WorkoutContext)
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider')
  }
  return context
}
