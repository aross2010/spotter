import { NextResponse } from 'next/server'
import { withAuth } from '../../middleware'
import db from '@/src'
import { exercises, workouts, workoutExercises, sets } from '@/src/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'

type MuscleGroup = string

type Set = {
  setNumber: number
  weightLbs?: number
  weightKg?: number
  reps?: number
  leftReps?: number
  rightReps?: number
  rpe?: number
  leftRpe?: number
  rightRpe?: number
  rir?: number
  leftRir?: number
  rightRir?: number
  partialReps?: number
  leftPartialReps?: number
  rightPartialReps?: number
  cheatReps?: number
  id: string
}

type ExerciseDetails = {
  id: string
  name: string
  primaryMuscleGroup: MuscleGroup
  secondaryMuscleGroups: MuscleGroup[]
  isUnilateral: boolean
  description?: string
  totalUserWorkouts: number
  history: {
    workoutId: string
    workoutName: string
    date: string
    exerciseNumber: number
    sets: Set[]
  }[]
  stats: {
    pr: number // weight in user pref
    totalSets: number
    totalReps: number
    totalWorkouts: number
    progressionChart: {
      date: string
      data: {
        workoutId: string
        weight: number
        reps: number
        rpe?: number
        rir?: number
      }
    }[]
  }
}

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url)
  const exerciseId = url.pathname.split('/').pop()
  const userId = user.id

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

    // Run queries in parallel for better performance
    const [totalUserWorkoutsResult, exerciseHistory] = await Promise.all([
      // Get total completed workouts for the user
      db
        .select({ count: sql<number>`count(*)` })
        .from(workouts)
        .where(
          and(eq(workouts.userId, userId), eq(workouts.status, 'completed'))
        ),

      // Get all workout data with sets for this exercise
      db
        .select({
          workoutId: workouts.id,
          workoutName: workouts.name,
          workoutDate: workouts.date,
          exerciseNumber: workoutExercises.exerciseNumber,
          setId: sets.id,
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
          cheatReps: sets.cheatReps,
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
        .orderBy(
          desc(workouts.date),
          workoutExercises.exerciseNumber,
          sets.setNumber
        ),
    ])

    const totalUserWorkouts = totalUserWorkoutsResult[0]?.count || 0

    if (exerciseHistory.length === 0) {
      return NextResponse.json(
        { error: 'Exercise has no associated sets' },
        { status: 400 }
      )
    }

    // Group the data by workout
    const historyMap = new Map<
      string,
      {
        workoutId: string
        workoutName: string
        date: string
        exerciseNumber: number
        sets: Set[]
      }
    >()

    let totalSets = 0
    let totalReps = 0
    let pr = 0

    exerciseHistory.forEach((row) => {
      const workoutKey = row.workoutId

      if (!historyMap.has(workoutKey)) {
        historyMap.set(workoutKey, {
          workoutId: row.workoutId,
          workoutName: row.workoutName,
          date: row.workoutDate,
          exerciseNumber: Number(row.exerciseNumber),
          sets: [],
        })
      }

      const setData: Set = {
        setNumber: Number(row.setNumber),
        weightLbs: row.weightLbs ? Number(row.weightLbs) : undefined,
        weightKg: row.weightKg ? Number(row.weightKg) : undefined,
        reps: row.reps ? Number(row.reps) : undefined,
        leftReps: row.leftReps ? Number(row.leftReps) : undefined,
        rightReps: row.rightReps ? Number(row.rightReps) : undefined,
        rpe: row.rpe ? Number(row.rpe) : undefined,
        leftRpe: row.leftRpe ? Number(row.leftRpe) : undefined,
        rightRpe: row.rightRpe ? Number(row.rightRpe) : undefined,
        rir: row.rir ? Number(row.rir) : undefined,
        leftRir: row.leftRir ? Number(row.leftRir) : undefined,
        rightRir: row.rightRir ? Number(row.rightRir) : undefined,
        partialReps: row.partialReps ? Number(row.partialReps) : undefined,
        leftPartialReps: row.leftPartialReps
          ? Number(row.leftPartialReps)
          : undefined,
        rightPartialReps: row.rightPartialReps
          ? Number(row.rightPartialReps)
          : undefined,
        cheatReps: row.cheatReps ? Number(row.cheatReps) : undefined,
        id: row.setId,
      }

      historyMap.get(workoutKey)!.sets.push(setData)
      totalSets++

      // Calculate total reps (handle unilateral exercises)
      if (exercise.isUnilateral) {
        totalReps += (setData.leftReps || 0) + (setData.rightReps || 0)
      } else {
        totalReps += setData.reps || 0
      }

      // Track PR (convert kg to lbs for accurate comparison)
      const weightInLbs =
        setData.weightLbs || (setData.weightKg ? setData.weightKg * 2.20462 : 0)
      if (weightInLbs > pr) {
        pr = weightInLbs
      }
    })

    // Build progression chart (best set per workout)
    const workoutProgression = new Map<
      string,
      {
        date: string
        workoutId: string
        bestWeight: number
        bestReps: number
        rpe?: number
        rir?: number
      }
    >()

    historyMap.forEach((workout) => {
      let bestSet = {
        weight: 0,
        reps: 0,
        rpe: undefined as number | undefined,
        rir: undefined as number | undefined,
      }

      workout.sets.forEach((set) => {
        const weightInLbs =
          set.weightLbs || (set.weightKg ? set.weightKg * 2.20462 : 0)
        const reps = exercise.isUnilateral
          ? (set.leftReps || 0) + (set.rightReps || 0)
          : set.reps || 0

        if (
          weightInLbs > bestSet.weight ||
          (weightInLbs === bestSet.weight && reps > bestSet.reps)
        ) {
          bestSet = {
            weight: weightInLbs,
            reps,
            rpe: set.rpe || set.leftRpe || set.rightRpe,
            rir: set.rir || set.leftRir || set.rightRir,
          }
        }
      })

      if (bestSet.weight > 0 || bestSet.reps > 0) {
        workoutProgression.set(workout.workoutId, {
          date: workout.date,
          workoutId: workout.workoutId,
          bestWeight: bestSet.weight,
          bestReps: bestSet.reps,
          rpe: bestSet.rpe,
          rir: bestSet.rir,
        })
      }
    })

    const progressionChart = Array.from(workoutProgression.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((p) => ({
        date: p.date,
        data: {
          workoutId: p.workoutId,
          weight: p.bestWeight,
          reps: p.bestReps,
          rpe: p.rpe,
          rir: p.rir,
        },
      }))

    const result: ExerciseDetails = {
      id: exercise.id,
      name: exercise.name,
      primaryMuscleGroup: exercise.primaryMuscleGroup || '',
      secondaryMuscleGroups: exercise.secondaryMuscleGroups || [],
      isUnilateral: exercise.isUnilateral,
      description: exercise.description || undefined,
      totalUserWorkouts,
      history: Array.from(historyMap.values()),
      stats: {
        pr,
        totalSets,
        totalReps,
        totalWorkouts: historyMap.size,
        progressionChart,
      },
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error fetching exercise details:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
})
