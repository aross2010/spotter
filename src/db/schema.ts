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
  date,
  boolean,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    firstName: varchar('first_name', { length: 75 }).notNull(),
    lastName: varchar('last_name', { length: 75 }),
    email: varchar('email', { length: 150 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 50 })
      .notNull()
      .default('credentials'),
    providerId: varchar('provider_id', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (t) => [
    check(
      'valid_provider',
      sql`provider IN ('credentials', 'google', 'apple')`
    ),
  ]
)

export const notebooks = pgTable('notebooks', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const notebookTags = pgTable(
  'notebook_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 50 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [unique().on(t.name, t.userId)] // tag names can be unique per notebook
)

export const notebookEntries = pgTable('notebook_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id')
    .notNull()
    .references(() => notebooks.userId, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  body: text('body').notNull(), // limit to n words in business logic
  date: date('date').notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  pinned: boolean('pinned').notNull().default(false),
})

export const notebookEntryTagLinks = pgTable(
  'notebook_entry_tag_links',
  {
    entryId: uuid('entry_id')
      .notNull()
      .references(() => notebookEntries.id, { onDelete: 'cascade' }),

    tagId: uuid('tag_id')
      .notNull()
      .references(() => notebookTags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.entryId, t.tagId] })]
)

export const weightEntries = pgTable(
  'weight_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    weight: numeric('weight', { precision: 4, scale: 1 }).notNull(), // in lbs
    date: date('date').notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (t) => [unique().on(t.userId, t.date)] // ensure max one entry per user per date
)

export const workoutTags = pgTable(
  'workout_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 50 }).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [unique().on(t.name, t.userId)]
)

export const workoutTagLinks = pgTable(
  'workout_tag_links',
  {
    workoutId: uuid('workout_id')
      .notNull()
      .references(() => workouts.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => workoutTags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.workoutId, t.tagId] })]
)

export const workouts = pgTable(
  'workouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    notes: text('notes'), // limit to n words in business logic
    date: date('date').notNull().defaultNow(),
    location: varchar('location', { length: 100 }),
    status: varchar('status', { length: 20 }).notNull().default('completed'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (t) => [check('valid_status', sql`status IN ('completed', 'planned')`)]
)

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
    lowReps: numeric('low_reps', {
      precision: 2,
      scale: 0,
    }),
    highReps: numeric('high_reps', {
      precision: 2,
      scale: 0,
    }),
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
    check(
      'reps_xor_low_high',
      sql`(reps IS NULL OR (low_reps IS NULL AND high_reps IS NULL))`
    ),
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

export * as schema from './schema'
