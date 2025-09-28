import { withAuth } from '@/app/api/middleware'
import { NextResponse } from 'next/server'
import db from '@/src'
import {
  workouts,
  workoutExercises,
  exercises,
  sets,
  workoutTagLinks,
  workoutTags,
  setGroupings,
} from '@/src/db/schema'
import { desc, asc, eq, and, inArray, sql, min, max, count } from 'drizzle-orm'

export const GET = withAuth(async (req, user) => {
  const url = new URL(req.url)
  const userId = url.pathname.split('/').pop()

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  // query params
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 50)
  const sortBy = url.searchParams.get('sortBy') || 'date'
  const sortOrder = url.searchParams.get('sortOrder') || 'desc'
  const tags = url.searchParams.get('tags') // string of tag names
  const workoutNames = url.searchParams.get('workoutNames') // string of workout names
  const exerciseNames = url.searchParams.get('exerciseNames') // string of exercise names
  const status = url.searchParams.get('status') // 'completed' or 'planned'

  if (page < 1 || limit < 1) {
    return NextResponse.json(
      { error: 'Invalid pagination parameters. Page and limit must be >= 1.' },
      { status: 400 }
    )
  }

  if (!['date', 'name'].includes(sortBy)) {
    return NextResponse.json(
      { error: 'Invalid sortBy parameter. Allowed values: date, name' },
      { status: 400 }
    )
  }

  if (!['asc', 'desc'].includes(sortOrder)) {
    return NextResponse.json(
      { error: 'Invalid sortOrder parameter. Allowed values: asc, desc' },
      { status: 400 }
    )
  }

  if (status && !['completed', 'planned'].includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status parameter. Allowed values: completed, planned' },
      { status: 400 }
    )
  }

  try {
    const offset = (page - 1) * limit
    let tagIds: string[] = []
    let workoutNameList: string[] = []
    let exerciseNameList: string[] = []

    if (tags) {
      try {
        const tagNames = JSON.parse(tags) as string[]
        if (Array.isArray(tagNames) && tagNames.length > 0) {
          const tagRecords = await db
            .select({ id: workoutTags.id })
            .from(workoutTags)
            .where(
              and(
                eq(workoutTags.userId, userId),
                inArray(workoutTags.name, tagNames)
              )
            )
          tagIds = tagRecords.map((tag) => tag.id)

          if (tagIds.length === 0) {
            return NextResponse.json(
              {
                workouts: [],
                pagination: {
                  page,
                  limit,
                  totalPages: 0,
                  totalWorkouts: 0,
                  hasNextPage: false,
                  hasPrevPage: false,
                },
              },
              { status: 200 }
            )
          }
        }
      } catch (error) {
        return NextResponse.json(
          {
            error: 'Invalid tags parameter. Must be a JSON array of tag names.',
          },
          { status: 400 }
        )
      }
    }

    if (workoutNames) {
      try {
        const names = JSON.parse(workoutNames) as string[]
        if (Array.isArray(names) && names.length > 0) {
          workoutNameList = names
        }
      } catch (error) {
        return NextResponse.json(
          {
            error:
              'Invalid workoutNames parameter. Must be a JSON array of workout names.',
          },
          { status: 400 }
        )
      }
    }

    if (exerciseNames) {
      try {
        const names = JSON.parse(exerciseNames) as string[]
        if (Array.isArray(names) && names.length > 0) {
          exerciseNameList = names
        }
      } catch (error) {
        return NextResponse.json(
          {
            error:
              'Invalid exerciseNames parameter. Must be a JSON array of exercise names.',
          },
          { status: 400 }
        )
      }
    }

    let baseConditions = eq(workouts.userId, userId)

    if (status) {
      baseConditions =
        and(baseConditions, eq(workouts.status, status)) || baseConditions
    }

    if (workoutNameList.length > 0) {
      baseConditions =
        and(baseConditions, inArray(workouts.name, workoutNameList)) ||
        baseConditions
    }

    const hasTagFilter = tagIds.length > 0
    const hasExerciseFilter = exerciseNameList.length > 0

    let workoutsQuery
    let countQuery

    if (hasTagFilter && hasExerciseFilter) {
      const joinConditions = and(
        baseConditions,
        inArray(workoutTagLinks.tagId, tagIds),
        inArray(exercises.name, exerciseNameList)
      )

      workoutsQuery = db
        .selectDistinct({
          id: workouts.id,
          userId: workouts.userId,
          name: workouts.name,
          date: workouts.date,
          location: workouts.location,
        })
        .from(workouts)
        .innerJoin(workoutTagLinks, eq(workouts.id, workoutTagLinks.workoutId))
        .innerJoin(
          workoutExercises,
          eq(workouts.id, workoutExercises.workoutId)
        )
        .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .where(joinConditions)
        .orderBy(
          ...[
            sortBy === 'date'
              ? sortOrder === 'desc'
                ? desc(workouts.date)
                : asc(workouts.date)
              : sortOrder === 'desc'
              ? desc(workouts.name)
              : asc(workouts.name),
          ]
        )
        .limit(limit)
        .offset(offset)

      countQuery = db
        .select({ count: sql<number>`count(distinct ${workouts.id})` })
        .from(workouts)
        .innerJoin(workoutTagLinks, eq(workouts.id, workoutTagLinks.workoutId))
        .innerJoin(
          workoutExercises,
          eq(workouts.id, workoutExercises.workoutId)
        )
        .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .where(joinConditions)
    } else if (hasTagFilter) {
      const tagConditions = and(
        baseConditions,
        inArray(workoutTagLinks.tagId, tagIds)
      )

      workoutsQuery = db
        .selectDistinct({
          id: workouts.id,
          userId: workouts.userId,
          name: workouts.name,
          date: workouts.date,
          location: workouts.location,
        })
        .from(workouts)
        .innerJoin(workoutTagLinks, eq(workouts.id, workoutTagLinks.workoutId))
        .where(tagConditions)
        .orderBy(
          ...[
            sortBy === 'date'
              ? sortOrder === 'desc'
                ? desc(workouts.date)
                : asc(workouts.date)
              : sortOrder === 'desc'
              ? desc(workouts.name)
              : asc(workouts.name),
          ]
        )
        .limit(limit)
        .offset(offset)

      countQuery = db
        .select({ count: sql<number>`count(distinct ${workouts.id})` })
        .from(workouts)
        .innerJoin(workoutTagLinks, eq(workouts.id, workoutTagLinks.workoutId))
        .where(tagConditions)
    } else if (hasExerciseFilter) {
      const exerciseConditions = and(
        baseConditions,
        inArray(exercises.name, exerciseNameList)
      )

      workoutsQuery = db
        .selectDistinct({
          id: workouts.id,
          userId: workouts.userId,
          name: workouts.name,
          date: workouts.date,
          location: workouts.location,
        })
        .from(workouts)
        .innerJoin(
          workoutExercises,
          eq(workouts.id, workoutExercises.workoutId)
        )
        .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .where(exerciseConditions)
        .orderBy(
          ...[
            sortBy === 'date'
              ? sortOrder === 'desc'
                ? desc(workouts.date)
                : asc(workouts.date)
              : sortOrder === 'desc'
              ? desc(workouts.name)
              : asc(workouts.name),
          ]
        )
        .limit(limit)
        .offset(offset)

      countQuery = db
        .select({ count: sql<number>`count(distinct ${workouts.id})` })
        .from(workouts)
        .innerJoin(
          workoutExercises,
          eq(workouts.id, workoutExercises.workoutId)
        )
        .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
        .where(exerciseConditions)
    } else {
      const orderBy = [
        sortBy === 'date'
          ? sortOrder === 'desc'
            ? desc(workouts.date)
            : asc(workouts.date)
          : sortOrder === 'desc'
          ? desc(workouts.name)
          : asc(workouts.name),
      ]

      workoutsQuery = db
        .select()
        .from(workouts)
        .where(baseConditions)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset)

      countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(workouts)
        .where(baseConditions)
    }

    const [workoutResults, countResult] = await Promise.all([
      workoutsQuery,
      countQuery,
    ])

    const totalWorkouts = Number(countResult[0]?.count) || 0

    if (workoutResults.length === 0) {
      return NextResponse.json(
        {
          workouts: [],
          pagination: {
            page,
            limit,
            totalPages: 0,
            totalWorkouts: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
        { status: 200 }
      )
    }

    const workoutIds = workoutResults.map((workout) => workout.id)

    const [workoutTagsData, workoutExercisesData] =
      workoutIds.length > 0
        ? await Promise.all([
            db
              .select({
                workoutId: workoutTagLinks.workoutId,
                tagName: workoutTags.name,
              })
              .from(workoutTagLinks)
              .innerJoin(workoutTags, eq(workoutTagLinks.tagId, workoutTags.id))
              .where(inArray(workoutTagLinks.workoutId, workoutIds)),

            db
              .select({
                workoutId: workoutExercises.workoutId,
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
              .innerJoin(
                exercises,
                eq(workoutExercises.exerciseId, exercises.id)
              )
              .leftJoin(sets, eq(workoutExercises.id, sets.workoutExerciseId))
              .where(inArray(workoutExercises.workoutId, workoutIds))
              .groupBy(
                workoutExercises.workoutId,
                workoutExercises.exerciseNumber,
                exercises.name
              )
              .orderBy(asc(workoutExercises.exerciseNumber)),
          ])
        : [[], []]

    const tagsByWorkout: Record<string, string[]> = {}
    workoutTagsData.forEach(({ workoutId, tagName }) => {
      if (!tagsByWorkout[workoutId]) {
        tagsByWorkout[workoutId] = []
      }
      tagsByWorkout[workoutId].push(tagName)
    })

    const exercisesByWorkout: Record<string, any[]> = {}
    workoutExercisesData.forEach((exercise) => {
      if (!exercisesByWorkout[exercise.workoutId]) {
        exercisesByWorkout[exercise.workoutId] = []
      }
      exercisesByWorkout[exercise.workoutId].push(exercise)
    })

    const minimalWorkouts = workoutResults.map((workout) => {
      const workoutExercises = exercisesByWorkout[workout.id] || []

      const exercises = workoutExercises.map((exercise) => ({
        name: exercise.exerciseName,
        sets: Number(exercise.setsCount) || 0,
        lowRepRange: Number(exercise.lowRepRange) || 0,
        highRepRange: Number(exercise.highRepRange) || 0,
      }))

      return {
        id: workout.id,
        date: workout.date,
        location: workout.location || '',
        tags: tagsByWorkout[workout.id] || [],
        pinned: (workout as any).pinned || false,
        name: workout.name,
        exercises,
      }
    })

    const totalPages = Math.ceil(totalWorkouts / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json(
      {
        workouts: minimalWorkouts,
        pagination: {
          page,
          limit,
          totalPages,
          totalWorkouts,
          hasNextPage,
          hasPrevPage,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
})
