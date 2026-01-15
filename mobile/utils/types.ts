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
}

export type ExerciseDetailsMini = {
  id: string
  name: string
  description?: string
  isUnilateral: boolean
  history?: {
    workoutId: string
    date: string
    exerciseNumber: number
    sets: {
      setNumber: number
      weight: number
      reps: number
      partials?: number
      intensity?: number
    }[]
  }[]
}

type ExerciseInForm = {
  name: string
  isUnilateral: boolean
  isSynced?: boolean // for unilateral exercises: whether left/right are synced
  existing?: boolean // whether this exercise already exists in the user's exercise names
  id?: string // existing exercise ID
  sets: Set[]
  used?: number
  details: {
    loading: boolean
    data: ExerciseDetailsMini | null
  }
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

export type BodyWeightData = {
  bodyWeightProgression: {
    date: string
    bodyWeight: number
  }[]
  lowestBodyWeight: number | null // null if one or less entries
  highestBodyWeight: number | null // null if one or less entries
  overallDifference: number | null // highest - lowest, null if one or less entries
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
  bodyWeightData?: BodyWeightData
}

export type InsightsData = {
  totalWorkouts: number
  userExercises: {
    id: string
    name: string
  }[]
  core?: {
    // if the user has recorded less than 5 workouts, no core data will be shown
    summary: {
      mostPopularWorkoutType: {
        // break any tie by most recent
        name: string
        numWorkouts: number
      }
      mostPopularExercise: {
        // break any tie by most recent
        name: string
        numWorkouts: number
        exerciseId: string
      }
      mostPopularLocation: {
        // break any tie by most recent
        name: string
        numWorkouts: number
      }
      heaviestExercisePR: {
        // break any tie by most recent
        name: string
        weight: number
        exerciseId: string
        date: string
      }
      heaviestWorkout: {
        // break any tie by most recent
        date: string
        workoutLocation: string
        workoutName: string
        totalWeight: number
        workoutId: string
      }
    }
    exercises: {
      muscleGroupsWorked: {
        [key: string]: { primary: number; secondary: number }
      } // stack horizontal bar graph, numbers are sets completed as the primary or secondary muscle group
      // two exercises, overlaying line graph data
      exerciseComparisonGraph: {
        name: string
        exerciseId: string
        graphData: {
          date: string
          weight: number
        }[]
      }[]
    }
    workouts: {
      repsPerSet: {
        workoutType: string | null // null = all workouts
        data: { [key: number]: number } // key = # reps, value = # sets with that many reps
      }
      // only one of the following two will be used at a time, based on user selection. Present setsPerWorkout by default
      setsPerWorkout?: { [key: number]: number } // key = # sets, value = # workouts with that many sets
      repsPerWorkout?: { [key: number]: number } // key = # reps, value = # workouts with that many reps
      weeklyVolume: {
        date: string // start of week date
        totalVolume: number // sets x reps or total weight lifted
      }[]
    }
  }
}

// Insights:

//     Summary (no title):
//         - most popular workout type
//         - most popular exercise (# num of workouts in, link to ex)
//         - most popular location
//         - heaviest exercise pr (link to ex)
//         - heaviest workout (link to workout details)

//     Exercises:
//         - Pie graph of muscles worked
//         - Overlaying line graph to compare two exercises (no axis labels, only trend line)

//     Workouts:
//         - Bar graph for workouts each day of the week
//         - Horizontal bar graph, # reps per set (from 1 to highest ever number of reps)
//             - Can toggle between all workouts, or type of workout
//         - Horizontal bar graph, # sets per workout (from lowest number to highest ever number)
//             - Can toggle between sets and reps options
//         - Line graph, weekly volume (each point represents a week, volume = sets x reps? or total weight lifted?)

//     Weight:
//         - Line graph, body weight progression over time (from first entry to last)
//             - include stats below: lowest, highest, and overal difference from the start
