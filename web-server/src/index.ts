import { drizzle } from 'drizzle-orm/postgres-js'
import ws from 'ws'
import { schema } from './db/schema'
import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const db = postgres(process.env.DATABASE_URL!)

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export default db
