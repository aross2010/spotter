import { MUSCLE_GROUPS } from '../constants/data'

export type Providers = 'apple' | 'google'

export type Provider = {
  id: string
  name: Providers
  email: string
}

export type UserProfile = {
  id: string | null
  firstName: string
  lastName?: string
  email: string
}

// for display only
export type Tag = {
  id: string
  name: string
  userId: string
}

// for tag selector results
export type TagWithCount = Tag & { used: number }

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

export type Exercise = {
  name: string
  isUnilateral: boolean
  sets: Set[]
}

export type TreadmillEntry = {
  duration: number // in seconds
  distanceMiles: number
  distanceKm: number
  averageSpeedMph: number
  averageSpeedKph: number
  averageIncline: number
  caloriesBurned: number
}

export type BikeEntry = {
  duration: number // in seconds
  distanceMiles: number
  distanceKm: number
  averageSpeedMph: number
  averageSpeedKph: number
  averageResistanceLevel: number
  caloriesBurned: number
}

export type StairClimberEntry = {
  duration: number // in seconds
  stepsClimbed: number
  caloriesBurned: number
  level: number
}

export type CardioEntry = {
  startOfWorkout?: boolean
  endOfWorkout?: boolean
  machineId: string
  entryData: TreadmillEntry | BikeEntry | StairClimberEntry
}

export type WorkoutStatus = 'completed' | 'planned' | 'active'

// for workout details page
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
  status: WorkoutStatus
  cardioEntries?: CardioEntry[]
}

type ExerciseInForm = {
  name: string
  isUnilateral: boolean
  existing?: boolean // whether this exercise already exists in the user's exercise names
  id?: string // existing exercise ID
  sets: Set[]
  used?: number
}

export type WorkoutFormData = {
  name: string
  date: Date
  location: string
  tags: Tag[]
  notes: string
  exercises: ExerciseInForm[]
  weightUnit: 'lbs' | 'kgs'
  distanceUnit: 'mi' | 'km'
  setGroupings: SetGrouping[]
  status: WorkoutStatus
  cardioEntries?: CardioEntry[]
}

// for the workout tab workouts
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
  status: WorkoutStatus
}

export type WorkoutName = {
  name: string
  used: number
}

export type ExerciseName = {
  id: string
  name: string
  isUnilateral: boolean
  used: number
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

export type ActivityCalendar = {
  [date: string]: {
    workouts: {
      status: WorkoutStatus
      workoutId: string
    }[]
  }
}

export type HomeData = {
  totalWorkouts: number
  totalReps: number
  totalSets: number
  totalExercises: number
  featuredWorkout: {
    workout: WorkoutMinimal | null
    status: 'none' | 'most recent' | 'upcoming' | 'current' // try to get current workout first (active and same day), then upcoming (any workout marked as planned in the future or today), then most recent (last completed wotkout), else none (prompt to create)
  }
  activityCalendar: ActivityCalendar
}
