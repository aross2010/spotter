import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Link, Stack } from 'expo-router'
import Button from '../../../components/button'
import TextLogo from '../../../assets/spotter-text-logo.svg'
import { SymbolView, SymbolViewProps, SFSymbol } from 'expo-symbols'
import { Plus, Settings } from 'lucide-react-native'
import Colors from '../../../constants/colors'
import useTheme from '../../../hooks/theme'
import { useState } from 'react'

const HomeLayout = () => {
  const { theme } = useTheme()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <Stack
      screenOptions={{
        headerRight: () => (
          <>
            <Link
              asChild
              href={'/settings'}
            >
              <Pressable>
                <Settings
                  size={24}
                  color={theme.grayText}
                />
              </Pressable>
            </Link>
            <Link
              asChild
              href={'/workout-form'}
            >
              <Pressable>
                <Plus
                  size={24}
                  color={theme.grayText}
                />
              </Pressable>
            </Link>
          </>
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
