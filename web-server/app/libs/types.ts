import { InferInsertModel } from 'drizzle-orm'
import { exercises, sets, users } from '@/src/db/schema'

export type User = Omit<InferInsertModel<typeof users>, 'passwordHash'>
export type Set = InferInsertModel<typeof sets>

export type ExercisePayload = {
  name: string
  exerciseSets: Set[]
}
