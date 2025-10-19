import { MUSCLE_GROUPS } from '../constants/data'

export type Providers = 'apple' | 'google'

export type Provider = {
  id: string
  name: Providers
  email: string
}

export type User = {
  id: string
  firstName: string
  lastName?: string
  email: string
}

export type CompleteUser = {
  id: string
  firstName: string
  lastName?: string
  email: string
  providers: Provider[]
}

export type Tag = {
  id: string
  name: string
  userId: string
}

// for tag selector results
export type UsedTags = {
  id: string
  name: string
  used: number
}

export type NotebookEntry = {
  id: string
  userId: string
  title?: string
  body: string
  date: string
  createdAt: string
  updatedAt?: string
  pinned: boolean
  tags: Tag[]
}

export type Workout = {
  id: string
  userId: string
  name: string
  notes?: string
  date: string
  location?: string
  status: 'completed' | 'planned'
  createdAt: string
  updatedAt?: string
}

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export type ExerciseDetails = {
  id: string
  name: string
  primaryMuscleGroup: MuscleGroup
  secondaryMuscleGroups: MuscleGroup[]
  isUnilateral: boolean
  description?: string
  totalUserWorkouts: number
  history: {
    workoutId: string
    workoutName: string
    date: string
    sets: {
      // unilateral exercises will have 2x sets
      setNumber: number
      weight: number
      reps: number
      partials?: number
      intensity?: number // RPE or RIR based on user preference
    }[]
  }[]
  stats: {
    pr: number // weight in user pref
    totalSets: number
    totalReps: number
    totalWorkouts: number
    progressionChart: {
      // best set per workout, start with all time, can change to 1m, 3m, 6m, 1y
      date: string
      data: {
        workoutId: string
        weight: number // in user pref, y-axis value
        reps: number
        rpe?: number
        rir?: number
      }
    }[]
  }
}

export type ExerciseDetailsMini = {
  id: string
  description: string
  history: {
    // last 10 workouts with this exercise
    workoutId: string
    date: string
    sets: {
      setNumber: number
      weight: number
      reps: number
      partials?: number
      intensity?: number
    }
  }
}
