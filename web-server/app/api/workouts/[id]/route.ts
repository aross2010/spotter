import { Params } from 'next/dist/server/request/params'
import { NextResponse } from 'next/server'
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
import { setExercise, setSuperOrDropsets, setTags } from '../route'
import { eq, and, sql } from 'drizzle-orm'
import { withAuth } from '../../middleware'

// clear data not in the workout table – tags, then exercises (which will delete sets), then clean up empty set groups and unused exercises
const clearWorkoutChildren = async (workoutId: string, tx: any) => {
  await tx
    .delete(workoutTagLinks)
    .where(eq(workoutTagLinks.workoutId, workoutId))

  // Get exercise IDs that will be orphaned before deleting workout exercises
  const exerciseIdsToCheck = await tx
    .select({ exerciseId: workoutExercises.exerciseId })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId))

  // Delete workout exercises first (which will cascade delete sets)
  await tx
    .delete(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId))

  // Delete exercises that no longer have any workout exercises attached
  if (exerciseIdsToCheck.length > 0) {
    await tx.delete(exercises).where(sql`
      ${exercises.id} IN (${sql.join(
      exerciseIdsToCheck.map((e: any) => sql`${e.exerciseId}`),
      sql`, `
    )})
      AND NOT EXISTS (
        SELECT 1 FROM ${workoutExercises} 
        WHERE ${workoutExercises.exerciseId} = ${exercises.id}
      )
    `)
  }

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
      { status: 400 }
    )
  }

  const setIdMap = new Map<string, string>()
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
      { status: 400 }
    )
  }

  if (!isISO8601(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  if (typeof name !== 'string' || name.length > 25) {
    return NextResponse.json(
      { error: 'Workout name must be a string under 25 characters' },
      { status: 400 }
    )
  }

  if (location && (typeof location !== 'string' || location.length > 100)) {
    return NextResponse.json(
      { error: 'Location must be a string under 100 characters' },
      { status: 400 }
    )
  }

  if (!Array.isArray(exercises) || exercises.length === 0) {
    return NextResponse.json(
      { error: 'Exercises must be a non-empty array' },
      { status: 400 }
    )
  }

  if (setGroupings && !Array.isArray(setGroupings)) {
    return NextResponse.json(
      { error: 'Set groupings must be an array' },
      { status: 400 }
    )
  }

  if (tags && (!Array.isArray(tags) || tags.length > 10)) {
    return NextResponse.json(
      { error: 'Tags must be an array of strings, limited to 10' },
      { status: 400 }
    )
  }

  if (notes && (typeof notes !== 'string' || notes.length > 500)) {
    return NextResponse.json(
      { error: 'Notes must be a string under 500 characters' },
      { status: 400 }
    )
  }

  if (status && !['completed', 'planned', 'active'].includes(status)) {
    return NextResponse.json(
      { error: 'Status must be one of: completed, planned, active' },
      { status: 400 }
    )
  }

  if (pinned !== undefined && typeof pinned !== 'boolean') {
    return NextResponse.json(
      { error: 'Pinned must be a boolean value' },
      { status: 400 }
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
        await setExercise(
          exercise,
          status || 'completed',
          setIdMap,
          exNum,
          userId,
          updatedWorkout.id,
          tx
        )
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

    return NextResponse.json(
      {
        message: 'Workout updated successfully',
        id: result,
      },
      { status: 200 }
    )
  } catch (error: any) {
    const msg =
      error instanceof Error ? error.message : 'Unexpected error occurred'
    const status =
      msg === 'User not found' || msg === 'Workout not found' ? 404 : 500

    console.error('Error processing workout data:', error)
    return NextResponse.json({ error: msg }, { status })
  }
})

export const DELETE = withAuth(async (req: Request, user: any) => {
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop()

  if (!id) {
    return NextResponse.json(
      { error: 'Workout ID is required' },
      { status: 400 }
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
        { status: 403 }
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
      { status: 200 }
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
      { status: 400 }
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
        { status: 403 }
      )
    }

    const tags = workout.workoutTagLinks.map((l) => ({
      name: l.workoutTag.name,
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
      { status: 500 }
    )
  }
})
