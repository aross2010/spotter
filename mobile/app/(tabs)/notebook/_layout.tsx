import { Stack } from 'expo-router'
import useTheme from '../../hooks/theme'

export default function NotebookLayout() {
  const { theme } = useTheme()

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.background },
        headerTitleAlign: 'left',
        headerTitleStyle: {
          fontSize: 26,
          fontFamily: 'Poppins_600SemiBold',
          color: theme.text,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Notebook' }}
      />
    </Stack>
  )
}
