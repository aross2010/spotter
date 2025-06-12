import {
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 75 }).notNull(),
  lastName: varchar('last_name', { length: 75 }),
  email: varchar('email', { length: 150 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const notebooks = pgTable('notebooks', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const tags = pgTable(
  'tags',
  {
    name: varchar('name', { length: 50 }).notNull(),
    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.userId, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.notebookId, t.name] })]
)

export const notebookEntries = pgTable('notebook_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  notebookId: uuid('notebook_id')
    .notNull()
    .references(() => notebooks.userId, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  body: text('body').notNull(), // limit to n words in business logic
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
})

export const notebookEntryTags = pgTable(
  'notebook_entry_tags',
  {
    entryId: uuid('entry_id')
      .notNull()
      .references(() => notebookEntries.id, { onDelete: 'cascade' }),

    notebookId: uuid('notebook_id')
      .notNull()
      .references(() => notebooks.userId, { onDelete: 'cascade' }),

    tagName: varchar('tag_name', { length: 50 })
      .notNull()
      .references(() => tags.name, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.entryId, t.tagName, t.notebookId] })]
)

export const weightEntries = pgTable(
  'weight_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    weight: numeric('weight', { precision: 4, scale: 1 }).notNull(), // in lbs
    date: timestamp('date').notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.date)] // ensure max one entry per user per date
)

export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  notes: text('notes'), // limit to n words in business logic
  date: timestamp('date').notNull().defaultNow(),
  location: varchar('location', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const workoutExercises = pgTable('workout_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  workoutId: uuid('workout_id')
    .notNull()
    .references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseNumber: numeric('exercise_number', {
    precision: 2,
    scale: 0,
  }).notNull(),
})

export const exercises = pgTable(
  'exercises',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.name] })]
)

export const sets = pgTable(
  'sets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workoutExerciseId: uuid('workout_exercise_id')
      .notNull()
      .references(() => workoutExercises.id, { onDelete: 'cascade' }),
    setGroupingId: uuid('set_grouping_id').references(() => setGroupings.id, {
      onDelete: 'set null',
    }),
    setNumber: numeric('set_number', {
      precision: 2,
      scale: 0,
    }).notNull(),
    weight: numeric('weight', { precision: 4, scale: 1 }), // in lbs
    reps: numeric('reps', { precision: 2, scale: 0 }),
    rpe: numeric('rpe', { precision: 2, scale: 1 }),
    rir: numeric('rir', { precision: 2, scale: 1 }),
    partialReps: numeric('partial_reps', {
      precision: 2,
      scale: 0,
    }),
    cheatReps: numeric('cheat_reps', {
      precision: 2,
      scale: 0,
    }),
  },
  (t) => [
    check('rpe_xor_rir', sql`(rpe IS NULL OR rir IS NULL)`),
    check('cheat_xor_partial', sql`cheat_reps IS NULL OR partial_reps IS NULL`),
  ]
)

export const setGroupings = pgTable(
  'set_groupings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 20 }).notNull(),
  },
  (t) => [check('valid_grouping_type', sql`type IN ('superset', 'dropset')`)]
)
