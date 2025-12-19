import { Stack } from 'expo-router'
import useTheme from '../../hooks/theme'

export default function WorkoutsLayout() {
  const { theme } = useTheme()

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Workouts',
          headerLargeTitle: true,
          headerTransparent: true,
          headerTitleStyle: {
            color: theme.text,
            fontWeight: 600,
          },
          headerLargeTitleStyle: {
            color: theme.text,
            fontWeight: '600',
          },
        }}
      />
    </Stack>
  )
}
