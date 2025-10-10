import { withAuth } from '@/app/api/middleware'
import db from '@/src'
import { exercises, workoutExercises } from '@/src/db/schema'
import { NextResponse } from 'next/server'
import { eq, sql, count } from 'drizzle-orm'

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url)
  const userId = url.pathname.split('/').pop()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    // Optimized query to get all user exercises with usage count and muscle groups
    const userExercises = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        used: count(workoutExercises.id),
        primaryMuscleGroup: exercises.primaryMuscleGroup,
        secondaryMuscleGroups: exercises.secondaryMuscleGroups,
      })
      .from(exercises)
      .leftJoin(workoutExercises, eq(exercises.id, workoutExercises.exerciseId))
      .where(eq(exercises.userId, userId))
      .groupBy(
        exercises.id,
        exercises.name,
        exercises.primaryMuscleGroup,
        exercises.secondaryMuscleGroups
      )
      .orderBy(sql`count(${workoutExercises.id}) DESC, ${exercises.name} ASC`)

    const result = userExercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      used: Number(exercise.used),
      primaryMuscleGroup: exercise.primaryMuscleGroup,
      secondaryMuscleGroups: exercise.secondaryMuscleGroups || [],
    }))

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error fetching user exercises:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
})
