import { withAuth } from '../../middleware'
import { NextResponse } from 'next/server'
import db from '@/src'
import {
  workouts,
  workoutExercises,
  exercises,
  sets,
  workoutTagLinks,
  workoutTags,
} from '@/src/db/schema'
import {
  desc,
  asc,
  eq,
  and,
  inArray,
  sql,
  min,
  max,
  count,
  gte,
} from 'drizzle-orm'

export type WorkoutMinimal = {
  id: string
  date: string
  location: string
  tags: string[]
  pinned: boolean
  name: string
  exercises: {
    name: string
    sets: number // 2 sets, 3 sets, etc.
    lowRepRange: number
    highRepRange: number // 6 - 8 reps the lowest and highest rep count for the ex., not including partials
  }[]
  status: 'completed' | 'planned' | 'active'
}

type HomeData = {
  totalWorkouts: number
  totalReps: number
  totalSets: number
  totalExercises: number
  featuredWorkout: {
    workout: WorkoutMinimal | null
    status: 'none' | 'most recent' | 'upcoming' | 'current' // try to get current workout first (active and same day), then upcoming (any workout marked as planned in the future or today), then most recent (last completed wotkout), else none (prompt to create)
  }
  activityCalendar: {
    [date: string]: {
      workouts: {
        status: 'completed' | 'planned' | 'active'
        workoutId: string
      }[]
    }
  }
}

export const GET = withAuth(async (req: Request, user: any) => {
  const url = new URL(req.url)
  const userId = url.pathname.split('/').pop()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0]

    const [
      statsResult,
      activityData,
      currentWorkout,
      upcomingWorkout,
      recentWorkout,
    ] = await Promise.all([
      // Get all workout stats (total workouts, sets, reps, exercises)
      db
        .select({
          totalWorkouts: count(workouts.id),
          totalSets: sql<number>`count(${sets.id})`,
          totalReps: sql<number>`sum(COALESCE(${sets.reps}, 0) + COALESCE(${sets.leftReps}, 0) + COALESCE(${sets.rightReps}, 0))`,
          totalExercises: sql<number>`count(distinct ${exercises.id})`,
        })
        .from(workouts)
        .leftJoin(workoutExercises, eq(workouts.id, workoutExercises.workoutId))
        .leftJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .leftJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
        .where(eq(workouts.userId, userId)),

      // Get activity data for the last 365 days with status and workout IDs
      db
        .select({
          date: workouts.date,
          status: workouts.status,
          workoutId: workouts.id,
        })
        .from(workouts)
        .where(
          and(eq(workouts.userId, userId), gte(workouts.date, oneYearAgoStr))
        )
        .orderBy(asc(workouts.date)),

      // Try to find current workout (active status and today's date)
      db
        .select({ id: workouts.id })
        .from(workouts)
        .where(
          and(
            eq(workouts.userId, userId),
            eq(workouts.status, 'active'),
            eq(workouts.date, today)
          )
        )
        .orderBy(desc(workouts.date))
        .limit(1),

      // Try to find upcoming workout (planned status, today or future)
      db
        .select({ id: workouts.id })
        .from(workouts)
        .where(
          and(
            eq(workouts.userId, userId),
            eq(workouts.status, 'planned'),
            gte(workouts.date, today)
          )
        )
        .orderBy(asc(workouts.date))
        .limit(1),

      // Get most recent completed workout
      db
        .select({ id: workouts.id })
        .from(workouts)
        .where(
          and(eq(workouts.userId, userId), eq(workouts.status, 'completed'))
        )
        .orderBy(desc(workouts.date))
        .limit(1),
    ])

    const stats = statsResult[0] || {
      totalWorkouts: 0,
      totalSets: 0,
      totalReps: 0,
      totalExercises: 0,
    }

    // Build activity calendar with workout status and IDs
    const activityCalendar: HomeData['activityCalendar'] = {}
    activityData.forEach(({ date, status, workoutId }) => {
      if (!activityCalendar[date]) {
        activityCalendar[date] = { workouts: [] }
      }
      activityCalendar[date].workouts.push({
        status: status as 'completed' | 'planned' | 'active',
        workoutId,
      })
    })

    // Helper function to get full workout data
    const getFullWorkout = async (
      workoutId: string
    ): Promise<WorkoutMinimal | null> => {
      const workoutResult = await db
        .select({
          id: workouts.id,
          userId: workouts.userId,
          name: workouts.name,
          date: workouts.date,
          location: workouts.location,
          status: workouts.status,
          pinned: workouts.pinned,
        })
        .from(workouts)
        .where(eq(workouts.id, workoutId))
        .limit(1)

      if (workoutResult.length === 0) return null

      const workout = workoutResult[0]

      const [workoutTagsData, workoutExercisesData] = await Promise.all([
        db
          .select({
            tagName: workoutTags.name,
          })
          .from(workoutTagLinks)
          .innerJoin(workoutTags, eq(workoutTagLinks.tagId, workoutTags.id))
          .where(eq(workoutTagLinks.workoutId, workoutId)),

        db
          .select({
            exerciseName: exercises.name,
            setsCount: count(sets.id),
            lowRepRange: min(
              sql`CASE 
                WHEN ${sets.leftReps} IS NOT NULL AND ${sets.rightReps} IS NOT NULL 
                THEN LEAST(${sets.leftReps}, ${sets.rightReps})
                ELSE ${sets.reps}
              END`
            ),
            highRepRange: max(
              sql`CASE 
                WHEN ${sets.leftReps} IS NOT NULL AND ${sets.rightReps} IS NOT NULL 
                THEN GREATEST(${sets.leftReps}, ${sets.rightReps})
                ELSE ${sets.reps}
              END`
            ),
          })
          .from(workoutExercises)
          .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
          .leftJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
          .where(eq(workoutExercises.workoutId, workoutId))
          .groupBy(workoutExercises.exerciseNumber, exercises.name)
          .orderBy(asc(workoutExercises.exerciseNumber)),
      ])

      const exercisesData = workoutExercisesData.map((exercise) => ({
        name: exercise.exerciseName,
        sets: Number(exercise.setsCount) || 0,
        lowRepRange: Number(exercise.lowRepRange) || 0,
        highRepRange: Number(exercise.highRepRange) || 0,
      }))

      return {
        id: workout.id,
        date: workout.date,
        location: workout.location || '',
        tags: workoutTagsData.map((t) => t.tagName),
        pinned: workout.pinned || false,
        name: workout.name,
        status: workout.status as 'completed' | 'planned' | 'active',
        exercises: exercisesData,
      }
    }

    // Determine featured workout based on priority
    let featuredWorkout: WorkoutMinimal | null = null
    let featuredStatus: 'none' | 'most recent' | 'upcoming' | 'current' = 'none'

    if (currentWorkout.length > 0) {
      featuredWorkout = await getFullWorkout(currentWorkout[0].id)
      featuredStatus = 'current'
    } else if (upcomingWorkout.length > 0) {
      featuredWorkout = await getFullWorkout(upcomingWorkout[0].id)
      featuredStatus = 'upcoming'
    } else if (recentWorkout.length > 0) {
      featuredWorkout = await getFullWorkout(recentWorkout[0].id)
      featuredStatus = 'most recent'
    }

    const homeData: HomeData = {
      totalWorkouts: Number(stats.totalWorkouts),
      totalReps: Number(stats.totalReps),
      totalSets: Number(stats.totalSets),
      totalExercises: Number(stats.totalExercises),
      featuredWorkout: {
        workout: featuredWorkout,
        status: featuredStatus,
      },
      activityCalendar,
    }

    return NextResponse.json(homeData, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching home data:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
})
