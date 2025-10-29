export const rpeToRir: Map<number, number> = new Map([
  [10, 0],
  [9.5, 0.5],
  [9, 1],
  [8.5, 1.5],
  [8, 2],
  [7.5, 2.5],
  [7, 3],
  [6.5, 3.5],
  [6, 4],
  [5.5, 4.5],
  [5, 5],
  [4.5, 5.5],
  [4, 6],
  [3.5, 6.5],
  [3, 7],
  [2.5, 7.5],
  [2, 8],
  [1.5, 8.5],
  [1, 9],
  [0.5, 9.5],
  [0, 10],
])

export const RirToRpe: Map<number, number> = new Map([
  [0, 10],
  [0.5, 9.5],
  [1, 9],
  [1.5, 8.5],
  [2, 8],
  [2.5, 7.5],
  [3, 7],
  [3.5, 6.5],
  [4, 6],
  [4.5, 5.5],
  [5, 5],
  [5.5, 4.5],
  [6, 4],
  [6.5, 3.5],
  [7, 3],
  [7.5, 2.5],
  [8, 2],
  [8.5, 1.5],
  [9, 1],
  [9.5, 0.5],
  [10, 0],
])

export const toKg = (lbs: number): number => {
  const kg = lbs * 0.453592
  return Math.round(kg * 10) / 10
}
export const toLbs = (kg: number) => Math.round(kg / 0.453592)
