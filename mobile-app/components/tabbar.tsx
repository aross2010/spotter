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
import Colors from '../constants/colors'

type Props = BottomTabBarProps & {
  barColor?: string
  indicatorColor?: string
  height?: number
  paddingTop?: number
}

export default function TopIndicatorTabBar({
  state,
  descriptors,
  navigation,
  barColor = Colors.primary,
  indicatorColor = Colors.light.background,
  height = 90,
  paddingTop = 10,
}: Props) {
  const insets = useSafeAreaInsets()
  const [w, setW] = React.useState(0)
  const translateX = React.useRef(new Animated.Value(0)).current
  const count = state.routes.length
  const tabW = count > 0 ? w / count : 0

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: tabW * state.index,
      useNativeDriver: true,
      bounciness: 5,
      speed: 12,
    }).start()
  }, [state.index, tabW, translateX])

  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        {
          backgroundColor: barColor,
          height,
          paddingTop,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {/* sliding indicator */}
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

        const icon =
          typeof options.tabBarIcon === 'function'
            ? options.tabBarIcon({
                focused: isFocused,
                color: '#fff',
                size: 28,
              })
            : null

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            {icon}
          </Pressable>
        )
      })}
    </View>
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
    height: 3,
    borderRadius: 999,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
  },
})
