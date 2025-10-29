import { ExerciseDetails } from '../utils/types'

const calculate1RM = (
  weight: number,
  unit: 'lbs' | 'kgs',
  reps: number,
  rpe: number | null = null,
  rir: number | null = null
) => {
  if (!weight || reps <= 0) return 'N/A'

  // Derive RIR if only RPE is provided
  let effectiveRIR: number
  if (rir !== null) {
    effectiveRIR = Math.max(0, Math.min(4, rir))
  } else if (rpe !== null) {
    effectiveRIR = Math.max(0, Math.min(4, 10 - rpe)) // RPE 9 → 1 RIR
  } else {
    effectiveRIR = 0 // assume max effort if neither provided
  }

  // Approximate % of 1RM from RPE chart (Mike Tuchscherer)
  const rpeTable: Record<number, number[]> = {
    1: [1.0, 0.98, 0.96, 0.94, 0.92],
    2: [0.955, 0.935, 0.92, 0.9, 0.89],
    3: [0.92, 0.9, 0.88, 0.86, 0.84],
    4: [0.89, 0.86, 0.84, 0.82, 0.8],
    5: [0.86, 0.83, 0.81, 0.79, 0.77],
    6: [0.83, 0.81, 0.78, 0.76, 0.74],
    7: [0.81, 0.79, 0.76, 0.74, 0.72],
    8: [0.79, 0.76, 0.74, 0.72, 0.7],
    9: [0.76, 0.74, 0.72, 0.7, 0.68],
    10: [0.74, 0.72, 0.7, 0.68, 0.66],
  }

  const repsKey = Math.min(10, Math.max(1, Math.round(reps)))
  const rirIndex = Math.round(effectiveRIR)

  // Lookup %1RM or fallback to Epley if out of range
  const percent = rpeTable[repsKey]?.[rirIndex] ?? 1 / (1.0278 - 0.0278 * reps)

  const oneRepMax = weight / percent

  return `${Math.floor(oneRepMax)} ${unit}`
}

export const estimate1RM = (
  exercise: ExerciseDetails,
  weightMetric: 'lbs' | 'kgs'
) => {
  const lastThreeWorkouts = exercise?.stats.progressionChart.slice(-3) || []
  if (lastThreeWorkouts.length === 0) return 'N/A'

  const maxWeightSet = lastThreeWorkouts.reduce((max, workout) => {
    return workout.data.weight > max.data.weight ? workout : max
  }, lastThreeWorkouts[0])

  return calculate1RM(
    maxWeightSet.data.weight,
    weightMetric,
    maxWeightSet.data.reps,
    maxWeightSet.data.rpe || null,
    maxWeightSet.data.rir || null
  )
}
