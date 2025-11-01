import { MMKV } from 'react-native-mmkv'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { UserProfile } from '../utils/types'

type WeightMetric = 'lbs' | 'kgs'
type IntensityMetric = 'rpe' | 'rir'
type UnilateralLogging = 'sync' | 'separate'
type HapticFeedback = 'enabled' | 'disabled'

type UserPreferences = {
  weightMetric: WeightMetric
  intensityMetric: IntensityMetric
  colorScheme: 'dark' | 'light' | 'system'
  unilateralLogging: UnilateralLogging
  hapticFeedback: HapticFeedback
  location: string
}

type UserStore = {
  user: UserProfile | null
  preferences: UserPreferences | null
  setUser: (user: UserProfile | null) => void
  setPreferences: (preferences: UserPreferences | null) => void
  clearUserStore: () => void
}

const initialUser = {
  id: null,
  firstName: '',
  lastName: '',
  email: '',
  providers: [],
}
const initialUserPreferences: UserPreferences = {
  weightMetric: 'lbs',
  intensityMetric: 'rir',
  colorScheme: 'system',
  unilateralLogging: 'sync',
  hapticFeedback: 'enabled',
  location: '',
}

const kv = new MMKV({ id: 'spotter-user-store' })
const storage = {
  getItem: (key: string) => kv.getString(key) ?? null,
  setItem: (key: string, value: string) => kv.set(key, value),
  removeItem: (key: string) => kv.delete(key),
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: initialUser,
      preferences: initialUserPreferences,
      setUser: (u) =>
        set((s) => ({
          user: {
            id:
              u && typeof u.id !== 'undefined'
                ? u.id
                : s.user
                  ? s.user.id
                  : null,
            firstName:
              u && u.firstName
                ? u.firstName.trim()
                : s.user
                  ? s.user.firstName
                  : '',
            lastName:
              u && typeof u.lastName !== 'undefined'
                ? u.lastName
                  ? u.lastName.trim()
                  : undefined
                : s.user
                  ? s.user.lastName
                  : undefined,
            email: u && u.email ? u.email.trim() : s.user ? s.user.email : '',
            providers:
              u && Object.prototype.hasOwnProperty.call(u, 'providers')
                ? (u.providers ?? [])
                : (s.user?.providers ?? []),
          },
        })),
      setPreferences: (p) => {
        set((s) => ({
          preferences: {
            weightMetric:
              p?.weightMetric ??
              s.preferences?.weightMetric ??
              initialUserPreferences.weightMetric,
            intensityMetric:
              p?.intensityMetric ??
              s.preferences?.intensityMetric ??
              initialUserPreferences.intensityMetric,
            colorScheme:
              p?.colorScheme ??
              s.preferences?.colorScheme ??
              initialUserPreferences.colorScheme,
            unilateralLogging:
              p?.unilateralLogging ??
              s.preferences?.unilateralLogging ??
              initialUserPreferences.unilateralLogging,
            hapticFeedback:
              p?.hapticFeedback ??
              s.preferences?.hapticFeedback ??
              initialUserPreferences.hapticFeedback,
            location:
              p?.location !== undefined
                ? p.location.trim()
                : (s.preferences?.location ?? initialUserPreferences.location),
          },
        }))
      },
      clearUserStore: () =>
        set((s) => ({
          user: initialUser,
          // Preserve preferences when clearing user data
          preferences: s.preferences || initialUserPreferences,
        })),
    }),
    {
      name: 'spotter-user-store',
      storage: createJSONStorage(() => storage),
      version: 2,
    }
  )
)
