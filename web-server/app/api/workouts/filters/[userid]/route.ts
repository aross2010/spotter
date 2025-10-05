import { withAuth } from '@/app/api/middleware'
import { NextResponse } from 'next/server'
import db from '@/src'
import {
  workouts,
  workoutTags,
  workoutTagLinks,
  workoutExercises,
  exercises,
} from '@/src/db/schema'
import { eq, and, sql } from 'drizzle-orm'

type FilterOptions = {
  label: string
  type: 'tags' | 'workoutNames' | 'exerciseNames' | 'locations'
  used: number
}[]

export const GET = withAuth(async (req: Request, user: any) => {
  const url = new URL(req.url)
  const userId = url.pathname.split('/').pop()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    // Run all queries in parallel for better performance
    const [
      tagsResult,
      workoutNamesResult,
      exerciseNamesResult,
      locationsResult,
    ] = await Promise.all([
      // Get all workout tags with usage count (only tags that are actually used)
      db
        .select({
          label: workoutTags.name,
          used: sql<number>`count(distinct ${workoutTagLinks.workoutId})::int`,
        })
        .from(workoutTagLinks)
        .innerJoin(workoutTags, eq(workoutTags.id, workoutTagLinks.tagId))
        .where(eq(workoutTags.userId, userId))
        .groupBy(workoutTags.id, workoutTags.name)
        .having(sql`count(distinct ${workoutTagLinks.workoutId}) > 0`),

      // Get all unique workout names with usage count
      db
        .select({
          label: workouts.name,
          used: sql<number>`count(*)::int`,
        })
        .from(workouts)
        .where(eq(workouts.userId, userId))
        .groupBy(workouts.name),

      // Get all unique exercise names with usage count (only exercises that are actually used)
      db
        .select({
          label: exercises.name,
          used: sql<number>`count(distinct ${workoutExercises.workoutId})::int`,
        })
        .from(workoutExercises)
        .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
        .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
        .where(eq(workouts.userId, userId))
        .groupBy(exercises.id, exercises.name)
        .having(sql`count(distinct ${workoutExercises.workoutId}) > 0`),

      // Get all unique locations with usage count (only non-null locations)
      db
        .select({
          label: workouts.location,
          used: sql<number>`count(*)::int`,
        })
        .from(workouts)
        .where(
          and(
            eq(workouts.userId, userId),
            sql`${workouts.location} IS NOT NULL AND ${workouts.location} != ''`
          )
        )
        .groupBy(workouts.location),
    ])

    // Transform results
    const tags: FilterOptions = tagsResult.map((tag) => ({
      label: tag.label,
      type: 'tags' as const,
      used: tag.used,
    }))

    const workoutNames: FilterOptions = workoutNamesResult.map((name) => ({
      label: name.label,
      type: 'workoutNames' as const,
      used: name.used,
    }))

    const exerciseNames: FilterOptions = exerciseNamesResult.map(
      (exercise) => ({
        label: exercise.label,
        type: 'exerciseNames' as const,
        used: exercise.used,
      })
    )

    const locations: FilterOptions = locationsResult
      .filter((loc) => loc.label !== null)
      .map((location) => ({
        label: location.label!,
        type: 'locations' as const,
        used: location.used,
      }))

    // Combine all filter options
    const allFilters: FilterOptions = [
      ...tags,
      ...workoutNames,
      ...exerciseNames,
      ...locations,
    ]

    return NextResponse.json(allFilters)
  } catch (error: any) {
    console.error('Error fetching filter options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    )
  }
})
