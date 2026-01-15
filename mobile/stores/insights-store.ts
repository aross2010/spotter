import { create } from 'zustand'

/* From workout form, exercise form to Body Weight Details on home page refresh */

type InsightsState = {
  shouldRefresh: boolean
  triggerRefresh: () => void
  clearRefresh: () => void
}

export const useInsightsStore = create<InsightsState>((set) => ({
  shouldRefresh: false,
  triggerRefresh: () => set({ shouldRefresh: true }),
  clearRefresh: () => set({ shouldRefresh: false }),
}))
