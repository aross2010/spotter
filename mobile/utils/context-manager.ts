// Context manager to handle resetting all contexts on sign out
// This avoids circular dependencies between auth and other contexts

import {
  useWorkoutStore,
  useHomeDataStore,
  useWorkoutTabStore,
} from '../stores/workout-store'
import { useExerciseStore, useExerciseTabStore } from '../stores/exercise-store'

type ContextResetters = {
  resetWorkoutContext?: () => void
  resetNotebookContext?: () => void
  resetWorkoutFormContext?: () => void
  resetNotebookFormContext?: () => void
}

export const contextResetters: ContextResetters = {}

export const registerContextResetter = (
  name: keyof ContextResetters,
  resetFn: () => void
) => {
  contextResetters[name] = resetFn
}

export const resetAllContexts = () => {
  // Reset all registered contexts
  Object.values(contextResetters).forEach((resetFn) => {
    if (resetFn) resetFn()
  })

  // Reset all zustand stores
  useWorkoutStore.getState().clearRefresh()
  useHomeDataStore.getState().clearRefresh()
  useWorkoutTabStore.getState().clearRefresh()
  useExerciseStore.getState().clearRefresh()
  useExerciseTabStore.getState().clearRefresh()
}
