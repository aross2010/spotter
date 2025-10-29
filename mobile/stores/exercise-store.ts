import { create } from 'zustand'

/* For Exercise Form to Exercise Details refresh */

type ExerciseState = {
  shouldRefresh: boolean
  triggerRefresh: () => void
  clearRefresh: () => void
}

export const useExerciseStore = create<ExerciseState>((set) => ({
  shouldRefresh: false,
  triggerRefresh: () => set({ shouldRefresh: true }),
  clearRefresh: () => set({ shouldRefresh: false }),
}))

/* For Exercise Form to Exercise Tab to refresh */

type ExerciseTabState = {
  shouldRefresh: boolean
  triggerRefresh: () => void
  clearRefresh: () => void
}

export const useExerciseTabStore = create<ExerciseTabState>((set) => ({
  shouldRefresh: false,
  triggerRefresh: () => set({ shouldRefresh: true }),
  clearRefresh: () => set({ shouldRefresh: false }),
}))
