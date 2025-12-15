import { Stack, useRouter } from 'expo-router'

export default function Layout() {
  const router = useRouter()

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerSearchBarOptions: {
            onChangeText: (event) => {
              router.setParams({
                q: event.nativeEvent.text,
              })
            },
          },
        }}
      />
    </Stack>
  )
}
