import { useEffect } from 'react'
import { useAppColorScheme } from 'twrnc'
import Colors from '../../constants/colors'
import { useUserStore } from '../../stores/user-store'
import tw from '../../tw'

type Scheme = 'light' | 'dark'
type PreferenceScheme = 'light' | 'dark' | 'system'
type Theme = typeof Colors.light

export default function useTheme() {
  const { preferences, setPreferences } = useUserStore()
  const [colorScheme, toggleColorScheme, setColorScheme] = useAppColorScheme(tw)

  useEffect(() => {
    if (preferences?.colorScheme) {
      if (preferences.colorScheme === 'system') {
        // For system, let twrnc auto-detect from device
        // Don't set any specific scheme, let it follow system
        setColorScheme(null as any)
      } else if (preferences.colorScheme !== colorScheme) {
        // Set specific scheme
        setColorScheme(preferences.colorScheme as Scheme)
      }
    }
  }, [preferences?.colorScheme])

  const theme: Theme =
    (Colors as Record<Scheme, Theme>)[colorScheme ?? 'light'] ?? Colors.light

  return {
    theme,
    colorScheme,
    toggleColorScheme,
    setColorScheme: (scheme: Scheme) => {
      setColorScheme(scheme)
      if (preferences) {
        setPreferences({ ...preferences, colorScheme: scheme })
      }
    },
    setColorSchemePreference: (scheme: PreferenceScheme) => {
      if (preferences) {
        setPreferences({ ...preferences, colorScheme: scheme })

        if (scheme === 'system') {
          // Reset to follow system setting
          setColorScheme(null as any)
        } else {
          // Set specific scheme
          setColorScheme(scheme)
        }
      }
    },
  }
}
