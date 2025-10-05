import { WorkoutDetails } from '../context/workout-context'
import { formatDate } from './formatted-date'
import { Share as RNShare, Alert } from 'react-native'

export const getWorkoutMessage = (workout: WorkoutDetails) => {
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

export const handleShareWorkout = async (workout: WorkoutDetails) => {
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

    if (result.action === RNShare.sharedAction) {
      if (result.activityType) {
        console.log('Shared with activity type:', result.activityType)
      } else {
        console.log('Workout shared successfully')
      }
    } else if (result.action === RNShare.dismissedAction) {
      console.log('Share dismissed')
    }
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Failed to share workout')
  }
}
