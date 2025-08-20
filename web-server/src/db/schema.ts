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
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'
import { sql, relations } from 'drizzle-orm'

export const authProvider = pgEnum('auth_provider', ['google', 'apple'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 75 }).notNull(),
  lastName: varchar('last_name', { length: 75 }),
  email: varchar('email', { length: 150 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
})

export const userProviders = pgTable(
  'user_providers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: authProvider('provider').notNull(),
    providerId: varchar('provider_id', { length: 200 }).notNull(),
    providerEmail: varchar('provider_email', { length: 150 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique('uq_provider_providerId').on(t.provider, t.providerId),
    unique('uq_user_provider').on(t.userId, t.provider),
    index('idx_provider_lookup').on(t.provider, t.providerId),
    index('idx_user_lookup').on(t.userId),
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
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id, { onDelete: 'cascade' }),
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
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
  },
  (t) => [unique().on(t.name, t.userId)] // ensure unique exercise names per user
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
    rpe: numeric('rpe', { precision: 3, scale: 1 }),
    rir: numeric('rir', { precision: 3, scale: 1 }),
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

// 1 user to many providers
export const userRelations = relations(users, ({ many }) => ({
  userProviders: many(userProviders),
}))

export const userProvidersRelations = relations(userProviders, ({ one }) => ({
  user: one(users, {
    fields: [userProviders.userId],
    references: [users.id],
  }),
}))

// 1 notebook to many entries
export const notebooksRelations = relations(notebooks, ({ many }) => ({
  notebookEntries: many(notebookEntries),
}))

// 1 notebook entry to many tags and 1 notebook
export const notebookEntriesRelations = relations(
  notebookEntries,
  ({ one, many }) => ({
    notebook: one(notebooks, {
      fields: [notebookEntries.user_id],
      references: [notebooks.userId],
    }),
    notebookEntryTagLinks: many(notebookEntryTagLinks),
  })
)

// 1 notebook tag to many links and 1 notebook
export const notebookTagsRelations = relations(notebookTags, ({ many }) => ({
  notebookEntryTagLinks: many(notebookEntryTagLinks),
}))

// 1 notebook entry tag link to 1 entry and 1 tag
export const notebookEntryTagLinksRelations = relations(
  notebookEntryTagLinks,
  ({ one }) => ({
    notebookEntry: one(notebookEntries, {
      fields: [notebookEntryTagLinks.entryId],
      references: [notebookEntries.id],
    }),
    notebookTag: one(notebookTags, {
      fields: [notebookEntryTagLinks.tagId],
      references: [notebookTags.id],
    }),
  })
)

// 1 workout to many exercises and tags
export const workoutsRelations = relations(workouts, ({ many }) => ({
  workoutExercises: many(workoutExercises),
  workoutTagLinks: many(workoutTagLinks),
}))

// 1 workout exercise to 1 exercise, 1 workout, and many sets
export const workoutExercisesRelations = relations(
  workoutExercises,
  ({ one, many }) => ({
    exercise: one(exercises, {
      fields: [workoutExercises.exerciseId],
      references: [exercises.id],
    }),
    workout: one(workouts, {
      fields: [workoutExercises.workoutId],
      references: [workouts.id],
    }),
    sets: many(sets),
  })
)

// 1 exercise to many workout exercises
export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutExercises: many(workoutExercises),
}))

// 1 set to 1 set grouping and 1 workout exercise (each set is unique)
export const setsRelations = relations(sets, ({ one }) => ({
  setGrouping: one(setGroupings, {
    fields: [sets.setGroupingId],
    references: [setGroupings.id],
  }),
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}))

// 1 set grouping to many sets (dropset or superset can have many sets)
export const setGroupingsRelations = relations(setGroupings, ({ many }) => ({
  sets: many(sets),
}))

// 1 workout tag link to 1 workout and 1 tag
export const workoutTagLinksRelations = relations(
  workoutTagLinks,
  ({ one }) => ({
    workoutTag: one(workoutTags, {
      fields: [workoutTagLinks.tagId],
      references: [workoutTags.id],
    }),
    workout: one(workouts, {
      fields: [workoutTagLinks.workoutId],
      references: [workouts.id],
    }),
  })
)

// 1 workout tag to many links (tag can be used in many workouts)
export const workoutTagsRelations = relations(workoutTags, ({ many }) => ({
  workoutTagLinks: many(workoutTagLinks),
}))

export * as schema from './schema'
