import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Dimensions,
  Pressable,
  Modal,
} from 'react-native'
import Button from './button'
import { LucideIcon } from 'lucide-react-native'
import tw from '../tw'
import { useState } from 'react'
import useTheme from '../hooks/theme'
import { GlassView } from 'expo-glass-effect'
import Txt from './text'
import Colors from '../constants/colors'

type DropdownMenuProps = {
  options: {
    label: string
    icon: LucideIcon
    onPress: () => void
    type: 'button' | 'submenu'
    destructive?: boolean
  }[]
  triggerIcon: LucideIcon
}

const DropdownMenu = ({ options, triggerIcon: Icon }: DropdownMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme } = useTheme()

  return (
    <>
      <View style={tw`relative overflow-visible`}>
        <Button
          hitSlop={20}
          onPress={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Icon
            size={20}
            color={theme.grayText}
          />
        </Button>
        {isMenuOpen && (
          <GlassView
            isInteractive
            style={[
              tw`absolute top-6 right-0 z-50 rounded-lg`,
              { minWidth: 150 },
            ]}
          >
            {options.map((option, index) => (
              <Button
                key={index}
                onPress={() => {
                  option.onPress()
                  setIsMenuOpen(false)
                }}
                twcn="flex-row items-center justify-between px-4 py-2"
                style={{
                  borderBottomColor: theme.grayTertiary,
                  borderBottomWidth: index === options.length - 1 ? 0 : 1,
                }}
              >
                <Txt
                  twcn={`text-sm ${option.destructive ? 'text-alert dark:text-alert' : ''}`}
                >
                  {option.label}
                </Txt>
                <option.icon
                  size={16}
                  color={option.destructive ? Colors.alert : theme.grayText}
                />
              </Button>
            ))}
          </GlassView>
        )}
      </View>
    </>
  )
}

export default DropdownMenu

const styles = StyleSheet.create({})
