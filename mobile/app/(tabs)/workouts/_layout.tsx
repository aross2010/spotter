import { Stack } from 'expo-router'
import useTheme from '../../hooks/theme'

export default function WorkoutsLayout() {
  const { theme } = useTheme()

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Workouts',
          headerLargeTitleEnabled: true,
          headerTransparent: true,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  )
}
