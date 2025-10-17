export const toKg = (lbs: number): number =>
  Number(Math.round(lbs * 0.453592 * 10) / 10)
export const toLbs = (kg: number) => Math.round(kg / 0.453592)
