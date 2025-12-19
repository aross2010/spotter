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
          headerRight: () => (
            <View style={tw`flex-row items-center gap-6 px-2`}>
              <MyButton
                hitSlop={8}
                onPress={() => {
                  router.push('/settings')
                }}
                accessibilityLabel="settings"
              >
                <SFIcon
                  name="gear"
                  color={Colors.primary}
                  size={26}
                />
              </MyButton>
              <Host style={{ width: 26, height: 26 }}>
                <ContextMenu>
                  <ContextMenu.Items>
                    <Button
                      systemImage="figure.strengthtraining.traditional"
                      onPress={() => router.push('/workout-form')}
                    >
                      New Workout
                    </Button>
                    <Button
                      systemImage="book.pages.fill"
                      onPress={() => router.push('/notebook-entry-form')}
                    >
                      New Notebook Entry
                    </Button>
                  </ContextMenu.Items>
                  <ContextMenu.Trigger>
                    <SFIcon
                      name="plus"
                      color={Colors.primary}
                      size={26}
                    />
                  </ContextMenu.Trigger>
                </ContextMenu>
              </Host>
            </View>
          ),
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
