import { useEffect } from 'react'
import { useAppColorScheme, useDeviceContext } from 'twrnc'
import Colors from '../../constants/colors'
import { useUserStore } from '../../stores/user-store'
import tw from '../../tw'
import { Appearance, useColorScheme } from 'react-native'

type Scheme = 'light' | 'dark'
type PreferenceScheme = 'light' | 'dark' | 'system'
type Theme = typeof Colors.light

export default function useTheme() {
  const { preferences, setPreferences } = useUserStore()
  const [colorScheme, toggleColorScheme, setColorScheme] = useAppColorScheme(tw)
  const deviceColorScheme = useColorScheme()

  useEffect(() => {
    Appearance.setColorScheme(colorScheme === 'dark' ? 'dark' : 'light')
  }, [colorScheme])

  useEffect(() => {
    const savedScheme = preferences?.colorScheme

    // If no saved preference (pre-login), default to system theme
    if (!savedScheme || savedScheme === 'system') {
      setColorScheme(deviceColorScheme as Scheme)
    } else {
      setColorScheme(savedScheme as Scheme)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences?.colorScheme])

  // When colorScheme is null (system), get actual device color scheme
  const actualColorScheme = colorScheme || (deviceColorScheme as Scheme)
  const theme: Theme = Colors[actualColorScheme]

  return {
    theme,
    colorScheme: actualColorScheme, // Return actual scheme, not null
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
          setColorScheme(deviceColorScheme as Scheme)
        } else {
          // Set specific scheme
          setColorScheme(scheme)
        }
      }
    },
  }
}
