import db from '@/src'
import {
  workouts,
  workoutExercises,
  sets,
  workoutTagLinks,
  workoutTags,
  setGroupings,
  exercises,
} from '@/src/db/schema'
import { workoutsRelations } from '@/src/db/schema'
import { eq, asc, sql } from 'drizzle-orm'

export const getFullWorkout = async (workoutId: string) => {
  const workout = await db.query.workouts.findFirst({
    where: eq(workouts.id, workoutId),
    with: {
      workoutExercises: {
        orderBy: [asc(workoutExercises.exerciseNumber)],
        with: {
          exercise: true,
          sets: {
            orderBy: [asc(sets.setNumber)],
            with: {
              setGrouping: true,
            },
          },
        },
      },
      workoutTagLinks: {
        with: {
          workoutTag: true,
        },
      },
    },
  })

  if (!workout) return null

  const tags = workout.workoutTagLinks.map((l) => l.workoutTag.name)

  const groupingMap = new Map<
    string,
    {
      id: string
      type: string
      groupSets: { exerciseNumber: number; setNumber: number }[]
    }
  >()

  const exercises = workout.workoutExercises.map((we) => {
    const exerciseNumber = Number(we.exerciseNumber)

    const shapedSets = we.sets.map((s) => {
      const setNumber = Number(s.setNumber)
      const grouping = s.setGrouping
      if (grouping) {
        if (!groupingMap.has(grouping.id)) {
          groupingMap.set(grouping.id, {
            id: grouping.id,
            type: grouping.type,
            groupSets: [],
          })
        }
        groupingMap.get(grouping.id)!.groupSets.push({
          exerciseNumber,
          setNumber,
        })
      }

      return {
        setNumber,
        weight: s.weight ? Number(s.weight) : null,
        reps: s.reps ? Number(s.reps) : null,
        lowReps: s.lowReps ? Number(s.lowReps) : null,
        highReps: s.highReps ? Number(s.highReps) : null,
        rpe: s.rpe ? Number(s.rpe) : null,
        rir: s.rir ? Number(s.rir) : null,
        cheatReps: s.cheatReps ? Number(s.cheatReps) : null,
        partialReps: s.partialReps ? Number(s.partialReps) : null,
        setGroupingId: s.setGroupingId ?? null,
      }
    })

    return {
      name: we.exercise.name,
      exerciseNumber,
      sets: shapedSets,
    }
  })

  return {
    id: workout.id,
    userId: workout.userId,
    name: workout.name,
    date: workout.date,
    location: workout.location,
    notes: workout.notes,
    status: workout.status,
    createdAt: workout.createdAt,
    updatedAt: workout.updatedAt,
    tags,
    exercises,
    setGroupings: Array.from(groupingMap.values()),
  }
}
