import { useColorScheme } from 'react-native'
import Colors from '../constants/colors'

type Scheme = 'light' | 'dark'
type Theme = typeof Colors.light

export default function useTheme() {
  const scheme = useColorScheme()
  const colorScheme: Scheme = scheme === 'dark' ? 'dark' : 'light'
  const theme: Theme =
    (Colors as Record<Scheme, Theme>)[colorScheme] ?? Colors.light

  return { theme, colorScheme, isDark: colorScheme === 'dark' }
}
