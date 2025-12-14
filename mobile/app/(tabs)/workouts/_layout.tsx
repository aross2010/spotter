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
            fontFamily: 'Poppins_600SemiBold',
          },
          headerLargeTitleStyle: {
            color: theme.text,
            fontFamily: 'Poppins_600SemiBold',
          },
        }}
      />
    </Stack>
  )
}
