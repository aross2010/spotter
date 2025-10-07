import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useUserStore } from '../stores/user-store'
import { useAuth } from './auth-context'
import { BASE_URL } from '../constants/auth'
import { Alert } from 'react-native'
import { toLocalDateString } from '../functions/formatted-date'
import { Tag } from '../utils/types'
import { Set, SetGrouping, WorkoutFormData } from './workout-form-context'

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

export type WorkoutDetails = Workout & {
  muscleGroupAnalysis: {
    muscleGroup: string
    percentage: number
  }[]
}

export type WorkoutMinimal = {
  id: string
  date: string
  location: string
  tags: string[]
  pinned: boolean
  name: string
  exercises: {
    name: string
    sets: number // 2 sets, 3 sets, etc.
    lowRepRange: number
    highRepRange: number // 6 - 8 reps the lowest and highest rep count for the ex., not including partials
  }[]
  status: 'completed' | 'planned' | 'active'
}

export type WorkoutName = {
  name: string
  used: number
}

type WorkoutFilters = {
  tags: string[]
  workoutNames: string[]
  exerciseNames: string[]
  locations: string[]
}

export type FilterOptions = {
  label: string
  type: 'tags' | 'workoutNames' | 'exerciseNames' | 'locations'
  used: number
}[]

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
  sortOrder: 'asc' | 'desc'
  setSortOrder: (order: 'asc' | 'desc') => void
  statusFilter: string | null
  setStatusFilter: (status: string | null) => void
  filters: WorkoutFilters
  updateFilters: (
    filterOption: FilterOptions[number],
    action: 'add' | 'remove'
  ) => void
  clearFilters: () => void
  deleteWorkout: (workoutId: string) => Promise<void>
  updateWorkout: (
    workoutId: string,
    workoutData: WorkoutFormData
  ) => Promise<void>
  getFilterOptions: () => Promise<void>
  filterOptions: FilterOptions
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
    locations: [],
  })
  const [filterOptions, setFilterOptions] = useState<FilterOptions>([])
  const { user } = useUserStore()
  const { fetchWithAuth } = useAuth()

  const PAGE_SIZE = 25

  const getFilterOptions = async () => {
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/api/workouts/filters/${user?.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      const data = await response.json()
      setFilterOptions(data)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  const updateFilters = (
    filterOption: FilterOptions[number],
    action: 'add' | 'remove'
  ) => {
    setFilters((prev) => {
      const { type, label } = filterOption
      const filterKey =
        type === 'tags'
          ? 'tags'
          : type === 'workoutNames'
            ? 'workoutNames'
            : type === 'exerciseNames'
              ? 'exerciseNames'
              : 'locations'

      if (action === 'add') {
        return {
          ...prev,
          [filterKey]: [...prev[filterKey], label],
        }
      } else {
        return {
          ...prev,
          [filterKey]: prev[filterKey].filter((item) => item !== label),
        }
      }
    })
  }

  const clearFilters = () => {
    setFilters({
      tags: [],
      workoutNames: [],
      exerciseNames: [],
      locations: [],
    })
  }

  const buildQueryParams = (
    page: number,
    tags: string[] = filters.tags,
    workoutNames: string[] = filters.workoutNames,
    exerciseNames: string[] = filters.exerciseNames,
    locations: string[] = filters.locations,
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
        params.append('tags', JSON.stringify(tags))
      }
      if (workoutNames.length > 0) {
        params.append('workoutNames', JSON.stringify(workoutNames))
      }
      if (exerciseNames.length > 0) {
        params.append('exerciseNames', JSON.stringify(exerciseNames))
      }
      if (locations.length > 0) {
        params.append('locations', JSON.stringify(locations))
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
    tags: string[] = filters.tags,
    workoutNames: string[] = filters.workoutNames,
    exerciseNames: string[] = filters.exerciseNames,
    locations: string[] = filters.locations,
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
        locations,
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

  const applyFiltersAndSort = async () => {
    setCurrentPage(1)
    setHasMore(true)
    await fetchWorkouts(
      1,
      false,
      filters.tags,
      filters.workoutNames,
      filters.exerciseNames,
      filters.locations,
      statusFilter,
      sortOrder
    )
  }

  // const updateCurrentWorkouts = (
  //   workoutId: string,
  //   updates: Partial<WorkoutMinimal>
  // ) => {
  //   setCurrentWorkouts((prev) => {
  //     const updatedWorkouts = prev.map((workout) =>
  //       workout.id === workoutId ? { ...workout, ...updates } : workout
  //     )

  //     // Sort: pinned first, then by date according to current sort order
  //     return updatedWorkouts.sort((a, b) => {
  //       if (a.pinned && !b.pinned) return -1
  //       if (!a.pinned && b.pinned) return 1

  //       const dateA = new Date(a.date)
  //       const dateB = new Date(b.date)

  //       return sortOrder === 'desc'
  //         ? dateB.getTime() - dateA.getTime()
  //         : dateA.getTime() - dateB.getTime()
  //     })
  //   })
  // }

  const deleteWorkout = async (workoutId: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            setIsLoading(true)
            try {
              const response = await fetchWithAuth(
                `${BASE_URL}/api/workouts/${workoutId}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                }
              )
              if (response.ok) {
                setCurrentWorkouts((prev) =>
                  prev.filter((workout) => workout.id !== workoutId)
                )
              }
            } catch (error: any) {
              Alert.alert('Error', error.message)
            } finally {
              setIsLoading(false)
            }
          },
          style: 'destructive',
        },
      ]
    )
  }

  const updateWorkout = async (
    workoutId: string,
    workoutData: WorkoutFormData
  ) => {
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/api/workouts/${workoutId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...workoutData,
            tags: workoutData.tags.map((tag: any) => tag.name),
            date: toLocalDateString(workoutData.date), // Send local date (YYYY-MM-DD)
          }),
        }
      )
      const workout = await response.json()
      await refreshWorkouts()
      return workout
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
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
    sortOrder,
    setSortOrder,
    statusFilter,
    setStatusFilter,
    filters,
    updateFilters,
    clearFilters,
    deleteWorkout,
    updateWorkout,
    getFilterOptions,
    filterOptions,
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
