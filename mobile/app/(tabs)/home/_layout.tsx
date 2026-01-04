import { Stack, Link, router } from 'expo-router'
import { View } from 'react-native'
import { Settings } from 'lucide-react-native'
import TextLogo from '../../../assets/spotter-text-logo.svg'
import Colors from '../../../constants/colors'
import useTheme from '../../hooks/theme'
import tw from '../../../tw'
import MyButton from '../../../components/button'
import SFIcon from '../../../components/sf-icon'
import { size } from '@shopify/react-native-skia'
import { Button, ContextMenu, Host } from '@expo/ui/swift-ui'

export default function HomeLayout() {
  const { theme } = useTheme()

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
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
