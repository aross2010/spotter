// components/TopIndicatorTabBar.tsx
import * as React from 'react'
import {
  View,
  Pressable,
  Animated,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import Colors from '../constants/colors'
import Txt from './text'
import useTheme from '../hooks/theme'
import tw from '../tw'

type Props = BottomTabBarProps & {
  barColor?: string
  indicatorColor?: string
  height?: number
  paddingTop?: number
}

// tiny helper for hex → rgba
function hexToRgba(hex: string, alpha = 1) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return `rgba(0,0,0,${alpha})`
  const r = parseInt(m[1], 16)
  const g = parseInt(m[2], 16)
  const b = parseInt(m[3], 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default function TopIndicatorTabBar({
  state,
  descriptors,
  navigation,
  barColor = Colors.light.grayPrimary,
  indicatorColor = Colors.light.text,
  height = 90,
  paddingTop = 10,
}: Props) {
  const insets = useSafeAreaInsets()
  const [w, setW] = React.useState(0)
  const translateX = React.useRef(new Animated.Value(0)).current
  const count = state.routes.length
  const tabW = count > 0 ? w / count : 0
  const { theme } = useTheme()

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: tabW * state.index,
      useNativeDriver: true,
      bounciness: 2,
      speed: 12,
    }).start()
  }, [state.index, tabW, translateX])

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)

  return (
    <BlurView
      intensity={50}
      onLayout={onLayout}
      experimentalBlurMethod="dimezisBlurView"
      style={[
        styles.container,
        {
          height,
          paddingTop,
          paddingBottom: Math.max(insets.bottom, 12),
          zIndex: 10,
          elevation: 10,
          backgroundColor: hexToRgba(theme.background, 0.25),
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.indicator,
          {
            backgroundColor: indicatorColor,
            width: tabW,
            transform: [{ translateX }],
          },
        ]}
      />

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const isFocused = state.index === index
        const isAddTab = route.name === 'add'

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          })
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name as never)
          }
        }

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key })
        }

        const activeColor = options.tabBarActiveTintColor ?? Colors.light.text
        const inactiveColor =
          options.tabBarInactiveTintColor ?? 'rgba(255,255,255,0.8)'
        const color = isFocused ? activeColor : inactiveColor

        const icon =
          typeof options.tabBarIcon === 'function'
            ? options.tabBarIcon({ focused: isFocused, color, size: 28 })
            : null
        const label =
          (options.tabBarLabel as string) ??
          (options.title as string) ??
          route.name

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            onLongPress={onLongPress}
            style={tw`flex-1 items-center justify-end h-16`}
          >
            {icon}
            <Txt
              numberOfLines={1}
              twcn={`text-xs ${
                !isFocused
                  ? 'text-light-grayText dark:text-dark-grayText'
                  : 'text-light-text dark:text-dark-text'
              }`}
            >
              {label}
            </Txt>
          </Pressable>
        )
      })}
    </BlurView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: 2,
    borderRadius: 999,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end', // anchor content to bottom
    paddingBottom: 8, // room for label so icon doesn't get pushed up
    height: 64,
  },
})
