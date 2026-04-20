import { InferInsertModel } from 'drizzle-orm'
import { sets, users } from '@/src/db/schema'

export type User = Omit<InferInsertModel<typeof users>, 'passwordHash'>
export type Set = InferInsertModel<typeof sets>

export type ExercisePayload = {
  name: string
  isUnilateral: boolean
  sets: Set[]
}

export type AuthUser = {
  id: string
  email: string
  name: string
  picture?: string
  given_name?: string
  family_name?: string
  email_verified?: boolean
  exp?: number
}

export type WorkoutStatus = 'completed' | 'planned' | 'active'

export type SetGrouping = {
  groupingType: 'superset' | 'dropset'
  groupSets: {
    exerciseNumber: number
    setNumber: number
  }[]
}

// Delta type for PATCH updates - only includes changed fields
export type WorkoutFormDelta = {
  // Metadata fields - only included if changed
  name?: string
  date?: string // ISO date string
  location?: string
  tags?: string[] // tag names
  notes?: string
  status?: WorkoutStatus
  pinned?: boolean
  // Exercise changes - only include exercises that changed
  requiresExerciseRebuild?: boolean
  changedExercises?: {
    exerciseNumber: number // 1-indexed position in workout
    exercise: {
      name: string
      isUnilateral: boolean
      sets: Omit<Set, 'id' | 'workoutExerciseId' | 'setGroupingId'>[]
    }
  }[]
  // Set groupings - only include if changed
  setGroupings?: SetGrouping[]
  // Flags to indicate what was changed
  hasMetadataChanges: boolean
  hasExerciseChanges: boolean
  hasSetGroupingChanges: boolean
}
