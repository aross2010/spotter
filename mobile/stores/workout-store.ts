import { create } from 'zustand'

/* For Edit Workout to Workout Details */

type WorkoutState = {
  shouldRefresh: boolean
  triggerRefresh: () => void
  clearRefresh: () => void
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  shouldRefresh: false,
  triggerRefresh: () => set({ shouldRefresh: true }),
  clearRefresh: () => set({ shouldRefresh: false }),
}))

/* For Edit Workout to Home Screen */

type HomeDataState = {
  shouldRefresh: boolean
  triggerRefresh: () => void
  clearRefresh: () => void
}

export const useHomeDataStore = create<HomeDataState>((set) => ({
  shouldRefresh: false,
  triggerRefresh: () => set({ shouldRefresh: true }),
  clearRefresh: () => set({ shouldRefresh: false }),
}))
