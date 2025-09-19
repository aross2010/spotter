import { StyleSheet, Text, View } from 'react-native'
import { Link, Stack } from 'expo-router'
import Button from '../../../components/button'
import TextLogo from '../../../assets/spotter-text-logo.svg'
import { SymbolView, SymbolViewProps, SFSymbol } from 'expo-symbols'
import { Settings } from 'lucide-react-native'
import Colors from '../../../constants/colors'
import useTheme from '../../hooks/theme'
import { Icon } from 'expo-router/unstable-native-tabs'
import tw from '../../../tw'

const HomeLayout = () => {
  const { theme } = useTheme()

  return (
    <Stack
      screenOptions={{
        headerRight: () => (
          <Link
            asChild
            href={'/settings'}
            style={tw`ml-2 items-center justify-center w-full h-full`}
          >
            <Settings
              size={20}
              color={theme.text}
            />
          </Link>
        ),
        headerBackVisible: false,
        headerTitle: () => (
          <View style={{ height: '90%', aspectRatio: 135 / 57 }}>
            <TextLogo
              width={'100%'}
              height={'100%'}
              color={Colors.primary}
            />
          </View>
        ),
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerStyle: { backgroundColor: theme.background },
      }}
    />
  )
}

export default HomeLayout

const styles = StyleSheet.create({})
