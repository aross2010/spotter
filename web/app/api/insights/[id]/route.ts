import { NextResponse } from 'next/server'
import { withAuth } from '../../middleware'
import db from '@/src'
import {
  workouts,
  workoutExercises,
  exercises,
  sets,
  weightEntries,
} from '@/src/db/schema'
import { eq, desc, sql, and, isNotNull, inArray, or } from 'drizzle-orm'
import { calculate1RM } from '@/app/functions/one-rep-max'
import { toKg, toLbs } from '@/app/functions/conversions'

/**
 * Get exercise comparison graph data for specified exercises
 * @param userId - User ID
 * @param exerciseIds - Array of exercise IDs (max 5)
 * @param weightUnit - 'lbs' or 'kg'
 * @returns Array of exercise graph data with name, exerciseId, and progression data
 */
export async function getExerciseComparisonData(
  userId: string,
  exerciseIds: string[],
  weightUnit: 'lbs' | 'kgs',
) {
  if (exerciseIds.length === 0 || exerciseIds.length > 5) {
    return []
  }

  // Fetch latest body weight for bodyweight exercise 1RM calculation
  const latestBodyWeightResult = await db
    .select({
      weightLbs: weightEntries.weightLbs,
      weightKg: weightEntries.weightKg,
    })
    .from(weightEntries)
    .where(eq(weightEntries.userId, userId))
    .orderBy(desc(weightEntries.date))
    .limit(1)

  const bodyWeightLbs = latestBodyWeightResult[0]
    ? Number(latestBodyWeightResult[0].weightLbs) ||
      (latestBodyWeightResult[0].weightKg
        ? toLbs(Number(latestBodyWeightResult[0].weightKg))
        : null)
    : null
  const bodyWeight =
    bodyWeightLbs !== null
      ? weightUnit === 'kgs'
        ? toKg(bodyWeightLbs)
        : bodyWeightLbs
      : null

  // Get all sets for each exercise to find the best set per workout
  // Select BOTH weight fields and unilateral fields to match exercise-details logic
  const allSetsData = await db
    .select({
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      isUnilateral: exercises.isUnilateral,
      workoutId: workouts.id,
      date: workouts.date,
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
    })
    .from(sets)
    .innerJoin(
      workoutExercises,
      eq(sets.workoutExerciseId, workoutExercises.id),
    )
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        eq(workouts.userId, userId),
        eq(workouts.status, 'completed'),
        inArray(exercises.id, exerciseIds),
        or(isNotNull(sets.weightLbs), isNotNull(sets.weightKg)),
      ),
    )
    .orderBy(workouts.date)

  // Group by exercise and find best set per workout (highest weight in LBS, reps as tiebreaker)
  // This matches the exercise-details logic exactly
  const exerciseWorkoutMap = new Map<
    string,
    Map<
      string,
      {
        date: string
        weightInLbs: number // Always store in LBS for consistent comparison
        reps: number
        rpe: number | null
        rir: number | null
      }
    >
  >()
  const exerciseNames = new Map<string, string>()
  const exerciseIsUnilateral = new Map<string, boolean>()

  allSetsData.forEach((row) => {
    // Convert to LBS for comparison - matching exercise-details logic
    const weightInLbs =
      Number(row.weightLbs) || (row.weightKg ? toLbs(Number(row.weightKg)) : 0)

    // Handle unilateral exercises - use leftReps/rightReps
    const isUnilateral = row.isUnilateral || false
    let reps = 0
    if (isUnilateral) {
      const leftReps = Number(row.leftReps) || 0
      const rightReps = Number(row.rightReps) || 0
      // Take the lower value between left and right, or use whichever is available
      reps =
        leftReps && rightReps
          ? Math.min(leftReps, rightReps)
          : leftReps || rightReps
    } else {
      reps = Number(row.reps) || 1
    }

    // Handle intensity for unilateral exercises
    const rpe = row.rpe
      ? Number(row.rpe)
      : row.leftRpe
        ? Number(row.leftRpe)
        : row.rightRpe
          ? Number(row.rightRpe)
          : null
    const rir = row.rir
      ? Number(row.rir)
      : row.leftRir
        ? Number(row.leftRir)
        : row.rightRir
          ? Number(row.rightRir)
          : null

    exerciseNames.set(row.exerciseId, row.exerciseName)
    exerciseIsUnilateral.set(row.exerciseId, isUnilateral)

    if (!exerciseWorkoutMap.has(row.exerciseId)) {
      exerciseWorkoutMap.set(row.exerciseId, new Map())
    }

    const workoutMap = exerciseWorkoutMap.get(row.exerciseId)!
    const existing = workoutMap.get(row.workoutId)

    // Keep the set with highest weight (reps as tiebreaker) - matching exercise details logic
    if (
      !existing ||
      weightInLbs > existing.weightInLbs ||
      (weightInLbs === existing.weightInLbs && reps > existing.reps)
    ) {
      workoutMap.set(row.workoutId, {
        date: row.date,
        weightInLbs,
        reps,
        rpe,
        rir,
      })
    }
  })

  // Convert to final format with est1RM calculation
  const result: {
    name: string
    exerciseId: string
    graphData: { date: string; weight: number }[]
  }[] = []

  exerciseWorkoutMap.forEach((workoutMap, exerciseId) => {
    const graphData = Array.from(workoutMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((entry) => {
        // Convert weight to user preference - matching exercise-details logic
        const weight =
          weightUnit === 'kgs' ? toKg(entry.weightInLbs) : entry.weightInLbs

        return {
          date: entry.date,
          weight: calculate1RM(
            weight,
            weightUnit,
            entry.reps,
            entry.rpe,
            entry.rir,
            bodyWeight,
          ),
        }
      })

    result.push({
      name: exerciseNames.get(exerciseId) || '',
      exerciseId,
      graphData,
    })
  })

  return result
}

export const GET = withAuth(async (req: Request, user: any) => {
  const url = new URL(req.url)
  const userId = url.pathname.split('/').pop()
  const weightUnit = (url.searchParams.get('unit') || 'lbs') as 'lbs' | 'kgs'

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  if (userId !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    // Count total workouts to determine if core data should be shown
    const workoutCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(workouts)
      .where(and(eq(workouts.userId, userId), eq(workouts.status, 'completed')))

    const totalWorkouts = workoutCount[0]?.count || 0

    // Initialize response structure
    const insightsData: any = {
      totalWorkouts,
      userExercises: [],
    }

    const weightField = weightUnit === 'kgs' ? sets.weightKg : sets.weightLbs
    const weightEntryField =
      weightUnit === 'kgs' ? weightEntries.weightKg : weightEntries.weightLbs

    // Fetch all data in parallel
    const [
      popularWorkoutResult,
      popularExerciseResult,
      popularLocationResult,
      heaviestPRResult,
      heaviestWorkoutResult,
      muscleGroupsResult,
      repsPerSetResult,
      setsPerWorkoutResult,
      weeklyVolumeResult,
      userExercisesResult,
      topTwoExercisesResult,
    ] = await Promise.all([
      // Most popular workout type
      totalWorkouts >= 5
        ? db
            .select({
              name: workouts.name,
              count: sql<number>`count(*)::int`,
              mostRecent: sql<string>`max(${workouts.date})`,
            })
            .from(workouts)
            .where(
              and(
                eq(workouts.userId, userId),
                eq(workouts.status, 'completed'),
              ),
            )
            .groupBy(workouts.name)
            .orderBy(desc(sql`count(*)`), desc(sql`max(${workouts.date})`))
            .limit(1)
        : Promise.resolve([]),

      // Most popular exercise
      totalWorkouts >= 5
        ? db
            .select({
              name: exercises.name,
              exerciseId: exercises.id,
              count: sql<number>`count(distinct ${workouts.id})::int`,
              mostRecent: sql<string>`max(${workouts.date})`,
            })
            .from(workoutExercises)
            .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
            .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
            .where(
              and(
                eq(workouts.userId, userId),
                eq(workouts.status, 'completed'),
              ),
            )
            .groupBy(exercises.id, exercises.name)
            .orderBy(
              desc(sql`count(distinct ${workouts.id})`),
              desc(sql`max(${workouts.date})`),
            )
            .limit(1)
        : Promise.resolve([]),

      // Most popular location
      totalWorkouts >= 5
        ? db
            .select({
              location: workouts.location,
              count: sql<number>`count(*)::int`,
              mostRecent: sql<string>`max(${workouts.date})`,
            })
            .from(workouts)
            .where(
              and(
                eq(workouts.userId, userId),
                eq(workouts.status, 'completed'),
                isNotNull(workouts.location),
              ),
            )
            .groupBy(workouts.location)
            .orderBy(desc(sql`count(*)`), desc(sql`max(${workouts.date})`))
            .limit(1)
        : Promise.resolve([]),

      // Heaviest exercise PR
      totalWorkouts >= 5
        ? db
            .select({
              name: exercises.name,
              exerciseId: exercises.id,
              weight: weightField,
              date: workouts.date,
            })
            .from(sets)
            .innerJoin(
              workoutExercises,
              eq(sets.workoutExerciseId, workoutExercises.id),
            )
            .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
            .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
            .where(
              and(
                eq(workouts.userId, userId),
                eq(workouts.status, 'completed'),
                isNotNull(weightField),
              ),
            )
            .orderBy(desc(weightField), desc(workouts.date))
            .limit(1)
        : Promise.resolve([]),

      // Heaviest workout
      totalWorkouts >= 5
        ? db
            .select({
              workoutId: workouts.id,
              workoutName: workouts.name,
              workoutLocation: workouts.location,
              date: workouts.date,
              totalWeight: sql<number>`sum(${weightField} * COALESCE(${sets.reps}, 1))`,
            })
            .from(workouts)
            .innerJoin(
              workoutExercises,
              eq(workouts.id, workoutExercises.workoutId),
            )
            .innerJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
            .where(
              and(
                eq(workouts.userId, userId),
                eq(workouts.status, 'completed'),
                isNotNull(weightField),
              ),
            )
            .groupBy(
              workouts.id,
              workouts.name,
              workouts.location,
              workouts.date,
            )
            .orderBy(
              desc(sql`sum(${weightField} * COALESCE(${sets.reps}, 1))`),
              desc(workouts.date),
            )
            .limit(1)
        : Promise.resolve([]),

      // Muscle groups worked
      totalWorkouts >= 5
        ? db
            .select({
              primaryMuscleGroup: exercises.primaryMuscleGroup,
              secondaryMuscleGroups: exercises.secondaryMuscleGroups,
              setCount: sql<number>`count(${sets.id})::int`,
            })
            .from(workoutExercises)
            .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
            .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
            .innerJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
            .where(
              and(
                eq(workouts.userId, userId),
                eq(workouts.status, 'completed'),
                isNotNull(exercises.primaryMuscleGroup),
              ),
            )
            .groupBy(
              exercises.primaryMuscleGroup,
              exercises.secondaryMuscleGroups,
            )
        : Promise.resolve([]),

      // Reps per set distribution
      totalWorkouts >= 5
        ? db
            .select({
              reps: sets.reps,
              count: sql<number>`count(*)::int`,
            })
            .from(sets)
            .innerJoin(
              workoutExercises,
              eq(sets.workoutExerciseId, workoutExercises.id),
            )
            .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
            .where(
              and(
                eq(workouts.userId, userId),
                eq(workouts.status, 'completed'),
                isNotNull(sets.reps),
              ),
            )
            .groupBy(sets.reps)
        : Promise.resolve([]),

      // Sets per workout distribution
      totalWorkouts >= 5
        ? db
            .select({
              workoutId: workouts.id,
              setCount: sql<number>`count(${sets.id})::int`,
            })
            .from(workouts)
            .innerJoin(
              workoutExercises,
              eq(workouts.id, workoutExercises.workoutId),
            )
            .innerJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
            .where(
              and(
                eq(workouts.userId, userId),
                eq(workouts.status, 'completed'),
              ),
            )
            .groupBy(workouts.id)
        : Promise.resolve([]),

      // Weekly volume: sum of (reps * weight) for each set = total volume
      // For unilateral exercises, use the greater of leftReps or rightReps
      // Exclude current incomplete week (only include weeks that have ended)
      totalWorkouts >= 5
        ? db
            .select({
              weekStart: sql<string>`date_trunc('week', ${workouts.date})::date`,
              totalVolume: sql<number>`sum(
                COALESCE(${sets.reps}, GREATEST(COALESCE(${sets.leftReps}, 0), COALESCE(${sets.rightReps}, 0)))
                * COALESCE(${weightField}, 0)
              )::bigint`,
            })
            .from(workouts)
            .innerJoin(
              workoutExercises,
              eq(workouts.id, workoutExercises.workoutId),
            )
            .innerJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
            .where(
              and(
                eq(workouts.userId, userId),
                eq(workouts.status, 'completed'),
                sql`date_trunc('week', ${workouts.date}) < date_trunc('week', CURRENT_DATE)`,
              ),
            )
            .groupBy(sql`date_trunc('week', ${workouts.date})`)
            .orderBy(sql`date_trunc('week', ${workouts.date})`)
        : Promise.resolve([]),

      // User exercises that appear in at least two workouts
      db
        .select({
          id: exercises.id,
          name: exercises.name,
          workoutCount: sql<number>`count(distinct ${workouts.id})::int`,
        })
        .from(exercises)
        .innerJoin(
          workoutExercises,
          eq(exercises.id, workoutExercises.exerciseId),
        )
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .where(
          and(eq(workouts.userId, userId), eq(workouts.status, 'completed')),
        )
        .groupBy(exercises.id, exercises.name)
        .having(sql`count(distinct ${workouts.id}) >= 2`)
        .orderBy(exercises.name),

      // Top 2 most popular exercises for comparison graph
      totalWorkouts >= 5
        ? db
            .select({
              exerciseId: exercises.id,
              count: sql<number>`count(distinct ${workouts.id})::int`,
              mostRecent: sql<string>`max(${workouts.date})`,
            })
            .from(workoutExercises)
            .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
            .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
            .where(
              and(
                eq(workouts.userId, userId),
                eq(workouts.status, 'completed'),
              ),
            )
            .groupBy(exercises.id)
            .orderBy(
              desc(sql`count(distinct ${workouts.id})`),
              desc(sql`max(${workouts.date})`),
            )
            .limit(2)
        : Promise.resolve([]),
    ])

    // Add user exercises to response
    insightsData.userExercises = userExercisesResult.map((ex) => ({
      id: ex.id,
      name: ex.name,
    }))

    // Only show core data if user has 5+ workouts
    if (totalWorkouts >= 5) {
      const mostPopularWorkoutType = popularWorkoutResult[0]
        ? {
            name: popularWorkoutResult[0].name,
            numWorkouts: popularWorkoutResult[0].count,
          }
        : { name: '', numWorkouts: 0 }

      const mostPopularExercise = popularExerciseResult[0]
        ? {
            name: popularExerciseResult[0].name,
            numWorkouts: popularExerciseResult[0].count,
            exerciseId: popularExerciseResult[0].exerciseId,
          }
        : { name: '', numWorkouts: 0, exerciseId: '' }

      const mostPopularLocation = popularLocationResult[0]
        ? {
            name: popularLocationResult[0].location,
            numWorkouts: popularLocationResult[0].count,
          }
        : { name: '', numWorkouts: 0 }

      const heaviestExercisePR = heaviestPRResult[0]
        ? {
            name: heaviestPRResult[0].name,
            weight: Number(heaviestPRResult[0].weight) || 0,
            exerciseId: heaviestPRResult[0].exerciseId,
            date: heaviestPRResult[0].date,
          }
        : { name: '', weight: 0, exerciseId: '', date: '' }

      const heaviestWorkout = heaviestWorkoutResult[0]
        ? {
            date: heaviestWorkoutResult[0].date,
            workoutLocation: heaviestWorkoutResult[0].workoutLocation || '',
            workoutName: heaviestWorkoutResult[0].workoutName,
            totalWeight: Number(heaviestWorkoutResult[0].totalWeight) || 0,
            workoutId: heaviestWorkoutResult[0].workoutId,
          }
        : {
            date: '',
            workoutLocation: '',
            workoutName: '',
            totalWeight: 0,
            workoutId: '',
          }

      // Process muscle groups - initialize all muscle groups with zero values
      const ALL_MUSCLE_GROUPS = [
        'quadriceps',
        'hamstrings',
        'calves',
        'hip adductors',
        'hip abductors',
        'hip flexors',
        'glutes',
        'front delts',
        'rear delts',
        'side delts',
        'chest',
        'lats',
        'upper back',
        'lower back',
        'traps',
        'biceps',
        'triceps',
        'forearms',
        'upper abs',
        'lower abs',
        'obliques',
      ]

      const muscleGroupCounts: {
        [key: string]: { primary: number; secondary: number }
      } = {}

      // Initialize all muscle groups with zero values
      ALL_MUSCLE_GROUPS.forEach((group) => {
        muscleGroupCounts[group] = { primary: 0, secondary: 0 }
      })

      muscleGroupsResult.forEach((row) => {
        // Count sets for primary muscle group
        if (row.primaryMuscleGroup) {
          muscleGroupCounts[row.primaryMuscleGroup].primary += row.setCount
        }
        // Count sets for secondary muscle groups
        if (
          row.secondaryMuscleGroups &&
          Array.isArray(row.secondaryMuscleGroups)
        ) {
          row.secondaryMuscleGroups.forEach((group) => {
            if (muscleGroupCounts[group]) {
              muscleGroupCounts[group].secondary += row.setCount
            }
          })
        }
      })

      // Process reps per set with hardcoded range 1-19, 20+
      const repsPerSetData: { [key: string]: number } = {}
      // Initialize all buckets from 1 to 19, then 20+
      for (let i = 1; i <= 19; i++) {
        repsPerSetData[i.toString()] = 0
      }
      repsPerSetData['20+'] = 0

      repsPerSetResult.forEach((row) => {
        const repsValue = Number(row.reps)
        if (repsValue >= 20) {
          repsPerSetData['20+'] = (repsPerSetData['20+'] || 0) + row.count
        } else if (repsValue >= 1) {
          repsPerSetData[repsValue.toString()] =
            (repsPerSetData[repsValue.toString()] || 0) + row.count
        }
      })

      // Process sets per workout with hardcoded range <5, 6-19, 20+
      const setsPerWorkoutData: { [key: string]: number } = {}
      // Initialize buckets: <5, then 6-19, then 20+
      setsPerWorkoutData['<5'] = 0
      for (let i = 6; i <= 19; i++) {
        setsPerWorkoutData[i.toString()] = 0
      }
      setsPerWorkoutData['20+'] = 0

      setsPerWorkoutResult.forEach((row) => {
        const setCount = row.setCount
        if (setCount <= 5) {
          setsPerWorkoutData['<5'] = (setsPerWorkoutData['<5'] || 0) + 1
        } else if (setCount >= 20) {
          setsPerWorkoutData['20+'] = (setsPerWorkoutData['20+'] || 0) + 1
        } else {
          setsPerWorkoutData[setCount.toString()] =
            (setsPerWorkoutData[setCount.toString()] || 0) + 1
        }
      })

      // Process weekly volume - fill in all weeks from first workout to last complete week
      // Exclude current incomplete week
      const weeklyVolume: { date: string; totalVolume: number }[] = []
      if (weeklyVolumeResult.length > 0) {
        // Create a map of existing week data
        const weekDataMap = new Map<string, number>()
        weeklyVolumeResult.forEach((row) => {
          weekDataMap.set(row.weekStart, Number(row.totalVolume) || 0)
        })

        // Get the first week and current week
        const firstWeek = new Date(weeklyVolumeResult[0].weekStart)
        const now = new Date()
        // Get the start of the current week (Monday)
        const currentWeek = new Date(now)
        currentWeek.setUTCHours(0, 0, 0, 0)
        const dayOfWeek = currentWeek.getUTCDay()
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Adjust to Monday
        currentWeek.setUTCDate(currentWeek.getUTCDate() - diff)

        // Iterate through all weeks from first to BEFORE current week (exclude incomplete week)
        const iterWeek = new Date(firstWeek)
        while (iterWeek < currentWeek) {
          const weekKey = iterWeek.toISOString().split('T')[0]
          weeklyVolume.push({
            date: weekKey,
            totalVolume: weekDataMap.get(weekKey) || 0,
          })
          // Move to next week
          iterWeek.setUTCDate(iterWeek.getUTCDate() + 7)
        }
      }

      // Get exercise comparison graph data for top 2 exercises
      const topExerciseIds = topTwoExercisesResult.map((ex) => ex.exerciseId)
      const exerciseComparisonGraph =
        topExerciseIds.length > 0
          ? await getExerciseComparisonData(userId, topExerciseIds, weightUnit)
          : null

      insightsData.core = {
        summary: {
          mostPopularWorkoutType,
          mostPopularExercise,
          mostPopularLocation,
          heaviestExercisePR,
          heaviestWorkout,
        },
        exercises: {
          muscleGroupsWorked: muscleGroupCounts,
          exerciseComparisonGraph,
        },
        workouts: {
          repsPerSet: {
            workoutType: null,
            data: repsPerSetData,
          },
          setsPerWorkout: setsPerWorkoutData,
          weeklyVolume,
        },
      }
    }

    return NextResponse.json(insightsData)
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 },
    )
  }
})
