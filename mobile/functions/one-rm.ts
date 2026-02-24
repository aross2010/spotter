import { ExerciseDetails } from '../utils/types'

const calculate1RM = (
  weight: number,
  unit: 'lbs' | 'kgs',
  reps: number,
  rpe: number | null = null,
  rir: number | null = null,
  bodyWeight: number | null = null,
) => {
  if (reps <= 0) return 'N/A'

  // Derive RIR if only RPE is provided
  let effectiveRIR: number
  if (rir !== null) {
    effectiveRIR = Math.max(0, Math.min(4, rir))
  } else if (rpe !== null) {
    effectiveRIR = Math.max(0, Math.min(4, 10 - rpe)) // RPE 9 → 1 RIR
  } else {
    effectiveRIR = 0 // assume max effort if neither provided
  }

  // Use Brzycki formula - more accurate for higher rep ranges
  // Adjust effective reps by adding RIR (reps they could have done at RPE 10)
  const effectiveReps = reps + effectiveRIR

  // Modified Brzycki: slightly more conservative for higher reps
  // Cap at 36 reps to avoid division issues
  const cappedReps = Math.min(36, effectiveReps)
  const multiplier = 36 / (37.5 - cappedReps)

  // For bodyweight exercises (0 added weight), estimate additional weight for 1RM
  if (!weight && bodyWeight) {
    const additionalWeight = Math.max(
      0,
      Math.floor(bodyWeight * (multiplier - 1)),
    )
    return `${additionalWeight} ${unit}`
  }

  if (!weight) return 'N/A'

  const oneRepMax = weight * multiplier

  return `${Math.floor(oneRepMax)} ${unit}`
}

export const estimate1RM = (
  exercise: ExerciseDetails,
  weightMetric: 'lbs' | 'kgs',
) => {
  const lastThreeWorkouts = exercise?.stats.progressionChart.slice(-3) || []
  if (lastThreeWorkouts.length === 0) return 'N/A'

  // Use the highest pre-calculated est1RM from the last 3 workouts
  const maxEst1RM = Math.max(...lastThreeWorkouts.map((w) => w.data.est1RM))

  if (maxEst1RM <= 0) return 'N/A'
  return `${maxEst1RM} ${weightMetric}`
}
