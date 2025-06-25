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
} from '@/src/db/schema'
import { setExercise, setSuperOrDropsets, setTags } from '../route'
import { eq, and, sql } from 'drizzle-orm'
import { getFullWorkout } from '@/app/functions/getFullWorkout'

// clear data not in the workout table – tags, then set groups, then exercises (which will delete sets)
const clearWorkoutChildren = async (workoutId: string, tx: any) => {
  await tx
    .delete(workoutTagLinks)
    .where(eq(workoutTagLinks.workoutId, workoutId))
  await tx.delete(setGroupings).where(sql`
    ${setGroupings.id} IN (
      SELECT DISTINCT s.set_grouping_id
      FROM ${sets} s
      JOIN ${workoutExercises} we ON we.id = s.workout_exercise_id
      WHERE we.workout_id = ${workoutId}
    )
  `)
  await tx
    .delete(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId))
}

// clear sub-data and re-insert + update workout base data
export async function PUT(req: Request, props: { params: Params }) {
  const data = await req.json()
  const params = await props.params
  const id = params.id as string

  const setIdMap = new Map<string, string>()
  let exNum = 1

  let {
    date,
    userId,
    name,
    location,
    exercises,
    setGroupings,
    tags,
    notes,
    status,
  } = data

  if (!userId || !date || !name || !exercises) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  if (!isISO8601(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  if (typeof name !== 'string' || name.length > 100) {
    return NextResponse.json(
      { error: 'Workout name must be a string under 100 characters' },
      { status: 400 }
    )
  }

  if (location && (typeof location !== 'string' || location.length > 100)) {
    return NextResponse.json(
      { error: 'Location must be a string' },
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

  if (status && !['completed', 'planned'].includes(status)) {
    return NextResponse.json(
      { error: 'Status must be one of: completed, in-progress, planned' },
      { status: 400 }
    )
  }

  try {
    const result = await db.transaction(async (tx) => {
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
        })
        .where(eq(workouts.id, id))
        .returning()

      if (!updatedWorkout) {
        throw new Error('Workout not found or update failed')
      }

      for (const exercise of exercises) {
        await setExercise(
          exercise,
          status,
          setIdMap,
          exNum,
          userId,
          updatedWorkout.id,
          tx
        )
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
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : 'Unexpected error occurred'
    const status = msg.includes('not found') ? 404 : 500
    console.error('Error processing workout data:', error)
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function DELETE(req: Request, props: { params: Params }) {
  const params = await props.params
  const id = params.id as string

  if (!id) {
    return NextResponse.json(
      { error: 'Workout ID is required' },
      { status: 400 }
    )
  }

  try {
    const [deletedWorkout] = await db
      .delete(workouts)
      .where(eq(workouts.id, id))
      .returning()

    if (!deletedWorkout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    return NextResponse.json(
      { message: 'Workout deleted successfully', id: deletedWorkout.id },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request, props: { params: Params }) {
  const params = await props.params
  const id = params.id as string

  if (!id) {
    return NextResponse.json(
      { error: 'Workout ID is required' },
      { status: 400 }
    )
  }

  try {
    const workout = await getFullWorkout(id)

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    return NextResponse.json(workout, { status: 200 })
  } catch (error) {
    console.error('Error fetching workout:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
