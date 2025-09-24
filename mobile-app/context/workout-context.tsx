import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useUserStore } from '../stores/user-store'
import { useAuth } from './auth-context'
import { BASE_URL } from '../constants/auth'
import { Alert } from 'react-native'
import { Tag } from '../utils/types'
import { Set, SetGrouping } from './workout-form-context'

// export type NotebookEntry = {
//   id: string
//   userId: string
//   title?: string
//   body: string
//   date: string
//   createdAt: string
//   updatedAt?: string
//   pinned: boolean
//   tags: Tag[]
// }

type Exercise = {
  name: string
  isUnilateral: boolean
  sets: Set[]
}

export type Workout = {
  id: string
  userId: string
  date: string
  createdAt: string
  updatedAt?: string
  pinned: boolean
  tags: Tag[]
  name: string
  exercises: Exercise[]
  setGroupings: SetGrouping[]
  notes?: string
  location?: string
}

export type WorkoutMinimal = {
  id: string
  date: string
  location: string
  notes: string
  tags: string[]
  pinned: boolean
  name: string
  exercises: {
    name: string
    sets: number // 2 sets, 3 sets, etc.
    lowRepRange: number
    highRepRange: number // 6 - 8 reps the lowest and highest rep count for the ex., not including partials
  }[]
}

export type WorkoutName = {
  name: string
  used: number
}

type WorkoutFilters = {
  tags: Tag[]
  workoutNames: string[]
  exerciseNames: string[]
}

type WorkoutContextType = {
  currentWorkouts: WorkoutMinimal[]
  isLoading: boolean
  isLoadingMore: boolean
  hasLoaded: boolean
  hasMore: boolean
  initializeWorkouts: () => Promise<void>
  refreshWorkouts: () => Promise<void>
  loadMoreWorkouts: () => Promise<void>
  applyFiltersAndSort: (
    status?: string,
    order?: 'asc' | 'desc'
  ) => Promise<void>
  applyFilters: () => Promise<void>
  statusFilter: string | null
  sortOrder: 'asc' | 'desc'
  setSortOrder: (order: 'asc' | 'desc') => void
  filters: WorkoutFilters
  setFilters: (filters: WorkoutFilters) => void
  updateFilters: (updates: Partial<WorkoutFilters>) => void
  clearFilters: () => void
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined)

type WorkoutProviderProps = {
  children: ReactNode
}

export const WorkoutProvider = ({ children }: WorkoutProviderProps) => {
  const [currentWorkouts, setCurrentWorkouts] = useState<WorkoutMinimal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [filters, setFilters] = useState<WorkoutFilters>({
    tags: [],
    workoutNames: [],
    exerciseNames: [],
  })
  const { user } = useUserStore()
  const { fetchWithAuth } = useAuth()

  const PAGE_SIZE = 25

  // Filter helper methods
  const updateFilters = (updates: Partial<WorkoutFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }

  const clearFilters = () => {
    setFilters({
      tags: [],
      workoutNames: [],
      exerciseNames: [],
    })
  }

  const buildQueryParams = (
    page: number,
    tags: Tag[] = filters.tags,
    workoutNames: string[] = filters.workoutNames,
    exerciseNames: string[] = filters.exerciseNames,
    status: string | null = statusFilter,
    order: 'asc' | 'desc' = sortOrder,
    resetFilters: boolean = false
  ) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: PAGE_SIZE.toString(),
      sortBy: 'date',
      sortOrder: order,
    })

    if (!resetFilters) {
      if (tags.length > 0) {
        const tagNames = tags.map((tag) => tag.name)
        params.append('tags', JSON.stringify(tagNames))
      }
      if (workoutNames.length > 0) {
        params.append('workoutNames', JSON.stringify(workoutNames))
      }
      if (exerciseNames.length > 0) {
        params.append('exerciseNames', JSON.stringify(exerciseNames))
      }
      if (status) {
        params.append('status', status)
      }
    }

    return params.toString()
  }

  const fetchWorkouts = async (
    page: number = 1,
    append: boolean = false,
    tags: Tag[] = filters.tags,
    workoutNames: string[] = filters.workoutNames,
    exerciseNames: string[] = filters.exerciseNames,
    status: string | null = statusFilter,
    order: 'asc' | 'desc' = sortOrder
  ) => {
    if (!user) return

    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }

    try {
      const queryParams = buildQueryParams(
        page,
        tags,
        workoutNames,
        exerciseNames,
        status,
        order
      )
      const response = await fetchWithAuth(
        `${BASE_URL}/api/workouts/user/${user.id}?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()

      if (append) {
        setCurrentWorkouts((prev) => [...prev, ...data.workouts])
      } else {
        setCurrentWorkouts(data.workouts)
      }

      setHasMore(data.pagination.hasNextPage)
      setCurrentPage(data.pagination.page)
      setHasLoaded(true)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const initializeWorkouts = async () => {
    if (!hasLoaded && !isLoading) {
      await fetchWorkouts(1, false)
    }
  }

  const refreshWorkouts = async () => {
    setCurrentPage(1)
    setHasMore(true)
    await fetchWorkouts(1, false)
  }

  const loadMoreWorkouts = async () => {
    if (!hasMore || isLoadingMore) return
    await fetchWorkouts(currentPage + 1, true)
  }

  const applyFiltersAndSort = async (
    status?: string,
    order?: 'asc' | 'desc'
  ) => {
    setStatusFilter(status || null)
    setSortOrder(order || 'desc')
    setCurrentPage(1)
    setHasMore(true)
    await fetchWorkouts(
      1,
      false,
      filters.tags,
      filters.workoutNames,
      filters.exerciseNames,
      status || null,
      order || 'desc'
    )
  }

  const applyFilters = async () => {
    setCurrentPage(1)
    setHasMore(true)
    await fetchWorkouts(1, false)
  }

  const value: WorkoutContextType = {
    currentWorkouts,
    isLoading,
    isLoadingMore,
    hasLoaded,
    hasMore,
    initializeWorkouts,
    refreshWorkouts,
    loadMoreWorkouts,
    applyFiltersAndSort,
    applyFilters,
    statusFilter,
    sortOrder,
    setSortOrder,
    filters,
    setFilters,
    updateFilters,
    clearFilters,
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
