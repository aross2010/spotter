import { withAuth } from '@/app/api/middleware'
import { NextResponse } from 'next/server'
import db from '@/src'
import {
  workouts,
  exercises,
  workoutExercises,
  workoutTags,
  workoutTagLinks,
} from '@/src/db/schema'
import { eq, sql, desc, and } from 'drizzle-orm'

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url)
  const userId = url.pathname.split('/').pop()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  if (userId !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const [workoutNames, exerciseNames, locationResults, tagResults] =
      await Promise.all([
        db
          .select({
            name: workouts.name,
            used: sql<number>`count(*)::int`.as('used'),
          })
          .from(workouts)
          .where(
            and(eq(workouts.userId, userId), eq(workouts.status, 'completed'))
          )
          .groupBy(workouts.name)
          .orderBy(desc(sql`count(*)`)),

        db
          .select({
            id: exercises.id,
            name: exercises.name,
            used: sql<number>`count(CASE WHEN ${workouts.status} = 'completed' THEN ${workoutExercises.id} END)::int`.as(
              'used'
            ),
            isUnilateral: exercises.isUnilateral,
          })
          .from(exercises)
          .leftJoin(
            workoutExercises,
            eq(exercises.id, workoutExercises.exerciseId)
          )
          .leftJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
          .where(eq(exercises.userId, userId))
          .groupBy(exercises.id, exercises.name, exercises.isUnilateral)
          .orderBy(
            desc(
              sql`count(CASE WHEN ${workouts.status} = 'completed' THEN ${workoutExercises.id} END)`
            )
          ),

        db
          .select({
            location: workouts.location,
            used: sql<number>`count(*)::int`.as('used'),
          })
          .from(workouts)
          .where(
            and(eq(workouts.userId, userId), eq(workouts.status, 'completed'))
          )
          .groupBy(workouts.location)
          .orderBy(desc(sql`count(*)`)),

        db
          .select({
            id: workoutTags.id,
            name: workoutTags.name,
            userId: workoutTags.userId,
            used: sql<number>`count(CASE WHEN ${workouts.status} = 'completed' THEN ${workoutTagLinks.workoutId} END)::int`.as(
              'used'
            ),
          })
          .from(workoutTags)
          .leftJoin(workoutTagLinks, eq(workoutTags.id, workoutTagLinks.tagId))
          .leftJoin(workouts, eq(workouts.id, workoutTagLinks.workoutId))
          .where(eq(workoutTags.userId, userId))
          .groupBy(workoutTags.id, workoutTags.name, workoutTags.userId)
          .orderBy(
            desc(
              sql`count(CASE WHEN ${workouts.status} = 'completed' THEN ${workoutTagLinks.workoutId} END)`
            )
          ),
      ])

    const locations = locationResults.filter(
      (loc) => loc.location !== null && loc.location !== '' && loc.used > 0
    )

    const tags = tagResults.filter((tag) => tag.used > 0)

    return NextResponse.json(
      { workoutNames, exerciseNames, locations, tags },
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
