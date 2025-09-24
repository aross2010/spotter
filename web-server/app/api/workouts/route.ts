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
  setGroupings,
  schema,
} from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import { ExercisePayload } from '@/app/libs/types'
import { withAuth } from '../middleware'

type GroupingType = 'superset' | 'dropset'
type GroupSets = {
  exerciseNumber: number
  setNumber: number
}[]

export const getExerciseId = async (
  name: string,
  userId: string,
  isUnilateral: boolean,
  tx: any
) => {
  // check if exists
  const existingExercise = await tx.query.exercises.findFirst({
    where: (
      exercise: typeof schema.exercises,
      { eq, and }: { eq: any; and: any }
    ) => and(eq(exercise.name, name), eq(exercise.userId, userId)),
  })
  if (existingExercise) {
    return existingExercise.id
  }

  // if not exists, create exercise
  const [exercise] = await tx
    .insert(exercises)
    .values({
      name,
      userId,
      isUnilateral,
    })
    .returning()

  if (!exercise) {
    throw new Error('Failed to create exercise')
  }

  return exercise.id
}

export const setSuperOrDropsets = async (
  groupings: {
    groupingType: GroupingType
    groupSets: GroupSets
  }[],
  setIdMap: Map<string, string>,
  tx: any
) => {
  const setIdsInGroupings = new Set<string>()
  for (const grouping of groupings) {
    const { groupingType, groupSets } = grouping
    if (
      !groupingType ||
      !groupSets ||
      !Array.isArray(groupSets) ||
      groupSets.length < 2
    ) {
      throw new Error('Invalid set grouping data')
    }

    if (groupingType !== 'superset' && groupingType !== 'dropset') {
      throw new Error('Grouping type must be either "superset" or "dropset"')
    }

    // ensure dropset sets are consecutive and for the same exercise (exerciseNumber)
    if (groupingType === 'dropset') {
      const setNumbers = groupSets.map((s) => s.setNumber).sort((a, b) => a - b)
      const exerciseNumbers = new Set(groupSets.map((s) => s.exerciseNumber))

      // same exercise check
      if (exerciseNumbers.size !== 1) {
        throw new Error('All sets in a dropset must be for the same exercise')
      }

      // consecutive setNumber check
      for (let i = 1; i < setNumbers.length; i++) {
        if (setNumbers[i] !== setNumbers[i - 1] + 1) {
          throw new Error(
            'Dropset setNumbers must be consecutive (e.g., 1, 2, 3)'
          )
        }
      }
    }

    // ensure superset sets are for different exercises (exerciseNumber) and must be in consecutive exerciseNumber order
    if (groupingType === 'superset') {
      const numbers = groupSets
        .map((s) => s.exerciseNumber)
        .sort((a, b) => a - b)

      // duplicate check
      const unique = new Set(numbers)
      if (unique.size !== numbers.length) {
        throw new Error(
          'All sets in a superset must be for different exercises'
        )
      }

      // consecutive exerciseNumber check
      for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] !== numbers[i - 1] + 1) {
          throw new Error(
            'Superset exerciseNumbers must be consecutive and ordered (e.g., 1, 2, 3)'
          )
        }
      }
    }

    const [setGrouping] = await tx
      .insert(setGroupings)
      .values({
        type: groupingType,
      })
      .returning({ id: setGroupings.id })

    if (!setGrouping) {
      throw new Error('Failed to create set grouping')
    }

    for (const set of groupSets) {
      const { exerciseNumber, setNumber } = set
      if (!exerciseNumber || !setNumber) {
        throw new Error(
          'Each set grouping must have exerciseNumber and setNumber'
        )
      }
      console.log(setIdMap)
      console.log('set:', set)
      const setId = setIdMap.get(`${exerciseNumber}-${setNumber}`)
      if (!setId) {
        throw new Error(
          `Set not found for exercise ${exerciseNumber} and set ${setNumber}`
        )
      }
      if (setIdsInGroupings.has(setId)) {
        throw new Error('Set can only be in one superset or dropset grouping')
      }

      await tx
        .update(sets)
        .set({
          setGroupingId: setGrouping.id,
        })
        .where(eq(sets.id, setId))
      setIdsInGroupings.add(setId)
    }
  }
}

export const setTags = async (
  tags: string[],
  workoutId: string,
  userId: string,
  tx: any
) => {
  const tagIds: string[] = []
  tags = Array.from(new Set(tags))

  for (const tag of tags) {
    if (typeof tag !== 'string' || tag.length > 50) {
      throw new Error('Each tag must be a string under 50 characters')
    }

    const existingTag = await tx.query.workoutTags.findFirst({
      where: (
        workoutTags: typeof schema.workoutTags,
        { eq, and }: { eq: any; and: any }
      ) => and(eq(workoutTags.name, tag), eq(workoutTags.userId, userId)),
    })

    if (existingTag) {
      tagIds.push(existingTag.id)
    } else {
      const [newTag] = await tx
        .insert(workoutTags)
        .values({ name: tag, userId })
        .returning()

      if (!newTag) {
        throw new Error(`Failed to create tag ${tag}`)
      }
      tagIds.push(newTag.id)
    }
  }

  for (const tagId of tagIds) {
    await tx.insert(workoutTagLinks).values({
      workoutId,
      tagId,
    })
  }
}

export const setExercise = async (
  exercise: ExercisePayload,
  status: 'completed' | 'planned',
  setIdMap: Map<string, string>,
  exNum: number,
  userId: string,
  workoutId: string,
  tx: any
) => {
  const exerciseId = await getExerciseId(
    exercise.name,
    userId,
    exercise.isUnilateral,
    tx
  )
  const [workoutExercise] = await tx
    .insert(workoutExercises)
    .values({
      exerciseId,
      exerciseNumber: exNum.toString(),
      workoutId,
    })
    .returning()

  let setNum = 1
  const { sets: exerciseSets } = exercise

  for (const set of exerciseSets) {
    const {
      weightLbs,
      weightKg,
      reps,
      leftReps,
      rightReps,
      rpe,
      leftRpe,
      rightRpe,
      rir,
      leftRir,
      rightRir,
      partialReps,
    } = set

    console.log('Processing set: ', set)

    if (!reps && !(leftReps && rightReps)) {
      throw new Error('Must specify reps or both left and right reps for a set')
    }

    if (rpe && rir) {
      throw new Error('Cannot specify both RPE and RIR for a set')
    }

    if (rir && (leftRir || rightRir)) {
      throw new Error('Cannot specify both RIR and left/right RIR for a set')
    }

    if (rpe && (leftRpe || rightRpe)) {
      throw new Error('Cannot specify both RPE and left/right RPE for a set')
    }

    if (reps && (leftReps || rightReps)) {
      throw new Error('Cannot specify both reps and left/right reps for a set')
    }

    if (
      exercise.isUnilateral == false &&
      (leftReps || rightReps || leftRpe || rightRpe || leftRir || rightRir)
    ) {
      throw new Error(
        `Exercise ${exercise.name} is not unilateral, so left/right fields are not applicable`
      )
    }

    const [insertedSet] = await tx
      .insert(sets)
      .values({
        workoutExerciseId: workoutExercise.id,
        setNumber: setNum.toString(),
        weightLbs: weightLbs ?? null,
        weightKg: weightKg ?? null,
        reps: reps ?? null,
        leftReps: leftReps ?? null,
        rightReps: rightReps ?? null,
        rpe: rpe ?? null,
        leftRpe: leftRpe ?? null,
        rightRpe: rightRpe ?? null,
        rir: rir ?? null,
        leftRir: leftRir ?? null,
        rightRir: rightRir ?? null,
        partialReps: partialReps ?? null,
      })
      .returning({ id: sets.id, setNumber: sets.setNumber })

    if (!insertedSet) {
      throw new Error(`Failed to create set ${setNum} for ${exercise}`)
    }
    setIdMap.set(
      `${workoutExercise.exerciseNumber}-${insertedSet.setNumber}`,
      insertedSet.id
    )
    setNum++
  }
}
// upload workout data, then exercises (exercise then workout exercises), then sets, then any dropsets/supersets, then tags
export const POST = withAuth(async (req, user) => {
  const data = await req.json()

  const setIdMap = new Map<string, string>()
  let exNum = 1

  let { date, name, location, exercises, setGroupings, tags, notes, status } =
    data

  const userId = user.id

  if (!userId || !date || !name || !exercises) {
    console.error('Missing required fields:', { userId, date, name, exercises })
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

  if (tags && (!Array.isArray(tags) || tags.length > 10)) {
    return NextResponse.json(
      { error: 'Tags must be an array of strings, limited to 10' },
      { status: 400 }
    )
  }

  if (notes && (typeof notes !== 'string' || notes.length > 500)) {
    return NextResponse.json(
      { error: 'Notes must be a string under 500 characters' },
      { status: 400 }
    )
  }

  if (status && !['completed', 'planned'].includes(status)) {
    return NextResponse.json(
      { error: 'Status must be one of: completed, in-progress, planned' },
      { status: 400 }
    )
  }

  try {
    const result = await db.transaction(async (tx) => {
      const existingUser = await tx.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      })

      if (!existingUser) {
        throw new Error('User not found')
      }

      const [workout] = await tx
        .insert(workouts)
        .values({
          userId: userId,
          date,
          name,
          location: location || null,
          notes: notes || null,
          status: status || 'completed',
        })
        .returning()

      if (!workout) {
        throw new Error('Failed to create workout')
      }

      for (const exercise of exercises) {
        await setExercise(
          exercise,
          status,
          setIdMap,
          exNum,
          userId,
          workout.id,
          tx
        )
        exNum++
      }

      if (setGroupings && setGroupings.length > 0) {
        await setSuperOrDropsets(setGroupings, setIdMap, tx)
      }

      if (tags) {
        await setTags(tags, workout.id, userId, tx)
      }

      return workout.id
    })

    return NextResponse.json(
      {
        message: 'Workout created successfully',
        id: result,
      },
      { status: 201 }
    )
  } catch (error: any) {
    const msg =
      error instanceof Error ? error.message : 'Unexpected error occurred'
    const status = msg === 'User not found' ? 404 : 500

    console.error('Error processing workout data:', error)
    return NextResponse.json({ error: msg }, { status })
  }
})
