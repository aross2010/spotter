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
    const savedScheme = preferences?.colorScheme
    console.log('🎨 Theme useEffect triggered - savedScheme:', savedScheme)
    
    if (!savedScheme) {
      console.log('⚠️ No saved scheme found, skipping')
      return
    }

    if (savedScheme === 'system') {
      console.log('📱 Setting to system (null)')
      setColorScheme(null as any)
    } else {
      console.log('✅ Setting to:', savedScheme)
      setColorScheme(savedScheme as Scheme)
    }
  }, [preferences?.colorScheme])

  const theme: Theme =
    (Colors as Record<Scheme, Theme>)[colorScheme ?? 'light'] ?? Colors.light

  console.log('Using color scheme:', colorScheme, 'Theme:', theme)

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
      console.log('🔧 setColorSchemePreference called with:', scheme)
      console.trace('📍 Call stack:')
      
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
