import {
  StyleSheet,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native'
import React from 'react'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated'
import Button from './button'
import Txt from './text'
import useTheme from '../app/hooks/theme'
import SFIcon from './sf-icon'

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type AccordionProps = {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
  disabled?: boolean
  twcn?: string
}

// a single accordion item that expands and collapses to show more content
const Accordion = ({
  title,
  isExpanded,
  onToggle,
  children,
  disabled = false,
  twcn = '',
}: AccordionProps) => {
  const { theme } = useTheme()
  const chevronRotation = useSharedValue(isExpanded ? 1 : 0)

  React.useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    chevronRotation.value = withTiming(isExpanded ? 1 : 0, { duration: 300 })
  }, [isExpanded])

  const animatedChevron = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(chevronRotation.value, [0, 1], [0, 180])}deg`,
        },
      ],
    }
  })

  return (
    <View className={twcn}>
      <Button
        onPress={() => !disabled && onToggle()}
        twcn={`justify-between flex-row flex-wrap gap-4 px-4 py-4 items-center ${
          disabled ? 'opacity-40' : ''
        }`}
        disabled={disabled}
      >
        <Txt
          twcn={`flex-1 ${disabled ? 'text-light-grayText dark:text-dark-grayText' : ''}`}
        >
          {title}
        </Txt>
        <Animated.View style={animatedChevron}>
          <SFIcon
            name="chevron.down"
            size={16}
            color={theme.grayText}
          />
        </Animated.View>
      </Button>

      {isExpanded && <View>{children}</View>}
    </View>
  )
}

export default Accordion

const styles = StyleSheet.create({})
