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
import { eq, desc, sql, and, isNotNull, inArray } from 'drizzle-orm'

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
  weightUnit: 'lbs' | 'kg'
) {
  if (exerciseIds.length === 0 || exerciseIds.length > 5) {
    return []
  }

  const weightField = weightUnit === 'kg' ? sets.weightKg : sets.weightLbs

  // Get best set per workout for each exercise
  const progressionData = await db
    .select({
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      workoutId: workouts.id,
      date: workouts.date,
      weight: sql<number>`max(${weightField})`,
    })
    .from(sets)
    .innerJoin(
      workoutExercises,
      eq(sets.workoutExerciseId, workoutExercises.id)
    )
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .where(
      and(
        eq(workouts.userId, userId),
        inArray(exercises.id, exerciseIds),
        isNotNull(weightField)
      )
    )
    .groupBy(exercises.id, exercises.name, workouts.id, workouts.date)
    .orderBy(workouts.date)

  // Group by exercise
  const exerciseMap = new Map<
    string,
    {
      name: string
      exerciseId: string
      graphData: { date: string; weight: number }[]
    }
  >()

  progressionData.forEach((row) => {
    if (!exerciseMap.has(row.exerciseId)) {
      exerciseMap.set(row.exerciseId, {
        name: row.exerciseName,
        exerciseId: row.exerciseId,
        graphData: [],
      })
    }
    exerciseMap.get(row.exerciseId)!.graphData.push({
      date: row.date,
      weight: Number(row.weight) || 0,
    })
  })

  return Array.from(exerciseMap.values())
}

export const GET = withAuth(async (req: Request, user: any) => {
  const url = new URL(req.url)
  const userId = url.pathname.split('/').pop()
  const weightUnit = (url.searchParams.get('unit') || 'lbs') as 'lbs' | 'kg'

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
      .where(eq(workouts.userId, userId))

    const totalWorkouts = workoutCount[0]?.count || 0

    // Initialize response structure
    const insightsData: any = {
      totalWorkouts,
      userExercises: [],
    }

    const weightField = weightUnit === 'kg' ? sets.weightKg : sets.weightLbs
    const weightEntryField =
      weightUnit === 'kg' ? weightEntries.weightKg : weightEntries.weightLbs

    // Fetch all data in parallel
    const [
      popularWorkoutResult,
      popularExerciseResult,
      popularLocationResult,
      heaviestPRResult,
      heaviestWorkoutResult,
      muscleGroupsResult,
      dayOfWeekResult,
      repsPerSetResult,
      setsPerWorkoutResult,
      weeklyVolumeResult,
      weightProgressionResult,
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
            .where(eq(workouts.userId, userId))
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
            .where(eq(workouts.userId, userId))
            .groupBy(exercises.id, exercises.name)
            .orderBy(
              desc(sql`count(distinct ${workouts.id})`),
              desc(sql`max(${workouts.date})`)
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
              and(eq(workouts.userId, userId), isNotNull(workouts.location))
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
              eq(sets.workoutExerciseId, workoutExercises.id)
            )
            .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
            .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
            .where(and(eq(workouts.userId, userId), isNotNull(weightField)))
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
              eq(workouts.id, workoutExercises.workoutId)
            )
            .innerJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
            .where(and(eq(workouts.userId, userId), isNotNull(weightField)))
            .groupBy(
              workouts.id,
              workouts.name,
              workouts.location,
              workouts.date
            )
            .orderBy(
              desc(sql`sum(${weightField} * COALESCE(${sets.reps}, 1))`),
              desc(workouts.date)
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
                isNotNull(exercises.primaryMuscleGroup)
              )
            )
            .groupBy(
              exercises.primaryMuscleGroup,
              exercises.secondaryMuscleGroups
            )
        : Promise.resolve([]),

      // Workouts by day of week
      totalWorkouts >= 5
        ? db
            .select({
              dayOfWeek: sql<string>`to_char(${workouts.date}, 'Day')`,
              count: sql<number>`count(*)::int`,
            })
            .from(workouts)
            .where(eq(workouts.userId, userId))
            .groupBy(sql`to_char(${workouts.date}, 'Day')`)
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
              eq(sets.workoutExerciseId, workoutExercises.id)
            )
            .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
            .where(and(eq(workouts.userId, userId), isNotNull(sets.reps)))
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
              eq(workouts.id, workoutExercises.workoutId)
            )
            .innerJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
            .where(eq(workouts.userId, userId))
            .groupBy(workouts.id)
        : Promise.resolve([]),

      // Weekly volume
      totalWorkouts >= 5
        ? db
            .select({
              weekStart: sql<string>`date_trunc('week', ${workouts.date})::date`,
              totalVolume: sql<number>`sum(COALESCE(${sets.reps}, 0))::int`,
            })
            .from(workouts)
            .innerJoin(
              workoutExercises,
              eq(workouts.id, workoutExercises.workoutId)
            )
            .innerJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
            .where(eq(workouts.userId, userId))
            .groupBy(sql`date_trunc('week', ${workouts.date})`)
            .orderBy(sql`date_trunc('week', ${workouts.date})`)
        : Promise.resolve([]),

      // Weight progression
      db
        .select({
          date: weightEntries.date,
          bodyWeight: weightEntryField,
        })
        .from(weightEntries)
        .where(
          and(eq(weightEntries.userId, userId), isNotNull(weightEntryField))
        )
        .orderBy(weightEntries.date),

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
          eq(exercises.id, workoutExercises.exerciseId)
        )
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .where(eq(workouts.userId, userId))
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
            .where(eq(workouts.userId, userId))
            .groupBy(exercises.id)
            .orderBy(
              desc(sql`count(distinct ${workouts.id})`),
              desc(sql`max(${workouts.date})`)
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

      // Process day of week
      const workoutsByDayOfWeek: { [key: string]: number } = {}
      dayOfWeekResult.forEach((row) => {
        workoutsByDayOfWeek[row.dayOfWeek.trim()] = row.count
      })

      // Process reps per set
      const repsPerSetData: { [key: number]: number } = {}
      repsPerSetResult.forEach((row) => {
        const repsValue = Number(row.reps)
        repsPerSetData[repsValue] = row.count
      })

      // Process sets per workout
      const setsPerWorkoutData: { [key: number]: number } = {}
      setsPerWorkoutResult.forEach((row) => {
        const setCount = row.setCount
        setsPerWorkoutData[setCount] = (setsPerWorkoutData[setCount] || 0) + 1
      })

      // Process weekly volume
      const weeklyVolume = weeklyVolumeResult.map((row) => ({
        date: row.weekStart,
        totalVolume: row.totalVolume,
      }))

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
          workoutsByDayOfWeek,
          repsPerSet: {
            workoutType: null,
            data: repsPerSetData,
          },
          setsPerWorkout: setsPerWorkoutData,
          weeklyVolume,
        },
      }
    }

    // WEIGHT PROGRESSION
    if (weightProgressionResult.length > 0) {
      const bodyWeightProgression = weightProgressionResult.map((entry) => ({
        date: entry.date,
        bodyWeight: Number(entry.bodyWeight) || 0,
      }))

      const weights = bodyWeightProgression.map((entry) => entry.bodyWeight)
      const lowestBodyWeight = Math.min(...weights)
      const highestBodyWeight = Math.max(...weights)
      const overallDifference = highestBodyWeight - lowestBodyWeight

      insightsData.weight = {
        bodyWeightProgression,
        lowestBodyWeight,
        highestBodyWeight,
        overallDifference,
      }
    }

    return NextResponse.json(insightsData)
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
})
