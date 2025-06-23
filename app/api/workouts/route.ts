import { NextResponse } from 'next/server'
import { isISO8601 } from 'validator'
import db from '@/src'
import {
  exercises,
  sets,
  workoutExercises,
  workouts,
  workoutTagLinks,
  workoutTags,
} from '@/src/db/schema'
import { eq } from 'drizzle-orm'

const getExerciseId = async (name: string, userId: string) => {
  // check if exists
  const existingExercise = await db.query.exercises.findFirst({
    where: (exercise, { eq, and }) =>
      and(eq(exercise.name, name), eq(exercise.userId, userId)),
  })
  if (existingExercise) {
    return existingExercise.id
  }

  // if not exists, create exercise
  const [exercise] = await db
    .insert(exercises)
    .values({
      name,
      userId,
    })
    .returning()

  if (!exercise) {
    throw new Error('Failed to create exercise')
  }

  return exercise.id
}

// upload workout data, then exercises (exercise then workout exercises), then sets, then any dropsets/supersets, then tags
export async function POST(req: Request) {
  const data = await req.json()

  let { date, userId, name, location, exercises, setGroupings, tags } = data

  if (!userId || !date || !name || !exercises) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  if (!isISO8601(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  if (typeof name !== 'string' || name.length > 100) {
    return NextResponse.json(
      { error: 'Workout name must be a string under 100 characters' },
      { status: 400 }
    )
  }

  if (location && (typeof location !== 'string' || location.length > 100)) {
    return NextResponse.json(
      { error: 'Location must be a string' },
      { status: 400 }
    )
  }

  if (!Array.isArray(exercises) || exercises.length === 0) {
    return NextResponse.json(
      { error: 'Exercises must be a non-empty array' },
      { status: 400 }
    )
  }

  if (setGroupings && !Array.isArray(setGroupings)) {
    return NextResponse.json(
      { error: 'Set groupings must be an array' },
      { status: 400 }
    )
  }

  try {
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // create workout table entry
    const [workout] = await db
      .insert(workouts)
      .values({
        userId: userId,
        date,
        name,
        location: location || null,
      })
      .returning()

    if (!workout) {
      return NextResponse.json(
        { error: 'Failed to create workout' },
        { status: 500 }
      )
    }

    // process exercises
    let exNum: number = 1
    const setIdMap = new Map<string, string>()
    for (const exercise of exercises) {
      const exerciseId = await getExerciseId(exercise.name, userId)
      const [workoutExercise] = await db
        .insert(workoutExercises)
        .values({
          exerciseId,
          exerciseNumber: exNum.toString(),
          workoutId: workout.id,
        })
        .returning()

      let setNum = 1
      const { exerciseSets } = exercise

      for (const set of exerciseSets) {
        const {
          weight,
          reps,
          rpe,
          rir,
          partialReps,
          cheatReps,
          lowReps,
          highReps,
        } = set
        const [insertedSet] = await db
          .insert(sets)
          .values({
            workoutExerciseId: workoutExercise.id,
            setNumber: setNum.toString(),
            weight: weight ? weight.toString() : null,
            reps: reps ? reps.toString() : null,
            rpe: rpe ? rpe.toString() : null,
            rir: rir ? rir.toString() : null,
            partialReps: partialReps ? partialReps.toString() : null,
            cheatReps: cheatReps ? cheatReps.toString() : null,
            lowReps: lowReps ? lowReps.toString() : null,
            highReps: highReps ? highReps.toString() : null,
          })
          .returning({ id: sets.id, setNumber: sets.setNumber })

        if (!insertedSet) {
          return NextResponse.json(
            { error: `Failed to create set ${setNum} for ${exercise}` },
            { status: 500 }
          )
        }
        setIdMap.set(
          `${workoutExercise.exerciseNumber}-${insertedSet.setNumber}`,
          insertedSet.id
        )
        setNum++
      }
      exNum++
    }

    if (setGroupings && setGroupings.length > 0) {
      for (const grouping of setGroupings) {
        const { type, groupSets } = grouping
        if (
          !type ||
          !groupSets ||
          !Array.isArray(groupSets) ||
          groupSets.length < 2
        ) {
          return NextResponse.json(
            { error: 'Invalid set grouping data' },
            { status: 400 }
          )
        }

        const [setGrouping] = await db
          .insert(setGroupings)
          .values({
            type,
          })
          .returning({ id: setGroupings.id })

        if (!setGrouping) {
          return NextResponse.json(
            { error: 'Failed to create set grouping' },
            { status: 500 }
          )
        }

        for (const set of groupSets) {
          const { exerciseNumber, setNumber } = set
          if (!exerciseNumber || !setNumber) {
            return NextResponse.json(
              {
                error:
                  'Each set grouping must have exerciseNumber and setNumber',
              },
              { status: 400 }
            )
          }
          const setId = setIdMap.get(`${exerciseNumber}-${setNumber}`)
          if (!setId) {
            return NextResponse.json(
              {
                error: `Set not found for exercise ${exerciseNumber} and set ${setNumber}`,
              },
              { status: 404 }
            )
          }
          const [insertedSetGrouping] = await db
            .update(sets)
            .set({
              setGroupingId: setGrouping.id,
            })
            .where(eq(sets.id, setId))
            .returning()
        }
      }
    }

    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagIds: string[] = []
      tags = Array.from(new Set(tags))

      if (tags.length > 10) {
        return NextResponse.json(
          { error: 'Maximum of 10 tags allowed' },
          { status: 400 }
        )
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.length > 50) {
          return NextResponse.json(
            { error: 'Each tag must be a string under 50 characters' },
            { status: 400 }
          )
        }

        const existingTag = await db.query.workoutTags.findFirst({
          where: (workoutTags, { eq, and }) =>
            and(eq(workoutTags.name, tag), eq(workoutTags.userId, userId)),
        })

        if (existingTag) {
          tagIds.push(existingTag.id)
        } else {
          const [newTag] = await db
            .insert(workoutTags)
            .values({ name: tag, userId })
            .returning()

          if (!newTag) {
            return NextResponse.json(
              { error: `Failed to create tag ${tag}` },
              { status: 500 }
            )
          }
          tagIds.push(newTag.id)
        }
      }

      // associate tags with workout
      for (const tagId of tagIds) {
        await db.insert(workoutTagLinks).values({
          workoutId: workout.id,
          tagId,
        })
      }
    }

    return NextResponse.json(
      {
        message: 'Workout created successfully',
        workoutId: workout.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error processing workout data:', error)
    return NextResponse.json(
      {
        error: 'An unexpected error occurred while processing the workout data',
      },
      { status: 500 }
    )
  }
}
