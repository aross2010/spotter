import { drizzle } from 'drizzle-orm/neon-http'
import { schema } from './db/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}
const db = drizzle(process.env.DATABASE_URL, { schema })
export default db
