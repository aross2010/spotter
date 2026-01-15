import { router, Stack } from 'expo-router'
import useTheme from '../../hooks/theme'
import Colors from '../../../constants/colors'

export default function ExercisesLayout() {
  const { theme } = useTheme()

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Exercises',
          headerSearchBarOptions: {
            onChangeText: (event) => {
              router.setParams({
                q: event.nativeEvent.text,
              })
            },
            placeholder: 'Search Exercises',
            shouldShowHintSearchIcon: true,
            autoCapitalize: 'none',
            autoFocus: true,
            placement: 'integratedButton',
          },
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
