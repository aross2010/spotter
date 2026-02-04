import { NextResponse } from 'next/server'
import { withAuth } from '../../middleware'
import db from '@/src'
import { exercises, workouts, workoutExercises, sets } from '@/src/db/schema'
import { eq, and, sql, desc, inArray } from 'drizzle-orm'
import { RirToRpe, rpeToRir, toKg, toLbs } from '@/app/functions/conversions'
import { calculate1RM } from '@/app/functions/one-rep-max'

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
    sets: {
      // unilateral exercises will have 2x sets
      setNumber: number
      weight: number
      reps: number
      partials?: number
      intensity?: number // RPE or RIR based on user preference
    }[]
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
        est1RM: number
        weight: number
        reps: number
        rpe?: number
        rir?: number
        location?: string
      }
    }[]
  }
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
      { status: 400 },
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
        { status: 404 },
      )
    }

    // Run queries in parallel for better performance
    const [totalUserWorkoutsResult, exerciseHistory] = await Promise.all([
      // Get total completed workouts for the user
      db
        .select({ count: sql<number>`count(*)` })
        .from(workouts)
        .where(
          and(eq(workouts.userId, userId), eq(workouts.status, 'completed')),
        ),

      // Get all workout data with sets for this exercise
      db
        .select({
          workoutId: workouts.id,
          workoutName: workouts.name,
          workoutDate: workouts.date,
          location: workouts.location,
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
          eq(exercises.id, workoutExercises.exerciseId),
        )
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .innerJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
        .where(
          and(eq(exercises.id, exerciseId), eq(workouts.status, 'completed')),
        )
        .orderBy(
          desc(workouts.date),
          workoutExercises.exerciseNumber,
          sets.setNumber,
        ),
    ])

    const totalUserWorkouts = totalUserWorkoutsResult[0]?.count || 0

    if (exerciseHistory.length === 0) {
      return NextResponse.json(
        { error: 'Exercise has no associated sets' },
        { status: 400 },
      )
    }

    // Group the data by workout AND exercise number (same exercise can appear multiple times in one workout)
    const historyMap = new Map<
      string,
      {
        workoutId: string
        workoutName: string
        date: string
        location?: string
        exerciseNumber: number
        sets: Set[]
      }
    >()

    let totalSets = 0
    let totalReps = 0
    let pr = 0

    exerciseHistory.forEach((row) => {
      const workoutKey = `${row.workoutId}-${row.exerciseNumber}` // Include exerciseNumber in key

      if (!historyMap.has(workoutKey)) {
        historyMap.set(workoutKey, {
          workoutId: row.workoutId,
          workoutName: row.workoutName,
          date: row.workoutDate,
          exerciseNumber: Number(row.exerciseNumber),
          sets: [],
          ...(row.location && { location: row.location }),
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

      // Calculate total reps (handle unilateral exercises - take lower value)
      if (exercise.isUnilateral) {
        const leftReps = setData.leftReps || 0
        const rightReps = setData.rightReps || 0
        // Take the lower value between left and right, or use whichever is available
        totalReps +=
          leftReps && rightReps
            ? Math.min(leftReps, rightReps)
            : leftReps || rightReps
      } else {
        totalReps += setData.reps || 0
      }

      // Track PR (convert kg to lbs for accurate comparison)
      const weightInLbs =
        setData.weightLbs || (setData.weightKg ? toLbs(setData.weightKg) : 0)
      if (weightInLbs > pr) {
        pr = weightInLbs
      }
    })

    // Build progression chart (best set per workout - keep original grouping)
    const workoutProgression = new Map<
      string,
      {
        date: string
        workoutId: string
        bestWeight: number
        bestReps: number
        rpe?: number
        rir?: number
        location?: string
      }
    >()

    historyMap.forEach((workout) => {
      // If we already have this workout, compare and keep the better set
      const existingEntry = workoutProgression.get(workout.workoutId)

      let bestSet = {
        weight: existingEntry?.bestWeight || 0,
        reps: existingEntry?.bestReps || 0,
        rpe: existingEntry?.rpe,
        rir: existingEntry?.rir,
      }

      workout.sets.forEach((set) => {
        const weightInLbs =
          set.weightLbs || (set.weightKg ? toLbs(set.weightKg) : 0)

        // For unilateral exercises, take the lower value between left and right
        let reps = 0
        if (exercise.isUnilateral) {
          const leftReps = set.leftReps || 0
          const rightReps = set.rightReps || 0
          // Take the lower value between left and right, or use whichever is available
          reps =
            leftReps && rightReps
              ? Math.min(leftReps, rightReps)
              : leftReps || rightReps
        } else {
          reps = set.reps || 0
        }

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
          location: workout.location,
        })
      }
    })

    const progressionChart = Array.from(workoutProgression.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((p) => {
        // Convert weight to user preference
        const weight =
          weightMetric === 'kgs' ? toKg(p.bestWeight) : p.bestWeight

        // Convert intensity to user preference
        let intensity: number | undefined
        if (intensityMetric === 'rpe') {
          intensity =
            p.rpe !== undefined
              ? p.rpe
              : p.rir !== undefined
                ? RirToRpe.get(p.rir)
                : undefined
        } else {
          intensity =
            p.rir !== undefined
              ? p.rir
              : p.rpe !== undefined
                ? rpeToRir.get(p.rpe)
                : undefined
        }

        return {
          date: p.date,
          data: {
            workoutId: p.workoutId,
            weight:
              weightMetric === 'kgs'
                ? toKg(weight)
                : Math.round(weight * 100) / 100,
            est1RM: calculate1RM(
              weight,
              weightMetric,
              p.bestReps,
              intensityMetric === 'rpe' ? intensity : undefined,
              intensityMetric === 'rir' ? intensity : undefined,
            ),
            reps: p.bestReps,
            ...(intensityMetric === 'rpe' &&
              intensity !== undefined && { rpe: intensity }),
            ...(intensityMetric === 'rir' &&
              intensity !== undefined && { rir: intensity }),
            ...(typeof p.location === 'string' && { location: p.location }),
          },
        }
      })

    // Transform history for response - convert to unified metrics and split unilateral sets
    const transformedHistory = Array.from(historyMap.values()).map(
      (workout) => {
        const transformedSets: {
          setNumber: number
          weight: number
          reps: number
          partials?: number
          intensity?: number
        }[] = []

        workout.sets.forEach((set) => {
          // Convert weight to user preference
          const weightInLbs =
            set.weightLbs || (set.weightKg ? toLbs(set.weightKg) : 0)
          const weight =
            weightMetric === 'kgs' ? toKg(weightInLbs) : weightInLbs

          if (exercise.isUnilateral) {
            // Create two separate sets for left and right
            const leftReps = set.leftReps || 0
            const rightReps = set.rightReps || 0
            const leftPartials = set.leftPartialReps
            const rightPartials = set.rightPartialReps

            // Get intensity values
            const leftIntensityRpe =
              set.leftRpe ||
              (set.leftRir !== undefined
                ? RirToRpe.get(set.leftRir)
                : undefined)
            const leftIntensityRir =
              set.leftRir ||
              (set.leftRpe !== undefined
                ? rpeToRir.get(set.leftRpe)
                : undefined)
            const rightIntensityRpe =
              set.rightRpe ||
              (set.rightRir !== undefined
                ? RirToRpe.get(set.rightRir)
                : undefined)
            const rightIntensityRir =
              set.rightRir ||
              (set.rightRpe !== undefined
                ? rpeToRir.get(set.rightRpe)
                : undefined)

            // Left side set
            if (leftReps > 0) {
              transformedSets.push({
                setNumber: set.setNumber,
                weight:
                  weightMetric === 'kgs'
                    ? toKg(weight)
                    : Math.round(weight * 100) / 100,
                reps: leftReps,
                ...(leftPartials && { partials: leftPartials }),
                ...(intensityMetric === 'rpe' &&
                  leftIntensityRpe !== undefined && {
                    intensity: leftIntensityRpe,
                  }),
                ...(intensityMetric === 'rir' &&
                  leftIntensityRir !== undefined && {
                    intensity: leftIntensityRir,
                  }),
              })
            }

            // Right side set (same set number)
            if (rightReps > 0) {
              transformedSets.push({
                setNumber: set.setNumber,
                weight:
                  weightMetric === 'kgs'
                    ? toKg(weight)
                    : Math.round(weight * 100) / 100,
                reps: rightReps,
                ...(rightPartials && { partials: rightPartials }),
                ...(intensityMetric === 'rpe' &&
                  rightIntensityRpe !== undefined && {
                    intensity: rightIntensityRpe,
                  }),
                ...(intensityMetric === 'rir' &&
                  rightIntensityRir !== undefined && {
                    intensity: rightIntensityRir,
                  }),
              })
            }
          } else {
            // Non-unilateral exercise - single set
            const reps = set.reps || 0
            const partials = set.partialReps

            // Get intensity value
            const intensityRpe =
              set.rpe ||
              (set.rir !== undefined ? RirToRpe.get(set.rir) : undefined)
            const intensityRir =
              set.rir ||
              (set.rpe !== undefined ? rpeToRir.get(set.rpe) : undefined)

            if (reps > 0) {
              transformedSets.push({
                setNumber: set.setNumber,
                weight:
                  weightMetric === 'kgs'
                    ? toKg(weight)
                    : Math.round(weight * 100) / 100,
                reps,
                ...(partials && { partials }),
                ...(intensityMetric === 'rpe' &&
                  intensityRpe !== undefined && { intensity: intensityRpe }),
                ...(intensityMetric === 'rir' &&
                  intensityRir !== undefined && { intensity: intensityRir }),
              })
            }
          }
        })

        return {
          workoutId: workout.workoutId,
          workoutName: workout.workoutName,
          date: workout.date,
          exerciseNumber: workout.exerciseNumber,
          sets: transformedSets,
        }
      },
    )

    // Convert PR to user preference
    const prConverted = weightMetric === 'kgs' ? toKg(pr) : pr

    const result: ExerciseDetails = {
      id: exercise.id,
      name: exercise.name,
      primaryMuscleGroup: exercise.primaryMuscleGroup || '',
      secondaryMuscleGroups: exercise.secondaryMuscleGroups || [],
      isUnilateral: exercise.isUnilateral,
      description: exercise.description || undefined,
      totalUserWorkouts,
      history: transformedHistory,
      stats: {
        pr:
          weightMetric === 'kgs'
            ? toKg(prConverted)
            : Math.round(prConverted * 100) / 100,
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
      { status: 500 },
    )
  }
})

export const PUT = withAuth(async (req, user) => {
  const url = new URL(req.url)
  const exerciseId = url.pathname.split('/').pop()
  const userId = user.id

  if (!exerciseId) {
    return NextResponse.json(
      { error: 'Exercise ID is required' },
      { status: 400 },
    )
  }

  try {
    const body = await req.json()
    const {
      name,
      description,
      primaryMuscleGroup,
      secondaryMuscleGroups,
      isUnilateral,
    } = body

    // Validate required fields
    if (!name || !primaryMuscleGroup) {
      return NextResponse.json(
        { error: 'Name and primary muscle group are required' },
        { status: 400 },
      )
    }

    // First, verify the exercise exists and belongs to the user
    const existingExercise = await db.query.exercises.findFirst({
      where: and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)),
    })

    if (!existingExercise) {
      return NextResponse.json(
        { error: 'Exercise not found or access denied' },
        { status: 404 },
      )
    }

    // Check if the exercise type is changing
    const changingToUnilateral = !existingExercise.isUnilateral && isUnilateral
    const changingToBilateral = existingExercise.isUnilateral && !isUnilateral

    // Update the exercise
    await db
      .update(exercises)
      .set({
        name: name.trim(),
        description: description || null,
        primaryMuscleGroup,
        secondaryMuscleGroups: secondaryMuscleGroups || [],
        isUnilateral: isUnilateral ?? false,
      })
      .where(eq(exercises.id, exerciseId))

    // If the exercise type is changing, we need to update all sets
    if (changingToUnilateral || changingToBilateral) {
      // Get all workout exercises for this exercise
      const workoutExercisesForExercise =
        await db.query.workoutExercises.findMany({
          where: eq(workoutExercises.exerciseId, exerciseId),
        })

      const workoutExerciseIds = workoutExercisesForExercise.map((we) => we.id)

      if (workoutExerciseIds.length > 0) {
        // Get all sets for these workout exercises
        const allSets = await db.query.sets.findMany({
          where: inArray(sets.workoutExerciseId, workoutExerciseIds),
        })

        // Update each set based on the conversion direction
        for (const set of allSets) {
          if (changingToUnilateral) {
            // Converting bilateral → unilateral: Copy bilateral values to both sides, keep originals
            await db
              .update(sets)
              .set({
                // Copy bilateral values to both left and right sides (if not already set)
                leftReps: set.leftReps ?? set.reps,
                rightReps: set.rightReps ?? set.reps,
                leftRpe: set.leftRpe ?? set.rpe,
                rightRpe: set.rightRpe ?? set.rpe,
                leftRir: set.leftRir ?? set.rir,
                rightRir: set.rightRir ?? set.rir,
                leftPartialReps: set.leftPartialReps ?? set.partialReps,
                rightPartialReps: set.rightPartialReps ?? set.partialReps,
                // Keep bilateral values for potential revert
              })
              .where(eq(sets.id, set.id))
          } else if (changingToBilateral) {
            // Converting unilateral → bilateral: Use the minimum of left/right, keep originals

            // Helper function to get minimum value, handling nulls
            const getMin = (left: any, right: any): string | null => {
              const leftNum = left ? Number(left) : null
              const rightNum = right ? Number(right) : null

              if (leftNum === null && rightNum === null) return null
              if (leftNum === null) return String(rightNum)
              if (rightNum === null) return String(leftNum)
              return String(Math.min(leftNum, rightNum))
            }

            await db
              .update(sets)
              .set({
                // Use the minimum of left and right for bilateral values (if not already set)
                reps: set.reps ?? getMin(set.leftReps, set.rightReps),
                rpe: set.rpe ?? getMin(set.leftRpe, set.rightRpe),
                rir: set.rir ?? getMin(set.leftRir, set.rightRir),
                partialReps:
                  set.partialReps ??
                  getMin(set.leftPartialReps, set.rightPartialReps),
                // Keep unilateral values for potential revert
              })
              .where(eq(sets.id, set.id))
          }
        }
      }
    }

    // Fetch the updated exercise to return
    const updatedExercise = await db.query.exercises.findFirst({
      where: eq(exercises.id, exerciseId),
    })

    return NextResponse.json(
      {
        message: 'Exercise updated successfully',
        exercise: updatedExercise,
        setsUpdated: changingToUnilateral || changingToBilateral,
        conversionType: changingToUnilateral
          ? 'bilateral-to-unilateral'
          : changingToBilateral
            ? 'unilateral-to-bilateral'
            : null,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error updating exercise:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
})
