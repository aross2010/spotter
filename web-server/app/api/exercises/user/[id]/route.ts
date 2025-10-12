import { withAuth } from '@/app/api/middleware'
import db from '@/src'
import { exercises } from '@/src/db/schema'
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url)
  const userId = url.pathname.split('/').pop()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    // Simple query to get all user exercises with muscle groups
    const userExercises = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        primaryMuscleGroup: exercises.primaryMuscleGroup,
        secondaryMuscleGroups: exercises.secondaryMuscleGroups,
      })
      .from(exercises)
      .where(eq(exercises.userId, userId))
      .orderBy(exercises.name)

    const result = userExercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
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
