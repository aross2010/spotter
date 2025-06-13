import { InferInsertModel } from 'drizzle-orm'
import { users } from '@/src/db/schema'

export type User = Omit<InferInsertModel<typeof users>, 'passwordHash'>
