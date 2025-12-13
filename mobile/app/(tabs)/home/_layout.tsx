import { Stack, Link, router } from 'expo-router'
import { View } from 'react-native'
import { Settings } from 'lucide-react-native'
import TextLogo from '../../../assets/spotter-text-logo.svg'
import Colors from '../../../constants/colors'
import useTheme from '../../hooks/theme'
import tw from '../../../tw'
import Button from '../../../components/button'
import SFIcon from '../../../components/sf-icon'
import { size } from '@shopify/react-native-skia'

export default function HomeLayout() {
  const { theme } = useTheme()

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerRight: () => (
            <Button
              hitSlop={48}
              onPress={() => {
                router.push('/settings')
              }}
              accessibilityLabel="settings"
              twcn="w-9 flex-row items-center justify-center h-full"
            >
              <SFIcon
                name="gear"
                color={Colors.primary}
                size={26}
              />
            </Button>
          ),
          title: 'Home',
          headerLargeTitle: true,
          headerTransparent: true,
          headerTitleStyle: {
            color: theme.text,
            fontFamily: 'Poppins_600SemiBold',
          },
        }}
      />
    </Stack>
  )
}
