import { withAuth } from '../../../middleware'
import { NextResponse } from 'next/server'
import db from '@/src'
import { workouts } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

export const GET = withAuth(async (req, user) => {
  const id = req.url.split('/').pop()
  if (!id) {
    return NextResponse.json(
      { error: 'Workout ID is required' },
      { status: 400 }
    )
  }

  try {
    // Query workout with all related data
    const workout = await db.query.workouts.findFirst({
      where: eq(workouts.id, id),
      with: {
        workoutExercises: {
          orderBy: (workoutExercises, { asc }) => [
            asc(workoutExercises.exerciseNumber),
          ],
          with: {
            exercise: true,
            sets: {
              orderBy: (sets, { asc }) => [asc(sets.setNumber)],
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

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    // Check if user owns this workout
    if (workout.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Build tags array
    const tags = workout.workoutTagLinks.map((link) => ({
      id: link.workoutTag.id,
      name: link.workoutTag.name,
      userId: link.workoutTag.userId,
    }))

    // Build set groupings map
    const groupingMap = new Map<
      string,
      {
        id: string
        groupingType: string
        groupSets: { exerciseNumber: number; setNumber: number }[]
      }
    >()

    // Calculate muscle group analysis based on set counts with weighted contributions
    const muscleGroupContributions = new Map<string, number>()

    // Process exercises and sets
    const exercises = workout.workoutExercises.map((we) => {
      const exerciseNumber = Number(we.exerciseNumber)
      const exercise = we.exercise

      // Count sets for this exercise (for muscle group weighting)
      const sets = we.sets.map((s) => {
        const setNumber = Number(s.setNumber)
        const grouping = s.setGrouping

        // Handle set groupings
        if (grouping) {
          if (!groupingMap.has(grouping.id)) {
            groupingMap.set(grouping.id, {
              id: grouping.id,
              groupingType: grouping.type,
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
          weightLbs: s.weightLbs ? Number(s.weightLbs) : null,
          weightKg: s.weightKg ? Number(s.weightKg) : null,
          reps: s.reps ? Number(s.reps) : null,
          leftReps: s.leftReps ? Number(s.leftReps) : null,
          rightReps: s.rightReps ? Number(s.rightReps) : null,
          rpe: s.rpe ? Number(s.rpe) : null,
          leftRpe: s.leftRpe ? Number(s.leftRpe) : null,
          rightRpe: s.rightRpe ? Number(s.rightRpe) : null,
          rir: s.rir ? Number(s.rir) : null,
          leftRir: s.leftRir ? Number(s.leftRir) : null,
          rightRir: s.rightRir ? Number(s.rightRir) : null,
          partialReps: s.partialReps ? Number(s.partialReps) : null,
          leftPartialReps: s.leftPartialReps ? Number(s.leftPartialReps) : null,
          rightPartialReps: s.rightPartialReps
            ? Number(s.rightPartialReps)
            : null,
          cheatReps: s.cheatReps ? Number(s.cheatReps) : null,
          id: s.id,
        }
      })

      // Count sets for muscle group contributions
      const setCount = sets.length

      // Add muscle group contributions (primary gets full count, secondary gets 0.3x count)
      if (exercise.primaryMuscleGroup) {
        const current =
          muscleGroupContributions.get(exercise.primaryMuscleGroup) || 0
        muscleGroupContributions.set(
          exercise.primaryMuscleGroup,
          current + setCount
        )
      }

      if (exercise.secondaryMuscleGroups) {
        exercise.secondaryMuscleGroups.forEach((muscleGroup) => {
          const current = muscleGroupContributions.get(muscleGroup) || 0
          // Secondary muscle groups get 30% weight
          muscleGroupContributions.set(muscleGroup, current + setCount * 0.3)
        })
      }

      return {
        name: exercise.name,
        isUnilateral: exercise.isUnilateral,
        primaryMuscleGroup: exercise.primaryMuscleGroup,
        secondaryMuscleGroups: exercise.secondaryMuscleGroups || [],
        sets,
      }
    })

    // Convert set groupings map to array
    const setGroupings = Array.from(groupingMap.values())

    // Calculate muscle group analysis percentages
    const totalContribution = Array.from(
      muscleGroupContributions.values()
    ).reduce((sum, val) => sum + val, 0)
    const muscleGroupAnalysis = Array.from(muscleGroupContributions.entries())
      .map(([muscleGroup, contribution]) => ({
        muscleGroup,
        percentage:
          totalContribution > 0
            ? Math.round((contribution / totalContribution) * 100)
            : 0,
      }))
      .filter(({ percentage }) => percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)

    // Build final workout data
    const workoutInfo = {
      id: workout.id,
      name: workout.name,
      date: workout.date,
      location: workout.location,
      notes: workout.notes,
      status: workout.status,
      createdAt: workout.createdAt,
      updatedAt: workout.updatedAt,
      pinned: workout.pinned,
      exercises,
      setGroupings,
      tags,
      muscleGroupAnalysis,
    }

    return NextResponse.json(workoutInfo, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching workout info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout info' },
      { status: 500 }
    )
  }
})
