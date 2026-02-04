import { NextResponse } from 'next/server'
import { withAuth } from '@/app/api/middleware'
import db from '@/src'
import { workouts, workoutTags, workoutTagLinks } from '@/src/db/schema'
import { and, eq, sql } from 'drizzle-orm'

type WorkoutDataToChange = {
  names?: {
    prevName: string
    newName: string
  }[]
  locations?: {
    prevName: string
    newName: string
  }[]
  tags?: {
    prevName: string
    newName?: string
    delete?: boolean
  }[]
}

export type WorkoutData = {
  names: {
    name: string
    used: number
  }[]
  locations: {
    name: string
    used: number
  }[]
  tags: {
    name: string
    used: number
  }[]
}

export const GET = withAuth(async (req, user) => {
  const id = req.url.split('/').pop() // Extract user ID from the URL

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  if (id !== user.id) {
    return NextResponse.json(
      { error: 'Unauthorized access to user data' },
      { status: 403 },
    )
  }

  try {
    // Fetch all workout data in parallel
    const [workoutNamesResult, workoutLocationsResult, workoutTagsResult] =
      await Promise.all([
        // Workout names with usage count
        db
          .select({
            name: workouts.name,
            used: sql<number>`count(*)::int`,
          })
          .from(workouts)
          .where(eq(workouts.userId, id))
          .groupBy(workouts.name)
          .orderBy(sql`count(*) desc`),

        // Workout locations with usage count (excluding null locations)
        db
          .select({
            name: workouts.location,
            used: sql<number>`count(*)::int`,
          })
          .from(workouts)
          .where(eq(workouts.userId, id))
          .groupBy(workouts.location)
          .having(sql`${workouts.location} is not null`)
          .orderBy(sql`count(*) desc`),

        // Workout tags with usage count, but only with those used > 0
        db
          .select({
            name: workoutTags.name,
            used: sql<number>`count(${workoutTagLinks.workoutId})::int`,
          })
          .from(workoutTags)
          .leftJoin(workoutTagLinks, eq(workoutTags.id, workoutTagLinks.tagId))
          .where(eq(workoutTags.userId, id))
          .groupBy(workoutTags.id, workoutTags.name)
          .orderBy(sql`count(${workoutTagLinks.workoutId}) desc`)
          .having(sql`count(${workoutTagLinks.workoutId}) > 0`),
      ])

    // If user has no workouts, return null
    if (workoutNamesResult.length === 0) {
      return NextResponse.json(null, { status: 200 })
    }

    const workoutData: WorkoutData = {
      names: workoutNamesResult,
      locations: workoutLocationsResult.filter((l) => l.name !== null) as {
        name: string
        used: number
      }[],
      tags: workoutTagsResult,
    }

    return NextResponse.json(workoutData, { status: 200 })
  } catch (error) {
    console.error('Error fetching workout data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout data' },
      { status: 500 },
    )
  }
})

export const PATCH = withAuth(async (req, user) => {
  const id = req.url.split('/').pop()

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  if (id !== user.id) {
    return NextResponse.json(
      { error: 'Unauthorized access to user data' },
      { status: 403 },
    )
  }

  try {
    const body: WorkoutDataToChange = await req.json()

    // Handle name changes
    if (body.names && body.names.length > 0) {
      for (const nameChange of body.names) {
        await db
          .update(workouts)
          .set({ name: nameChange.newName })
          .where(
            and(
              eq(workouts.userId, id),
              eq(workouts.name, nameChange.prevName),
            ),
          )
      }
    }

    // Handle location changes
    if (body.locations && body.locations.length > 0) {
      for (const locationChange of body.locations) {
        await db
          .update(workouts)
          .set({ location: locationChange.newName })
          .where(
            and(
              eq(workouts.userId, id),
              eq(workouts.location, locationChange.prevName),
            ),
          )
      }
    }

    // Handle tag changes
    if (body.tags && body.tags.length > 0) {
      for (const tagChange of body.tags) {
        if (tagChange.delete) {
          // Delete the tag (workoutTagLinks cascade will remove associations, but NOT delete workouts)
          await db
            .delete(workoutTags)
            .where(
              and(
                eq(workoutTags.userId, id),
                eq(workoutTags.name, tagChange.prevName),
              ),
            )
        } else if (tagChange.newName) {
          // Check if a tag with the new name already exists for this user
          const existingTag = await db
            .select()
            .from(workoutTags)
            .where(
              and(
                eq(workoutTags.userId, id),
                eq(workoutTags.name, tagChange.newName),
              ),
            )
            .limit(1)

          if (existingTag.length > 0) {
            return NextResponse.json(
              {
                error: `A tag with the name "${tagChange.newName}" already exists`,
              },
              { status: 400 },
            )
          }

          // Update the tag name
          await db
            .update(workoutTags)
            .set({ name: tagChange.newName })
            .where(
              and(
                eq(workoutTags.userId, id),
                eq(workoutTags.name, tagChange.prevName),
              ),
            )
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error updating workout data:', error)
    return NextResponse.json(
      { error: 'Failed to update workout data' },
      { status: 500 },
    )
  }
})
