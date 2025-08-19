import { InferInsertModel } from 'drizzle-orm'
import { exercises, sets, users } from '@/src/db/schema'

export type User = Omit<InferInsertModel<typeof users>, 'passwordHash'>
export type Set = InferInsertModel<typeof sets>

export type ExercisePayload = {
  name: string
  exerciseSets: Set[]
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
