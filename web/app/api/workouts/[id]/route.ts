import { Params } from 'next/dist/server/request/params'
import { NextResponse, after } from 'next/server'
import { isISO8601 } from 'validator'
import db from '@/src'
import {
  workouts,
  setGroupings,
  workoutExercises,
  sets,
  workoutTagLinks,
  users,
  exercises,
} from '@/src/db/schema'
import {
  setExercise,
  setSuperOrDropsets,
  setTags,
  getExerciseId,
} from '../route'
import { eq, and, sql } from 'drizzle-orm'
import { withAuth } from '../../middleware'
import { detectMuscleGroups } from '@/app/functions/detectMuscleGroups'

// Background function to update muscle groups for new exercises
async function updateMuscleGroupsInBackground(
  exerciseId: string,
  exerciseName: string,
) {
  try {
    const { primaryMuscleGroup, secondaryMuscleGroups } =
      await detectMuscleGroups(exerciseName)

    await db
      .update(exercises)
      .set({
        primaryMuscleGroup,
        secondaryMuscleGroups,
      })
      .where(eq(exercises.id, exerciseId))
  } catch (error) {
    console.error(
      `Failed to update muscle groups for exercise ${exerciseName}:`,
      error,
    )
  }
}

// clear data not in the workout table – tags, then exercises (which will delete sets), then clean up empty set groups
// NOTE: We do NOT delete exercises themselves - they should persist even if not used in any workouts
const clearWorkoutChildren = async (workoutId: string, tx: any) => {
  await tx
    .delete(workoutTagLinks)
    .where(eq(workoutTagLinks.workoutId, workoutId))

  // Delete workout exercises (which will cascade delete sets)
  await tx
    .delete(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId))

  // Clean up any set groupings that no longer have any sets
  await tx.delete(setGroupings).where(sql`
    NOT EXISTS (
      SELECT 1 FROM ${sets} 
      WHERE ${sets.setGroupingId} = ${setGroupings.id}
    )
  `)
}

// clear sub-data and re-insert + update workout base data
export const PUT = withAuth(async (req: Request, user: any) => {
  const data = await req.json()
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop()

  if (!id) {
    return NextResponse.json(
      { error: 'Workout ID is required' },
      { status: 400 },
    )
  }

  const setIdMap = new Map<string, string>()
  const newExercises: { id: string; name: string }[] = []
  let exNum = 1

  let {
    date,
    name,
    location,
    exercises,
    setGroupings,
    tags,
    notes,
    status,
    pinned,
  } = data

  const userId = user.id

  if (!userId || !date || !name || !exercises) {
    console.error('Missing required fields:', { userId, date, name, exercises })
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    )
  }

  if (!isISO8601(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  if (typeof name !== 'string' || name.length > 25) {
    return NextResponse.json(
      { error: 'Workout name must be a string under 25 characters' },
      { status: 400 },
    )
  }

  if (location && (typeof location !== 'string' || location.length > 100)) {
    return NextResponse.json(
      { error: 'Location must be a string under 100 characters' },
      { status: 400 },
    )
  }

  if (!Array.isArray(exercises) || exercises.length === 0) {
    return NextResponse.json(
      { error: 'Exercises must be a non-empty array' },
      { status: 400 },
    )
  }

  // Validate that each exercise has a name
  for (const exercise of exercises) {
    if (
      !exercise.name ||
      typeof exercise.name !== 'string' ||
      exercise.name.trim() === ''
    ) {
      return NextResponse.json(
        { error: 'Each exercise must have a name' },
        { status: 400 },
      )
    }
  }

  if (setGroupings && !Array.isArray(setGroupings)) {
    return NextResponse.json(
      { error: 'Set groupings must be an array' },
      { status: 400 },
    )
  }

  if (tags && (!Array.isArray(tags) || tags.length > 10)) {
    return NextResponse.json(
      { error: 'Tags must be an array of strings, limited to 10' },
      { status: 400 },
    )
  }

  if (notes && (typeof notes !== 'string' || notes.length > 500)) {
    return NextResponse.json(
      { error: 'Notes must be a string under 500 characters' },
      { status: 400 },
    )
  }

  if (status && !['completed', 'planned', 'active'].includes(status)) {
    return NextResponse.json(
      { error: 'Status must be one of: completed, planned, active' },
      { status: 400 },
    )
  }

  if (pinned !== undefined && typeof pinned !== 'boolean') {
    return NextResponse.json(
      { error: 'Pinned must be a boolean value' },
      { status: 400 },
    )
  }

  try {
    const result = await db.transaction(async (tx) => {
      const existingUser = await tx.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      })

      if (!existingUser) {
        throw new Error('User not found')
      }

      const existingWorkout = await tx.query.workouts.findFirst({
        where: (workouts, { eq }) =>
          and(eq(workouts.id, id), eq(workouts.userId, userId)),
      })

      if (!existingWorkout) {
        throw new Error('Workout not found')
      }

      await clearWorkoutChildren(id, tx)

      const [updatedWorkout] = await tx
        .update(workouts)
        .set({
          userId: userId,
          date,
          name,
          location: location || null,
          notes: notes || null,
          status: status || 'completed',
          pinned: pinned !== undefined ? pinned : existingWorkout.pinned,
          updatedAt: new Date(),
        })
        .where(eq(workouts.id, id))
        .returning()

      if (!updatedWorkout) {
        throw new Error('Workout not found or update failed')
      }

      for (const exercise of exercises) {
        const exerciseData = await setExercise(
          exercise,
          status || 'completed',
          setIdMap,
          exNum,
          userId,
          updatedWorkout.id,
          tx,
        )

        // Track new exercises for background processing
        if (exerciseData.isNew) {
          newExercises.push({ id: exerciseData.id, name: exerciseData.name })
        }

        exNum++
      }

      if (setGroupings && setGroupings.length > 0) {
        await setSuperOrDropsets(setGroupings, setIdMap, tx)
      }

      if (tags) {
        await setTags(tags, updatedWorkout.id, userId, tx)
      }

      return updatedWorkout.id
    })

    // Send response first
    const response = NextResponse.json(
      {
        message: 'Workout updated successfully',
        id: result,
      },
      { status: 200 },
    )

    // Trigger background muscle group updates after response
    if (newExercises.length > 0) {
      after(async () => {
        try {
          await Promise.all(
            newExercises.map(async (exercise) => {
              await updateMuscleGroupsInBackground(exercise.id, exercise.name)
            }),
          )
        } catch (error) {
          console.error('Background muscle group update failed:', error)
        }
      })
    }

    return response
  } catch (error: any) {
    const msg =
      error instanceof Error ? error.message : 'Unexpected error occurred'
    const status =
      msg === 'User not found' || msg === 'Workout not found' ? 404 : 500

    console.error('Error processing workout data:', error)
    return NextResponse.json({ error: msg }, { status })
  }
})

// PATCH - Partial update for changed data only (optimized for speed)
export const PATCH = withAuth(async (req: Request, user: any) => {
  const data = await req.json()
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop()

  if (!id) {
    return NextResponse.json(
      { error: 'Workout ID is required' },
      { status: 400 },
    )
  }

  const {
    name,
    date,
    location,
    notes,
    status,
    pinned,
    tags,
    changedExercises,
    setGroupings: newSetGroupings,
    hasMetadataChanges,
    hasExerciseChanges,
    hasSetGroupingChanges,
  } = data

  const userId = user.id
  const setIdMap = new Map<string, string>()
  const newExercises: { id: string; name: string }[] = []

  try {
    const result = await db.transaction(async (tx) => {
      const existingUser = await tx.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      })

      if (!existingUser) {
        throw new Error('User not found')
      }

      const existingWorkout = await tx.query.workouts.findFirst({
        where: (workouts, { eq, and }) =>
          and(eq(workouts.id, id), eq(workouts.userId, userId)),
        with: {
          workoutExercises: {
            with: {
              sets: true,
            },
          },
        },
      })

      if (!existingWorkout) {
        throw new Error('Workout not found')
      }

      // 1. Update metadata if changed
      if (hasMetadataChanges) {
        const updateData: any = { updatedAt: new Date() }

        if (name !== undefined) updateData.name = name
        if (date !== undefined) updateData.date = date
        if (location !== undefined) updateData.location = location || null
        if (notes !== undefined) updateData.notes = notes || null
        if (status !== undefined) updateData.status = status
        if (pinned !== undefined) updateData.pinned = pinned

        await tx.update(workouts).set(updateData).where(eq(workouts.id, id))

        // Handle tags if changed
        if (tags !== undefined) {
          // Clear existing tags
          await tx
            .delete(workoutTagLinks)
            .where(eq(workoutTagLinks.workoutId, id))

          // Add new tags
          if (tags.length > 0) {
            await setTags(tags, id, userId, tx)
          }
        }
      }

      // 2. Handle exercise changes
      if (hasExerciseChanges && changedExercises) {
        // Build a map of existing exercise numbers to workout exercise IDs
        const existingExerciseMap = new Map<
          number,
          {
            workoutExerciseId: string
            sets: (typeof existingWorkout.workoutExercises)[0]['sets']
          }
        >()
        existingWorkout.workoutExercises.forEach((we) => {
          existingExerciseMap.set(Number(we.exerciseNumber), {
            workoutExerciseId: we.id,
            sets: we.sets,
          })
        })

        // Determine if we need to rebuild all exercises (count changed or positions shifted)
        const currentExerciseCount = existingWorkout.workoutExercises.length
        const hasCountChanged = changedExercises.some(
          (ce: any) => ce.exerciseNumber > currentExerciseCount,
        )

        // Get all exercise numbers that are changing
        const changingExerciseNumbers = new Set(
          changedExercises.map((ce: any) => ce.exerciseNumber),
        )

        // If count changed (exercises added/removed), we need to rebuild all exercises
        if (
          hasCountChanged ||
          changedExercises.length === currentExerciseCount
        ) {
          // Full rebuild - delete all workout exercises and recreate
          await tx
            .delete(workoutExercises)
            .where(eq(workoutExercises.workoutId, id))

          // Clean up orphaned set groupings
          await tx.delete(setGroupings).where(sql`
            NOT EXISTS (
              SELECT 1 FROM ${sets} 
              WHERE ${sets.setGroupingId} = ${setGroupings.id}
            )
          `)

          // Recreate all exercises
          let exNum = 1
          for (const change of changedExercises) {
            const exerciseData = await setExercise(
              change.exercise,
              status || existingWorkout.status || 'completed',
              setIdMap,
              change.exerciseNumber,
              userId,
              id,
              tx,
            )

            if (exerciseData.isNew) {
              newExercises.push({
                id: exerciseData.id,
                name: exerciseData.name,
              })
            }
            exNum++
          }
        } else {
          // Partial update - only update changed exercises
          for (const change of changedExercises) {
            const existing = existingExerciseMap.get(change.exerciseNumber)

            if (existing) {
              // Delete existing sets for this exercise
              await tx
                .delete(sets)
                .where(eq(sets.workoutExerciseId, existing.workoutExerciseId))

              // Get or create the exercise
              const { id: exerciseId, isNew } = await getExerciseId(
                change.exercise.name,
                userId,
                change.exercise.isUnilateral,
                tx,
              )

              if (isNew) {
                newExercises.push({
                  id: exerciseId,
                  name: change.exercise.name,
                })
              }

              // Update the workout exercise link
              await tx
                .update(workoutExercises)
                .set({ exerciseId })
                .where(eq(workoutExercises.id, existing.workoutExerciseId))

              // Insert new sets
              let setNum = 1
              for (const set of change.exercise.sets) {
                const [insertedSet] = await tx
                  .insert(sets)
                  .values({
                    workoutExerciseId: existing.workoutExerciseId,
                    setNumber: setNum.toString(),
                    weightLbs: set.weightLbs ?? null,
                    weightKg: set.weightKg ?? null,
                    reps: set.reps ?? null,
                    leftReps: set.leftReps ?? null,
                    rightReps: set.rightReps ?? null,
                    rpe: set.rpe ?? null,
                    leftRpe: set.leftRpe ?? null,
                    rightRpe: set.rightRpe ?? null,
                    rir: set.rir ?? null,
                    leftRir: set.leftRir ?? null,
                    rightRir: set.rightRir ?? null,
                    partialReps: set.partialReps ?? null,
                    leftPartialReps: set.leftPartialReps ?? null,
                    rightPartialReps: set.rightPartialReps ?? null,
                    cheatReps: set.cheatReps ?? null,
                  })
                  .returning({ id: sets.id, setNumber: sets.setNumber })

                setIdMap.set(
                  `${change.exerciseNumber}-${insertedSet.setNumber}`,
                  insertedSet.id,
                )
                setNum++
              }
            }
          }

          // Build setIdMap for unchanged exercises (needed for set groupings)
          existingWorkout.workoutExercises.forEach((we) => {
            if (!changingExerciseNumbers.has(Number(we.exerciseNumber))) {
              we.sets.forEach((s) => {
                setIdMap.set(`${we.exerciseNumber}-${s.setNumber}`, s.id)
              })
            }
          })
        }
      } else {
        // No exercise changes - build setIdMap from existing data for set groupings
        existingWorkout.workoutExercises.forEach((we) => {
          we.sets.forEach((s) => {
            setIdMap.set(`${we.exerciseNumber}-${s.setNumber}`, s.id)
          })
        })
      }

      // 3. Handle set grouping changes
      if (hasSetGroupingChanges && newSetGroupings !== undefined) {
        // Clear all existing set grouping associations
        await tx.execute(sql`
          UPDATE ${sets} 
          SET set_grouping_id = NULL 
          WHERE workout_exercise_id IN (
            SELECT id FROM ${workoutExercises} WHERE workout_id = ${id}
          )
        `)

        // Clean up orphaned set groupings
        await tx.delete(setGroupings).where(sql`
          NOT EXISTS (
            SELECT 1 FROM ${sets} 
            WHERE ${sets.setGroupingId} = ${setGroupings.id}
          )
        `)

        // Create new set groupings
        if (newSetGroupings.length > 0) {
          await setSuperOrDropsets(newSetGroupings, setIdMap, tx)
        }
      }

      return id
    })

    // Send response first
    const response = NextResponse.json(
      {
        message: 'Workout updated successfully',
        id: result,
      },
      { status: 200 },
    )

    // Trigger background muscle group updates after response
    if (newExercises.length > 0) {
      after(async () => {
        try {
          await Promise.all(
            newExercises.map(async (exercise) => {
              await updateMuscleGroupsInBackground(exercise.id, exercise.name)
            }),
          )
        } catch (error) {
          console.error('Background muscle group update failed:', error)
        }
      })
    }

    return response
  } catch (error: any) {
    const msg =
      error instanceof Error ? error.message : 'Unexpected error occurred'
    const status =
      msg === 'User not found' || msg === 'Workout not found' ? 404 : 500

    console.error('Error processing PATCH workout data:', error)
    return NextResponse.json({ error: msg }, { status })
  }
})

export const DELETE = withAuth(async (req: Request, user: any) => {
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop()

  if (!id) {
    return NextResponse.json(
      { error: 'Workout ID is required' },
      { status: 400 },
    )
  }

  try {
    const workout = await db.query.workouts.findFirst({
      where: eq(workouts.id, id),
    })

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    if (workout.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied to this workout' },
        { status: 403 },
      )
    }

    const result = await db.transaction(async (tx) => {
      // Clean up workout children and orphaned exercises before deleting the workout
      await clearWorkoutChildren(id, tx)

      const [deletedWorkout] = await tx
        .delete(workouts)
        .where(eq(workouts.id, id))
        .returning()

      if (!deletedWorkout) {
        throw new Error('Workout not found')
      }

      return deletedWorkout
    })

    return NextResponse.json(
      { message: 'Workout deleted successfully', id: result.id },
      { status: 200 },
    )
  } catch (error: any) {
    const msg =
      error instanceof Error ? error.message : 'Unexpected error occurred'
    const status = msg === 'Workout not found' ? 404 : 500

    console.error('Error deleting workout:', error)
    return NextResponse.json({ error: msg }, { status })
  }
})

export const GET = withAuth(async (req: Request, user: any) => {
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop()

  if (!id) {
    return NextResponse.json(
      { error: 'Workout ID is required' },
      { status: 400 },
    )
  }

  try {
    const workout = await db.query.workouts.findFirst({
      where: eq(workouts.id, id),
      with: {
        workoutExercises: {
          with: {
            exercise: true,
            sets: {
              with: {
                setGrouping: true,
              },
            },
          },
        },
        workoutTagLinks: {
          with: {
            workoutTag: true,
          },
        },
      },
    })

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    if (workout.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied to this workout' },
        { status: 403 },
      )
    }

    const tags = workout.workoutTagLinks.map((l) => ({
      id: l.workoutTag.id,
      name: l.workoutTag.name,
      userId: l.workoutTag.userId,
    }))

    // Build set groupings map
    const groupingMap = new Map<
      string,
      {
        id: string
        groupingType: string
        groupSets: { exerciseNumber: number; setNumber: number }[]
      }
    >()

    const exercises = workout.workoutExercises.map((we) => {
      const exerciseNumber = Number(we.exerciseNumber)

      const sets = we.sets.map((s) => {
        const setNumber = Number(s.setNumber)
        const grouping = s.setGrouping

        if (grouping) {
          if (!groupingMap.has(grouping.id)) {
            groupingMap.set(grouping.id, {
              id: grouping.id,
              groupingType: grouping.type,
              groupSets: [],
            })
          }
          groupingMap.get(grouping.id)!.groupSets.push({
            exerciseNumber,
            setNumber,
          })
        }

        return {
          setNumber,
          weightLbs: s.weightLbs ? Number(s.weightLbs) : null,
          weightKg: s.weightKg ? Number(s.weightKg) : null,
          reps: s.reps ? Number(s.reps) : null,
          leftReps: s.leftReps ? Number(s.leftReps) : null,
          rightReps: s.rightReps ? Number(s.rightReps) : null,
          rpe: s.rpe ? Number(s.rpe) : null,
          leftRpe: s.leftRpe ? Number(s.leftRpe) : null,
          rightRpe: s.rightRpe ? Number(s.rightRpe) : null,
          rir: s.rir ? Number(s.rir) : null,
          leftRir: s.leftRir ? Number(s.leftRir) : null,
          rightRir: s.rightRir ? Number(s.rightRir) : null,
          partialReps: s.partialReps ? Number(s.partialReps) : null,
          leftPartialReps: s.leftPartialReps ? Number(s.leftPartialReps) : null,
          rightPartialReps: s.rightPartialReps
            ? Number(s.rightPartialReps)
            : null,
          cheatReps: s.cheatReps ? Number(s.cheatReps) : null,
          id: `${exerciseNumber}-${setNumber}`,
        }
      })

      return {
        name: we.exercise.name,
        isUnilateral: we.exercise.isUnilateral,
        sets,
        existing: true,
        id: we.exercise.id,
      }
    })

    const workoutData = {
      name: workout.name.trim(),
      date: workout.date,
      location: workout.location ? workout.location.trim() : '',
      notes: workout.notes ? workout.notes.trim() : '',
      tags,
      exercises,
      weightUnit: 'lbs' as const,
      setGroupings: Array.from(groupingMap.values()),
      status: workout.status,
    }

    return NextResponse.json(workoutData, { status: 200 })
  } catch (error) {
    console.error('Error fetching workout:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
})
