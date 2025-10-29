import { ExerciseDetails } from '../utils/types'
import { Workout } from '../utils/types'
import { formatDate } from './formatted-date'
import { Share as RNShare, Alert } from 'react-native'
import { estimate1RM } from './one-rm'

export const getWorkoutMessage = (workout: Workout) => {
  if (!workout) return ''

  // Build the workout summary text
  let message = `🏋️ ${workout.name}\n`
  message += `📅 ${formatDate(workout.date)}`
  if (workout.location) {
    message += ` @ ${workout.location}`
  }
  message += '\n\n'

  if (workout.notes) {
    message += `📝 ${workout.notes}\n\n`
  }

  // Add exercises
  workout.exercises.forEach((exercise, index) => {
    message += `${index + 1}. ${exercise.name}\n`
    exercise.sets.forEach((set) => {
      if (exercise.isUnilateral) {
        const weight = set.weightLbs || set.weightKg
        const leftReps = set.leftReps || 0
        const rightReps = set.rightReps || 0
        const reps =
          leftReps !== rightReps ? `${leftReps}/${rightReps}` : leftReps

        if (weight && weight > 0) {
          message += `    Set ${set.setNumber}: ${weight} lbs × ${reps} reps`
        } else {
          message += `    Set ${set.setNumber}: ${reps} reps`
        }

        if (set.leftPartialReps || set.rightPartialReps) {
          const leftPartials = set.leftPartialReps || 0
          const rightPartials = set.rightPartialReps || 0
          const partials =
            leftPartials !== rightPartials
              ? `${leftPartials}/${rightPartials}`
              : leftPartials
          message += ` + ${partials} partials`
        }

        if (set.leftRpe || set.rightRpe) {
          const leftRpe = set.leftRpe || 0
          const rightRpe = set.rightRpe || 0
          const rpe = leftRpe !== rightRpe ? `${leftRpe}/${rightRpe}` : leftRpe
          message += ` @ RPE ${rpe}`
        }
      } else {
        const weight = set.weightLbs || set.weightKg
        const reps = set.reps || '-'

        if (weight && weight > 0) {
          message += `    Set ${set.setNumber}: ${weight} lbs × ${reps} reps`
        } else {
          message += `    Set ${set.setNumber}: ${reps} reps`
        }

        if (set.partialReps) {
          message += ` + ${set.partialReps} partials`
        }

        if (set.rpe) {
          message += ` @ RPE ${set.rpe}`
        }
      }
      message += '\n'
    })
    message += '\n'
  })

  // Add tags if available
  if (workout.tags && workout.tags.length > 0) {
    message += `🏷️ ${workout.tags.map((tag) => tag.name).join(', ')}`
  }

  return message
}

export const handleShareWorkout = async (workout: Workout) => {
  try {
    const message = getWorkoutMessage(workout)

    const result = await RNShare.share(
      {
        message: message,
        title: workout?.name || 'My Workout',
      },
      {
        subject: workout?.name || 'My Workout',
      }
    )
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to share workout')
  }
}

const getExerciseMessage = (
  exercise: ExerciseDetails,
  weightMetric: 'lbs' | 'kgs',
  intensityMetric?: 'rpe' | 'rir'
): string => {
  if (!exercise) return ''

  const { stats, description, name } = exercise
  const { totalSets, totalReps, totalWorkouts, pr } = stats

  const progressionChart = stats.progressionChart

  // Find lowest weight with date
  const lowestWeightPoint = progressionChart.reduce((lowest, current) => {
    return current.data.weight < lowest.data.weight ? current : lowest
  })

  const lowestWeight =
    weightMetric === 'kgs'
      ? lowestWeightPoint.data.weight.toFixed(1)
      : lowestWeightPoint.data.weight

  const firstDate = progressionChart[0].date
  const lastDate = progressionChart[progressionChart.length - 1].date
  const daysBetween = Math.floor(
    (new Date(lastDate).getTime() - new Date(firstDate).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  // Get the most recent workout sets
  const lastSession = exercise.history[0]
  let lastSessionSets = ''

  if (lastSession) {
    lastSession.sets.forEach((set) => {
      const weight = weightMetric === 'kgs' ? set.weight.toFixed(1) : set.weight

      lastSessionSets += `  Set ${set.setNumber}: ${weight} ${weightMetric} × ${set.reps} reps`

      if (set.partials) {
        lastSessionSets += ` + ${set.partials} partials`
      }

      if (set.intensity) {
        lastSessionSets += ` @ ${intensityMetric?.toUpperCase()} ${set.intensity}`
      }

      lastSessionSets += '\n'
    })
  }

  // Build the exercise summary text
  let message = `🏋️ ${name}\n`
  message += `${description ? `📝 ${description}\n` : ''}\n`

  message += `🏆 PR: ${weightMetric === 'kgs' ? pr.toFixed(1) : pr} ${weightMetric}\n`
  message += `🎯 Est. 1-Rep Max: ${estimate1RM(exercise, weightMetric)}\n`
  message += `Total Sets: ${totalSets}\n`
  message += `Total Reps: ${totalReps}\n`
  message += `Total Workouts: ${totalWorkouts}\n\n`
  message += `📈 Progress: ${lowestWeight} ${weightMetric} → ${weightMetric === 'kgs' ? pr.toFixed(1) : pr} ${weightMetric} over ${daysBetween} days\n\n`

  message += `🔥 Last Session:\n`
  message += lastSessionSets

  return message
}

export const handleShareExercise = async (
  exercise: ExerciseDetails,
  weightMetric: 'lbs' | 'kgs',
  intensityMetric?: 'rpe' | 'rir'
) => {
  try {
    const message = getExerciseMessage(exercise, weightMetric, intensityMetric)

    if (!message) {
      Alert.alert('Error', 'No exercise data to share')
      return
    }

    const result = await RNShare.share(
      {
        message: message,
        title: exercise?.name || 'My Exercise',
      },
      {
        subject: exercise?.name || 'My Exercise',
      }
    )
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to share exercise')
  }
}
