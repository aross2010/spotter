import { create } from 'zustand'

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
