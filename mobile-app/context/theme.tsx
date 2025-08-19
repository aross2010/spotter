import { useColorScheme } from 'nativewind'
import Colors from '../constants/colors'

type Scheme = 'light' | 'dark'
type Theme = typeof Colors.light

export default function useTheme() {
  const { colorScheme, toggleColorScheme, setColorScheme } = useColorScheme()
  const theme: Theme =
    (Colors as Record<Scheme, Theme>)[colorScheme ?? 'light'] ?? Colors.light

  return {
    theme,
    colorScheme,
    isDark: colorScheme === 'dark',
    toggleColorScheme,
    setColorScheme,
  }
}
