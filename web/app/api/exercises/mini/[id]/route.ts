import { NextResponse } from 'next/server'
import { withAuth } from '../../../middleware'
import db from '@/src'
import { exercises, workouts, workoutExercises, sets } from '@/src/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { RirToRpe, rpeToRir, toKg, toLbs } from '@/app/functions/conversions'

type ExerciseDetailsMini = {
  id: string
  name: string
  description?: string
  isUnilateral: boolean
  history:
    | {
        workoutId: string
        date: string
        exerciseNumber: number
        sets: {
          setNumber: number
          weight: number
          reps: number
          partials?: number
          intensity?: number
        }[]
      }[]
    | null
}

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url)
  const exerciseId = url.pathname.split('/').pop()
  const userId = user.id

  const weightMetric =
    (url.searchParams.get('weight') as 'lbs' | 'kgs') || 'lbs'
  const intensityMetric =
    (url.searchParams.get('intensity') as 'rpe' | 'rir') || 'rpe'

  if (!exerciseId) {
    return NextResponse.json(
      { error: 'Exercise ID is required' },
      { status: 400 }
    )
  }

  try {
    // First, get the exercise and verify ownership
    const exercise = await db.query.exercises.findFirst({
      where: and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)),
    })

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found or access denied' },
        { status: 404 }
      )
    }

    // Get limited workout history (last 10 workouts)
    const exerciseHistory = await db
      .select({
        workoutId: workouts.id,
        workoutDate: workouts.date,
        exerciseNumber: workoutExercises.exerciseNumber,
        setNumber: sets.setNumber,
        weightLbs: sets.weightLbs,
        weightKg: sets.weightKg,
        reps: sets.reps,
        leftReps: sets.leftReps,
        rightReps: sets.rightReps,
        rpe: sets.rpe,
        leftRpe: sets.leftRpe,
        rightRpe: sets.rightRpe,
        rir: sets.rir,
        leftRir: sets.leftRir,
        rightRir: sets.rightRir,
        partialReps: sets.partialReps,
        leftPartialReps: sets.leftPartialReps,
        rightPartialReps: sets.rightPartialReps,
      })
      .from(exercises)
      .innerJoin(
        workoutExercises,
        eq(exercises.id, workoutExercises.exerciseId)
      )
      .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
      .innerJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
      .where(
        and(eq(exercises.id, exerciseId), eq(workouts.status, 'completed'))
      )
      .orderBy(desc(workouts.date), sets.setNumber)
      .limit(10 * 20) // Assume max ~20 sets per workout to get roughly 10 workouts

    if (exerciseHistory.length === 0) {
      return NextResponse.json(
        {
          id: exercise.id,
          name: exercise.name,
          description: exercise.description || undefined,
          isUnilateral: exercise.isUnilateral,
          history: null,
        } as ExerciseDetailsMini,
        { status: 200 }
      )
    }

    // Group by workout and limit to 10 workouts
    const workoutMap = new Map<
      string,
      {
        workoutId: string
        date: string
        exerciseNumber: number
        sets: {
          setNumber: number
          weight: number
          reps: number
          partials?: number
          intensity?: number
        }[]
      }
    >()

    for (const row of exerciseHistory) {
      // Stop if we already have 10 workouts
      if (workoutMap.size >= 10 && !workoutMap.has(row.workoutId)) {
        break
      }

      if (!workoutMap.has(row.workoutId)) {
        workoutMap.set(row.workoutId, {
          workoutId: row.workoutId,
          date: row.workoutDate,
          exerciseNumber: Number(row.exerciseNumber),
          sets: [],
        })
      }

      const workout = workoutMap.get(row.workoutId)!
      const weight = row.weightLbs ? Number(row.weightLbs) : 0

      if (exercise.isUnilateral) {
        // Unilateral exercise - create separate sets for left and right
        const leftReps = row.leftReps ? Number(row.leftReps) : 0
        const rightReps = row.rightReps ? Number(row.rightReps) : 0
        const leftPartials = row.leftPartialReps
          ? Number(row.leftPartialReps)
          : undefined
        const rightPartials = row.rightPartialReps
          ? Number(row.rightPartialReps)
          : undefined

        // Get intensity values
        const leftIntensityRpe =
          row.leftRpe !== null && row.leftRpe !== undefined
            ? row.leftRpe
            : row.leftRir !== null && row.leftRir !== undefined
            ? RirToRpe.get(Number(row.leftRir))
            : undefined
        const leftIntensityRir =
          row.leftRir !== null && row.leftRir !== undefined
            ? row.leftRir
            : row.leftRpe !== null && row.leftRpe !== undefined
            ? rpeToRir.get(Number(row.leftRpe))
            : undefined
        const rightIntensityRpe =
          row.rightRpe !== null && row.rightRpe !== undefined
            ? row.rightRpe
            : row.rightRir !== null && row.rightRir !== undefined
            ? RirToRpe.get(Number(row.rightRir))
            : undefined
        const rightIntensityRir =
          row.rightRir !== null && row.rightRir !== undefined
            ? row.rightRir
            : row.rightRpe !== null && row.rightRpe !== undefined
            ? rpeToRir.get(Number(row.rightRpe))
            : undefined

        // Left side set
        if (leftReps > 0) {
          workout.sets.push({
            setNumber: Number(row.setNumber),
            weight:
              weightMetric === 'kgs'
                ? toKg(weight)
                : Math.round(weight * 100) / 100,
            reps: leftReps,
            ...(leftPartials && { partials: leftPartials }),
            ...(intensityMetric === 'rpe' &&
              leftIntensityRpe !== undefined && {
                intensity: Number(leftIntensityRpe),
              }),
            ...(intensityMetric === 'rir' &&
              leftIntensityRir !== undefined && {
                intensity: Number(leftIntensityRir),
              }),
          })
        }

        // Right side set
        if (rightReps > 0) {
          workout.sets.push({
            setNumber: Number(row.setNumber),
            weight:
              weightMetric === 'kgs'
                ? toKg(weight)
                : Math.round(weight * 100) / 100,
            reps: rightReps,
            ...(rightPartials && { partials: rightPartials }),
            ...(intensityMetric === 'rpe' &&
              rightIntensityRpe !== undefined && {
                intensity: Number(rightIntensityRpe),
              }),
            ...(intensityMetric === 'rir' &&
              rightIntensityRir !== undefined && {
                intensity: Number(rightIntensityRir),
              }),
          })
        }
      } else {
        // Bilateral exercise - single set
        const reps = row.reps ? Number(row.reps) : 0
        const partials = row.partialReps ? Number(row.partialReps) : undefined

        // Get intensity value
        const intensityRpe =
          row.rpe !== null && row.rpe !== undefined
            ? row.rpe
            : row.rir !== null && row.rir !== undefined
            ? RirToRpe.get(Number(row.rir))
            : undefined
        const intensityRir =
          row.rir !== null && row.rir !== undefined
            ? row.rir
            : row.rpe !== null && row.rpe !== undefined
            ? rpeToRir.get(Number(row.rpe))
            : undefined

        if (reps > 0) {
          workout.sets.push({
            setNumber: Number(row.setNumber),
            weight:
              weightMetric === 'kgs'
                ? toKg(weight)
                : Math.round(weight * 100) / 100,
            reps: reps,
            ...(partials && { partials: partials }),
            ...(intensityMetric === 'rpe' &&
              intensityRpe !== undefined && {
                intensity: Number(intensityRpe),
              }),
            ...(intensityMetric === 'rir' &&
              intensityRir !== undefined && {
                intensity: Number(intensityRir),
              }),
          })
        }
      }
    }

    const result: ExerciseDetailsMini = {
      id: exercise.id,
      name: exercise.name,
      description: exercise.description || undefined,
      isUnilateral: exercise.isUnilateral,
      history: Array.from(workoutMap.values()),
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error fetching mini exercise details:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
})
