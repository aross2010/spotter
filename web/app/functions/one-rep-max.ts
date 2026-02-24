import { toKg } from './conversions'

export const calculate1RM = (
  weight: number,
  unit: 'lbs' | 'kgs',
  reps: number,
  rpe: number | null = null,
  rir: number | null = null,
  bodyWeight: number | null = null,
) => {
  if (reps <= 0) return 0

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
  // e.g. if you do 6 pull-ups at bodyweight, estimate how much weight you could add for 1 rep
  if (!weight && bodyWeight) {
    const additionalWeight = bodyWeight * (multiplier - 1)
    const result = Math.max(0, additionalWeight)
    if (unit === 'kgs') {
      return Math.floor(toKg(result))
    }
    return Math.floor(result)
  }

  if (!weight) return 0

  const oneRepMax = weight * multiplier

  if (unit === 'kgs') {
    return Math.floor(toKg(oneRepMax))
  } else {
    return Math.floor(oneRepMax)
  }
}
