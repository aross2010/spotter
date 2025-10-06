import { withAuth } from '@/app/api/middleware'
import { NextResponse } from 'next/server'
import db from '@/src'
import { workouts, exercises, workoutExercises } from '@/src/db/schema'
import { eq, sql, desc } from 'drizzle-orm'

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url)
  const userId = url.pathname.split('/').pop()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    const [workoutNameResults, exerciseNameResults, locationResults] =
      await Promise.all([
        db
          .select({
            name: workouts.name,
            used: sql<number>`count(*)::int`.as('used'),
          })
          .from(workouts)
          .where(eq(workouts.userId, userId))
          .groupBy(workouts.name)
          .orderBy(desc(sql`count(*)`)),

        db
          .select({
            name: exercises.name,
            used: sql<number>`count(${workoutExercises.id})::int`.as('used'),
            isUnilateral: exercises.isUnilateral,
          })
          .from(exercises)
          .leftJoin(
            workoutExercises,
            eq(exercises.id, workoutExercises.exerciseId)
          )
          .where(eq(exercises.userId, userId))
          .groupBy(exercises.name, exercises.isUnilateral)
          .orderBy(desc(sql`count(${workoutExercises.id})`)),

        db
          .select({
            location: workouts.location,
            used: sql<number>`count(*)::int`.as('used'),
          })
          .from(workouts)
          .where(eq(workouts.userId, userId))
          .groupBy(workouts.location)
          .orderBy(desc(sql`count(*)`)),
      ])

    const workoutNames = workoutNameResults
    const exerciseNames = exerciseNameResults
    const locations = locationResults.filter(
      (loc) => loc.location !== null && loc.location !== ''
    )

    console.log('locations: ', locations)

    return NextResponse.json(
      { workoutNames, exerciseNames, locations },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching workout and exercise names:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout and exercise names' },
      { status: 500 }
    )
  }
})
