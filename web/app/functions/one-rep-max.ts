import { toKg } from './conversions'

export const calculate1RM = (
  weight: number,
  unit: 'lbs' | 'kgs',
  reps: number,
  rpe: number | null = null,
  rir: number | null = null,
) => {
  if (!weight || reps <= 0) return 0

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
  const oneRepMax = weight * (36 / (37.5 - cappedReps))

  if (unit === 'kgs') {
    return Math.floor(toKg(oneRepMax))
  } else {
    return Math.floor(oneRepMax)
  }
}
