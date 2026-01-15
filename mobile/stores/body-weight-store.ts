import { create } from 'zustand'

/* For Body Weight Form to Body Weight Details on home page refresh */

type BodyWeightState = {
  shouldRefresh: boolean
  triggerRefresh: () => void
  clearRefresh: () => void
}

export const useBodyWeightStore = create<BodyWeightState>((set) => ({
  shouldRefresh: false,
  triggerRefresh: () => set({ shouldRefresh: true }),
  clearRefresh: () => set({ shouldRefresh: false }),
}))
