import { StyleSheet, View } from 'react-native'
import React from 'react'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import Button from './button'
import Txt from './text'
import { ChevronDown } from 'lucide-react-native'
import useTheme from '../hooks/theme'

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
  const progress = useSharedValue(isExpanded ? 1 : 0)
  const [contentHeight, setContentHeight] = React.useState(0)

  React.useEffect(() => {
    progress.value = withTiming(isExpanded ? 1 : 0, { duration: 300 })
  }, [isExpanded])

  const animatedHeight = useAnimatedStyle(() => {
    return {
      height: interpolate(
        progress.value,
        [0, 1],
        [0, contentHeight],
        Extrapolation.CLAMP
      ),
      overflow: 'hidden',
    }
  })

  const animatedChevron = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg`,
        },
      ],
    }
  })

  const onContentLayout = (event: any) => {
    const { height } = event.nativeEvent.layout
    if (height > 0) {
      setContentHeight(height)
    }
  }

  return (
    <View className={twcn}>
      <Button
        onPress={() => !disabled && onToggle()}
        twcn={`justify-between flex-row px-2 py-4 items-center ${
          disabled ? 'opacity-40' : ''
        }`}
        disabled={disabled}
      >
        <Txt
          twcn={`${disabled ? 'text-light-grayText dark:text-dark-grayText' : ''}`}
        >
          {title}
        </Txt>
        <Animated.View style={animatedChevron}>
          <ChevronDown
            size={16}
            color={theme.grayText}
          />
        </Animated.View>
      </Button>

      <View
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
        onLayout={onContentLayout}
      >
        {children}
      </View>

      <Animated.View style={animatedHeight}>
        <View>{children}</View>
      </Animated.View>
    </View>
  )
}

export default Accordion

const styles = StyleSheet.create({})
